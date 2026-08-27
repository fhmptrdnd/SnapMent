/* ==========================================================================
   SnapMent - Web Photobooth Engine
   ========================================================================== */

// 1. Layout Geometries for 4R Standards (1200x1800 Portrait & 1800x1200 Landscape)
const LAYOUT_GEOMETRIES = {
    'portrait': {
        'double-strip': {
            canvasSize: { width: 1200, height: 1800 },
            numPhotos: 3,
            slots: [
                { id: 0, x: 60, y: 80, w: 480, h: 360, duplicateOf: null },
                { id: 1, x: 60, y: 490, w: 480, h: 360, duplicateOf: null },
                { id: 2, x: 60, y: 900, w: 480, h: 360, duplicateOf: null },
                { id: 3, x: 660, y: 80, w: 480, h: 360, duplicateOf: 0 },
                { id: 4, x: 660, y: 490, w: 480, h: 360, duplicateOf: 1 },
                { id: 5, x: 660, y: 900, w: 480, h: 360, duplicateOf: 2 }
            ]
        },
        'grid-2x2': {
            canvasSize: { width: 1200, height: 1800 },
            numPhotos: 4,
            slots: [
                { id: 0, x: 80, y: 80, w: 480, h: 640, duplicateOf: null },
                { id: 1, x: 640, y: 80, w: 480, h: 640, duplicateOf: null },
                { id: 2, x: 80, y: 800, w: 480, h: 640, duplicateOf: null },
                { id: 3, x: 640, y: 800, w: 480, h: 640, duplicateOf: null }
            ]
        },
        'triple-row': {
            canvasSize: { width: 1200, height: 1800 },
            numPhotos: 3,
            slots: [
                { id: 0, x: 100, y: 100, w: 1000, h: 450, duplicateOf: null },
                { id: 1, x: 100, y: 600, w: 1000, h: 450, duplicateOf: null },
                { id: 2, x: 100, y: 1100, w: 1000, h: 450, duplicateOf: null }
            ]
        },
        'single': {
            canvasSize: { width: 1200, height: 1800 },
            numPhotos: 1,
            slots: [
                { id: 0, x: 0, y: 0, w: 1200, h: 1800, duplicateOf: null }
            ]
        },
        'double-frame': {
            canvasSize: { width: 1200, height: 1800 },
            numPhotos: 2,
            slots: [
                { id: 0, x: 57, y: 131, w: 1086, h: 611, duplicateOf: null },
                { id: 1, x: 57, y: 830, w: 1086, h: 611, duplicateOf: null }
            ]
        }
    },
    'landscape': {
        'double-strip': {
            canvasSize: { width: 1800, height: 1200 },
            numPhotos: 3,
            slots: [
                { id: 0, x: 100, y: 60, w: 400, h: 480, duplicateOf: null },
                { id: 1, x: 600, y: 60, w: 400, h: 480, duplicateOf: null },
                { id: 2, x: 1100, y: 60, w: 400, h: 480, duplicateOf: null },
                { id: 3, x: 100, y: 660, w: 400, h: 480, duplicateOf: 0 },
                { id: 4, x: 600, y: 660, w: 400, h: 480, duplicateOf: 1 },
                { id: 5, x: 1100, y: 660, w: 400, h: 480, duplicateOf: 2 }
            ]
        },
        'grid-2x2': {
            canvasSize: { width: 1800, height: 1200 },
            numPhotos: 4,
            slots: [
                { id: 0, x: 80, y: 80, w: 760, h: 440, duplicateOf: null },
                { id: 1, x: 960, y: 80, w: 760, h: 440, duplicateOf: null },
                { id: 2, x: 80, y: 680, w: 760, h: 440, duplicateOf: null },
                { id: 3, x: 960, y: 680, w: 760, h: 440, duplicateOf: null }
            ]
        },
        'triple-row': {
            canvasSize: { width: 1800, height: 1200 },
            numPhotos: 3,
            slots: [
                { id: 0, x: 100, y: 100, w: 480, h: 800, duplicateOf: null },
                { id: 1, x: 660, y: 100, w: 480, h: 800, duplicateOf: null },
                { id: 2, x: 1220, y: 100, w: 480, h: 800, duplicateOf: null }
            ]
        },
        'single': {
            canvasSize: { width: 1800, height: 1200 },
            numPhotos: 1,
            slots: [
                { id: 0, x: 0, y: 0, w: 1800, h: 1200, duplicateOf: null }
            ]
        },
        'double-frame': {
            canvasSize: { width: 1800, height: 1200 },
            numPhotos: 2,
            slots: [
                { id: 0, x: 131, y: 57, w: 611, h: 1086, duplicateOf: null },
                { id: 1, x: 830, y: 57, w: 611, h: 1086, duplicateOf: null }
            ]
        }
    }
};

// 2. Application State Variables
let currentLayout = 'double-strip';
let activeOrientation = 'portrait'; // portrait or landscape
let activeFilter = 'none';
let currentPreset = 'none';

let photoSlotsState = {}; // Key: slotId, Value: { imageSrc, zoom, rotate, panX, panY }
let customTemplateDataUrl = null; // Stored user PNG upload
let activeSelectedSlotId = null; // The slot currently highlighted for adjustments
let isSessionRunning = false;
let audioContext = null;

// Undo / Redo stacks
let historyStack = [];
let redoStack = [];

// Countdown control
let shouldRestartCountdown = false;
let shouldGoBackPhoto = false;
let backClicks = 0;
let isWaitingForStart = false;

// Camera stream variables
let localStream = null;
let activeCameraId = '';

// Drag/Panning variables
let activeDrag = null;

// 3. DOM Elements
const webcam = document.getElementById('webcam');
const cameraPlaceholder = document.getElementById('camera-placeholder');
const btnStartCamera = document.getElementById('btn-start-camera');
const cameraSelect = document.getElementById('camera-select');
const btnMirror = document.getElementById('btn-mirror');
const btnCaptureSingle = document.getElementById('btn-capture-single');
const btnStartSession = document.getElementById('btn-start-session');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
const countdownPrompt = document.getElementById('countdown-prompt');
const captureStatus = document.getElementById('capture-status');
const currentPhotoIndexSpan = document.getElementById('current-photo-index');
const totalPhotosNeededSpan = document.getElementById('total-photos-needed');
const flashOverlay = document.getElementById('flash-overlay');

const photoboothPreview = document.getElementById('photobooth-preview');
const canvasOrientationBadge = document.getElementById('canvas-orientation');
const templateOverlayImg = document.getElementById('template-overlay-img');
const canvasGridGuide = document.getElementById('canvas-grid-guide');

const adjustmentControls = document.getElementById('adjustment-controls');
const selectedSlotNumSpan = document.getElementById('selected-slot-num');
const btnClearSlot = document.getElementById('btn-clear-slot');
const sliderZoom = document.getElementById('slider-zoom');
const sliderRotate = document.getElementById('slider-rotate');

const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');
const btnRestartCountdown = document.getElementById('btn-restart-countdown');
const manualTemplateName = document.getElementById('manual-template-name');
const btnLoadManualTemplate = document.getElementById('btn-load-manual-template');

