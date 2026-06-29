import { setBoxEventDependencies, attachBoxEvents } from './box-events.js';
import { 
    parseTransform, rgbToHex, MIN_WIDTH, MIN_HEIGHT, clearGuides,
    // NEW UTILITIES
    saveState, undo, redo, canUndo, canRedo,
    handleKeyResize, snapRotation, getSelectedBoxes, alignSelected,
    distributeSelected, toggleGrid, setGridSize, snapToGrid,
    copyStyles, pasteStyles, bringToFront, sendToBack,
    getContainerSnapPositions, debounce, showDistanceIndicator,
    autoSave, loadAutoSave, templates, applyTemplate
} from './texbox_utils.js';

// 1. DataHandler.js से आवश्यक डेटा और फ़ंक्शंस को इम्पोर्ट करें
import {
    filteredData, // यह वह डेटा है जिसे हम टेक्स्टबॉक्स में डालना चाहते हैं
    headers,      // डेटा के कॉलम हेडर
    // अन्य DataHandler फ़ंक्शंस
    // ...
} from '../store/DataHandler.js';

// Global variables for the module
let fullScreenContainer; 
let mainActionButton;
let bgColorPicker;
let dataInsertButton; 
let quill;
let textboxPreview;
let selectedBox = null;
let isEditMode = false;
let isInPlaceEditMode = false; // Flag for in-place editing
let GRID_SIZE = 10; // Updated for grid snapping
let TEXTBOX_TEMPLATES = []; // Now will be loaded from JSON

// **नया Global variable for data insertion sidebar**
let dataInsertSidebar;
let dataListContainer; 

// **NEW GLOBAL VARIABLES FOR ENHANCED FEATURES**
let undoButton;
let redoButton;
let alignButtons;
let distributeButtons;
let gridToggleButton;
let copyStyleButton;
let pasteStyleButton;
let bringFrontButton;
let sendBackButton;
let multiSelectMode = false;
// ---------------------------------------------------

// Google Fonts configuration
const CUSTOM_FONTS = ['Montserrat', 'Roboto', 'Lato', 'Open Sans', 'Poppins', 'Oswald'];

// --- Default Box Dimensions for Centering ---
const DEFAULT_BOX_WIDTH = 300;
const DEFAULT_BOX_HEIGHT = 100;
// --------------------------------------------

