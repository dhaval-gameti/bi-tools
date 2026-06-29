// js/utils.js

// CONFIG
export const MIN_WIDTH = 60;
export const MIN_HEIGHT = 24;
export const SNAP_THRESHOLD = 8;
export const ROTATION_SNAPS = [0, 15, 30, 45, 60, 75, 90, 180, 270];
export const KEYBOARD_STEP = 5;

export let guides = [];
export let history = [];
export let historyIndex = -1;
export let isGridEnabled = false;
export let gridSize = 10;

// Utility: Clear all snap guides
export function clearGuides() {
    guides.forEach(g => g.remove());
    guides = [];
}

// Utility: Show a snap guide
export function showGuide(type, rect, fullScreenContainer) {
    if (!fullScreenContainer) return;
    const g = document.createElement('div');
    g.className = 'guide ' + type;
    if (type === 'vertical') {
      g.style.left = rect.x + 'px';
      g.style.top = rect.y + 'px';
      g.style.height = rect.h + 'px';
      g.style.width = '1px';
    } else {
      g.style.top = rect.y + 'px';
      g.style.left = rect.x + 'px';
      g.style.width = rect.w + 'px';
      g.style.height = '1px';
    }
    fullScreenContainer.appendChild(g);
    guides.push(g);
}

// Utility: Parse box transform style
export function parseTransform(style) {
    let x = 0, y = 0, rot = 0;
    const t = style || '';
    const translateMatch = t.match(/translate\(\s*([-\d.]+)px,\s*([-\d.]+)px\)/);
    if (translateMatch) { x = parseFloat(translateMatch[1]); y = parseFloat(translateMatch[2]); }
    const rotateMatch = t.match(/rotate\(\s*([-\d.]+)deg\)/);
    if (rotateMatch) rot = parseFloat(rotateMatch[1]);
    return { x, y, rot };
}

// Utility: Get all box positions for snapping
export function getAllBoxPositions(excludeBox) {
    const boxes = Array.from(document.querySelectorAll('.box')).filter(b => b !== excludeBox);
    const positions = [];
    boxes.forEach(b => {
      const rect = b.getBoundingClientRect();
      positions.push({
        left: Math.round(rect.left),
        centerX: Math.round(rect.left + rect.width/2),
        right: Math.round(rect.left + rect.width),
        top: Math.round(rect.top),
        centerY: Math.round(rect.top + rect.height/2),
        bottom: Math.round(rect.top + rect.height),
        rect
      });
    });
    return positions;
}

// Utility: Convert RGB to Hex
export function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return '#ffffff';
    const a = rgb.match(/\d+/g).map(Number);
    return "#" + ((1 << 24) + (a[0] << 16) + (a[1] << 8) + a[2]).toString(16).slice(1).toUpperCase();
}

// NEW FEATURES

// 1. Undo/Redo System
export function saveState(boxes) {
    const state = boxes.map(b => ({ 
        id: b.id, 
        transform: b.style.transform,
        width: b.style.width,
        height: b.style.height,
        backgroundColor: b.style.backgroundColor,
        zIndex: b.style.zIndex
    }));
    history = history.slice(0, historyIndex + 1);
    history.push(state);
    historyIndex++;
    
    // Limit history to 50 states
    if (history.length > 50) {
        history.shift();
        historyIndex--;
    }
}

export function undo() {
    if (historyIndex <= 0) return null;
    historyIndex--;
    return history[historyIndex];
}

export function redo() {
    if (historyIndex >= history.length - 1) return null;
    historyIndex++;
    return history[historyIndex];
}

export function canUndo() {
    return historyIndex > 0;
}

export function canRedo() {
    return historyIndex < history.length - 1;
}

