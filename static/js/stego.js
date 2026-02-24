// ===== Steganography Module =====

// DOM Elements - Encode
const encodeUploadArea = document.getElementById('encode-upload-area');
const encodeFileInput = document.getElementById('encode-file-input');
const encodeBrowseBtn = document.getElementById('encode-browse-btn');
const encodePreview = document.getElementById('encode-preview');
const encodePreviewImage = document.getElementById('encode-preview-image');
const encodeClearBtn = document.getElementById('encode-clear-btn');
const secretDataTextarea = document.getElementById('secret-data');
const usePasswordEncode = document.getElementById('use-password-encode');
const encodePassword = document.getElementById('encode-password');
const encodeBtn = document.getElementById('encode-btn');
const encodeResults = document.getElementById('encode-results');
const capacityInfo = document.getElementById('capacity-info');
const capacityText = document.getElementById('capacity-text');

// DOM Elements - Decode
const decodeUploadArea = document.getElementById('decode-upload-area');
const decodeFileInput = document.getElementById('decode-file-input');
const decodeBrowseBtn = document.getElementById('decode-browse-btn');
const decodePreview = document.getElementById('decode-preview');
const decodePreviewImage = document.getElementById('decode-preview-image');
const decodeClearBtn = document.getElementById('decode-clear-btn');
const usePasswordDecode = document.getElementById('use-password-decode');
const decodePassword = document.getElementById('decode-password');
const decodeBtn = document.getElementById('decode-btn');
const decodeResults = document.getElementById('decode-results');

// Common
const stegoLoading = document.getElementById('stego-loading');
const stegoLoadingText = document.getElementById('stego-loading-text');

let encodeFile = null;
let decodeFile = null;
let downloadFilename = null;

// ===== Encode Section =====

// Browse button
encodeBrowseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    encodeFileInput.click();
});

// Upload area click
encodeUploadArea.addEventListener('click', () => {
    encodeFileInput.click();
});

// Drag and drop
encodeUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    encodeUploadArea.classList.add('drag-over');
});

encodeUploadArea.addEventListener('dragleave', () => {
    encodeUploadArea.classList.remove('drag-over');
});

encodeUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    encodeUploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleEncodeFile(files[0]);
    }
});

// File input change
encodeFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleEncodeFile(e.target.files[0]);
    }
});

function handleEncodeFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPG, JPEG, or PNG)');
        return;
    }

    if (file.size > 16 * 1024 * 1024) {
        alert('File size must be less than 16MB');
        return;
    }

    encodeFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        encodePreviewImage.src = e.target.result;
        encodeUploadArea.style.display = 'none';
        encodePreview.style.display = 'block';
        checkEncodeCapacity();
    };
    reader.readAsDataURL(file);

    updateEncodeButton();
}

// Check image capacity
async function checkEncodeCapacity() {
    const formData = new FormData();
    formData.append('image', encodeFile);

    try {
        const response = await fetch('/stego/capacity', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            capacityInfo.style.display = 'block';
            capacityText.textContent = `Capacity: ${data.max_characters} characters (${data.max_kb} KB)`;
        }
    } catch (error) {
        console.error('Error checking capacity:', error);
    }
}

// Clear encode preview
encodeClearBtn.addEventListener('click', () => {
    resetEncodeUI();
});

function resetEncodeUI() {
    encodeFile = null;
    encodeFileInput.value = '';
    encodePreviewImage.src = '';
    encodeUploadArea.style.display = 'block';
    encodePreview.style.display = 'none';
    encodeResults.style.display = 'none';
    capacityInfo.style.display = 'none';
    secretDataTextarea.value = '';
    usePasswordEncode.checked = false;
    encodePassword.style.display = 'none';
    encodePassword.value = '';
    updateEncodeButton();
}

// Password checkbox
usePasswordEncode.addEventListener('change', () => {
    if (usePasswordEncode.checked) {
        encodePassword.style.display = 'block';
    } else {
        encodePassword.style.display = 'none';
        encodePassword.value = '';
    }
});

// Update encode button state
secretDataTextarea.addEventListener('input', updateEncodeButton);

function updateEncodeButton() {
    const hasFile = encodeFile !== null;
    const hasData = secretDataTextarea.value.trim().length > 0;
    encodeBtn.disabled = !(hasFile && hasData);
}