const layoutButtons = document.querySelectorAll('.layout-btn');
const presetButtons = document.querySelectorAll('.preset-btn');
const filterButtons = document.querySelectorAll('.filter-btn');

const uploadZone = document.getElementById('upload-zone');
const templateFileInput = document.getElementById('template-file');
const btnBrowseFile = document.getElementById('btn-browse-file');

const btnDownload = document.getElementById('btn-download');
const btnUploadDrive = document.getElementById('btn-upload-drive');
const btnReset = document.getElementById('btn-reset');
const offscreenCanvas = document.getElementById('offscreen-canvas');

// ==========================================================================
// Web Audio API Synthesizer (Zero asset requirements)
// ==========================================================================

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playBeep(freq = 440, duration = 0.05) {
    try {
        initAudioContext();
        if (!audioContext) return;
        
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        
        gain.gain.setValueAtTime(0.15, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.warn("Audio Context beep failed:", e);
    }
}

function playShutterSound() {
    try {
        initAudioContext();
        if (!audioContext) return;
        
        const bufferSize = audioContext.sampleRate * 0.12; // 120ms burst
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate white noise for shutter sound
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;
        
        const filter = audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 1;
        
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0.8, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        
        // Add a secondary mechanical "click" sound
        const osc = audioContext.createOscillator();
        const oscGain = audioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.05);
        
        oscGain.gain.setValueAtTime(0.5, audioContext.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.04);
        
        osc.connect(oscGain);
        oscGain.connect(audioContext.destination);
        
        noise.start();
        osc.start();
        
        noise.stop(audioContext.currentTime + 0.12);
        osc.stop(audioContext.currentTime + 0.05);
    } catch (e) {
        console.warn("Audio shutter click failed:", e);
    }
}

// ==========================================================================
// Camera Management Module
// ==========================================================================

async function initCamera() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        cameraSelect.innerHTML = '';
        if (videoDevices.length === 0) {
            cameraSelect.innerHTML = '<option value="">No cameras found</option>';
            return;
        }
        
        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${index + 1}`;
            cameraSelect.appendChild(option);
        });
        
        // Select first camera
        const defaultDeviceId = videoDevices[0].deviceId;
        cameraSelect.value = defaultDeviceId;
        await startCameraStream(defaultDeviceId);
    } catch (err) {
        console.error("Camera list init failed:", err);
        showCameraPlaceholder(true, "Camera access permission denied. Grant access to run the Photobooth.");
    }
}

async function startCameraStream(deviceId) {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    
    const constraints = {
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: false
    };
    
    try {
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        webcam.srcObject = localStream;
        webcam.onloadedmetadata = () => {
            webcam.play();
            showCameraPlaceholder(false);
        };
        activeCameraId = deviceId;
    } catch (err) {
        console.error("Failed to start camera stream:", err);
        showCameraPlaceholder(true, "Could not stream camera. It might be occupied by another app.");
    }
}

function showCameraPlaceholder(visible, message = "") {
    if (visible) {
        cameraPlaceholder.classList.remove('hidden');
        if (message) {
            cameraPlaceholder.querySelector('p').textContent = message;
        }
    } else {
        cameraPlaceholder.classList.add('hidden');
    }
}

// ==========================================================================
// Layout & Frame Rendering Module
// ==========================================================================

function getActiveLayout() {
    return LAYOUT_GEOMETRIES[activeOrientation][currentLayout];
}

// Build standard pixel coordinates, translate to percentage layout dynamically
function buildCanvasLayout() {
    const layout = getActiveLayout();
    const canvasSize = layout.canvasSize;
    
    // Set aspect ratio classes on preview wrapper
    photoboothPreview.className = `photobooth-preview ${activeOrientation}-mode`;
    canvasOrientationBadge.textContent = `${activeOrientation.charAt(0).toUpperCase() + activeOrientation.slice(1)} 4R`;
    
    // Clear old slots (except template image container)
    const existingSlots = photoboothPreview.querySelectorAll('.photo-slot');
    existingSlots.forEach(el => el.remove());
    
    // Update guidelines
    buildGridGuideLines();
    
    // Draw and append slots
    layout.slots.forEach(slot => {
        const slotEl = document.createElement('div');
        slotEl.className = 'photo-slot';
        slotEl.dataset.slotId = slot.id;
        
        // CSS percent calculations
        slotEl.style.left = `${(slot.x / canvasSize.width) * 100}%`;
        slotEl.style.top = `${(slot.y / canvasSize.height) * 100}%`;
        slotEl.style.width = `${(slot.w / canvasSize.width) * 100}%`;
        slotEl.style.height = `${(slot.h / canvasSize.height) * 100}%`;
        
        // Slot event listener (click to select and adjust)
        slotEl.addEventListener('click', (e) => {
            if (isSessionRunning) return;
            // Select the source slot (or self if primary)
            const actualSlotId = slot.duplicateOf !== null ? slot.duplicateOf : slot.id;
            selectSlot(actualSlotId);
        });
        
        // Populate content
        const sourceId = slot.duplicateOf !== null ? slot.duplicateOf : slot.id;
        const photoState = photoSlotsState[sourceId];
        
        if (photoState && photoState.imageSrc) {
            // Draw image
            const img = document.createElement('img');
            img.src = photoState.imageSrc;
            img.className = `captured-image img-filter-${activeFilter}`;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            
            // Reapply translation / scale transforms
            img.style.transform = `translate(${photoState.panX}px, ${photoState.panY}px) scale(${photoState.zoom}) rotate(${photoState.rotate}deg)`;
            
            // Wire up drag logic
            if (slot.duplicateOf === null) {
                img.addEventListener('mousedown', (e) => startDrag(e, slot.id, img));
                img.addEventListener('touchstart', (e) => startDrag(e, slot.id, img), { passive: false });
            }
            
            slotEl.appendChild(img);
        } else {
            // Draw placeholder inside slot
            const placeholder = document.createElement('div');
            placeholder.className = 'slot-placeholder';
            
            // Render index inside badge (1-based index)
            const displayIndex = slot.duplicateOf !== null ? slot.duplicateOf + 1 : slot.id + 1;
            
            placeholder.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-dasharray="2,2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                </svg>
                <span>Slot ${displayIndex}</span>
            `;
            slotEl.appendChild(placeholder);
        }
        
        photoboothPreview.appendChild(slotEl);
    });
    
    // Keep template on top
    photoboothPreview.appendChild(document.getElementById('template-overlay-container'));
    
    // Draw built-in presets or upload
    updateTemplateFrameOverlay();
    
    // Highlight if there was a selected slot
    if (activeSelectedSlotId !== null) {
        const slotEl = photoboothPreview.querySelector(`.photo-slot[data-slot-id="${activeSelectedSlotId}"]`);
        if (slotEl) slotEl.classList.add('active-slot');
    }
    
    // Enable/disable download button
    checkDownloadAvailability();
}