// Function to load templates from JSON file
async function loadTemplatesFromJSON() {
    try {
        const response = await fetch('src/data/TEXTBOX_TEMPLATES.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        TEXTBOX_TEMPLATES = data.templates;
        console.log('Templates loaded successfully:', TEXTBOX_TEMPLATES.length);
        return TEXTBOX_TEMPLATES;
    } catch (error) {
        console.error('Error loading templates from JSON:', error);
        // Fallback to default templates if JSON fails to load
        TEXTBOX_TEMPLATES = getDefaultTemplates();
        return TEXTBOX_TEMPLATES;
    }
}

// Fallback default templates in case JSON fails to load
function getDefaultTemplates() {
    return [
        {
            name: "मुख्य शीर्षक",
            content: "<h6>मुख्य डैशबोर्ड शीर्षक</h6><p>आपके डेटा का सारांश</p>",
            bgColor: "#e0f7fa",
            animationClass: "bg-animated-pulse"
        },
        {
            name: "नोट्स",
            content: "<strong>महत्वपूर्ण नोट्स:</strong><br>डेटा में महत्वपूर्ण वृद्धि दिखी।",
            bgColor: "#fffde7",
            animationClass: ""
        }
    ];
}

// Function to dynamically load Google Fonts
function addGoogleFontsToQuill() {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${CUSTOM_FONTS.join('&family=')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    let fontStyles = '';
    CUSTOM_FONTS.forEach(font => {
        const fontName = font.toLowerCase().replace(/\s/g, '-');
        fontStyles += `.ql-font-${fontName} { font-family: '${font}', sans-serif; }`;
    });
    style.innerHTML = fontStyles;
    document.head.appendChild(style);

    const Font = Quill.import('formats/font');
    Font.whitelist = ['sans-serif', 'serif', 'monospace', ...CUSTOM_FONTS.map(f => f.toLowerCase().replace(/\s/g, '-'))];
    Quill.register(Font, true);
}

// --- NEW ENHANCED FEATURE FUNCTIONS ---

/**
 * इन्हेंशिएटेड फीचर्स के लिए इवेंट हैंडलर्स सेटअप करता है
 */
function setupEnhancedFeatures() {
    // Undo/Redo buttons
    undoButton = document.getElementById('undoButton');
    redoButton = document.getElementById('redoButton');
    
    if (undoButton) undoButton.onclick = handleUndo;
    if (redoButton) redoButton.onclick = handleRedo;
    
    // Alignment buttons
    alignButtons = {
        left: document.getElementById('alignLeft'),
        right: document.getElementById('alignRight'),
        top: document.getElementById('alignTop'),
        bottom: document.getElementById('alignBottom'),
        centerV: document.getElementById('alignCenterVertical'),
        centerH: document.getElementById('alignCenterHorizontal')
    };
    
    Object.keys(alignButtons).forEach(key => {
        if (alignButtons[key]) {
            alignButtons[key].onclick = () => handleAlignment(key);
        }
    });
    
    // Distribution buttons
    distributeButtons = {
        horizontal: document.getElementById('distributeHorizontal'),
        vertical: document.getElementById('distributeVertical')
    };
    
    Object.keys(distributeButtons).forEach(key => {
        if (distributeButtons[key]) {
            distributeButtons[key].onclick = () => handleDistribution(key);
        }
    });
    
    // Grid toggle
    gridToggleButton = document.getElementById('gridToggle');
    if (gridToggleButton) {
        gridToggleButton.onclick = handleGridToggle;
    }
    
    // Style copy/paste
    copyStyleButton = document.getElementById('copyStyle');
    pasteStyleButton = document.getElementById('pasteStyle');
    
    if (copyStyleButton) copyStyleButton.onclick = handleCopyStyle;
    if (pasteStyleButton) pasteStyleButton.onclick = handlePasteStyle;
    
    // Z-index management
    bringFrontButton = document.getElementById('bringToFront');
    sendBackButton = document.getElementById('sendToBack');
    
    if (bringFrontButton) bringFrontButton.onclick = handleBringToFront;
    if (sendBackButton) sendBackButton.onclick = handleSendToBack;
    
    // Multi-select toggle
    const multiSelectToggle = document.getElementById('multiSelectToggle');
    if (multiSelectToggle) {
        multiSelectToggle.onclick = handleMultiSelectToggle;
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Auto-save setup
    setupAutoSave();
}

/**
 * Undo operation handler
 */
function handleUndo() {
    const state = undo();
    if (state) {
        applyStateToBoxes(state);
        updateUIState();
    }
}

/**
 * Redo operation handler
 */
function handleRedo() {
    const state = redo();
    if (state) {
        applyStateToBoxes(state);
        updateUIState();
    }
}

/**
 * Alignment operation handler
 */
function handleAlignment(alignment) {
    const selectedBoxes = getSelectedBoxes();
    if (selectedBoxes.length < 2) {
        alert("कृपया alignment के लिए कम से कम 2 बॉक्स select करें।");
        return;
    }
    
    alignSelected(alignment, fullScreenContainer);
    saveCurrentState();
    updateUIState();
}

/**
 * Distribution operation handler
 */
function handleDistribution(direction) {
    const selectedBoxes = getSelectedBoxes();
    if (selectedBoxes.length < 3) {
        alert(`कृपया ${direction} distribution के लिए कम से कम 3 बॉक्स select करें।`);
        return;
    }
    
    distributeSelected(direction, fullScreenContainer);
    saveCurrentState();
    updateUIState();
}

/**
 * Grid toggle handler
 */
function handleGridToggle() {
    const isEnabled = toggleGrid();
    gridToggleButton.classList.toggle('active', isEnabled);
    
    // Show/hide grid overlay
    let gridOverlay = document.getElementById('gridOverlay');
    if (!gridOverlay) {
        gridOverlay = document.createElement('div');
        gridOverlay.id = 'gridOverlay';
        gridOverlay.className = 'grid-overlay';
        fullScreenContainer.appendChild(gridOverlay);
    }
    gridOverlay.classList.toggle('active', isEnabled);
}

/**
 * Copy style handler
 */
function handleCopyStyle() {
    const selectedBoxes = getSelectedBoxes();
    if (selectedBoxes.length === 1) {
        copyStyles(selectedBoxes[0]);
        pasteStyleButton.disabled = false;
    } else {
        alert("कृपया स्टाइल copy करने के लिए सिर्फ एक बॉक्स select करें।");
    }
}

/**
 * Paste style handler
 */
function handlePasteStyle() {
    const selectedBoxes = getSelectedBoxes();
    if (selectedBoxes.length > 0) {
        selectedBoxes.forEach(box => pasteStyles(box));
        saveCurrentState();
        updateUIState();
    }
}

/**
 * Bring to front handler
 */
function handleBringToFront() {
    const selectedBoxes = getSelectedBoxes();
    selectedBoxes.forEach(box => bringToFront(box));
    saveCurrentState();
}

/**
 * Send to back handler
 */
function handleSendToBack() {
    const selectedBoxes = getSelectedBoxes();
    selectedBoxes.forEach(box => sendToBack(box));
    saveCurrentState();
}

/**
 * Multi-select toggle handler
 */
function handleMultiSelectToggle(e) {
    multiSelectMode = !multiSelectMode;
    e.target.classList.toggle('active', multiSelectMode);
    
    if (multiSelectMode) {
        document.body.style.cursor = 'crosshair';
    } else {
        document.body.style.cursor = 'default';
        // Clear selection if only one box is selected
        const selected = getSelectedBoxes();
        if (selected.length === 1) {
            selected[0].classList.remove('selected');
        }
    }
}

/**
 * Keyboard shortcuts handler
 */
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'z':
                if (e.shiftKey) handleRedo();
                else handleUndo();
                e.preventDefault();
                break;
            case 'y':
                handleRedo();
                e.preventDefault();
                break;
            case 'c':
                if (getSelectedBoxes().length === 1) handleCopyStyle();
                break;
            case 'v':
                handlePasteStyle();
                break;
            case 'g':
                handleGridToggle();
                e.preventDefault();
                break;
        }
    }
    
    // Arrow key resizing for selected box
    if (selectedBox && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        handleKeyResize(selectedBox, e.key);
        saveCurrentState();
        updateUIState();
        e.preventDefault();
    }
}