// Encode button click
encodeBtn.addEventListener('click', async () => {
    const secretData = secretDataTextarea.value.trim();
    const password = usePasswordEncode.checked ? encodePassword.value : null;

    if (!encodeFile || !secretData) return;

    if (usePasswordEncode.checked && !password) {
        alert('Please enter a password');
        return;
    }

    // Show loading
    stegoLoadingText.textContent = 'Hiding data in image...';
    stegoLoading.style.display = 'block';
    encodeResults.style.display = 'none';

    const formData = new FormData();
    formData.append('image', encodeFile);
    formData.append('data', secretData);
    if (password) {
        formData.append('password', password);
    }

    try {
        const response = await fetch('/stego/encode', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            displayEncodeResults(data);
        } else {
            alert('Error: ' + data.error);
            stegoLoading.style.display = 'none';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to encode image. Please try again.');
        stegoLoading.style.display = 'none';
    }
});

function displayEncodeResults(data) {
    stegoLoading.style.display = 'none';
    encodeResults.style.display = 'block';

    document.getElementById('encode-result-message').textContent = data.message;
    document.getElementById('encoded-image-preview').src = data.image_data;
    downloadFilename = data.download_filename;

    // Display metadata
    const metadata = data.metadata;
    const metadataHtml = `
        <div class="metadata-item">
            <i class="fas fa-image"></i>
            <span>Original Size: ${metadata.original_size[0]} x ${metadata.original_size[1]}</span>
        </div>
        <div class="metadata-item">
            <i class="fas fa-file-alt"></i>
            <span>Data Length: ${metadata.data_length} characters</span>
        </div>
        <div class="metadata-item">
            <i class="fas fa-chart-pie"></i>
            <span>Capacity Used: ${metadata.capacity_used}</span>
        </div>
        <div class="metadata-item">
            <i class="fas fa-${metadata.encrypted ? 'lock' : 'unlock'}"></i>
            <span>${metadata.encrypted ? 'Encrypted' : 'Not Encrypted'}</span>
        </div>
    `;
    document.getElementById('encode-metadata').innerHTML = metadataHtml;

    // Scroll to results
    encodeResults.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Download encoded image
document.getElementById('download-encoded-btn').addEventListener('click', () => {
    if (downloadFilename) {
        window.location.href = `/download/${downloadFilename}`;
    }
});

// ===== Decode Section =====

// Browse button
decodeBrowseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    decodeFileInput.click();
});

// Upload area click
decodeUploadArea.addEventListener('click', () => {
    decodeFileInput.click();
});

// Drag and drop
decodeUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    decodeUploadArea.classList.add('drag-over');
});

decodeUploadArea.addEventListener('dragleave', () => {
    decodeUploadArea.classList.remove('drag-over');
});

decodeUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    decodeUploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleDecodeFile(files[0]);
    }
});

// File input change
decodeFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleDecodeFile(e.target.files[0]);
    }
});

function handleDecodeFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPG, JPEG, or PNG)');
        return;
    }

    if (file.size > 16 * 1024 * 1024) {
        alert('File size must be less than 16MB');
        return;
    }

    decodeFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        decodePreviewImage.src = e.target.result;
        decodeUploadArea.style.display = 'none';
        decodePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);

    updateDecodeButton();
}

// Clear decode preview
decodeClearBtn.addEventListener('click', () => {
    resetDecodeUI();
});

function resetDecodeUI() {
    decodeFile = null;
    decodeFileInput.value = '';
    decodePreviewImage.src = '';
    decodeUploadArea.style.display = 'block';
    decodePreview.style.display = 'none';
    decodeResults.style.display = 'none';
    usePasswordDecode.checked = false;
    decodePassword.style.display = 'none';
    decodePassword.value = '';
    updateDecodeButton();
}

// Password checkbox
usePasswordDecode.addEventListener('change', () => {
    if (usePasswordDecode.checked) {
        decodePassword.style.display = 'block';
    } else {
        decodePassword.style.display = 'none';
        decodePassword.value = '';
    }
});

function updateDecodeButton() {
    decodeBtn.disabled = decodeFile === null;
}

// Decode button click
decodeBtn.addEventListener('click', async () => {
    const password = usePasswordDecode.checked ? decodePassword.value : null;

    if (!decodeFile) return;

    if (usePasswordDecode.checked && !password) {
        alert('Please enter a password');
        return;
    }

    // Show loading
    stegoLoadingText.textContent = 'Extracting hidden data...';
    stegoLoading.style.display = 'block';
    decodeResults.style.display = 'none';

    const formData = new FormData();
    formData.append('image', decodeFile);
    if (password) {
        formData.append('password', password);
    }

    try {
        const response = await fetch('/stego/decode', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            displayDecodeResults(data);
        } else {
            alert('Error: ' + data.error);
            stegoLoading.style.display = 'none';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to decode image. Please try again.');
        stegoLoading.style.display = 'none';
    }
});

function displayDecodeResults(data) {
    stegoLoading.style.display = 'none';
    decodeResults.style.display = 'block';

    document.getElementById('decode-result-message').textContent = data.message;
    document.getElementById('extracted-data').textContent = data.data;

    // Scroll to results
    decodeResults.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Copy to clipboard
document.getElementById('copy-data-btn').addEventListener('click', () => {
    const extractedData = document.getElementById('extracted-data').textContent;
    navigator.clipboard.writeText(extractedData).then(() => {
        const btn = document.getElementById('copy-data-btn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
});

console.log('Steganography module initialized');
