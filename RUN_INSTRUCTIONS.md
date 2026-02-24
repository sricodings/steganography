# MLDefender - Python Web Application

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation & Running

1. **Install Dependencies**
```bash
pip install -r requirements.txt
```

2. **Run the Application**
```bash
python app.py
```

3. **Access the Application**
Open your browser and navigate to:
```
http://localhost:5000
```

## 🎯 Features

- **AI-Powered Malware Detection**: Uses machine learning to detect hidden malware in images
- **Beautiful Dark Theme**: Modern, premium UI with glassmorphism and smooth animations
- **Drag & Drop Upload**: Easy file upload with drag-and-drop support
- **Sample Images**: Pre-loaded sample images to test the detection system
- **Real-time Analysis**: Fast image analysis with visual results
- **Interactive Charts**: Beautiful Chart.js visualizations of detection probabilities

## 📁 Project Structure

```
MlDefender/
├── app.py                 # Flask backend server
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Styling
│   ├── js/
│   │   └── script.js     # Frontend JavaScript
│   └── samples/          # Sample images
└── uploads/              # Temporary upload folder
```

## 🛠️ Technologies Used

- **Backend**: Python, Flask
- **Frontend**: HTML5, CSS3, JavaScript
- **ML Simulation**: Image analysis algorithms
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter, JetBrains Mono)

## 🔒 Security Features

1. **File Validation**: Only accepts JPG, JPEG, and PNG files
2. **Size Limits**: Maximum 16MB file size
3. **Secure Filenames**: Uses Werkzeug's secure_filename
4. **Temporary Storage**: Uploaded files are deleted after analysis

## 📊 How It Works

1. **Upload**: User uploads an image or selects a sample
2. **Analysis**: Image is analyzed for malware signatures
3. **Detection**: ML algorithms check for steganography and hidden code
4. **Results**: Visual display of detection probabilities with charts

## 🎨 UI Features

- Responsive design for all devices
- Dark theme with gradient animations
- Smooth transitions and micro-animations
- Glassmorphism effects
- Interactive hover states
- Beautiful color palette

## 🔮 Future Enhancements

- Integration with real CNN model
- AWS Lambda deployment
- Database for analysis history
- User authentication
- Batch image processing
- API endpoints for external integration

## 👥 Team

- Sagar Bhure
- Sourav Kumar Dash
- Vamsi Suman K.

## 📝 License

This project is part of a research initiative on image-based malware detection.

---

**Note**: The current version uses simulated ML detection. For production use, integrate with a trained CNN model.