/**
 * Save current state of all boxes
 */
function saveCurrentState() {
    const boxes = Array.from(document.querySelectorAll('.box'));
    saveState(boxes);
    updateUIState();
}

/**
 * Apply saved state to boxes
 */
function applyStateToBoxes(state) {
    state.forEach(item => {
        const box = document.getElementById(item.id);
        if (box) {
            box.style.transform = item.transform;
            box.style.width = item.width;
            box.style.height = item.height;
            box.style.backgroundColor = item.backgroundColor;
            box.style.zIndex = item.zIndex;
        }
    });
    updateTextboxList();
}

/**
 * Update UI state (undo/redo buttons, etc.)
 */
function updateUIState() {
    if (undoButton) undoButton.disabled = !canUndo();
    if (redoButton) redoButton.disabled = !canRedo();
    
    const selectedCount = getSelectedBoxes().length;
    const hasSelection = selectedCount > 0;
    const hasMultipleSelection = selectedCount > 1;
    
    // Enable/disable buttons based on selection
    if (copyStyleButton) copyStyleButton.disabled = selectedCount !== 1;
    if (pasteStyleButton) pasteStyleButton.disabled = !hasSelection;
    if (bringFrontButton) bringFrontButton.disabled = !hasSelection;
    if (sendBackButton) sendBackButton.disabled = !hasSelection;
    
    // Alignment buttons require multiple selection
    Object.values(alignButtons).forEach(btn => {
        if (btn) btn.disabled = !hasMultipleSelection;
    });
    
    // Distribution buttons require at least 3 selections
    Object.values(distributeButtons).forEach(btn => {
        if (btn) btn.disabled = selectedCount < 3;
    });
}

/**
 * Setup auto-save functionality
 */
function setupAutoSave() {
    // Load auto-saved state if exists
    const savedState = loadAutoSave();
    if (savedState) {
        if (confirm('Auto-saved state मिला। क्या आप इसे load करना चाहते हैं?')) {
            applyStateToBoxes(savedState);
        }
    }
    
    // Auto-save every 30 seconds
    setInterval(() => {
        const boxes = Array.from(document.querySelectorAll('.box'));
        if (boxes.length > 0) {
            autoSave(boxes);
        }
    }, 30000);
}

// --- 2. नया डेटा इन्सर्ट करने वाला लॉजिक (साइडबार आधारित) ---

