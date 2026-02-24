// ===== DOM Elements =====
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const previewArea = document.getElementById('preview-area');
const previewImage = document.getElementById('preview-image');
const clearBtn = document.getElementById('clear-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const resultHeader = document.getElementById('result-header');
const probabilitiesList = document.getElementById('probabilities-list');

let currentFile = null;
let resultsChart = null;

// ===== Smooth Scrolling =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ===== Active Nav Link =====
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ===== Tab Switching =====
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');

        // Update active states
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            }
        });

        // Reset UI
        resetUI();
    });
});

// ===== File Upload Handling =====
browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

uploadArea.addEventListener('click', () => {
    fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPG, JPEG, or PNG)');
        return;
    }

    // Validate file size (16MB max)
    if (file.size > 16 * 1024 * 1024) {
        alert('File size must be less than 16MB');
        return;
    }

    currentFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        uploadArea.style.display = 'none';
        previewArea.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// ===== Clear Preview =====
clearBtn.addEventListener('click', () => {
    resetUI();
});

function resetUI() {
    currentFile = null;
    fileInput.value = '';
    previewImage.src = '';
    uploadArea.style.display = 'block';
    previewArea.style.display = 'none';
    loading.style.display = 'none';
    results.style.display = 'none';

    if (resultsChart) {
        resultsChart.destroy();
        resultsChart = null;
    }
}

// ===== Analyze Image =====
analyzeBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    // Show loading
    previewArea.style.display = 'none';
    loading.style.display = 'block';
    results.style.display = 'none';

    // Create form data
    const formData = new FormData();
    formData.append('image', currentFile);

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            displayResults(data);
        } else {
            alert('Error analyzing image: ' + data.error);
            resetUI();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to analyze image. Please try again.');
        resetUI();
    }
});

// ===== Sample Images =====
const sampleBtns = document.querySelectorAll('.sample-btn');

sampleBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        const sampleName = btn.getAttribute('data-sample');

        // Show loading
        loading.style.display = 'block';
        results.style.display = 'none';

        try {
            const response = await fetch(`/sample/${sampleName}`);
            const data = await response.json();

            if (data.success) {
                displayResults(data);
            } else {
                alert('Error analyzing sample: ' + data.error);
                loading.style.display = 'none';
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to analyze sample. Please try again.');
            loading.style.display = 'none';
        }
    });
});

// ===== Display Results =====
function displayResults(data) {
    loading.style.display = 'none';
    results.style.display = 'block';

    const probabilities = data.probabilities;
    const entries = Object.entries(probabilities);
    const topEntry = entries[0];
    const topMalware = topEntry[0];
    const topProbability = topEntry[1];

    // Determine if malware detected
    const isMalware = topProbability >= 0.6;

    // Update header
    resultHeader.className = 'result-header ' + (isMalware ? 'malware-detected' : 'safe');

    if (isMalware) {
        resultHeader.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem;">
                <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
            </div>
            <h2 style="color: var(--danger);">Malware Detected!</h2>
            <p>Type: <strong>${topMalware}</strong></p>
            <p>Confidence: <strong>${(topProbability * 100).toFixed(2)}%</strong></p>
        `;
    } else {
        resultHeader.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem;">
                <i class="fas fa-check-circle" style="color: var(--success);"></i>
            </div>
            <h2 style="color: var(--success);">Image is Safe</h2>
            <p>No malware detected with high confidence</p>
        `;
    }

    // Create chart
    createChart(probabilities);

    // Display probabilities list
    probabilitiesList.innerHTML = '';
    entries.slice(0, 10).forEach(([name, prob]) => {
        const item = document.createElement('div');
        item.className = 'probability-item';
        item.innerHTML = `
            <span class="probability-name">${name}</span>
            <span class="probability-value">${(prob * 100).toFixed(2)}%</span>
        `;
        probabilitiesList.appendChild(item);
    });

    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ===== Create Chart =====
function createChart(probabilities) {
    const ctx = document.getElementById('results-chart');

    if (resultsChart) {
        resultsChart.destroy();
    }

    const entries = Object.entries(probabilities).slice(0, 5);
    const labels = entries.map(([name]) => name);
    const values = entries.map(([, prob]) => prob * 100);

    // Generate gradient colors
    const gradients = labels.map((_, index) => {
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        const hue = 250 - (index * 30);
        gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.8)`);
        gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0.2)`);
        return gradient;
    });

    resultsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Probability (%)',
                data: values,
                backgroundColor: gradients,
                borderColor: gradients.map((_, index) => {
                    const hue = 250 - (index * 30);
                    return `hsla(${hue}, 80%, 60%, 1)`;
                }),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 36, 0.95)',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return `Probability: ${context.parsed.y.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            family: "'JetBrains Mono', monospace",
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function (value) {
                            return value + '%';
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// ===== Initialize =====
console.log('MLDefender initialized');
