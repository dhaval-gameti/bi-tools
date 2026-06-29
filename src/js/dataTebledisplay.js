
// dataTebledisplay.js

// DataHandler से इम्पोर्ट करें
import { filteredData, headers, rowsPerPage, currentPage, changePage } from '../store/DataHandler.js'; 

// ========================== GOOGLE SHEETS STYLE TABLE CSS ==========================
const GOOGLE_SHEETS_STYLES = `
.data-table-container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: white;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    overflow: hidden;
    margin: 20px 0;
    width: 100%;
}

.data-table-header {
    background: #1a73e8;
    color: white;
    padding: 15px 20px;
    text-align: center;
}

.data-table-header h2 {
    font-size: 20px;
    margin-bottom: 5px;
    margin: 0;
}

.data-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #dadce0;
    flex-wrap: wrap;
    gap: 10px;
}

.selection-info {
    font-size: 14px;
    color: #5f6368;
}

.selection-range {
    font-weight: bold;
    color: #1a73e8;
}

.data-buttons {
    display: flex;
    gap: 8px;
}

.data-btn {
    padding: 6px 12px;
    border: 1px solid #dadce0;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    background: white;
    color: #5f6368;
    transition: all 0.2s ease;
}

.data-btn:hover {
    background: #f1f3f4;
}

.btn-clear {
    color: #d93025;
    border-color: #d93025;
}

.btn-clear:hover {
    background: #fce8e6;
}

.btn-select-all {
    color: #1a73e8;
    border-color: #1a73e8;
}

.btn-select-all:hover {
    background: #e8f0fe;
}

.table-wrapper {
    overflow: auto;
    max-height: 60vh;
    position: relative;
    background: white;
    width: 100%;
}

/* कॉलम हेडर */
.column-headers {
    display: flex;
    background: #f8f9fa;
    position: sticky;
    top: 0;
    z-index: 20;
    border-bottom: 1px solid #dadce0;
    min-width: fit-content;
}

.corner {
    width: 40px;
    min-width: 40px;
    height: 24px;
    background: #f8f9fa;
    border-right: 1px solid #dadce0;
    border-bottom: 1px solid #dadce0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #5f6368;
    position: sticky;
    left: 0;
    z-index: 30;
    flex-shrink: 0;
}

.column-header {
    width: 120px;
    min-width: 120px;
    height: 24px;
    background: #f8f9fa;
    border-right: 1px solid #dadce0;
    border-bottom: 1px solid #dadce0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #5f6368;
    font-weight: 500;
    position: relative;
    flex-shrink: 0;
}

/* रो हेडर और सेल */
.data-grid-row {
    display: flex;
    min-width: fit-content;
}

.row-header {
    width: 40px;
    min-width: 40px;
    height: 24px;
    background: #f8f9fa;
    border-right: 1px solid #dadce0;
    border-bottom: 1px solid #dadce0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #5f6368;
    font-weight: 500;
    position: sticky;
    left: 0;
    z-index: 10;
    flex-shrink: 0;
}

.data-cell {
    width: 120px;
    min-width: 120px;
    height: 24px;
    border-right: 1px solid #e0e0e0;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    padding: 0 4px;
    cursor: cell;
    user-select: none;
    transition: all 0.1s ease;
    background: white;
    font-size: 11px;
    color: #000;
    position: relative;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 0;
    box-sizing: border-box;
}

.data-cell:hover {
    background: #f8f9fa;
}

/* Google Sheets जैसा सेलेक्शन बॉर्डर */
.data-cell.selected {
    background: #e8f0fe;
    border: 1px solid #1a73e8;
}

.selection-border {
    position: absolute;
    pointer-events: none;
    z-index: 5;
    border: 2px solid #1a73e8;
    background: rgba(26, 115, 232, 0.1);
}

.selection-handle {
    position: absolute;
    width: 6px;
    height: 6px;
    background: #1a73e8;
    border: 1px solid white;
    border-radius: 50%;
    z-index: 6;
    pointer-events: none;
}

.selection-handle.bottom-right {
    bottom: -3px;
    right: -3px;
    cursor: crosshair;
}

.active-cell {
    border: 2px solid #1a73e8 !important;
    z-index: 4;
}

.pagination-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: #f8f9fa;
    border-top: 1px solid #dadce0;
    flex-wrap: wrap;
    gap: 10px;
}

.page-info {
    font-size: 14px;
    color: #5f6368;
}

.pagination-buttons {
    display: flex;
    gap: 8px;
}

.page-btn {
    padding: 6px 12px;
    border: 1px solid #dadce0;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    background: white;
    color: #5f6368;
    transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
    background: #f1f3f4;
}

.page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.search-box {
    padding: 8px 12px;
    border: 1px solid #dadce0;
    border-radius: 4px;
    font-size: 12px;
    width: 200px;
}

.no-data {
    text-align: center;
    padding: 40px;
    color: #5f6368;
    font-style: italic;
    background: white;
    border-radius: 10px;
    margin: 20px 0;
}

/* Actual column names display - NOW SELECTABLE */
.actual-column-headers {
    display: flex;
    background: #e8f0fe;
    position: sticky;
    top: 24px;
    z-index: 19;
    border-bottom: 1px solid #dadce0;
    min-width: fit-content;
}

.actual-column-corner {
    width: 40px;
    min-width: 40px;
    height: 24px;
    background: #e8f0fe;
    border-right: 1px solid #dadce0;
    border-bottom: 1px solid #dadce0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #1a73e8;
    position: sticky;
    left: 0;
    z-index: 29;
    flex-shrink: 0;
    font-weight: bold;
}

.actual-column-header {
    width: 120px;
    min-width: 120px;
    height: 24px;
    background: #e8f0fe;
    border-right: 1px solid #dadce0;
    border-bottom: 1px solid #dadce0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #1a73e8;
    font-weight: 600;
    position: relative;
    flex-shrink: 0;
    padding: 0 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: cell;
    user-select: none;
}

.actual-column-header:hover {
    background: #d2e3fc;
}

.actual-column-header.selected {
    background: #1a73e8;
    color: white;
    border: 1px solid #1a73e8;
}

.header-row {
    display: flex;
    min-width: fit-content;
}

.header-cell {
    width: 120px;
    min-width: 120px;
    height: 24px;
    border-right: 1px solid #dadce0;
    border-bottom: 1px solid #dadce0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    position: relative;
    flex-shrink: 0;
    padding: 0 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: cell;
    user-select: none;
    background: #e8f0fe;
    color: #1a73e8;
}

.header-cell.selected {
    background: #1a73e8;
    color: white;
    border: 1px solid #1a73e8;
}

@media (max-width: 768px) {
    .data-controls {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
    }
    
    .data-buttons {
        width: 100%;
        justify-content: flex-start;
    }
    
    .data-cell, .column-header, .actual-column-header, .header-cell {
        width: 100px;
        min-width: 100px;
    }
    
    .search-box {
        width: 100%;
    }
    
    .pagination-controls {
        flex-direction: column;
        align-items: flex-start;
    }
}

.loading-spinner, .stats-grid, .error-state { 
    display: none; 
}
`;