// 2. Keyboard Resize Control
export function handleKeyResize(box, key) {
    const { x, y, rot } = parseTransform(box.style.transform);
    const width = parseInt(box.style.width) || MIN_WIDTH;
    const height = parseInt(box.style.height) || MIN_HEIGHT;
    
    switch(key) {
        case 'ArrowRight':
            box.style.width = Math.max(MIN_WIDTH, width + KEYBOARD_STEP) + 'px';
            break;
        case 'ArrowLeft':
            box.style.width = Math.max(MIN_WIDTH, width - KEYBOARD_STEP) + 'px';
            break;
        case 'ArrowDown':
            box.style.height = Math.max(MIN_HEIGHT, height + KEYBOARD_STEP) + 'px';
            break;
        case 'ArrowUp':
            box.style.height = Math.max(MIN_HEIGHT, height - KEYBOARD_STEP) + 'px';
            break;
    }
    
    return { width: box.style.width, height: box.style.height };
}

// 3. Rotation Snapping
export function snapRotation(currentRot) {
    return ROTATION_SNAPS.reduce((prev, curr) => 
        Math.abs(curr - currentRot) < Math.abs(prev - currentRot) ? curr : prev
    );
}

// 4. Multi-select & Group Operations
export function getSelectedBoxes() {
    return Array.from(document.querySelectorAll('.box.selected'));
}

export function alignSelected(alignment, container) {
    const selected = getSelectedBoxes();
    if (selected.length < 2) return;
    
    const firstRect = selected[0].getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    selected.forEach((box, index) => {
        if (index === 0) return; // Skip first box
        
        const boxRect = box.getBoundingClientRect();
        const { x, y, rot } = parseTransform(box.style.transform);
        
        switch(alignment) {
            case 'left':
                box.style.transform = `translate(${firstRect.left - containerRect.left}px, ${y}px) rotate(${rot}deg)`;
                break;
            case 'right':
                const rightX = firstRect.right - boxRect.width - containerRect.left;
                box.style.transform = `translate(${rightX}px, ${y}px) rotate(${rot}deg)`;
                break;
            case 'top':
                box.style.transform = `translate(${x}px, ${firstRect.top - containerRect.top}px) rotate(${rot}deg)`;
                break;
            case 'bottom':
                const bottomY = firstRect.bottom - boxRect.height - containerRect.top;
                box.style.transform = `translate(${x}px, ${bottomY}px) rotate(${rot}deg)`;
                break;
            case 'center-vertical':
                const centerX = firstRect.left + (firstRect.width - boxRect.width)/2 - containerRect.left;
                box.style.transform = `translate(${centerX}px, ${y}px) rotate(${rot}deg)`;
                break;
            case 'center-horizontal':
                const centerY = firstRect.top + (firstRect.height - boxRect.height)/2 - containerRect.top;
                box.style.transform = `translate(${x}px, ${centerY}px) rotate(${rot}deg)`;
                break;
        }
    });
}

export function distributeSelected(direction, container) {
    const selected = getSelectedBoxes();
    if (selected.length < 3) return;
    
    const containerRect = container.getBoundingClientRect();
    const sorted = selected.sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return direction === 'horizontal' ? rectA.left - rectB.left : rectA.top - rectB.top;
    });
    
    const firstRect = sorted[0].getBoundingClientRect();
    const lastRect = sorted[sorted.length - 1].getBoundingClientRect();
    
    const totalSpace = direction === 'horizontal' 
        ? lastRect.right - firstRect.left
        : lastRect.bottom - firstRect.top;
    
    const totalBoxWidth = sorted.reduce((sum, box) => {
        const rect = box.getBoundingClientRect();
        return sum + (direction === 'horizontal' ? rect.width : rect.height);
    }, 0);
    
    const gap = (totalSpace - totalBoxWidth) / (sorted.length - 1);
    
    let currentPos = direction === 'horizontal' ? firstRect.left : firstRect.top;
    
    sorted.forEach((box, index) => {
        const { x, y, rot } = parseTransform(box.style.transform);
        const rect = box.getBoundingClientRect();
        
        if (direction === 'horizontal') {
            const newX = currentPos - containerRect.left;
            box.style.transform = `translate(${newX}px, ${y}px) rotate(${rot}deg)`;
            currentPos += rect.width + gap;
        } else {
            const newY = currentPos - containerRect.top;
            box.style.transform = `translate(${x}px, ${newY}px) rotate(${rot}deg)`;
            currentPos += rect.height + gap;
        }
    });
}

