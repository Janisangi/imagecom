// DOM Elements
const fileInput = document.getElementById('file-input');
const uploadArea = document.getElementById('upload-area');
const fileInfo = document.getElementById('file-info');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('quality-value');
const qualityLabel = document.getElementById('quality-label');
const outputFormat = document.getElementById('output-format');
const maxWidth = document.getElementById('max-width');
const compressBtn = document.getElementById('compress-btn');
const resetBtn = document.getElementById('reset-btn');
const downloadBtn = document.getElementById('download-btn');
const resultsSection = document.getElementById('results');
const loadingSection = document.getElementById('loading');
const originalImg = document.getElementById('original-img');
const compressedImg = document.getElementById('compressed-img');
const originalSize = document.getElementById('original-size');
const compressedSize = document.getElementById('compressed-size');
const originalDimensions = document.getElementById('original-dimensions');
const compressedDimensions = document.getElementById('compressed-dimensions');
const reduction = document.getElementById('reduction');
const ratio = document.getElementById('ratio');
const loadTime = document.getElementById('load-time');
const toast = document.getElementById('toast');
const menuBtn = document.getElementById('menu-btn');
const mainNav = document.getElementById('main-nav');
const darkModeToggle = document.getElementById('dark-mode-toggle');

// State
let originalFile = null;
let compressedFile = null;

// Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('active');
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('active');
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('active');
    if (e.dataTransfer.files.length) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        handleFileSelect(fileInput.files[0]);
    }
});

qualitySlider.addEventListener('input', updateQualityLabel);
qualitySlider.addEventListener('change', updateQualityLabel);

compressBtn.addEventListener('click', compressImage);
resetBtn.addEventListener('click', resetTool);
downloadBtn.addEventListener('click', downloadImage);
menuBtn.addEventListener('click', toggleMobileMenu);
darkModeToggle.addEventListener('click', toggleDarkMode);

// Functions
function updateQualityLabel() {
    const value = parseFloat(qualitySlider.value);
    qualityValue.textContent = value;
    
    // Update quality label based on value
    if (value <= 0.3) {
        qualityLabel.textContent = '(Low Quality)';
    } else if (value <= 0.6) {
        qualityLabel.textContent = '(Medium Quality)';
    } else {
        qualityLabel.textContent = '(High Quality)';
    }
}

function handleFileSelect(file) {
    // Check if file is an image
    if (!file.type.match('image.*')) {
        showToast('Please select an image file (JPG, PNG, WEBP)');
        return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showToast('File size too large. Maximum 10MB allowed.');
        return;
    }

    originalFile = file;
    fileInfo.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
    
    const reader = new FileReader();

    reader.onload = function(e) {
        originalImg.src = e.target.result;
        
        // Get image dimensions
        const img = new Image();
        img.onload = function() {
            originalDimensions.textContent = `${this.width} × ${this.height} px`;
        };
        img.src = e.target.result;

        originalSize.textContent = formatFileSize(file.size);
        compressBtn.disabled = false;
        resetBtn.disabled = false;
        resultsSection.style.display = 'none';
    };

    reader.readAsDataURL(file);
}

function compressImage() {
    if (!originalFile) {
        showToast('Please select an image first');
        return;
    }

    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';
    compressBtn.disabled = true;

    const quality = parseFloat(qualitySlider.value);
    const format = outputFormat.value === 'auto' ? null : outputFormat.value;
    const maxWidthValue = parseInt(maxWidth.value);

    // Show loading state
    compressBtn.innerHTML = `
        <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
        Compressing...
    `;

    new Compressor(originalFile, {
        quality: quality,
        maxWidth: maxWidthValue || undefined,
        convertSize: 5000000, // Convert to JPEG if size > 5MB
        mimeType: format ? `image/${format}` : null,
        success(result) {
            compressedFile = result;
            const reader = new FileReader();

            reader.onload = function(e) {
                compressedImg.src = e.target.result;
                
                // Get compressed image dimensions
                const img = new Image();
                img.onload = function() {
                    compressedDimensions.textContent = `${this.width} × ${this.height} px`;
                    updateStats();
                    loadingSection.style.display = 'none';
                    resultsSection.style.display = 'block';
                    compressBtn.disabled = false;
                    compressBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Compress Image
                    `;
                };
                img.src = e.target.result;
            };

            reader.readAsDataURL(result);
            compressedSize.textContent = formatFileSize(result.size);
        },
        error(err) {
            console.error('Compression error:', err);
            showToast('Error compressing image. Please try again.');
            loadingSection.style.display = 'none';
            compressBtn.disabled = false;
            compressBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Compress Image
            `;
        }
    });
}

function updateStats() {
    const originalSizeBytes = originalFile.size;
    const compressedSizeBytes = compressedFile.size;
    const reductionPercent = ((originalSizeBytes - compressedSizeBytes) / originalSizeBytes * 100).toFixed(1);
    const ratioValue = (originalSizeBytes / compressedSizeBytes).toFixed(1);
    
    reduction.textContent = `${reductionPercent}%`;
    ratio.textContent = `1:${ratioValue}`;
    
    // Estimate load time improvement (assuming 1Mbps connection)
    const loadTimeImprovement = ((originalSizeBytes - compressedSizeBytes) / 125000).toFixed(0);
    loadTime.textContent = `${loadTimeImprovement} ms faster`;
}

function downloadImage() {
    if (!compressedFile) {
        showToast('No compressed image available');
        return;
    }

    const a = document.createElement('a');
    const url = URL.createObjectURL(compressedFile);
    const fileName = originalFile.name.replace(/\.[^/.]+$/, '') + 
                   '-compressed-' + 
                   (qualitySlider.value * 100) + 
                   (outputFormat.value !== 'auto' ? '.' + outputFormat.value : originalFile.name.match(/\.[^/.]+$/) || '');
    
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

function resetTool() {
    fileInput.value = '';
    originalFile = null;
    compressedFile = null;
    originalImg.src = '#';
    compressedImg.src = '#';
    originalSize.textContent = '0 KB';
    compressedSize.textContent = '0 KB';
    originalDimensions.textContent = '0 × 0 px';
    compressedDimensions.textContent = '0 × 0 px';
    reduction.textContent = '0%';
    ratio.textContent = '1:1';
    loadTime.textContent = '0 ms';
    fileInfo.textContent = '';
    resultsSection.style.display = 'none';
    compressBtn.disabled = true;
    resetBtn.disabled = true;
    qualitySlider.value = 0.8;
    updateQualityLabel();
    outputFormat.value = 'auto';
    maxWidth.value = '0';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function toggleMobileMenu() {
    mainNav.classList.toggle('active');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    
    // Save preference to localStorage
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
}

// Check for saved dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// Close mobile menu when clicking on a link
document.querySelectorAll('#main-nav a').forEach(link => {
    link.addEventListener('click', () => {
        mainNav.classList.remove('active');
    });
});

// Initialize quality label
updateQualityLabel();

// Initialize AdSense
(adsbygoogle = window.adsbygoogle || []).push({});