/**
 * डेटा इन्सर्ट साइडबार को खोलता है और डेटा सूची प्रस्तुत करता है।
 */
function openDataInsertSidebar() {
    // सुनिश्चित करें कि साइडबार मौजूद है
    if (!dataInsertSidebar || !dataListContainer) {
        console.error("Data Insert Sidebar elements not found.");
        return;
    }
    
    // वर्तमान संपादन मोड (Edit Mode) को साफ करें
    deselectAllBoxes();
    
    // डेटा सूची प्रस्तुत करें
    renderDataList();

    // साइडबार दिखाएं (Bootstrap offcanvas या कस्टम क्लास का उपयोग करें)
    dataInsertSidebar.classList.add('show'); 
    dataInsertSidebar.style.display = 'block'; // Ensure it's visible if using custom CSS
}

/**
 * डेटा इन्सर्ट साइडबार को बंद करता है।
 */
function closeDataInsertSidebar() {
    if (dataInsertSidebar) {
        dataInsertSidebar.classList.remove('show');
        dataInsertSidebar.style.display = 'none';
    }
}

/**
 * filteredData के आधार पर साइडबार में चयन योग्य सूची प्रस्तुत करता है।
 */
function renderDataList() {
    if (!dataListContainer || !filteredData || filteredData.length === 0) {
        dataListContainer.innerHTML = '<p class="text-muted p-3">कोई फ़िल्टर्ड डेटा उपलब्ध नहीं है।</p>';
        return;
    }

    let html = '<ul class="list-group">';
    
    // डेटा की पहली 50 पंक्तियों को दिखाएं (प्रदर्शन के लिए सीमा)
    const displayData = filteredData.slice(0, 50); 

    displayData.forEach((row, index) => {
        // प्रदर्शन के लिए मुख्य मान (उदाहरण के लिए, पहली 3 हेडर के मान)
        const displayValues = headers.slice(0, 3).map(header => row[header] !== undefined ? `${header}: ${row[header]}` : '').filter(Boolean);
        const displayLabel = displayValues.join(' | ');

        // प्रत्येक पंक्ति को एक चेकबॉक्स के साथ प्रस्तुत करें
        html += `
            <li class="list-group-item d-flex align-items-center" style="cursor: pointer;">
                <input type="checkbox" class="form-check-input me-3 data-checkbox" id="data-row-${index}" data-row-index="${index}">
                <label class="form-check-label flex-grow-1" for="data-row-${index}" style="font-size: 0.9em;">
                    <strong>Row ${index + 1}:</strong> ${displayLabel.substring(0, 80)}...
                </label>
                <button class="btn btn-sm btn-info view-details-btn" data-row-index="${index}" title="View Details">i</button>
            </li>
        `;
    });

    html += '</ul>';
    dataListContainer.innerHTML = html;
    
    // विवरण बटन पर क्लिक हैंडलर जोड़ें (वैकल्पिक: पूरी पंक्ति दिखाने के लिए)
    dataListContainer.querySelectorAll('.view-details-btn').forEach(button => {
        button.onclick = (e) => {
            const index = e.target.getAttribute('data-row-index');
            const fullRow = filteredData[index];
            alert('Full Row Data:\n' + JSON.stringify(fullRow, null, 2));
        };
    });
}

/**
 * चयनित डेटा पंक्तियों को पकड़ता है और उन्हें Quill एडिटर में इन्सर्ट करता है।
 */