function buildGridGuideLines() {
    const layout = getActiveLayout();
    const canvasSize = layout.canvasSize;
    
    canvasGridGuide.innerHTML = '';
    
    if (customTemplateDataUrl || currentPreset !== 'none') {
        canvasGridGuide.classList.add('hidden');
        return;
    }
    canvasGridGuide.classList.remove('hidden');
    
    // Render guidelines (where the photos will be cropped)
    layout.slots.forEach(slot => {
        const guide = document.createElement('div');
        guide.className = 'canvas-guide-rect';
        guide.style.position = 'absolute';
        guide.style.left = `${(slot.x / canvasSize.width) * 100}%`;
        guide.style.top = `${(slot.y / canvasSize.height) * 100}%`;
        guide.style.width = `${(slot.w / canvasSize.width) * 100}%`;
        guide.style.height = `${(slot.h / canvasSize.height) * 100}%`;
        guide.style.border = '2px dashed rgba(6, 182, 212, 0.4)';
        guide.style.pointerEvents = 'none';
        canvasGridGuide.appendChild(guide);
    });
}

function updateTemplateFrameOverlay() {
    if (customTemplateDataUrl) {
        // Show uploaded image
        templateOverlayImg.src = customTemplateDataUrl;
        templateOverlayImg.classList.remove('hidden');
    } else if (currentPreset !== 'none') {
        // Generate built-in preset frame dynamically
        const layout = getActiveLayout();
        const presetDataUrl = generatePresetFrame(currentPreset, layout.canvasSize.width, layout.canvasSize.height);
        templateOverlayImg.src = presetDataUrl;
        templateOverlayImg.classList.remove('hidden');
    } else {
        // No templates
        templateOverlayImg.src = '';
        templateOverlayImg.classList.add('hidden');
    }
}

// ==========================================================================
// Preset Frame Canvas Generators (Zero assets, elegant drawings)
// ==========================================================================

function generatePresetFrame(presetName, width, height) {
    const layout = getActiveLayout();
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (presetName === 'classic-polaroid') {
        // 1. Polaroid White/Cream Paper Background
        ctx.fillStyle = '#fbfbfc';
        ctx.fillRect(0, 0, width, height);
        
        // 2. Cutout transparent slots
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        layout.slots.forEach(slot => {
            ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
        });
        ctx.restore();
        
        // 3. Draw elegant borders around slots
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        layout.slots.forEach(slot => {
            ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
        });
        
        // 4. Text Branding
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
        
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
        if (width > height) {
            // Landscape print branding
            ctx.fillText("S N A P S T U D I O", width - 300, height - 70);
            ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText(dateStr, width - 300, height - 35);
        } else {
            // Portrait print branding
            ctx.fillText("S N A P S T U D I O", width / 2, height - 120);
            ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText(dateStr, width / 2, height - 70);
        }
        
    } else if (presetName === 'neon-cyber') {
        // 1. Cyberpunk Dark Space base
        ctx.fillStyle = '#08070d';
        ctx.fillRect(0, 0, width, height);
        
        // 2. Cutout slots
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        layout.slots.forEach(slot => {
            ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
        });
        ctx.restore();
        
        // 3. Glowing neon neon outlines
        layout.slots.forEach((slot, idx) => {
            ctx.save();
            ctx.shadowBlur = 20;
            const color = idx % 2 === 0 ? '#06b6d4' : '#ec4899';
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 6;
            ctx.strokeRect(slot.x - 3, slot.y - 3, slot.w + 6, slot.h + 6);
            ctx.restore();
        });
        
        // 4. Sci-Fi accents
        ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
        ctx.font = 'bold 20px "Courier New", Courier, monospace';
        
        if (width > height) {
            ctx.fillText("SYSTEM_READY // SNAP_STUDIO.DLL", 100, height - 60);
            ctx.fillStyle = 'rgba(236, 72, 153, 0.7)';
            ctx.fillText("4R_LANDSCAPE_COMPO", width - 350, height - 60);
        } else {
            ctx.fillText("SYSTEM_READY // SNAP_STUDIO.DLL", 80, height - 120);
            ctx.fillStyle = 'rgba(236, 72, 153, 0.7)';
            ctx.fillText("4R_PORTRAIT_STRIPS", 80, height - 80);
        }
        
    } else if (presetName === 'pastel-floral') {
        // 1. Soft Warm Cream background
        ctx.fillStyle = '#fcf8f6';
        ctx.fillRect(0, 0, width, height);
        
        // 2. Cutout slots
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        layout.slots.forEach(slot => {
            ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
        });
        ctx.restore();
        
        // 3. Fine white border overlay
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        layout.slots.forEach(slot => {
            ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
        });
        
        // 4. Draw Simple Pastel Flowers dynamically in corners/gutters
        const drawFlower = (cx, cy, size, color) => {
            ctx.fillStyle = color;
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5;
                const px = cx + Math.cos(angle) * (size * 0.4);
                const py = cy + Math.sin(angle) * (size * 0.4);
                ctx.beginPath();
                ctx.arc(px, py, size * 0.32, 0, 2 * Math.PI);
                ctx.fill();
            }
            // Center yellow dot
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(cx, cy, size * 0.18, 0, 2 * Math.PI);
            ctx.fill();
        };
        
        // Place decorations
        if (width > height) {
            drawFlower(180, height - 80, 50, '#fecdd3'); // pastel rose
            drawFlower(width - 150, 100, 40, '#ddd6fe'); // lavender
            drawFlower(width - 180, height - 90, 60, '#cbd5e1'); // sage green
        } else {
            drawFlower(150, height - 100, 55, '#fecdd3');
            drawFlower(width - 150, height - 100, 50, '#ddd6fe');
            drawFlower(width / 2, height - 140, 45, '#a7f3d0');
        }
        
        // 5. Delicate serif tagline
        ctx.fillStyle = '#78716c';
        ctx.textAlign = 'center';
        ctx.font = 'italic 28px serif';
        if (width > height) {
            ctx.fillText("sweet memories", width / 2, height - 60);
        } else {
            ctx.fillText("cherished moments", width / 2, height - 60);
        }
        
    } else if (presetName === 'retro-comic') {
        // 1. Halftone comic yellow background
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(0, 0, width, height);
        
        // Draw halftone pattern
        ctx.fillStyle = '#fde047';
        const spacing = 35;
        for (let x = 0; x < width; x += spacing) {
            for (let y = 0; y < height; y += spacing) {
                ctx.beginPath();
                ctx.arc(x + (y % (spacing * 2) === 0 ? spacing / 2 : 0), y, 8, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        
        // 2. Cutout slots
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        layout.slots.forEach(slot => {
            ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
        });
        ctx.restore();
        
        // 3. Thick black comic outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 14;
        ctx.lineJoin = 'miter';
        layout.slots.forEach(slot => {
            ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
        });
        
        // 4. Comic Burst Badge with "SNAP!" text
        const drawBurst = (cx, cy, numPoints, outerRadius, innerRadius, fill, stroke) => {
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            let step = Math.PI / numPoints;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < numPoints; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;
                
                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.lineWidth = 8;
            ctx.strokeStyle = stroke;
            ctx.stroke();
        };
        
        if (width > height) {
            drawBurst(width - 240, height - 160, 10, 110, 60, '#ef4444', '#000000');
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.font = 'black 38px "Arial Black", sans-serif';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 6;
            ctx.strokeText("COOL!", width - 240, height - 145);
            ctx.fillText("COOL!", width - 240, height - 145);
        } else {
            drawBurst(width / 2, height - 160, 10, 100, 55, '#ef4444', '#000000');
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.font = 'black 36px "Arial Black", sans-serif';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 6;
            ctx.strokeText("SNAP!", width / 2, height - 148);
            ctx.fillText("SNAP!", width / 2, height - 148);
        }
    }
    
    return tempCanvas.toDataURL('image/png');
}

// ==========================================================================
// Photobooth Capture Logic (Countdown, Sound, Flash, Filters)
// ==========================================================================

function getCanvasFilterString(filterName) {
    switch (filterName) {
        case 'grayscale': return 'grayscale(1)';
        case 'sepia': return 'sepia(1)';
        case 'vintage': return 'sepia(0.5) contrast(1.2) hue-rotate(-20deg)';
        case 'cool': return 'hue-rotate(90deg) saturate(1.2)';
        case 'warm': return 'sepia(0.3) saturate(1.4) hue-rotate(-10deg)';
        default: return 'none';
    }
}

// Capture current webcam frame
function captureFrame() {
    if (!webcam.srcObject) return null;
    
    const tempCanvas = document.createElement('canvas');
    // Set frame capture resolutions
    tempCanvas.width = webcam.videoWidth || 1280;
    tempCanvas.height = webcam.videoHeight || 720;
    const ctx = tempCanvas.getContext('2d');
    
    // Replicate Mirror state
    const isMirrored = !webcam.classList.contains('no-mirror');
    if (isMirrored) {
        ctx.translate(tempCanvas.width, 0);
        ctx.scale(-1, 1);
    }
    
    // Capture raw image so filters can be applied and changed dynamically later
    ctx.filter = 'none';
    
    // Draw
    ctx.drawImage(webcam, 0, 0, tempCanvas.width, tempCanvas.height);
    
    return tempCanvas.toDataURL('image/jpeg', 0.95);
}

// Wait for Spacebar press
function waitSpacebar() {
    return new Promise((resolve) => {
        const handleKeydown = (e) => {
            if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
                e.preventDefault();
                document.removeEventListener('keydown', handleKeydown);
                resolve();
            }
        };
        document.addEventListener('keydown', handleKeydown);
    });
}

// Helper to show custom confirmation modal
function showConfirmModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const btnYes = document.getElementById('confirm-btn-yes');
        const btnNo = document.getElementById('confirm-btn-no');
        
        modal.classList.remove('hidden');
        
        const handleYes = () => {
            cleanup();
            resolve(true);
        };
        
        const handleNo = () => {
            cleanup();
            resolve(false);
        };
        
        const cleanup = () => {
            modal.classList.add('hidden');
            btnYes.removeEventListener('click', handleYes);
            btnNo.removeEventListener('click', handleNo);
        };
        
        btnYes.addEventListener('click', handleYes);
        btnNo.addEventListener('click', handleNo);
    });
}

