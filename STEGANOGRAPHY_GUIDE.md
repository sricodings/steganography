# Steganography Feature Documentation

## Overview

The MLDefender project now includes a powerful **Steganography Tool** that allows you to:
- **Hide secret data** (text messages) within images
- **Extract hidden data** from images
- **Password-protect** your hidden data with encryption
- Check image **capacity** for data hiding

## Features

### 1. **Hide Data (Encode)**
- Upload any cover image (JPG, JPEG, PNG)
- Enter your secret message
- Optionally encrypt with a password
- Download the encoded image (looks identical to the original!)

### 2. **Extract Data (Decode)**
- Upload an encoded image
- Enter password if the data was encrypted
- View and copy the extracted secret message

### 3. **Security**
- Uses **LSB (Least Significant Bit)** steganography technique
- Optional **Fernet symmetric encryption** with PBKDF2 key derivation
- Password-based encryption with 100,000 iterations for security
- Invisible to the naked eye - encoded images look identical to originals

## How It Works

### LSB Steganography
The tool uses the Least Significant Bit technique:
1. Converts your secret message to binary
2. Modifies the least significant bit of each pixel's RGB values
3. These tiny changes are imperceptible to human eyes
4. The image looks identical but contains hidden data

### Encryption (Optional)
When you enable password protection:
1. Your message is encrypted using Fernet (AES-128)
2. Password is converted to a key using PBKDF2-HMAC-SHA256
3. Encrypted data is then hidden in the image
4. Without the correct password, the data cannot be decrypted

## Usage Guide

### Hiding Data

1. Navigate to the **Steganography** section
2. Click on the **Hide Data** tab
3. Upload a cover image (the larger the image, the more data you can hide)
4. Enter your secret message in the text area
5. (Optional) Check "Encrypt with password" and enter a strong password
6. Click **"Hide Data in Image"**
7. Download the encoded image

**Important Notes:**
- The encoded image will be saved as PNG format
- Larger images can hold more data
- The capacity is shown after uploading an image

### Extracting Data

1. Navigate to the **Steganography** section
2. Click on the **Extract Data** tab
3. Upload the encoded image
4. If the data was encrypted, check "Image is password protected" and enter the password
5. Click **"Extract Hidden Data"**
6. View the extracted message
7. Use the "Copy to Clipboard" button to copy the message

### Example Use Cases

1. **Secure Communication**: Send secret messages hidden in innocent-looking images
2. **Watermarking**: Embed copyright information in images
3. **Data Exfiltration Testing**: Test your organization's DLP (Data Loss Prevention) systems
4. **Digital Forensics**: Understand how attackers hide data in images
5. **Privacy**: Store sensitive notes in images on your device

## Technical Details

### File Structure
```
MlDefender/
├── steganography.py          # Core steganography module
├── app.py                     # Flask routes for encode/decode
├── static/
│   ├── js/
│   │   └── stego.js          # Frontend JavaScript
│   └── css/
│       └── style.css          # Steganography styling
└── templates/
    └── index.html             # UI with steganography section
```

### API Endpoints

#### POST `/stego/encode`
Hides data in an image.

**Parameters:**
- `image`: Image file (multipart/form-data)
- `data`: Secret message (string)
- `password`: Optional password for encryption (string)

**Response:**
```json
{
  "success": true,
  "message": "Data successfully hidden in image",
  "metadata": {
    "original_size": [width, height],
    "data_length": 123,
    "encrypted": true,
    "capacity_used": "5.23%"
  },
  "image_data": "data:image/png;base64,...",
  "download_filename": "encoded_image.png"
}
```

#### POST `/stego/decode`
Extracts hidden data from an image.

**Parameters:**
- `image`: Encoded image file (multipart/form-data)
- `password`: Optional password for decryption (string)

**Response:**
```json
{
  "success": true,
  "message": "Data successfully extracted",
  "data": "Your secret message here"
}
```

#### POST `/stego/capacity`
Checks the data capacity of an image.

**Parameters:**
- `image`: Image file (multipart/form-data)

**Response:**
```json
{
  "success": true,
  "total_pixels": 786432,
  "max_characters": 98304,
  "max_kb": 96.0,
  "image_size": [1024, 768]
}
```

## Security Considerations

### Strengths
✅ LSB steganography is difficult to detect without specialized tools
✅ Password encryption adds an extra layer of security
✅ PBKDF2 with 100,000 iterations protects against brute force
✅ Fernet provides authenticated encryption (AES-128)

### Limitations
⚠️ LSB steganography can be detected by statistical analysis tools
⚠️ Image compression (JPEG) may destroy hidden data
⚠️ Always use PNG format for encoded images
⚠️ Weak passwords can be cracked
⚠️ Not suitable for highly sensitive classified information

### Best Practices
1. **Use strong passwords**: At least 16 characters with mixed case, numbers, and symbols
2. **Use PNG format**: JPEG compression will destroy hidden data
3. **Choose appropriate cover images**: Larger, more complex images are better
4. **Don't reuse passwords**: Use unique passwords for each hidden message
5. **Secure deletion**: Properly delete original unencoded images if needed

## Dependencies

```
Flask==3.0.0
Werkzeug==3.0.1
Pillow==10.1.0
numpy==1.26.2
cryptography==41.0.7
```

## Installation

```bash
# Install dependencies
pip3 install -r requirements.txt

# Run the application
python3 app.py
```

The application will be available at `http://localhost:5000`

## Testing the Feature

### Quick Test
1. Start the application
2. Navigate to http://localhost:5000/#steganography
3. Try the "Hide Data" feature:
   - Upload any image
   - Enter "This is a secret message!"
   - Enable password protection with password "test123"
   - Download the encoded image
4. Try the "Extract Data" feature:
   - Upload the encoded image
   - Enable password protection
   - Enter password "test123"
   - Verify the message is extracted correctly

## Troubleshooting

### Common Issues

**Issue**: "Image too small" error
- **Solution**: Use a larger image. A 1024x768 image can hold ~96KB of data.

**Issue**: "Decryption failed" error
- **Solution**: Make sure you're using the correct password and the image hasn't been compressed.

**Issue**: "No hidden data found"
- **Solution**: Ensure you're uploading an image that was encoded with this tool.

**Issue**: Downloaded image doesn't contain data
- **Solution**: Make sure to use PNG format. JPEG compression destroys hidden data.

## Future Enhancements

Potential improvements for future versions:
- [ ] Support for hiding files (not just text)
- [ ] Multiple steganography algorithms (F5, DCT-based)
- [ ] Steganalysis detection
- [ ] Batch processing
- [ ] Image format conversion
- [ ] Steganography strength indicator

## Credits

Developed by the MLDefender team:
- Sagar Bhure
- Sourav Kumar Dash
- Vamsi Suman K.

## License

This feature is part of the MLDefender project. Use responsibly and ethically.

---

**⚠️ Disclaimer**: This tool is for educational and legitimate security research purposes only. Do not use it for illegal activities. The developers are not responsible for misuse of this tool.