function insertSelectedData() {
    if (!quill) return;

    const selectedCheckboxes = dataListContainer.querySelectorAll('.data-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        alert("कृपया इन्सर्ट करने के लिए कम से कम एक डेटा पंक्ति (Data Row) चुनें।");
        return;
    }

    let insertHtml = '<ul>';
    
    selectedCheckboxes.forEach(checkbox => {
        const index = checkbox.getAttribute('data-row-index');
        const row = filteredData[index];
        
        // हम डेटा को एक विशेष प्लेसहोल्डर प्रारूप में इन्सर्ट करते हैं
        // ताकि बाद में इसे रेंडरिंग इंजन द्वारा वास्तविक लाइव डेटा से बदला जा सके।
        // यहाँ, हम JSON स्ट्रिंग को HTML के अंदर डालते हैं जिसे हमारा रेंडरर पहचान सके।
        const rowString = JSON.stringify(row);
        
        // एक आसानी से पहचाने जाने वाले टैग में डेटा इन्सर्ट करें
        // (Quill इसे HTML के रूप में मानेगा, लेकिन हमारा रेंडरर इसे लाइव डेटा के रूप में पार्स करेगा)
        // यह एक उदाहरण है, आप इसे अपने बैकएंड रेंडरिंग सिस्टम के अनुरूप बदल सकते हैं।
        
        const displayValues = headers.slice(0, 3).map(header => row[header] || '');
        const displayText = displayValues.join(' | ');

        // लाइव डेटा को स्टोर करने के लिए एक कस्टम एट्रीब्यूट वाला HTML एलिमेंट का उपयोग करना
        insertHtml += `<li data-live-data='${rowString}' style="color: #0056b3; font-weight: bold; margin-bottom: 5px;">
            <span contenteditable="false" style="font-size: 0.8em; color: #6c757d;">(Live Data Row ${parseInt(index) + 1})</span>: ${displayText}
        </li>`;
    });

    insertHtml += '</ul>';

    const range = quill.getSelection(true);
    if (range) {
        // चयनित डेटा को HTML के रूप में इन्सर्ट करें
        quill.clipboard.dangerouslyPasteHTML(range.index, insertHtml);
        quill.setSelection(range.index + insertHtml.length, 0); 
    }

    // एडिटर और प्रीव्यू को अपडेट करें
    updatePreviewFromQuill();
    // साइडबार बंद करें
    closeDataInsertSidebar();
}

/**
 * क्विल एडिटर सामग्री के आधार पर टेक्स्टबॉक्स प्रीव्यू को अपडेट करता है।
 */
function updatePreviewFromQuill() {
    const quillContent = quill.root.innerHTML;
    const previewEditor = textboxPreview.querySelector('.ql-editor');
    
    let previewContent = quillContent;
    
    // 3. प्रीव्यू में लाइव डेटा टैग को दिखाने के लिए बदलना
    // यह फ़ंक्शन live-data टैग को पकड़ता है और दिखाता है कि यह कैसा दिखेगा।
    
    // Live Data Row (li[data-live-data] तत्वों को खोजें)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = quillContent;
    
    tempDiv.querySelectorAll('li[data-live-data]').forEach(li => {
        try {
            const rowData = JSON.parse(li.getAttribute('data-live-data'));
            // हम केवल पहले 3 मानों को लाइव-अपडेटेड टेक्स्ट के रूप में दिखाएंगे
            const liveText = headers.slice(0, 3).map(header => rowData[header] || 'N/A').join(' | ');
            
            // वास्तविक डेटा को प्रतिबिंबित करने के लिए li को अपडेट करें
            li.innerHTML = `<span style="font-size: 0.8em; color: green;">(LIVE DATA ROW)</span>: <span style="font-weight: bold;">${liveText}</span>`;
            li.style.backgroundColor = '#e6ffed'; // हल्के हरे रंग की पृष्ठभूमि
            li.style.borderLeft = '4px solid green';
            li.removeAttribute('contenteditable'); // संपादन से रोकें
        } catch (e) {
            console.error("Error parsing live data JSON:", e);
            li.innerHTML = '<span style="color: red;">[Invalid Live Data]</span>';
        }
    });

    previewContent = tempDiv.innerHTML;

    if (previewEditor) {
        previewEditor.innerHTML = previewContent;
    }
}

// --- Core Control Functions (ये फ़ंक्शन वही रहते हैं) ---

export function deselectAllBoxes() {
    if (isInPlaceEditMode && selectedBox) {
        const textDiv = selectedBox.querySelector('.txt');
        if (textDiv) {
            textDiv.removeAttribute('contentEditable');
            textDiv.classList.remove('in-place-edit-active');
        }
        isInPlaceEditMode = false;
    }
    
    document.querySelectorAll(".box.selected").forEach(b => b.classList.remove('selected'));
    document.querySelectorAll(".box.edit-mode").forEach(b => b.classList.remove('edit-mode'));
    clearGuides();
    selectedBox = null;
    isEditMode = false;
    if(mainActionButton) mainActionButton.textContent = 'Create New Textbox';
    if(quill) quill.setContents([]);
    if(bgColorPicker) bgColorPicker.value = '#ffffff';
    document.body.style.cursor = 'default';
    if(textboxPreview && textboxPreview.querySelector('.ql-editor')) {
        textboxPreview.querySelector('.ql-editor').innerHTML = '';
        textboxPreview.style.backgroundColor = '#ffffff';
        textboxPreview.className = "box-preview";
    }
    closeDataInsertSidebar(); // Ensure sidebar closes on deselection
    
    // Update UI state
    updateUIState();
}