// Sequence execution
async function runPhotoboothSession() {
    if (isSessionRunning) return;
    
    // Check if there are already photos captured in photoSlotsState
    const hasCapturedPhotos = Object.keys(photoSlotsState).some(key => photoSlotsState[key] && photoSlotsState[key].imageSrc);
    if (hasCapturedPhotos) {
        const confirmResult = await showConfirmModal();
        if (!confirmResult) {
            return;
        }
    }
    
    isSessionRunning = true;
    
    // Enter fullscreen live camera mode during the session
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) videoContainer.classList.add('fullscreen-camera');
    document.body.classList.add('in-session');
    
    initAudioContext();
    toggleControlsDisable(true);
    
    const layout = getActiveLayout();
    const photosToCapture = layout.numPhotos;
    
    // Reset canvas states before starting
    resetAllPhotoSlots(false); // Clear silently without full rebuild
    
    captureStatus.classList.remove('hidden');
    totalPhotosNeededSpan.textContent = photosToCapture;
    
    try {
        isWaitingForStart = true;
        let i = 0;
        
        while (i < photosToCapture) {
            if (isWaitingForStart) {
                // Wait for user to press Space to start the photobooth session
                countdownOverlay.classList.remove('hidden');
                countdownNumber.textContent = ""; // Hide the big central number
                
                if (countdownPrompt) {
                    countdownPrompt.textContent = "Press Space to Start";
                    countdownPrompt.classList.remove('hidden');
                }
                if (btnRestartCountdown) btnRestartCountdown.style.display = 'flex';
                
                backClicks = 0;
                shouldRestartCountdown = false;
                shouldGoBackPhoto = false;
                
                let spacePressed = false;
                const onSpace = (e) => {
                    if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
                        e.preventDefault();
                        spacePressed = true;
                    }
                };
                document.addEventListener('keydown', onSpace);
                
                while (!spacePressed && !shouldGoBackPhoto) {
                    await sleep(100);
                }
                
                document.removeEventListener('keydown', onSpace);
                
                if (shouldGoBackPhoto) {
                    // Back button clicked during space to start -> exit session
                    return;
                }
                
                isWaitingForStart = false;
                if (countdownPrompt) countdownPrompt.classList.add('hidden');
            }
            
            currentPhotoIndexSpan.textContent = i + 1;
            
            // Reset countdown control flags for the current photo
            backClicks = 0;
            shouldRestartCountdown = false;
            shouldGoBackPhoto = false;
            
            // 1. Wait 3 seconds countdown
            countdownOverlay.classList.remove('hidden');
            if (btnRestartCountdown) btnRestartCountdown.style.display = 'flex';
            
            let countdown = 3;
            let goToPrevious = false;
            
            while (countdown >= 1) {
                countdownNumber.textContent = countdown;
                playBeep(440, 0.05);
                
                let aborted = false;
                for (let ms = 0; ms < 1000; ms += 100) {
                    await sleep(100);
                    
                    if (shouldGoBackPhoto) {
                        goToPrevious = true;
                        aborted = true;
                        break;
                    }
                    
                    if (shouldRestartCountdown) {
                        countdown = 4; // Decrements to 3 below, resetting it to 3
                        shouldRestartCountdown = false;
                        aborted = true;
                        break;
                    }
                }
                
                if (shouldGoBackPhoto) {
                    goToPrevious = true;
                    break;
                }
                
                if (!aborted) {
                    countdown--;
                }
            }
            
            if (goToPrevious) {
                // Return to the session when no photo was taken in this slot
                // Hide overlay momentarily to indicate transition
                countdownOverlay.classList.add('hidden');
                if (countdownPrompt) countdownPrompt.classList.add('hidden');
                
                if (i > 0) {
                    // Go back to the previous photo slot
                    i--;
                    delete photoSlotsState[i]; // Delete the photo in the previous slot
                    buildCanvasLayout();
                } else {
                    // If we are at the first photo, go back to the space-to-start screen
                    isWaitingForStart = true;
                    delete photoSlotsState[0];
                    buildCanvasLayout();
                }
                
                await sleep(500); // 500ms transition delay
                continue; // Restart the loop at index i
            }
            
            // 2. Play shutter, trigger flash overlay, take picture
            countdownOverlay.classList.add('hidden');
            playShutterSound();
            triggerScreenFlash();
            
            const photoDataUrl = captureFrame();
            if (photoDataUrl) {
                // Save state
                photoSlotsState[i] = {
                    imageSrc: photoDataUrl,
                    zoom: 1.0,
                    rotate: 0,
                    panX: 0,
                    panY: 0
                };
            }
            
            // 3. Render layout to show preview update instantly
            buildCanvasLayout();
            
            // 4. Pause for user feedback before starting next shot
            await sleep(1500);
            
            i++; // Advance to the next photo slot
        }
        
        // Session success wrap-up sound
        playBeep(523.25, 0.08); // C5
        setTimeout(() => playBeep(659.25, 0.08), 80); // E5
        setTimeout(() => playBeep(783.99, 0.15), 160); // G5
    } catch (err) {
        console.error("Photobooth session error:", err);
    } finally {
        captureStatus.classList.add('hidden');
        isSessionRunning = false;
        toggleControlsDisable(false);
        
        // Exit fullscreen live camera mode
        if (videoContainer) videoContainer.classList.remove('fullscreen-camera');
        document.body.classList.remove('in-session');
        
        // Ensure prompt overlay is hidden
        if (countdownPrompt) countdownPrompt.classList.add('hidden');
        isWaitingForStart = false;
        
        // Reset font size for countdown number
        countdownNumber.style.fontSize = "";
        
        // Save state to history after session completes
        saveStateToHistory();
        
        // Focus first slot automatically for user convenience
        selectSlot(0);
        
        // Trigger completion flow if session finished successfully with all photos filled
        const checkLayout = getActiveLayout();
        const checkPrimarySlots = checkLayout.slots.filter(s => s.duplicateOf === null);
        const allSlotsFilled = checkPrimarySlots.every(slot => photoSlotsState[slot.id] && photoSlotsState[slot.id].imageSrc);
        if (allSlotsFilled) {
            triggerSessionCompletionFlow();
        }
    }
}

