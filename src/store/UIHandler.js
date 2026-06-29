// UIHandler.js (UI/Controls Management)

import { showMessage } from '../js/utils.js';
import { displayGoogleSheetsTable, setActiveCell, clearSelection, selectAll } from '../js/dataTebledisplay.js';
import { 
    populateMultiSelectOptions, 
    createSortRuleElement,
} from '../js/filter.js';
import { 
    filteredData, 
    rawData, 
    headers, 
    currentPage, 
    rowsPerPage, 
    isFilterActive, 
    getDisplayData,
    getHeaders,
    applyFiltersAndSort,
    resetFiltersAndShowAllData
} from './DataHandler.js'; 
import { generateSummary } from '../js/chat.js';

// Global UI State
let multiSelectHandler = null;
let sortRuleHandlers = [];

// ========================== TABLE DISPLAY & PAGINATION UI ==========================

export async function updateTableAndUI() {
    // Calls the external table display function with paginated data
    const data = getDisplayData();
    const headersArray = getHeaders();
    const paginatedData = paginate(data, rowsPerPage, currentPage);
    
    // Assumes displayGoogleSheetsTable handles loading the Handsontable instance
    await displayGoogleSheetsTable(paginatedData, headersArray);
}

export function paginate(data, pageSize, pageNum) {
    const start = (pageNum - 1) * pageSize;
    return data.slice(start, start + pageSize);
}

export function updatePaginationAndFilterUI() {
    const data = getDisplayData();
    const totalPages = Math.ceil(data.length / rowsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${data.length} rows)`;
    }
    
    // Previous/Next buttons enable/disable
    const prevBtn = document.querySelector('.pagination .page-item:first-child');
    const nextBtn = document.querySelector('.pagination .page-item:last-child');
    
    if (prevBtn) {
        prevBtn.classList.toggle('disabled', currentPage === 1);
    }
    if (nextBtn) {
        nextBtn.classList.toggle('disabled', currentPage === totalPages);
    }

    // Filter status indicator
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        if (isFilterActive) {
            filterStatus.innerHTML = `<span class="badge bg-warning">Filters Active (${data.length}/${rawData.length} rows)</span>`;
        } else {
            filterStatus.innerHTML = `<span class="badge bg-success">All Data (${rawData.length} rows)</span>`;
        }
    }
}

// ========================== CONTROLS & FORMS ==========================

export function updateControls(headers) {
    try {
        // 1. Populate Dropdowns (Selects)
        const selects = [
            'dataColsSelect', 'filterCol', 'multiSelectFilterCol', 
            'filterNumericCol', 'groupByCols', 'statsCol', 
            'xAxisColSelect', 'yAxisColSelect'
        ].map(id => document.getElementById(id)).filter(Boolean);

        selects.forEach(select => {
            select.innerHTML = '';
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'कॉलम चुनें';
            select.appendChild(defaultOption);
        });

        if (headers.length > 0) {
            headers.forEach(header => {
                selects.forEach(select => {
                    const option = document.createElement('option');
                    option.value = header;
                    option.textContent = header;
                    select.appendChild(option.cloneNode(true));
                });
            });

            // Select all columns by default in dataColsSelect
            const dataColsSelect = document.getElementById('dataColsSelect');
            if (dataColsSelect) {
                Array.from(dataColsSelect.options).forEach(option => {
                    if (option.value) option.selected = true;
                });
            }
        }

        // 2. Initialize dynamic UI elements
        initializeSortRules(headers);
        initializeMultiSelectFilter();
        populateAddDataForm(headers);
        
        // 3. Ensure custom reset button is attached
        initializeCustomResetButton();

        // 4. Final UI update
        updatePaginationAndFilterUI();
        
    } catch (error) {
        console.error("Error populating controls:", error);
        showMessage("Controls populate करने मे error: " + error.message, "danger");
    }
}

// Reset button event handler: Calls DataHandler function
const resetFilterHandler = () => {
    console.log('Reset button clicked - calling resetFiltersAndShowAllData');
    resetFiltersAndShowAllData(); // Call function from DataHandler
};

function initializeCustomResetButton() {
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
        // Remove old listener
        resetBtn.removeEventListener('click', resetFilterHandler);
        
        // Add new listener
        resetBtn.addEventListener('click', resetFilterHandler);
        console.log('Reset button event listener attached successfully.');
    }
}

function initializeSortRules(headers) {
    const sortContainer = document.getElementById('sortRulesContainer');
    if (sortContainer) {
        sortContainer.innerHTML = '';
        const defaultRule = createSortRuleElement(headers);
        sortContainer.appendChild(defaultRule);
        
        // Cleanup existing handlers (optional, but good practice)
        sortRuleHandlers = []; 
    }

    const addSortBtn = document.getElementById('addSortRuleBtn');
    if (addSortBtn) {
        // Reattach fresh listener
        addSortBtn.replaceWith(addSortBtn.cloneNode(true));
        const newAddSortBtn = document.getElementById('addSortRuleBtn');
        newAddSortBtn.addEventListener('click', () => handleAddSortRule(headers));
    }
}

function initializeMultiSelectFilter() {
    const multiSelect = document.getElementById('multiSelectFilterCol');
    if (multiSelect) {
        // Reattach fresh listener
        multiSelect.replaceWith(multiSelect.cloneNode(true));
        const newMultiSelect = document.getElementById('multiSelectFilterCol');
        newMultiSelect.addEventListener('change', handleMultiSelectChange);
    }
}

function handleMultiSelectChange(e) { 
    // Uses rawData from DataHandler
    populateMultiSelectOptions(e.target.value, rawData); 
}

function handleAddSortRule(headers) { 
    const sortContainer = document.getElementById('sortRulesContainer');
    if (sortContainer) {
        const newRule = createSortRuleElement(headers);
        sortContainer.appendChild(newRule);
    }
}

export function populateAddDataForm(headers) {
    const formDiv = document.getElementById('addDataForm');
    if (!formDiv) return;
    
    formDiv.innerHTML = '';
    
    if (!headers.length) {
        formDiv.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                Kripya pehle file upload करें या data add करें.
            </div>
        `;
        return;
    }

    headers.forEach(header => {
        const div = document.createElement('div');
        div.className = 'mb-3';
        div.innerHTML = `
            <label for="input-${header}" class="form-label">${header}</label>
            <input type="text" class="form-control" id="input-${header}" 
                   data-col="${header}" placeholder="${header} दर्ज करें">
        `;
        formDiv.appendChild(div);
    });
}