export function enterEditMode(box) {
    deselectAllBoxes(); 
    selectedBox = box;
    isEditMode = true;
    box.classList.add('selected', 'edit-mode');
    
    if(quill) quill.root.innerHTML = box.querySelector('.txt').innerHTML;
    
    const boxBgColor = window.getComputedStyle(box).backgroundColor;
    if(bgColorPicker) bgColorPicker.value = rgbToHex(boxBgColor) || '#ffffff';
    
    if(mainActionButton) mainActionButton.textContent = 'Update Textbox';
    updatePreviewFromQuill(); 
    if (textboxPreview) {
      textboxPreview.style.backgroundColor = boxBgColor;
      textboxPreview.className = "box-preview " + (box.getAttribute('data-animation-class') || '');
    }
    
    // Update UI state
    updateUIState();
}

/**
 * Enables in-place editing of the textbox content on the dashboard.
 * @param {HTMLElement} box The textbox element to edit.
 */
export function enterInPlaceEditMode(box) {
    deselectAllBoxes();
    
    selectedBox = box;
    isInPlaceEditMode = true; 
    box.classList.add('selected'); 

    const textDiv = box.querySelector('.txt');
    if (textDiv) {
        textDiv.setAttribute('contentEditable', 'true');
        textDiv.classList.add('in-place-edit-active'); 
        textDiv.focus(); 

        textDiv.onblur = () => {
            if (isInPlaceEditMode) {
                updateTextboxList(); 
                deselectAllBoxes(); 
            }
        };

        textDiv.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); 
                textDiv.blur(); 
            }
            if (e.key === 'Escape') {
                textDiv.blur();
            }
        };
    }
    
    if(mainActionButton) mainActionButton.textContent = 'Editing Textbox... (Double-click to stop)';
}

// Create a new box
function createBox(x, y, rotation, content, bgColor, animationClass = "") {
    if (!fullScreenContainer) {
        console.error("Cannot create box: Full screen container not found.");
        return null;
    }

    const box = document.createElement('div');
    box.className = 'box';
    
    // Apply grid snapping if enabled
    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);
    
    box.style.transform = `translate(${snappedX}px, ${snappedY}px) rotate(${rotation}deg)`;
    box.style.backgroundColor = bgColor;
    box.style.zIndex = 1000;
    box.style.width = DEFAULT_BOX_WIDTH + 'px'; 
    box.style.height = DEFAULT_BOX_HEIGHT + 'px';
    box.id = "textbox-" + Date.now();

    if (animationClass) {
        box.classList.add(animationClass);
        box.setAttribute('data-animation-class', animationClass);
    }

    const rotateHandle = document.createElement('div');
    rotateHandle.className = 'rotate-handle';
    rotateHandle.title = "घुमाएँ";
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    const btnFront = document.createElement('button'); btnFront.className="front"; btnFront.textContent="सामने";
    const btnBack = document.createElement('button'); btnBack.className="back"; btnBack.textContent="पीछे";
    const btnDup = document.createElement('button'); btnDup.className="duplicate"; btnDup.textContent="कॉपी";
    const btnDel = document.createElement('button'); btnDel.className="delete"; btnDel.textContent="हटाएँ";
    const btnLock = document.createElement('button'); btnLock.className="lock"; btnLock.textContent="लॉक";
    toolbar.appendChild(btnFront);
    toolbar.appendChild(btnBack);
    toolbar.appendChild(btnDup);
    toolbar.appendChild(btnDel);
    toolbar.appendChild(btnLock);

    const textDiv = document.createElement('div');
    textDiv.className = "txt"; 
    textDiv.innerHTML = content === '<p><br></p>' || content === '<p></p>' ? '' : content;

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.title = "आकार बदलें";

    box.appendChild(rotateHandle);
    box.appendChild(toolbar);
    box.appendChild(textDiv);
    box.appendChild(resizeHandle);

    fullScreenContainer.appendChild(box);
    attachBoxEvents(box); 
    updateTextboxList();
    
    // Save state after creation
    saveCurrentState();
    
    return box;
}