// Trigger single manual shot (targets selected slot or next empty slot)
function captureSingleShot() {
    if (isSessionRunning) return;
    
    initAudioContext();
    
    // Target slot is activeSelectedSlotId, or if none, first empty slot, or if full, slot 0
    let targetSlotId = activeSelectedSlotId;
    if (targetSlotId === null) {
        const layout = getActiveLayout();
        const primarySlots = layout.slots.filter(s => s.duplicateOf === null);
        const emptySlot = primarySlots.find(s => !photoSlotsState[s.id] || !photoSlotsState[s.id].imageSrc);
        targetSlotId = emptySlot ? emptySlot.id : 0;
    }
    
    playShutterSound();
    triggerScreenFlash();
    
    const photoDataUrl = captureFrame();
    if (photoDataUrl) {
        photoSlotsState[targetSlotId] = {
            imageSrc: photoDataUrl,
            zoom: 1.0,
            rotate: 0,
            panX: 0,
            panY: 0
        };
        buildCanvasLayout();
        saveStateToHistory();
        selectSlot(targetSlotId);
    }
}

function triggerScreenFlash() {
    flashOverlay.classList.remove('flash-active');
    void flashOverlay.offsetWidth; // Force CSS reflow reflow
    flashOverlay.classList.add('flash-active');
    setTimeout(() => {
        flashOverlay.classList.remove('flash-active');
    }, 400);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Disable/enable interactions while recording sessions
function toggleControlsDisable(disabled) {
    btnStartSession.disabled = disabled;
    btnCaptureSingle.disabled = disabled;
    btnReset.disabled = disabled;
    btnDownload.disabled = disabled;
    if (btnUploadDrive) btnUploadDrive.disabled = disabled;
    cameraSelect.disabled = disabled;
    
    layoutButtons.forEach(btn => btn.disabled = disabled);
    presetButtons.forEach(btn => btn.disabled = disabled);
    
    if (disabled) {
        adjustmentControls.classList.add('disabled');
        document.querySelectorAll('.photo-slot').forEach(el => el.style.pointerEvents = 'none');
    } else {
        document.querySelectorAll('.photo-slot').forEach(el => el.style.pointerEvents = 'auto');
    }
}

// ==========================================================================
// Interactive Photo Manipulation (Pinch-to-zoom / Pan mechanics)
// ==========================================================================

function selectSlot(slotId) {
    if (isSessionRunning) return;
    
    // Deselect old
    document.querySelectorAll('.photo-slot').forEach(el => el.classList.remove('active-slot'));
    
    const state = photoSlotsState[slotId];
    if (!state || !state.imageSrc) {
        // No photo captured here yet, disable adjustments
        activeSelectedSlotId = null;
        adjustmentControls.classList.add('disabled');
        selectedSlotNumSpan.textContent = '-';
        return;
    }
    
    activeSelectedSlotId = slotId;
    
    // Add border highlight in DOM
    const slotEl = photoboothPreview.querySelector(`.photo-slot[data-slot-id="${slotId}"]`);
    if (slotEl) slotEl.classList.add('active-slot');
    
    // Enable and update sliders
    adjustmentControls.classList.remove('disabled');
    selectedSlotNumSpan.textContent = slotId + 1;
    
    sliderZoom.disabled = false;
    sliderZoom.value = state.zoom;
    
    sliderRotate.disabled = false;
    sliderRotate.value = state.rotate;
}

// Drag & Pan handlers
function startDrag(e, slotId, imgElement) {
    if (isSessionRunning) return;
    e.stopPropagation();
    
    const isTouch = e.type.startsWith('touch');
    
    // Get mouse/touch coords
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    const state = photoSlotsState[slotId];
    if (!state) return;
    
    activeDrag = {
        slotId: slotId,
        img: imgElement,
        startX: clientX,
        startY: clientY,
        initialPanX: state.panX,
        initialPanY: state.panY
    };
    
    // Register global event listeners
    const moveEvent = isTouch ? 'touchmove' : 'mousemove';
    const endEvent = isTouch ? 'touchend' : 'mouseup';
    
    // touchmove needs non-passive to block viewport scrolling
    document.addEventListener(moveEvent, handleDrag, isTouch ? { passive: false } : false);
    document.addEventListener(endEvent, stopDrag);
}

function handleDrag(e) {
    if (!activeDrag) return;
    
    // Prevent mobile scrolling
    if (e.cancelable) e.preventDefault();
    
    const isTouch = e.type.startsWith('touch');
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - activeDrag.startX;
    const dy = clientY - activeDrag.startY;
    
    const state = photoSlotsState[activeDrag.slotId];
    state.panX = activeDrag.initialPanX + dx;
    state.panY = activeDrag.initialPanY + dy;
    
    // Redraw CSS transforms
    activeDrag.img.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom}) rotate(${state.rotate}deg)`;
    
    // Update duplicates synchronously
    const layout = getActiveLayout();
    layout.slots.forEach(slot => {
        if (slot.duplicateOf === activeDrag.slotId) {
            const dupImg = photoboothPreview.querySelector(`.photo-slot[data-slot-id="${slot.id}"] img`);
            if (dupImg) {
                dupImg.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom}) rotate(${state.rotate}deg)`;
            }
        }
    });
}

function stopDrag(e) {
    if (!activeDrag) return;
    
    const isTouch = e.type.startsWith('touch');
    const moveEvent = isTouch ? 'touchmove' : 'mousemove';
    const endEvent = isTouch ? 'touchend' : 'mouseup';
    
    document.removeEventListener(moveEvent, handleDrag);
    document.removeEventListener(endEvent, stopDrag);
    
    activeDrag = null;
    saveStateToHistory();
}

