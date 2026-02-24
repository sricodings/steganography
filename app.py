from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
import base64
from PIL import Image
import io
import random
from steganography import Steganography

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Malware types for classification
MALWARE_TYPES = [
    'Ramnit', 'Lollipop', 'Kelihos_ver3', 'Vundo', 'Simda',
    'Tracur', 'Kelihos_ver1', 'Obfuscator.ACY', 'Gatak', 'Adialer.C',
    'VB.AT', 'Swizzor.gen!I', 'Swizzor.gen!E', 'Dialplatform.B', 'Dontovo.A',
    'Alueron.gen!J', 'Malex.gen!J', 'Lolyda.AA1', 'Lolyda.AA2', 'Lolyda.AA3',
    'C2LOP.P', 'C2LOP.gen!g', 'Instantaccess', 'Wintrim.BX', 'Allaple.A'
]

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def analyze_image(image_path):
    """
    Simulate malware detection analysis
    In production, this would call your ML model
    """
    try:
        # Open and analyze the image
        img = Image.open(image_path)
        width, height = img.size
        file_size = os.path.getsize(image_path)
        
        # Simulate analysis based on image properties
        # In production, this would use your trained CNN model
        
        # Generate probabilities for different malware types
        probabilities = {}
        
        # Simulate detection logic
        # Larger files or specific dimensions might indicate malware
        if file_size > 100000 or (width > 500 and height > 500):
            # Likely contains malware
            malware_type = random.choice(MALWARE_TYPES[:10])
            confidence = random.uniform(0.65, 0.95)
            probabilities[malware_type] = round(confidence, 4)
            
            # Add other probabilities
            remaining_types = [t for t in MALWARE_TYPES if t != malware_type]
            random.shuffle(remaining_types)
            
            remaining_prob = 1.0 - confidence
            for i, mtype in enumerate(remaining_types[:4]):
                prob = remaining_prob * random.uniform(0.1, 0.3)
                probabilities[mtype] = round(prob, 4)
                remaining_prob -= prob
        else:
            # Likely clean
            for mtype in random.sample(MALWARE_TYPES, 5):
                probabilities[mtype] = round(random.uniform(0.01, 0.15), 4)
        
        # Sort by probability
        probabilities = dict(sorted(probabilities.items(), key=lambda x: x[1], reverse=True))
        
        return {
            'success': True,
            'probabilities': probabilities,
            'image_info': {
                'width': width,
                'height': height,
                'size': file_size,
                'format': img.format
            }
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No image file provided'}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Analyze the image
        result = analyze_image(filepath)
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify(result)
    
    return jsonify({'success': False, 'error': 'Invalid file type'}), 400

@app.route('/sample/<sample_name>')
def get_sample(sample_name):
    """Analyze sample images"""
    sample_path = os.path.join('static', 'samples', sample_name)
    
    if os.path.exists(sample_path):
        result = analyze_image(sample_path)
        return jsonify(result)
    
    return jsonify({'success': False, 'error': 'Sample not found'}), 404

@app.route('/stego/encode', methods=['POST'])
def stego_encode():
    """Hide data in an image"""
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No image file provided'}), 400
    
    file = request.files['image']
    secret_data = request.form.get('data', '')
    password = request.form.get('password', None)
    
    if not secret_data:
        return jsonify({'success': False, 'error': 'No data to hide'}), 400
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Encode the image
        encoded_bytes, success, message, metadata = Steganography.encode_image(
            filepath, secret_data, password if password else None
        )
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
        except:
            pass
        
        if success:
            # Save encoded image temporarily
            encoded_filename = f"encoded_{filename.rsplit('.', 1)[0]}.png"
            encoded_path = os.path.join(app.config['UPLOAD_FOLDER'], encoded_filename)
            
            with open(encoded_path, 'wb') as f:
                f.write(encoded_bytes)
            
            # Convert to base64 for preview
            encoded_base64 = base64.b64encode(encoded_bytes).decode('utf-8')
            
            return jsonify({
                'success': True,
                'message': message,
                'metadata': metadata,
                'image_data': f'data:image/png;base64,{encoded_base64}',
                'download_filename': encoded_filename
            })
        else:
            return jsonify({'success': False, 'error': message}), 400
    
    return jsonify({'success': False, 'error': 'Invalid file type'}), 400

@app.route('/stego/decode', methods=['POST'])
def stego_decode():
    """Extract hidden data from an image"""
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No image file provided'}), 400
    
    file = request.files['image']
    password = request.form.get('password', None)
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Decode the image
        extracted_data, success, message = Steganography.decode_image(
            filepath, password if password else None
        )
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
        except:
            pass
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'data': extracted_data
            })
        else:
            return jsonify({'success': False, 'error': message}), 400
    
    return jsonify({'success': False, 'error': 'Invalid file type'}), 400

@app.route('/stego/capacity', methods=['POST'])
def stego_capacity():
    """Check image capacity for hiding data"""
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No image file provided'}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Get capacity
        capacity_info = Steganography.get_image_capacity(filepath)
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify(capacity_info)
    
    return jsonify({'success': False, 'error': 'Invalid file type'}), 400

@app.route('/download/<filename>')
def download_file(filename):
    """Download encoded image"""
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(filepath):
        response = send_file(filepath, as_attachment=True)
        # Clean up after sending
        try:
            os.remove(filepath)
        except:
            pass
        return response
    return jsonify({'success': False, 'error': 'File not found'}), 404


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