// Deselect on outside click
function setupGlobalEvents() {
    document.addEventListener('pointerdown', (e) => {
        let targetElement = e.target;
        let isClickOnCanvasElement = false;
        while (targetElement) {
            // Check if the click is inside the active in-place editor
            if (targetElement.classList.contains('in-place-edit-active')) {
                 isClickOnCanvasElement = true;
                 break;
            }
            // Check for the new data sidebar
             if (targetElement === dataInsertSidebar || targetElement.closest('#dataInsertSidebar')) {
                 isClickOnCanvasElement = true;
                 break;
            }
            if (targetElement.id === 'dataInsertButton' || targetElement.closest('.ql-toolbar') || targetElement.closest('.ql-container')) {
                 isClickOnCanvasElement = true;
                 break;
            }
            if (targetElement.classList.contains('box') || targetElement.closest('.control-panel') || targetElement.closest('.offcanvas')) {
                isClickOnCanvasElement = true;
                break;
            }
            targetElement = targetElement.parentElement;
        }
        // If the click is outside all controls and boxes and not in the data sidebar
        if (!isClickOnCanvasElement) {
            deselectAllBoxes();
        }
    });
}

// Function to load template content into the editor
function loadTemplateIntoEditor(template) {
    deselectAllBoxes();
    if(quill) quill.root.innerHTML = template.content;
    if(bgColorPicker) bgColorPicker.value = template.bgColor;

    updatePreviewFromQuill();

    if (textboxPreview) {
        textboxPreview.style.backgroundColor = template.bgColor;
        if (template.animationClass) {
            textboxPreview.className = "box-preview " + template.animationClass;
        } else {
            textboxPreview.className = "box-preview";
        }
    }

    if(mainActionButton) mainActionButton.textContent = 'Create New Textbox';
    isEditMode = false;
}

// Function to render templates
function renderTemplates() {
    const templateGallery = document.getElementById('templateGallery');
    if (!templateGallery) return;

    templateGallery.innerHTML = '';
    TEXTBOX_TEMPLATES.forEach(template => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        
        if (template.animationClass) {
            templateItem.classList.add(template.animationClass);
            templateItem.style.backgroundColor = 'transparent';
        } else {
            templateItem.style.backgroundColor = template.bgColor;
        }
        
        templateItem.innerHTML = `<span class="fw-bold">${template.name}</span>`;
        templateItem.onclick = () => {
            loadTemplateIntoEditor(template);
        };
        templateGallery.appendChild(templateItem);
    });
}