// 5. Grid System
export function toggleGrid() {
    isGridEnabled = !isGridEnabled;
    return isGridEnabled;
}

export function setGridSize(size) {
    gridSize = Math.max(5, size);
}

export function snapToGrid(value) {
    if (!isGridEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
}

// 6. Copy/Paste Styles
export let copiedStyles = null;

export function copyStyles(box) {
    copiedStyles = {
        backgroundColor: box.style.backgroundColor,
        width: box.style.width,
        height: box.style.height,
        transform: box.style.transform,
        borderRadius: box.style.borderRadius,
        border: box.style.border
    };
}

export function pasteStyles(box) {
    if (!copiedStyles) return;
    
    Object.keys(copiedStyles).forEach(prop => {
        if (copiedStyles[prop]) {
            box.style[prop] = copiedStyles[prop];
        }
    });
}

// 7. Z-index Management
export function bringToFront(box) {
    const maxZ = Math.max(...Array.from(document.querySelectorAll('.box'))
        .map(b => parseInt(b.style.zIndex) || 0));
    box.style.zIndex = maxZ + 1;
}

export function sendToBack(box) {
    const minZ = Math.min(...Array.from(document.querySelectorAll('.box'))
        .map(b => parseInt(b.style.zIndex) || 0));
    box.style.zIndex = minZ - 1;
}

// 8. Container Edge Snapping
export function getContainerSnapPositions(container, boxRect) {
    const containerRect = container.getBoundingClientRect();
    return {
        left: containerRect.left,
        right: containerRect.right,
        top: containerRect.top,
        bottom: containerRect.bottom,
        centerX: containerRect.left + containerRect.width / 2,
        centerY: containerRect.top + containerRect.height / 2
    };
}

// 9. Debounced Operations
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 10. Measurement Tools
export function showDistanceIndicator(fromRect, toRect, fullScreenContainer) {
    if (!fullScreenContainer) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'distance-indicator';
    
    const midX = (fromRect.right + toRect.left) / 2;
    const distance = Math.abs(toRect.left - fromRect.right);
    
    indicator.style.left = midX + 'px';
    indicator.style.top = (fromRect.top - 30) + 'px';
    indicator.textContent = distance + 'px';
    indicator.style.transform = 'translateX(-50%)';
    
    fullScreenContainer.appendChild(indicator);
    guides.push(indicator);
    
    return indicator;
}

// 11. Auto-save
export function autoSave(boxes, storageKey = 'boxEditorAutoSave') {
    const state = boxes.map(box => ({
        id: box.id,
        style: {
            transform: box.style.transform,
            width: box.style.width,
            height: box.style.height,
            backgroundColor: box.style.backgroundColor,
            zIndex: box.style.zIndex
        }
    }));
    
    try {
        localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
        console.warn('Auto-save failed:', e);
    }
}

export function loadAutoSave(storageKey = 'boxEditorAutoSave') {
    try {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.warn('Auto-load failed:', e);
        return null;
    }
}

// 12. Template System
export const templates = {
    grid2x2: [
        { x: 50, y: 50, width: 200, height: 150 },
        { x: 300, y: 50, width: 200, height: 150 },
        { x: 50, y: 250, width: 200, height: 150 },
        { x: 300, y: 250, width: 200, height: 150 }
    ],
    headerContent: [
        { x: 50, y: 50, width: 500, height: 80 },
        { x: 50, y: 150, width: 500, height: 300 }
    ],
    sidebar: [
        { x: 50, y: 50, width: 150, height: 400 },
        { x: 220, y: 50, width: 330, height: 400 }
    ]
};

export function applyTemplate(templateName, container) {
    const template = templates[templateName];
    if (!template) return [];
    
    const containerRect = container.getBoundingClientRect();
    return template.map((item, index) => {
        const box = document.createElement('div');
        box.className = 'box';
        box.id = 'box-' + Date.now() + '-' + index;
        box.style.width = item.width + 'px';
        box.style.height = item.height + 'px';
        box.style.transform = `translate(${item.x}px, ${item.y}px)`;
        box.style.backgroundColor = `hsl(${index * 60}, 70%, 80%)`;
        return box;
    });
}