export function clearAddDataForm() {
    document.querySelectorAll('#addDataForm input').forEach(input => input.value = '');
}

// ========================== STATS & SUMMARY ==========================

export function displayStats() {
    const colSelect = document.getElementById('statsCol');
    const statsDiv = document.getElementById('statsOutput');
    
    if (!statsDiv) return;

    const col = colSelect?.value;
    const data = getDisplayData();

    if (!col || !data.length) { 
        statsDiv.innerHTML = '<p class="text-muted">सांख्यिकी के लिए column चुनें.</p>'; 
        return; 
    }

    try {
        const values = data.map(r => r[col]).filter(v => v != null);
        const numericValues = values.map(Number).filter(v => !isNaN(v));
        
        let html = `<h5>${col} के लिए सांख्यिकी:</h5>`;
        
        if (numericValues.length) {
            // ... (Stats calculation logic - same as original)
            const sum = numericValues.reduce((a, b) => a + b, 0);
            const avg = sum / numericValues.length;
            const sorted = [...numericValues].sort((a, b) => a - b);
            const median = sorted.length % 2 === 0 ? 
                (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2 : 
                sorted[Math.floor(sorted.length/2)];
            
            const squaredDiffs = numericValues.map(value => Math.pow(value - avg, 2));
            const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numericValues.length;
            const stdDev = Math.sqrt(variance);
            
            html += `
                <div class="stats-grid">
                    <div class="stat-item">
                        <strong>औसत:</strong> ${avg.toFixed(2)}
                    </div>
                    <div class="stat-item">
                        <strong>मीडियन:</strong> ${median.toFixed(2)}
                    </div>
                    <div class="stat-item">
                        <strong>न्यूनतम:</strong> ${Math.min(...numericValues)}
                    </div>
                    <div class="stat-item">
                        <strong>अधिकतम:</strong> ${Math.max(...numericValues)}
                    </div>
                    <div class="stat-item">
                        <strong>योग:</strong> ${sum.toFixed(2)}
                    </div>
                    <div class="stat-item">
                        <strong>गणना:</strong> ${numericValues.length}
                    </div>
                    <div class="stat-item">
                        <strong>Standard Deviation:</strong> ${stdDev.toFixed(2)}
                    </div>
                </div>
            `;
        } else {
            html += `<p>इस column में कोई numeric data नहीं.</p>`;
        }

        const uniqueValues = [...new Set(values)];
        html += `
            <div class="mt-3">
                <strong>अद्वितीय मान:</strong> 
                <div class="unique-values">
                    ${uniqueValues.slice(0, 10).join(', ')} 
                    ${uniqueValues.length > 10 ? `... (${uniqueValues.length} कुल)` : ''}
                </div>
            </div>
        `;
        
        statsDiv.innerHTML = html;
    } catch (error) {
        console.error("Error calculating stats:", error);
        statsDiv.innerHTML = `<p class="text-danger">Stats calculate करने मे error: ${error.message}</p>`;
    }
}

export function clearSummary() {
    const summaryOutput = document.getElementById('summaryOutput');
    if (summaryOutput) {
        summaryOutput.style.display = 'none';
        summaryOutput.innerHTML = '';
    }
}

// ========================== EVENT HANDLERS (for UI Logic) ==========================

document.addEventListener('DOMContentLoaded', function() {
    // Attach event listeners for UI controls which don't cause data change (e.g., stats)
    const statsCol = document.getElementById('statsCol');
    if (statsCol) {
        statsCol.addEventListener('change', displayStats);
    }

    // Attach custom event listeners which rely on data
    initializeCustomResetButton();

    // Expose data table display functions globally for external use
    window.clearSelection = clearSelection;
    window.selectAll = selectAll;
});

// Expose Stats and Chart functions that rely on filteredData
window.displayStats = displayStats;