// Function to update the list of textboxes in the sidebar
function updateTextboxList() {
    const textboxListContainer = document.getElementById('textboxList');
    if (!textboxListContainer) {
        console.error("Textbox list container not found.");
        return;
    }

    textboxListContainer.innerHTML = '';
    const allTextboxes = document.querySelectorAll('.box');

    if (allTextboxes.length === 0) {
        textboxListContainer.innerHTML = '<p class="text-muted small">कोई टेक्स्टबॉक्स नहीं है।</p>';
        return;
    }

    allTextboxes.forEach((box, index) => {
        const listItem = document.createElement('div');
        listItem.className = 'list-group-item list-group-item-action';
        listItem.style.cursor = 'pointer';
        
        const innerText = box.querySelector('.txt').innerHTML; 
        
        const textWithoutHtml = new DOMParser().parseFromString(innerText, 'text/html').body.textContent || '';
        const displayText = textWithoutHtml.trim() === '' ? '(खाली टेक्स्टबॉक्स)' : textWithoutHtml.substring(0, 30);
        
        listItem.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-card-text me-2"></i>
                <div class="flex-grow-1 overflow-hidden text-truncate">
                    <strong>टेक्स्टबॉक्स ${index + 1}</strong>
                    <div class="text-muted small">${displayText}...</div>
                </div>
            </div>
        `;
        
        listItem.addEventListener('click', () => {
            enterEditMode(box);
            box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        textboxListContainer.appendChild(listItem);
    });
}

// Main function to initialize the editor
export async function initializeTextboxEditor() {
    fullScreenContainer = document.body;
    mainActionButton = document.getElementById('mainActionButton');
    bgColorPicker = document.getElementById('bgColorPicker');
    dataInsertButton = document.getElementById('dataInsertButton'); 
    textboxPreview = document.getElementById('textboxPreview');
    // **नये तत्व प्राप्त करें**
    dataInsertSidebar = document.getElementById('dataInsertSidebar');
    dataListContainer = document.getElementById('dataListContainer'); 

    if (!fullScreenContainer || !mainActionButton || !bgColorPicker || !textboxPreview || !dataInsertButton || !dataInsertSidebar || !dataListContainer) {
        console.error("Required elements for Textbox Editor not found. Check all elements (dataInsertButton, dataInsertSidebar, dataListContainer).");
        return;
    }

    // Load templates from JSON first
    await loadTemplatesFromJSON();

    // Load Google Fonts before initializing Quill
    addGoogleFontsToQuill();
    
    // Initialize enhanced features
    setupEnhancedFeatures();

    if (!quill) {
        quill = new Quill('#quill-container', {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'header': 1 }, { 'header': 2 }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'direction': 'rtl' }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'font': ['sans-serif', 'serif', 'monospace', ...CUSTOM_FONTS.map(f => f.toLowerCase().replace(/\s/g, '-'))] }],
                    [{ 'align': [] }],
                    ['link', 'image', 'video'],
                    ['clean']
                ]
            }
        });
        
        quill.on('text-change', () => {
            updatePreviewFromQuill(); 

            if (isEditMode && selectedBox) {
                const textDiv = selectedBox.querySelector('.txt');
                if (textDiv) {
                    textDiv.innerHTML = quill.root.innerHTML; 
                    updateTextboxList();
                }
            }
        });
    }

    // Now that quill is initialized, re-set dependencies with the new function
    setBoxEventDependencies(quill, deselectAllBoxes, enterEditMode, enterInPlaceEditMode, createBox, updateTextboxList, fullScreenContainer, GRID_SIZE);

    document.querySelectorAll('.box').forEach(b => attachBoxEvents(b));
    
    // --- Data Insert Button Event Listener ---
    dataInsertButton.onclick = openDataInsertSidebar;
    
    // Sidebar के "Insert Selected" बटन पर इवेंट लिसनर
    const insertDataBtn = document.getElementById('insertSelectedDataBtn');
    if (insertDataBtn) {
        insertDataBtn.onclick = insertSelectedData;
    }
    // Sidebar के "Close" बटन पर इवेंट लिसनर
    const closeSidebarBtn = document.getElementById('closeDataSidebarBtn');
     if (closeSidebarBtn) {
        closeSidebarBtn.onclick = closeDataInsertSidebar;
    }
    // ------------------------------------------

    mainActionButton.onclick = () => {
        const content = quill.root.innerHTML;
        const bgColor = bgColorPicker.value;

        if (isEditMode && selectedBox) {
            // Logic for updating box from sidebar editor
            const textDiv = selectedBox.querySelector('.txt');
            if (textDiv) {
                textDiv.innerHTML = content;
            }
            selectedBox.style.backgroundColor = bgColor;
            const animationClass = textboxPreview.className.replace("box-preview", "").trim();
            if (animationClass) {
                selectedBox.className = "box selected edit-mode " + animationClass;
                selectedBox.setAttribute('data-animation-class', animationClass);
            } else {
                selectedBox.className = "box selected edit-mode";
                selectedBox.removeAttribute('data-animation-class');
            }
            deselectAllBoxes();
            updateTextboxList();
            saveCurrentState();
        } else {
            // Logic for creating a new box
            
            const x = (window.innerWidth / 2) - (DEFAULT_BOX_WIDTH / 2); 
            const y = (window.innerHeight / 2) - (DEFAULT_BOX_HEIGHT / 2); 

            const animationClass = textboxPreview.className.replace("box-preview", "").trim();
            
            createBox(x, y, 0, content, bgColor, animationClass);
            
            quill.setContents([]);
            const previewEditor = textboxPreview.querySelector('.ql-editor');
            if (previewEditor) {
                previewEditor.innerHTML = '';
            }
            textboxPreview.className = "box-preview";
            bgColorPicker.value = "#ffffff";
        }
    };

    bgColorPicker.oninput = (e) => {
        const newColor = e.target.value;
        if (isEditMode && selectedBox) {
            selectedBox.style.backgroundColor = newColor;
        }
        if (textboxPreview) {
            textboxPreview.style.backgroundColor = newColor;
            if (!isEditMode || !selectedBox) {
                 textboxPreview.className = "box-preview";
            }
        }
    };

    setupGlobalEvents(); 
    renderTemplates();
    updateTextboxList();
    updateUIState(); // Initial UI state update
}