// ========================== GOOGLE SHEETS TABLE LOGIC ==========================
let isSelecting = false;
let startCell = null;
let currentRange = null;
let selectionBorder = null;
let selectionHandle = null;

// स्टाइल्स इंजेक्ट करना
function injectGoogleSheetsStyles() {
    if (!document.getElementById('google-sheets-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'google-sheets-styles';
        styleSheet.textContent = GOOGLE_SHEETS_STYLES;
        document.head.appendChild(styleSheet);
    }
}

// कॉलम लेबल कन्वर्टर (A, B, C, ..., Z, AA, AB, ...)
function numberToColumnLabel(num) {
    let result = '';
    while (num >= 0) {
        result = String.fromCharCode(65 + (num % 26)) + result;
        num = Math.floor(num / 26) - 1;
        if (num < 0) break;
    }
    return result;
}

// सेलेक्शन बॉर्डर बनाना
function createSelectionBorder(container) {
    // पुराने elements को साफ़ करें
    if (selectionBorder) {
        selectionBorder.remove();
    }
    if (selectionHandle) {
        selectionHandle.remove();
    }
    
    selectionBorder = document.createElement('div');
    selectionBorder.className = 'selection-border';
    selectionBorder.style.display = 'none';
    
    selectionHandle = document.createElement('div');
    selectionHandle.className = 'selection-handle bottom-right';
    selectionHandle.style.display = 'none';
    
    container.appendChild(selectionBorder);
    container.appendChild(selectionHandle);
}

// इवेंट हैंडलर्स - अब headers को भी सपोर्ट करता है
function setupEventListeners(container) {
    // माउस इवेंट्स
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // टच इवेंट्स
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
}

function handleMouseDown(e) {
    const target = e.target;
    if (target.classList.contains('data-cell') || 
        target.classList.contains('actual-column-header') ||
        target.classList.contains('header-cell')) {
        
        e.preventDefault();
        isSelecting = true;
        startCell = target;
        
        let row, col;
        
        if (target.classList.contains('data-cell')) {
            row = parseInt(target.dataset.row);
            col = parseInt(target.dataset.col);
        } else if (target.classList.contains('actual-column-header') || 
                   target.classList.contains('header-cell')) {
            // Headers के लिए special row (-1) और column index
            row = -1; // Header row को represent करता है
            col = parseInt(target.dataset.col);
        }
        
        startSelection(row, col);
    }
}

function handleMouseMove(e) {
    if (!isSelecting) return;
    
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (target && (target.classList.contains('data-cell') || 
                   target.classList.contains('actual-column-header') ||
                   target.classList.contains('header-cell'))) {
        
        let row, col;
        
        if (target.classList.contains('data-cell')) {
            row = parseInt(target.dataset.row);
            col = parseInt(target.dataset.col);
        } else if (target.classList.contains('actual-column-header') || 
                   target.classList.contains('header-cell')) {
            row = -1;
            col = parseInt(target.dataset.col);
        }
        
        updateSelection(row, col);
    }
}

function handleMouseUp() {
    isSelecting = false;
}

function handleTouchStart(e) {
    if (e.target.classList.contains('data-cell') || 
        e.target.classList.contains('actual-column-header') ||
        e.target.classList.contains('header-cell')) {
        
        e.preventDefault();
        isSelecting = true;
        const touch = e.touches[0];
        startCell = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (startCell) {
            let row, col;
            
            if (startCell.classList.contains('data-cell')) {
                row = parseInt(startCell.dataset.row);
                col = parseInt(startCell.dataset.col);
            } else if (startCell.classList.contains('actual-column-header') || 
                       startCell.classList.contains('header-cell')) {
                row = -1;
                col = parseInt(startCell.dataset.col);
            }
            
            startSelection(row, col);
        }
    }
}

function handleTouchMove(e) {
    if (!isSelecting) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (target && (target.classList.contains('data-cell') || 
                   target.classList.contains('actual-column-header') ||
                   target.classList.contains('header-cell'))) {
        
        let row, col;
        
        if (target.classList.contains('data-cell')) {
            row = parseInt(target.dataset.row);
            col = parseInt(target.dataset.col);
        } else if (target.classList.contains('actual-column-header') || 
                   target.classList.contains('header-cell')) {
            row = -1;
            col = parseInt(target.dataset.col);
        }
        
        updateSelection(row, col);
    }
}

function handleTouchEnd() {
    isSelecting = false;
}

// सेलेक्शन फंक्शन्स - अब headers को भी सपोर्ट करता है
function startSelection(row, col) {
    currentRange = {
        startRow: row,
        startCol: col,
        endRow: row,
        endCol: col,
        includesHeaders: row === -1 // यह indicate करता है कि selection में headers शामिल हैं
    };
    
    updateVisualSelection();
}

function updateSelection(row, col) {
    if (!currentRange) return;
    
    currentRange.endRow = row;
    currentRange.endCol = col;
    currentRange.includesHeaders = currentRange.startRow === -1 || currentRange.endRow === -1;
    updateVisualSelection();
}

function updateVisualSelection() {
    // पुरानी सेलेक्शन क्लियर करें
    document.querySelectorAll('.data-cell.selected, .actual-column-header.selected, .header-cell.selected, .active-cell').forEach(cell => {
        cell.classList.remove('selected', 'active-cell');
    });
    
    if (!currentRange) return;
    
    const startRow = Math.min(currentRange.startRow, currentRange.endRow);
    const endRow = Math.max(currentRange.startRow, currentRange.endRow);
    const startCol = Math.min(currentRange.startCol, currentRange.endCol);
    const endCol = Math.max(currentRange.startCol, currentRange.endCol);
    
    // नई रेंज सेलेक्ट करें (headers और data दोनों)
    for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
            let cell;
            if (i === -1) {
                // Headers सेलेक्ट करें
                cell = document.querySelector(`.actual-column-header[data-col="${j}"]`) || 
                       document.querySelector(`.header-cell[data-col="${j}"]`);
            } else {
                // Data cells सेलेक्ट करें
                cell = document.querySelector(`.data-cell[data-row="${i}"][data-col="${j}"]`);
            }
            if (cell) {
                cell.classList.add('selected');
            }
        }
    }
    
    // एक्टिव सेल सेट करें
    let activeCell;
    if (currentRange.startRow === -1) {
        activeCell = document.querySelector(`.actual-column-header[data-col="${currentRange.startCol}"]`) || 
                     document.querySelector(`.header-cell[data-col="${currentRange.startCol}"]`);
    } else {
        activeCell = document.querySelector(`.data-cell[data-row="${currentRange.startRow}"][data-col="${currentRange.startCol}"]`);
    }
    
    if (activeCell) {
        activeCell.classList.add('active-cell');
    }
    
    // बॉर्डर अपडेट करें
    updateSelectionBorder();
    updateSelectionInfo();
}