// Wire up Slider Controls
sliderZoom.addEventListener('input', (e) => {
    if (activeSelectedSlotId === null) return;
    const value = parseFloat(e.target.value);
    
    const state = photoSlotsState[activeSelectedSlotId];
    state.zoom = value;
    
    // Apply transform in DOM
    const img = photoboothPreview.querySelector(`.photo-slot[data-slot-id="${activeSelectedSlotId}"] img`);
    if (img) {
        img.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom}) rotate(${state.rotate}deg)`;
    }
    
    // Sync duplicates
    const layout = getActiveLayout();
    layout.slots.forEach(slot => {
        if (slot.duplicateOf === activeSelectedSlotId) {
            const dupImg = photoboothPreview.querySelector(`.photo-slot[data-slot-id="${slot.id}"] img`);
            if (dupImg) {
                dupImg.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom}) rotate(${state.rotate}deg)`;
            }
        }
    });
});

sliderRotate.addEventListener('input', (e) => {
    if (activeSelectedSlotId === null) return;
    const value = parseInt(e.target.value);
    
    const state = photoSlotsState[activeSelectedSlotId];
    state.rotate = value;
    
    // Apply transform in DOM
    const img = photoboothPreview.querySelector(`.photo-slot[data-slot-id="${activeSelectedSlotId}"] img`);
    if (img) {
        img.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom}) rotate(${state.rotate}deg)`;
    }
    
    // Sync duplicates
    const layout = getActiveLayout();
    layout.slots.forEach(slot => {
        if (slot.duplicateOf === activeSelectedSlotId) {
            const dupImg = photoboothPreview.querySelector(`.photo-slot[data-slot-id="${slot.id}"] img`);
            if (dupImg) {
                dupImg.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom}) rotate(${state.rotate}deg)`;
            }
        }
    });
});

btnClearSlot.addEventListener('click', () => {
    if (activeSelectedSlotId === null) return;
    
    // Clear data
    delete photoSlotsState[activeSelectedSlotId];
    
    // Reset slider controls
    activeSelectedSlotId = null;
    sliderZoom.disabled = true;
    sliderRotate.disabled = true;
    sliderZoom.value = 1.0;
    sliderRotate.value = 0;
    adjustmentControls.classList.add('disabled');
    selectedSlotNumSpan.textContent = '-';
    
    buildCanvasLayout();
    saveStateToHistory();
});

// Reset logic
function resetAllPhotoSlots(rebuildLayout = true) {
    photoSlotsState = {};
    activeSelectedSlotId = null;
    sliderZoom.disabled = true;
    sliderRotate.disabled = true;
    sliderZoom.value = 1.0;
    sliderRotate.value = 0;
    adjustmentControls.classList.add('disabled');
    selectedSlotNumSpan.textContent = '-';
    
    if (rebuildLayout) {
        buildCanvasLayout();
    }
    saveStateToHistory();
}

// ==========================================================================
// Undo / Redo History Module
// ==========================================================================
function saveStateToHistory() {
    // Push deep copy of photoSlotsState
    historyStack.push(JSON.stringify(photoSlotsState));
    redoStack = []; // Clear redo stack
    updateUndoRedoButtons();
}

function undo() {
    if (historyStack.length <= 1) return;
    
    const current = historyStack.pop();
    redoStack.push(current);
    
    const previous = historyStack[historyStack.length - 1];
    photoSlotsState = JSON.parse(previous);
    
    buildCanvasLayout();
    updateUndoRedoButtons();
    
    if (activeSelectedSlotId !== null) {
        selectSlot(activeSelectedSlotId);
    }
}

function redo() {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack.pop();
    historyStack.push(nextState);
    photoSlotsState = JSON.parse(nextState);
    
    buildCanvasLayout();
    updateUndoRedoButtons();
    
    if (activeSelectedSlotId !== null) {
        selectSlot(activeSelectedSlotId);
    }
}

function updateUndoRedoButtons() {
    if (btnUndo) btnUndo.disabled = historyStack.length <= 1;
    if (btnRedo) btnRedo.disabled = redoStack.length === 0;
}

// Slider change (release mouse/touch) event listeners for history recording
sliderZoom.addEventListener('change', () => {
    saveStateToHistory();
});
sliderRotate.addEventListener('change', () => {
    saveStateToHistory();
});

function checkDownloadAvailability() {
    const layout = getActiveLayout();
    const primarySlots = layout.slots.filter(s => s.duplicateOf === null);
    
    // We check if at least one photo is captured to allow partial download, or if all are filled
    // Commercial photobooth standard: Download is unlocked once ALL slots have photos
    const allSlotsFilled = primarySlots.every(slot => photoSlotsState[slot.id] && photoSlotsState[slot.id].imageSrc);
    
    btnDownload.disabled = !allSlotsFilled;
    if (btnUploadDrive) btnUploadDrive.disabled = !allSlotsFilled;
}

// ==========================================================================
// Offscreen High-Res 4R Canvas Rendering (JPG/PNG Export)
// ==========================================================================

async function renderHighRes4RPrint() {
    const layout = getActiveLayout();
    const canvasSize = layout.canvasSize;
    
    // Set offscreen sizes
    offscreenCanvas.width = canvasSize.width;
    offscreenCanvas.height = canvasSize.height;
    const ctx = offscreenCanvas.getContext('2d');
    
    // Clear Canvas with absolute white (matches print sheet paper standard)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    
    // 1. Render all slot photos
    // Pre-load all photo images inside a Promise to guarantee synchronous drawing sequence
    const loadSlotImages = layout.slots.map(slot => {
        const sourceId = slot.duplicateOf !== null ? slot.duplicateOf : slot.id;
        const state = photoSlotsState[sourceId];
        
        if (!state || !state.imageSrc) return Promise.resolve(null);
        
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ slot, state, img });
            img.onerror = () => resolve(null);
            img.src = state.imageSrc;
        });
    });
    
    const renderedPhotos = await Promise.all(loadSlotImages);
    
    // Render photos onto the canvas
    const uiCanvasWidth = photoboothPreview.clientWidth;
    // Calculate global scaling between preview and print dimensions
    const scaleFactor = canvasSize.width / uiCanvasWidth;
    
    renderedPhotos.forEach(photoInfo => {
        if (!photoInfo) return;
        
        const { slot, state, img } = photoInfo;
        
        ctx.save();
        
        // Overflow crop clipping logic: matches CSS container clipping
        ctx.beginPath();
        ctx.rect(slot.x, slot.y, slot.w, slot.h);
        ctx.clip();
        
        // Compute "object-fit: cover" scales
        const scaleCover = Math.max(slot.w / img.width, slot.h / img.height);
        const fitW = img.width * scaleCover;
        const fitH = img.height * scaleCover;
        
        // Slot center math
        const centerX = slot.x + slot.w / 2;
        const centerY = slot.y + slot.h / 2;
        
        ctx.translate(centerX, centerY);
        ctx.rotate((state.rotate * Math.PI) / 180);
        ctx.scale(state.zoom, state.zoom);
        
        // Scaling custom user pans to offscreen resolution
        const canvasPanX = state.panX * scaleFactor;
        const canvasPanY = state.panY * scaleFactor;
        ctx.translate(canvasPanX, canvasPanY);
        
        // Apply active filter to the print canvas context
        ctx.filter = getCanvasFilterString(activeFilter);
        
        // Draw the image centered
        ctx.drawImage(img, -fitW / 2, -fitH / 2, fitW, fitH);
        
        ctx.restore();
    });
    
    // 2. Render Template overlay PNG on top of everything
    if (customTemplateDataUrl || currentPreset !== 'none') {
        const templateImg = new Image();
        await new Promise(resolve => {
            templateImg.onload = () => {
                ctx.drawImage(templateImg, 0, 0, canvasSize.width, canvasSize.height);
                resolve();
            };
            templateImg.src = templateOverlayImg.src;
        });
    }
}

