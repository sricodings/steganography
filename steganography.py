"""
Steganography Module for MLDefender
Supports hiding and extracting data from images using LSB technique
"""

from PIL import Image
import numpy as np
import io
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import hashlib


class Steganography:
    """
    LSB (Least Significant Bit) Steganography implementation
    Supports text and file hiding with optional encryption
    """
    
    DELIMITER = "<<<END_OF_DATA>>>"
    
    @staticmethod
    def generate_key_from_password(password: str, salt: bytes = None) -> tuple:
        """Generate encryption key from password"""
        if salt is None:
            salt = hashlib.sha256(password.encode()).digest()[:16]
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key, salt
    
    @staticmethod
    def encrypt_data(data: str, password: str) -> tuple:
        """Encrypt data with password"""
        key, salt = Steganography.generate_key_from_password(password)
        fernet = Fernet(key)
        encrypted = fernet.encrypt(data.encode())
        return encrypted, salt
    
    @staticmethod
    def decrypt_data(encrypted_data: bytes, password: str, salt: bytes) -> str:
        """Decrypt data with password"""
        key, _ = Steganography.generate_key_from_password(password, salt)
        fernet = Fernet(key)
        decrypted = fernet.decrypt(encrypted_data)
        return decrypted.decode()
    
    @staticmethod
    def text_to_binary(text: str) -> str:
        """Convert text to binary string"""
        return ''.join(format(ord(char), '08b') for char in text)
    
    @staticmethod
    def binary_to_text(binary: str) -> str:
        """Convert binary string to text"""
        chars = [binary[i:i+8] for i in range(0, len(binary), 8)]
        return ''.join(chr(int(char, 2)) for char in chars if len(char) == 8)
    
    @staticmethod
    def encode_image(image_path: str, secret_data: str, password: str = None) -> tuple:
        """
        Hide data in image using LSB steganography
        Returns: (encoded_image_bytes, success, message, metadata)
        """
        try:
            # Open image
            img = Image.open(image_path)
            
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Get image data
            img_array = np.array(img)
            original_shape = img_array.shape
            
            # Prepare data
            if password:
                encrypted_data, salt = Steganography.encrypt_data(secret_data, password)
                # Add salt to the beginning of data
                data_to_hide = base64.b64encode(salt + encrypted_data).decode() + Steganography.DELIMITER
            else:
                data_to_hide = secret_data + Steganography.DELIMITER
            
            # Convert data to binary
            binary_data = Steganography.text_to_binary(data_to_hide)
            data_length = len(binary_data)
            
            # Check if image can hold the data
            max_bytes = img_array.size
            if data_length > max_bytes:
                return None, False, f"Image too small. Need {data_length} bits but only have {max_bytes} bits available.", None
            
            # Flatten image array
            flat_img = img_array.flatten()
            
            # Encode data into LSB
            for i in range(data_length):
                flat_img[i] = (flat_img[i] & 0xFE) | int(binary_data[i])
            
            # Reshape and create new image
            encoded_array = flat_img.reshape(original_shape)
            encoded_img = Image.fromarray(encoded_array.astype('uint8'), 'RGB')
            
            # Convert to bytes
            img_byte_arr = io.BytesIO()
            encoded_img.save(img_byte_arr, format='PNG')
            img_byte_arr.seek(0)
            
            metadata = {
                'original_size': img.size,
                'data_length': len(secret_data),
                'encrypted': password is not None,
                'capacity_used': f"{(data_length / max_bytes * 100):.2f}%"
            }
            
            return img_byte_arr.getvalue(), True, "Data successfully hidden in image", metadata
            
        except Exception as e:
            return None, False, f"Error encoding image: {str(e)}", None
    
    @staticmethod
    def decode_image(image_path: str, password: str = None) -> tuple:
        """
        Extract hidden data from image
        Returns: (extracted_data, success, message)
        """
        try:
            # Open image
            img = Image.open(image_path)
            
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Get image data
            img_array = np.array(img)
            flat_img = img_array.flatten()
            
            # Extract binary data
            binary_data = ''
            for pixel in flat_img:
                binary_data += str(pixel & 1)
            
            # Convert binary to text
            all_bytes = [binary_data[i:i+8] for i in range(0, len(binary_data), 8)]
            decoded_data = ''
            
            for byte in all_bytes:
                if len(byte) == 8:
                    decoded_data += chr(int(byte, 2))
                    if decoded_data.endswith(Steganography.DELIMITER):
                        break
            
            # Check if delimiter found
            if not decoded_data.endswith(Steganography.DELIMITER):
                return None, False, "No hidden data found in image"
            
            # Remove delimiter
            decoded_data = decoded_data[:-len(Steganography.DELIMITER)]
            
            # Decrypt if password provided
            if password:
                try:
                    # Decode base64
                    encrypted_with_salt = base64.b64decode(decoded_data)
                    salt = encrypted_with_salt[:16]
                    encrypted_data = encrypted_with_salt[16:]
                    
                    # Decrypt
                    decrypted_data = Steganography.decrypt_data(encrypted_data, password, salt)
                    return decrypted_data, True, "Data successfully extracted and decrypted"
                except Exception as e:
                    return None, False, f"Decryption failed. Wrong password or corrupted data: {str(e)}"
            else:
                return decoded_data, True, "Data successfully extracted"
                
        except Exception as e:
            return None, False, f"Error decoding image: {str(e)}"
    
    @staticmethod
    def get_image_capacity(image_path: str) -> dict:
        """Get the maximum data capacity of an image"""
        try:
            img = Image.open(image_path)
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            img_array = np.array(img)
            total_pixels = img_array.size
            
            # Account for delimiter
            delimiter_bits = len(Steganography.text_to_binary(Steganography.DELIMITER))
            usable_bits = total_pixels - delimiter_bits
            usable_bytes = usable_bits // 8
            
            return {
                'success': True,
                'total_pixels': total_pixels,
                'max_characters': usable_bytes,
                'max_kb': round(usable_bytes / 1024, 2),
                'image_size': img.size
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