function updateSelectionBorder() {
    if (!currentRange || !selectionBorder) return;
    
    const startRow = Math.min(currentRange.startRow, currentRange.endRow);
    const endRow = Math.max(currentRange.startRow, currentRange.endRow);
    const startCol = Math.min(currentRange.startCol, currentRange.endCol);
    const endCol = Math.max(currentRange.startCol, currentRange.endCol);
    
    let firstCell, lastCell;
    
    if (startRow === -1) {
        // Headers selection
        firstCell = document.querySelector(`.actual-column-header[data-col="${startCol}"]`) || 
                    document.querySelector(`.header-cell[data-col="${startCol}"]`);
        lastCell = document.querySelector(`.actual-column-header[data-col="${endCol}"]`) || 
                   document.querySelector(`.header-cell[data-col="${endCol}"]`);
    } else {
        // Data cells selection
        firstCell = document.querySelector(`.data-cell[data-row="${startRow}"][data-col="${startCol}"]`);
        lastCell = document.querySelector(`.data-cell[data-row="${endRow}"][data-col="${endCol}"]`);
    }
    
    if (firstCell && lastCell) {
        const containerRect = document.querySelector('.table-wrapper').getBoundingClientRect();
        const firstRect = firstCell.getBoundingClientRect();
        const lastRect = lastCell.getBoundingClientRect();
        
        // बॉर्डर पोजीशन और साइज़ सेट करें
        selectionBorder.style.display = 'block';
        selectionBorder.style.left = (firstRect.left - containerRect.left) + 'px';
        selectionBorder.style.top = (firstRect.top - containerRect.top) + 'px';
        selectionBorder.style.width = (lastRect.right - firstRect.left) + 'px';
        selectionBorder.style.height = (lastRect.bottom - firstRect.top) + 'px';
        
        // हैंडल पोजीशन सेट करें
        if (selectionHandle) {
            selectionHandle.style.display = 'block';
            selectionHandle.style.left = (lastRect.right - containerRect.left - 3) + 'px';
            selectionHandle.style.top = (lastRect.bottom - containerRect.top - 3) + 'px';
        }
    }
}