// Download Trigger
btnDownload.addEventListener('click', async () => {
    btnDownload.disabled = true;
    const oldText = btnDownload.innerHTML;
    btnDownload.innerHTML = `
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: rotateLogo 1s infinite linear"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        <span>Processing Print...</span>
    `;
    
    try {
        await renderHighRes4RPrint();
        
        // Trigger file download
        const dataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.98); // High quality JPG
        const link = document.createElement('a');
        link.download = `SnapMent_4R_${Date.now()}.jpg`;
        link.href = dataUrl;
        link.click();
    } catch (e) {
        console.error("Print generation failed:", e);
        alert("Failed to generate download. Please try again.");
    } finally {
        btnDownload.innerHTML = oldText;
        checkDownloadAvailability();
    }
});

// Upload to Drive Trigger
if (btnUploadDrive) {
    btnUploadDrive.addEventListener('click', async () => {
        if (!gasUrl) {
            alert("URL Google Apps Script belum diatur. Silakan atur di menu Settings (ikon gerigi kanan atas).");
            return;
        }
        
        btnUploadDrive.disabled = true;
        const oldText = btnUploadDrive.innerHTML;
        btnUploadDrive.innerHTML = `
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: rotateLogo 1s infinite linear; width: 1rem; height: 1rem;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            <span>Uploading...</span>
        `;
        
        try {
            const result = await uploadToGoogleDrive();
            if (result && result.success) {
                alert("✅ Berhasil diunggah ke Google Drive!");
            } else {
                const errMsg = result && result.error ? result.error : "Koneksi gagal.";
                alert(`❌ Gagal mengunggah ke Google Drive: ${errMsg}`);
            }
        } catch (err) {
            console.error("Manual upload failed:", err);
            alert(`❌ Gagal mengunggah ke Google Drive: ${err.message || err}`);
        } finally {
            btnUploadDrive.innerHTML = oldText;
            checkDownloadAvailability();
        }
    });
}

// ==========================================================================
// Custom Template Upload & Auto-Orientation Module
// ==========================================================================

// Drag & Drop event bindings
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadZone.addEventListener(eventName, () => uploadZone.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, () => uploadZone.classList.remove('dragover'), false);
});

// Drop handler
uploadZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleTemplateFiles(files);
});

if (btnBrowseFile) {
    btnBrowseFile.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid double triggering upload-zone clicks
        templateFileInput.click();
    });
}

uploadZone.addEventListener('click', () => {
    templateFileInput.click();
});

templateFileInput.addEventListener('change', (e) => {
    handleTemplateFiles(e.target.files);
});

function handleTemplateFiles(files) {
    if (files.length === 0) return;
    const file = files[0];
    
    if (file.type !== 'image/png') {
        alert("Please upload a PNG file with transparent windows.");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // Auto detect aspect ratio orientation
            const prevOrientation = activeOrientation;
            activeOrientation = img.width >= img.height ? 'landscape' : 'portrait';
            
            customTemplateDataUrl = event.target.result;
            
            // Deactivate presets since custom upload overrides them
            currentPreset = 'none';
            presetButtons.forEach(btn => {
                if (btn.dataset.preset === 'none') btn.classList.add('active');
                else btn.classList.remove('active');
            });
            
            // If orientation changed, reset slot structures to avoid aspect bugs
            if (prevOrientation !== activeOrientation) {
                resetAllPhotoSlots(false);
            }
            
            buildCanvasLayout();
            
            // Inform user via alert or text
            console.log(`Custom PNG loaded. Detected orientation: ${activeOrientation}`);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// ==========================================================================
// Event Listeners Initialization
// ==========================================================================

// 1. Layout Button Selectors
layoutButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (isSessionRunning) return;
        
        layoutButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentLayout = btn.dataset.layout;
        
        // Double strip only makes sense in Portrait standard
        // Triple row only makes sense in Landscape standard
        // Adjust default orientation based on layout chosen if NO custom template is loaded
        if (!customTemplateDataUrl) {
            const prevOrientation = activeOrientation;
            if (currentLayout === 'triple-row') {
                activeOrientation = 'landscape';
            } else {
                activeOrientation = 'portrait';
            }
            
            if (prevOrientation !== activeOrientation) {
                resetAllPhotoSlots(false);
            }
        }
        
        buildCanvasLayout();
    });
});

// 2. Preset Template selectors
presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (isSessionRunning) return;
        
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentPreset = btn.dataset.preset;
        
        // Remove custom template upload since built-in preset is chosen
        customTemplateDataUrl = null;
        templateFileInput.value = '';
        
        buildCanvasLayout();
    });
});

// 3. Filter selectors
function applyActiveFilter() {
    // Apply filter to webcam
    webcam.className.split(' ').forEach(cls => {
        if (cls.startsWith('img-filter-')) {
            webcam.classList.remove(cls);
        }
    });
    webcam.classList.add(`img-filter-${activeFilter}`);
    
    // Apply filter class to currently captured images dynamically
    const imgs = photoboothPreview.querySelectorAll('.captured-image');
    imgs.forEach(img => {
        img.className = `captured-image img-filter-${activeFilter}`;
    });
}

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        activeFilter = btn.dataset.filter;
        applyActiveFilter();
    });
});

// 4. Capture & session buttons
btnStartCamera.addEventListener('click', initCamera);
cameraSelect.addEventListener('change', (e) => startCameraStream(e.target.value));

btnMirror.addEventListener('click', () => {
    webcam.classList.toggle('no-mirror');
});

btnCaptureSingle.addEventListener('click', captureSingleShot);
btnStartSession.addEventListener('click', runPhotoboothSession);
btnReset.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear all taken photos?")) {
        resetAllPhotoSlots(true);
    }
});

// 5. Undo / Redo buttons
if (btnUndo) btnUndo.addEventListener('click', undo);
if (btnRedo) btnRedo.addEventListener('click', redo);

// 6. Restart countdown button
if (btnRestartCountdown) {
    btnRestartCountdown.addEventListener('click', () => {
        if (isSessionRunning) {
            if (isWaitingForStart) {
                shouldGoBackPhoto = true;
            } else {
                backClicks++;
                if (backClicks === 1) {
                    shouldRestartCountdown = true;
                } else if (backClicks > 1) {
                    shouldGoBackPhoto = true;
                }
            }
        }
    });
}