function updateSelectionInfo() {
    if (!currentRange) return;
    
    const startRow = Math.min(currentRange.startRow, currentRange.endRow);
    const endRow = Math.max(currentRange.startRow, currentRange.endRow);
    const startCol = Math.min(currentRange.startCol, currentRange.endCol);
    const endCol = Math.max(currentRange.startCol, currentRange.endCol);
    
    const selectionInfo = document.getElementById('selectionInfo');
    if (selectionInfo) {
        if (startRow === -1 && endRow === -1) {
            // Only headers selected
            if (startCol === endCol) {
                selectionInfo.textContent = `Header: ${numberToColumnLabel(startCol)}`;
            } else {
                selectionInfo.textContent = `Headers: ${numberToColumnLabel(startCol)}:${numberToColumnLabel(endCol)}`;
            }
        } else if (startRow === endRow && startCol === endCol) {
            // Single cell selected
            if (startRow === -1) {
                selectionInfo.textContent = `Header: ${numberToColumnLabel(startCol)}`;
            } else {
                selectionInfo.textContent = `${numberToColumnLabel(startCol)}${startRow + 1 + ((currentPage - 1) * rowsPerPage)}`;
            }
        } else {
            // Range selected
            if (startRow === -1) {
                // Header range + data range
                const startRowAbsolute = 1;
                const endRowAbsolute = endRow + 1 + ((currentPage - 1) * rowsPerPage);
                selectionInfo.textContent = `${numberToColumnLabel(startCol)}${startRowAbsolute}:${numberToColumnLabel(endCol)}${endRowAbsolute}`;
            } else {
                // Data range only
                const startRowAbsolute = startRow + 1 + ((currentPage - 1) * rowsPerPage);
                const endRowAbsolute = endRow + 1 + ((currentPage - 1) * rowsPerPage);
                selectionInfo.textContent = `${numberToColumnLabel(startCol)}${startRowAbsolute}:${numberToColumnLabel(endCol)}${endRowAbsolute}`;
            }
        }
    }
}

export function setActiveCell(row, col) {
    currentRange = {
        startRow: row,
        startCol: col,
        endRow: row,
        endCol: col,
        includesHeaders: row === -1
    };
    updateVisualSelection();
}

export function clearSelection() {
    document.querySelectorAll('.data-cell, .actual-column-header, .header-cell').forEach(cell => {
        cell.classList.remove('selected', 'active-cell');
    });
    
    if (selectionBorder) {
        selectionBorder.style.display = 'none';
    }
    if (selectionHandle) {
        selectionHandle.style.display = 'none';
    }
    
    currentRange = null;
    
    const selectionInfo = document.getElementById('selectionInfo');
    if(selectionInfo) selectionInfo.textContent = 'A1';
}

export function selectAll() {
    const rows = document.querySelectorAll('.data-grid-row').length; 
    const cols = headers.length;
    
    if (rows > 0 && cols > 0) {
        currentRange = {
            startRow: -1, // Headers से शुरू
            startCol: 0,
            endRow: rows - 1, // आखिरी data row तक
            endCol: cols - 1,
            includesHeaders: true
        };
        updateVisualSelection();
    }
}

// ========================== GOOGLE SHEETS TABLE DISPLAY ==========================
export function displayGoogleSheetsTable() {
    injectGoogleSheetsStyles();
    
    const container = document.getElementById('dataTableContainer');
    if (!container) {
        console.error('dataTableContainer not found');
        return;
    }
    
    container.innerHTML = ''; // पुराना डेटा साफ़ करें
    
    // डेटा चेक
    if (!headers || !headers.length || !filteredData || !filteredData.length) {
        container.innerHTML = '<div class="no-data">कोई डेटा उपलब्ध नहीं है | No data available</div>';
        const pageInfoElement = document.getElementById('dataPageInfo');
        if (pageInfoElement) pageInfoElement.textContent = 'Page 0/0';
        return;
    }
    
    console.log('Displaying table with:', headers.length, 'columns and', filteredData.length, 'rows');
    
    // Pagination Logic
    const totalRows = filteredData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // मुख्य कंटेनर बनाएं
    const mainContainer = document.createElement('div');
    mainContainer.className = 'data-table-container';
    
    // हेडर सेक्शन
    const headerSection = document.createElement('div');
    mainContainer.appendChild(headerSection);
    
    // कंट्रोल्स सेक्शन
    const controlsSection = document.createElement('div');
    controlsSection.className = 'data-controls';
    controlsSection.innerHTML = `
        <div class="selection-info">
            सेलेक्टेड: <span class="selection-range" id="selectionInfo">A1</span>
        </div>
        <div class="data-buttons">
            <button class="data-btn btn-clear" id="clearSelectionBtn">क्लियर</button>
            <button class="data-btn btn-select-all" id="selectAllBtn">सभी सेलेक्ट</button>
        </div>
    `;
    mainContainer.appendChild(controlsSection);
    
    // टेबल रैपर
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'table-wrapper';
    
    // कॉलम हेडर (A, B, C...)
    const columnHeaders = document.createElement('div');
    columnHeaders.className = 'column-headers';
    
    // कॉर्नर सेल
    const corner = document.createElement('div');
    corner.className = 'corner';
    columnHeaders.appendChild(corner);
    
    // कॉलम हेडर (A, B, C...)
    headers.forEach((_, index) => {
        const columnHeader = document.createElement('div');
        columnHeader.className = 'column-header';
        columnHeader.textContent = numberToColumnLabel(index);
        columnHeaders.appendChild(columnHeader);
    });
    
    tableWrapper.appendChild(columnHeaders);
    
    // एक्चुअल कॉलम नेम्स (हेडर वैल्यूज) - NOW SELECTABLE
    const actualColumnHeaders = document.createElement('div');
    actualColumnHeaders.className = 'actual-column-headers';
    
    // एक्चुअल कॉलम कॉर्नर
    const actualCorner = document.createElement('div');
    actualCorner.className = 'actual-column-corner';
    actualCorner.textContent = '#';
    actualColumnHeaders.appendChild(actualCorner);
    
    // एक्चुअल कॉलम हेडर - NOW WITH SELECTION SUPPORT
    headers.forEach((header, index) => {
        const actualColumnHeader = document.createElement('div');
        actualColumnHeader.className = 'actual-column-header';
        actualColumnHeader.textContent = header;
        actualColumnHeader.title = header;
        actualColumnHeader.dataset.col = index; // Selection के लिए जरूरी
        actualColumnHeaders.appendChild(actualColumnHeader);
    });
    
    tableWrapper.appendChild(actualColumnHeaders);
    
    // डेटा ग्रिड
    const gridContainer = document.createElement('div');
    gridContainer.id = 'dataGridContainer';
    
    // डेटा रोज़
    if (pageData.length > 0) {
        pageData.forEach((row, rowIndex) => {
            const gridRow = document.createElement('div');
            gridRow.className = 'data-grid-row';
            
            // रो हेडर
            const rowHeader = document.createElement('div');
            rowHeader.className = 'row-header';
            // Display 1-indexed row number, relative to total data
            rowHeader.textContent = startIndex + rowIndex + 1; 
            gridRow.appendChild(rowHeader);
            
            // डेटा सेल
            headers.forEach((header, colIndex) => {
                const cell = document.createElement('div');
                cell.className = 'data-cell';
                cell.dataset.row = rowIndex; // Page-relative row index
                cell.dataset.col = colIndex;
                cell.dataset.address = `${numberToColumnLabel(colIndex)}${startIndex + rowIndex + 1}`;
                
                // डेटा डिस्प्ले
                const cellValue = row[header];
                cell.textContent = cellValue !== undefined && cellValue !== null ? String(cellValue) : '';
                cell.title = cell.textContent;
                
                gridRow.appendChild(cell);
            });
            
            gridContainer.appendChild(gridRow);
        });
    }
    
    tableWrapper.appendChild(gridContainer);
    mainContainer.appendChild(tableWrapper);
    
    // पेजिनेशन कंट्रोल्स
    const paginationSection = document.createElement('div');
    paginationSection.className = 'pagination-controls';
    paginationSection.innerHTML = `
        <div class="page-info">पेज ${currentPage}/${totalPages} (${startIndex + 1}-${endIndex} of ${totalRows} rows)</div>
        <div class="pagination-buttons">
            <button class="page-btn" id="prevPageBtn" ${currentPage === 1 ? 'disabled' : ''}>पिछला</button>
            <button class="page-btn" id="nextPageBtn" ${currentPage === totalPages ? 'disabled' : ''}>अगला</button>
        </div>
    `;
    mainContainer.appendChild(paginationSection);
    
    container.appendChild(mainContainer);
    
    // सेलेक्शन बॉर्डर बनाएं और इवेंट लिसनर्स सेटअप करें
    createSelectionBorder(tableWrapper);
    setupEventListeners(tableWrapper);
    
    // बटन इवेंट लिसनर्स
    document.getElementById('clearSelectionBtn')?.addEventListener('click', clearSelection);
    document.getElementById('selectAllBtn')?.addEventListener('click', selectAll);
    document.getElementById('prevPageBtn')?.addEventListener('click', () => changePage(-1));
    document.getElementById('nextPageBtn')?.addEventListener('click', () => changePage(1));
    
    // डिफॉल्ट सेलेक्शन
    setTimeout(() => {
        if (pageData.length > 0) {
            setActiveCell(0, 0);
        }
    }, 100);
    
    console.log('Table displayed successfully with selectable headers');
}

// ग्लोबल फंक्शन्स (विंडो पर अटैच करें)
window.clearSelection = clearSelection;
window.selectAll = selectAll;
window.changePage = changePage;