// 7. Manual Folder Template Loader
function loadTemplateFromFolder(filename) {
    if (!filename.trim()) return;
    
    let cleanName = filename.trim();
    if (!cleanName.toLowerCase().endsWith('.png')) {
        cleanName += '.png';
    }
    
    const imgPath = `templates/${cleanName}`;
    const img = new Image();
    img.onload = () => {
        const prevOrientation = activeOrientation;
        activeOrientation = img.width >= img.height ? 'landscape' : 'portrait';
        
        customTemplateDataUrl = imgPath;
        
        // Reset built-in preset highlights
        currentPreset = 'none';
        presetButtons.forEach(btn => {
            if (btn.dataset.preset === 'none') btn.classList.add('active');
            else btn.classList.remove('active');
        });
        
        // Clear file input
        templateFileInput.value = '';
        
        if (prevOrientation !== activeOrientation) {
            resetAllPhotoSlots(false);
        }
        
        buildCanvasLayout();
        console.log(`Folder template successfully loaded: ${imgPath}`);
    };
    img.onerror = () => {
        alert(`Failed to load template frame. Please make sure that "${cleanName}" exists inside the templates/ folder.`);
    };
    img.src = imgPath;
}

if (btnLoadManualTemplate) {
    btnLoadManualTemplate.addEventListener('click', () => {
        loadTemplateFromFolder(manualTemplateName.value);
    });
}

if (manualTemplateName) {
    manualTemplateName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            loadTemplateFromFolder(manualTemplateName.value);
        }
    });
}

// Window events
window.addEventListener('load', () => {
    // Initial camera list
    initCamera();
    
    // Initial canvas setup
    buildCanvasLayout();
    
    // Initial filter setup
    applyActiveFilter();
    
    // Save initial state to history stack
    saveStateToHistory();
    
    // Initialize settings from localStorage
    initSettings();
});

// ==========================================================================
// Google Drive Upload & Settings Integration
// ==========================================================================

// Load configurations from localStorage
let gasUrl = localStorage.getItem('snapment_gas_url') || '';
let folderId = localStorage.getItem('snapment_folder_id') || '';
let autoUpload = localStorage.getItem('snapment_auto_upload') === 'true';

// Settings elements
const btnSettings = document.getElementById('btn-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnSaveSettings = document.getElementById('btn-save-settings');
const settingsModal = document.getElementById('settings-modal');

const inputGasUrl = document.getElementById('input-gas-url');
const inputFolderId = document.getElementById('input-folder-id');
const checkboxAutoUpload = document.getElementById('checkbox-auto-upload');

// Completion modal elements
const completionModal = document.getElementById('completion-modal');
const completionStatusText = document.getElementById('completion-status-text');
const driveUploadStatus = document.getElementById('drive-upload-status');
const uploadStatusText = document.getElementById('upload-status-text');
const modalBtnDownload = document.getElementById('modal-btn-download');
const modalBtnClose = document.getElementById('modal-btn-close');

function initSettings() {
    if (inputGasUrl) inputGasUrl.value = gasUrl;
    if (inputFolderId) inputFolderId.value = folderId;
    if (checkboxAutoUpload) checkboxAutoUpload.checked = autoUpload;
}

function saveSettings() {
    if (inputGasUrl) {
        gasUrl = inputGasUrl.value.trim();
        localStorage.setItem('snapment_gas_url', gasUrl);
    }
    if (inputFolderId) {
        folderId = inputFolderId.value.trim();
        localStorage.setItem('snapment_folder_id', folderId);
    }
    if (checkboxAutoUpload) {
        autoUpload = checkboxAutoUpload.checked;
        localStorage.setItem('snapment_auto_upload', autoUpload ? 'true' : 'false');
    }
    
    if (settingsModal) settingsModal.classList.add('hidden');
}

// Bind Settings listeners
if (btnSettings) {
    btnSettings.addEventListener('click', () => {
        initSettings();
        if (settingsModal) settingsModal.classList.remove('hidden');
    });
}
if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => {
        if (settingsModal) settingsModal.classList.add('hidden');
    });
}
if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', saveSettings);
}
if (settingsModal) {
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });
}

// Bind Completion Modal listeners
if (modalBtnDownload) {
    modalBtnDownload.addEventListener('click', async () => {
        modalBtnDownload.disabled = true;
        const oldText = modalBtnDownload.innerHTML;
        modalBtnDownload.innerHTML = `
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: rotateLogo 1s infinite linear; width: 1rem; height: 1rem;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            <span>Downloading...</span>
        `;
        try {
            await renderHighRes4RPrint();
            const dataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.98);
            const link = document.createElement('a');
            link.download = `SnapMent_4R_${Date.now()}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (e) {
            console.error("Print generation failed:", e);
            alert("Failed to generate download. Please try again.");
        } finally {
            modalBtnDownload.innerHTML = oldText;
            modalBtnDownload.disabled = false;
        }
    });
}

if (modalBtnClose) {
    modalBtnClose.addEventListener('click', () => {
        if (completionModal) completionModal.classList.add('hidden');
    });
}

// Google Drive Upload function
async function uploadToGoogleDrive() {
    if (!gasUrl) {
        return { success: false, error: "URL Google Apps Script belum diatur." };
    }
    
    try {
        await renderHighRes4RPrint();
        const dataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.98);
        
        // POST to Google Apps Script Web App
        const response = await fetch(gasUrl, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Bypass CORS preflight request
            },
            body: JSON.stringify({
                image: dataUrl,
                filename: `SnapMent_4R_${Date.now()}.jpg`,
                folderId: folderId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (err) {
        console.error("Google Drive upload error:", err);
        return { success: false, error: err.message || err };
    }
}

// Trigger completion modal and upload flow
async function triggerSessionCompletionFlow() {
    if (completionModal) {
        completionModal.classList.remove('hidden');
    }
    if (completionStatusText) {
        completionStatusText.textContent = "Foto Anda telah siap. Klik tombol di bawah untuk mengunduh hasil foto.";
    }
    
    if (driveUploadStatus) {
        driveUploadStatus.classList.add('hidden');
    }
    
    if (autoUpload) {
        if (!gasUrl) {
            if (driveUploadStatus) {
                driveUploadStatus.classList.remove('hidden');
            }
            if (uploadStatusText) {
                uploadStatusText.textContent = "⚠️ Auto-upload aktif, silakan atur URL Apps Script di Settings.";
                uploadStatusText.style.color = "#eab308"; // warning yellow
            }
            return;
        }
        
        if (driveUploadStatus) {
            driveUploadStatus.classList.remove('hidden');
        }
        if (uploadStatusText) {
            uploadStatusText.textContent = "Mengunggah hasil foto ke Google Drive...";
            uploadStatusText.style.color = ""; // reset
        }
        
        const result = await uploadToGoogleDrive();
        if (result && result.success) {
            if (uploadStatusText) {
                uploadStatusText.textContent = "✅ Berhasil diunggah ke Google Drive!";
                uploadStatusText.style.color = "#10b981"; // success green
            }
        } else {
            const errMsg = result && result.error ? result.error : "Terjadi kesalahan koneksi.";
            if (uploadStatusText) {
                uploadStatusText.textContent = `❌ Gagal mengunggah ke Drive: ${errMsg}`;
                uploadStatusText.style.color = "#ef4444"; // error red
            }
        }
    }
}
