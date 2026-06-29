// DataHandler.js (Core Data Management)

import { auth, db, showMessage } from '../js/utils.js';
import { plotAll, visualizations, chartGlobalSettings } from '../js/charts.js';
import { generateSummary } from '../js/chat.js';
import { 
    applyFiltersAndSort as applyFilters, 
    getCurrentFilterState,
    resetAllFilters as resetFilterUI // UI reset function
} from '../js/filter.js';

// UIHandler functions (for updating UI after data change)
import { 
    updateControls, 
    updateTableAndUI, 
    updatePaginationAndFilterUI, 
    clearAddDataForm, 
    clearSummary 
} from './UIHandler.js'; 

// Configuration constants
const CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_ROWS: 10000,
    DEBOUNCE_DELAY: 300,
    ROWS_PER_PAGE_OPTIONS: [10, 25, 50, 100],
    AUTO_SAVE_DELAY: 2000,
    BATCH_OPERATION_DELAY: 50
};

const SUPPORTED_FILE_TYPES = {
    CSV: ['csv'],
    EXCEL: ['xlsx', 'xls']
};

// Global State Variables
export let rawData = [];
export let filteredData = [];
export let savedFilteredData = [];
export let headers = [];
export const rowsPerPage = 10;
export let currentPage = 1;
export let currentDataForChat = [];
export let currentFilterState = null;

let currentUserId = null;
let searchTimeout = null;
let autoSaveTimeout = null;
let isDataModified = false;
export let isFilterActive = false;

// Operation flags to prevent concurrent executions (Concurrency Mutex)
let isOperationInProgress = false;
let pendingOperation = null; // 'applyFilters' या 'resetFilters'
let isResetting = false; // Flag to prevent infinite loop during reset

// ========================== CONFIGURATION & STATE ==========================

export function setCurrentUserId(userId) {
    currentUserId = userId;
}

export function getDisplayData() {
    return filteredData;
}

export function getRawData() {
    return rawData;
}

export function getHeaders() {
    return headers;
}

// ========================== NO DATA POPUP HANDLER ==========================

function showNoDataPopup() {
    // Check if we are on index.html page
    const isIndexPage = window.location.pathname.endsWith('index.html') || 
                       window.location.pathname.endsWith('/') ||
                       window.location.pathname === '';
    
    if (!isIndexPage) {
        console.log('No data popup skipped - not on index page');
        return;
    }

    // Create popup modal if it doesn't exist
    let noDataModal = document.getElementById('noDataModal');
    
    if (!noDataModal) {
        noDataModal = document.createElement('div');
        noDataModal.id = 'noDataModal';
        noDataModal.className = 'modal fade';
        noDataModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title">कोई डेटा नहीं मिला</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="mb-3">
                            <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                        </div>
                        <p class="mb-3">आपके पास अभी कोई डेटा उपलब्ध नहीं है। कृपया नया डेटा अपलोड करें या डेटा एडिट पेज पर जाएं।</p>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-primary" id="uploadDataBtn">
                            <i class="bi bi-upload me-2"></i>फ़ाइल अपलोड करें
                        </button>
                        <button type="button" class="btn btn-outline-primary" id="goToEditPageBtn">
                            <i class="bi bi-pencil-square me-2"></i>डेटा एडिट करें
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(noDataModal);
        
        // Add event listeners
        const modalInstance = new bootstrap.Modal(noDataModal);
        
        document.getElementById('uploadDataBtn').addEventListener('click', function() {
            modalInstance.hide();
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('goToEditPageBtn').addEventListener('click', function() {
            modalInstance.hide();
            window.location.href = 'edit_data.html';
        });
    }
    
    const modalInstance = new bootstrap.Modal(noDataModal);
    modalInstance.show();
}

function checkAndShowNoDataPopup() {
    // Check if we are on index.html page
    const isIndexPage = window.location.pathname.endsWith('index.html') || 
                       window.location.pathname.endsWith('/') ||
                       window.location.pathname === '';
    
    if (!isIndexPage) {
        console.log('No data check skipped - not on index page');
        return false;
    }

    if (rawData.length === 0) {
        // Show popup after a small delay to ensure UI is loaded
        setTimeout(() => {
            showNoDataPopup();
        }, 500);
        return true;
    }
    return false;
}

// ========================== INIT DATA ==========================

export async function initData() {
    try {
        // Reset all data states
        rawData = [];
        filteredData = [];
        savedFilteredData = [];
        headers = [];
        currentDataForChat = [];
        currentFilterState = null;
        isDataModified = false;
        isFilterActive = false; 
        isOperationInProgress = false;
        pendingOperation = null;
        isResetting = false;

        showLoadingState();

        if (!currentUserId) {
            console.log("No user logged in. Data will not be loaded from Firebase.");
            // UI Handler will take care of populating controls and table display
            updateControls(headers);
            updateTableAndUI();
            
            // Check if no data and show popup (only on index.html)
            if (checkAndShowNoDataPopup()) {
                return;
            }
        }

        await loadUserDataFromFirebase();
        
        if (isFilterActive && savedFilteredData.length > 0) {
            filteredData = [...savedFilteredData];
            showMessage("सहेजे गए फ़िल्टर बहाल किए गए! अब फ़िल्टर्ड डेटा दिख रहा है।", "info");
        } else {
            filteredData = [...rawData];
            savedFilteredData = [...rawData];
            isFilterActive = false; 
        }
        
        currentDataForChat = [...filteredData];

        // UI Handler call to update controls, forms, and table
        updateControls(headers);
        await updateTableAndUI();

        // Check if no data and show popup (only on index.html)
        if (checkAndShowNoDataPopup()) {
            return;
        }

        if (filteredData.length > 0) {
            generateSummary(filteredData);
        }

        document.dispatchEvent(new CustomEvent('dataLoaded', {
            detail: { 
                rowCount: rawData.length, 
                filteredRowCount: filteredData.length,
                headers: headers,
                isFilterActive: isFilterActive
            }
        }));
        
    } catch (error) {
        console.error("Error initializing data:", error);
        showErrorState("Data initialize करने मे error आया: " + error.message);
        
        // Check if no data and show popup even in case of error (only on index.html)
        checkAndShowNoDataPopup();
    }
}

function showLoadingState() {
    const visualizationsDiv = document.getElementById('visualizations');
    const tableContainer = document.getElementById('tableContainer');
    
    const loadingHTML = `
        <div class="loading-spinner text-center p-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted">Data load हो रहा है...</p>
        </div>
    `;
    
    if (visualizationsDiv) visualizationsDiv.innerHTML = loadingHTML;
    if (tableContainer) tableContainer.innerHTML = loadingHTML;
}

function showErrorState(message) {
    const visualizationsDiv = document.getElementById('visualizations');
    const tableContainer = document.getElementById('tableContainer');
    
    const errorHTML = `
        <div class="error-state text-danger text-center p-4">
            <i class="bi bi-exclamation-triangle fs-1"></i>
            <p class="mt-2">${message}</p>
            <button class="btn btn-sm btn-outline-danger mt-2" onclick="initData()">
                फिर try करें
            </button>
        </div>
    `;
    
    if (visualizationsDiv) visualizationsDiv.innerHTML = errorHTML;
    if (tableContainer) tableContainer.innerHTML = errorHTML;
}

// ========================== DASHBOARD SETTINGS (Kept for Firebase Logic) ==========================

export async function saveDashboardSettings() {
    if (!currentUserId) {
        showMessage("User ID not set", "warning");
        return false;
    }

    try {
        const settings = {
            visualizations: [...visualizations],
            chartGlobalSettings: { ...chartGlobalSettings },
            backgroundTemplateIndex: localStorage.getItem('selectedBackgroundTemplateIndex') || null,
            lastSaved: new Date().toISOString(),
            currentFilterState: currentFilterState, 
            isFilterActive: isFilterActive
        };
        
        await db.collection('users').doc(currentUserId).set({
            dashboardSettings: settings
        }, { merge: true });
        
        console.log("Dashboard settings saved successfully!");
        return true;
    } catch (error) {
        console.error("Error saving dashboard settings:", error);
        showMessage("Dashboard settings save करने मे error: " + error.message, "danger");
        return false;
    }
}

export async function loadDashboardSettings() {
    if (!currentUserId) {
        showMessage("User ID not set", "warning");
        return false;
    }

    try {
        const doc = await db.collection('users').doc(currentUserId).get();
        if (doc.exists) {
            const userData = doc.data();
            const settings = userData.dashboardSettings;
            
            if (settings) {
                visualizations.length = 0;
                if (settings.visualizations) {
                    settings.visualizations.forEach(v => visualizations.push(v));
                }
                if (settings.chartGlobalSettings) {
                    Object.assign(chartGlobalSettings, settings.chartGlobalSettings);
                }
                if (settings.backgroundTemplateIndex) {
                    localStorage.setItem('selectedBackgroundTemplateIndex', settings.backgroundTemplateIndex);
                }
                console.log("Dashboard settings loaded successfully!");
                return true;
            }
        }
        console.log("No saved dashboard settings found.");
        return false;
    } catch (error) {
        console.error("Error loading dashboard settings:", error);
        showMessage("Dashboard settings load error: " + error.message, "danger");
        return false;
    }
}

// ========================== DATA VALIDATION & FIREBASE ==========================

function validateData(data) {
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }
    
    const validatedData = data.filter((row, index) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
        
        const hasValidData = Object.values(row).some(val => 
            val !== null && val !== undefined && String(val).trim() !== ''
        );
        
        if (!hasValidData) console.warn(`Empty row at index ${index}`);
        
        return hasValidData;
    });
    
    console.log(`Validated data: ${validatedData.length} valid rows out of ${data.length}`);
    return validatedData;
}

function validateHeaders(headersArray) {
    if (!Array.isArray(headersArray)) {
        throw new Error("Headers must be an array");
    }
    
    const validHeaders = headersArray.filter(h => 
        h && typeof h === 'string' && h.trim() !== ''
    ).map(h => h.trim());
    
    if (validHeaders.length === 0) {
        throw new Error("No valid headers found");
    }
    
    const uniqueHeaders = [...new Set(validHeaders)];
    if (uniqueHeaders.length !== validHeaders.length) {
        console.warn("Duplicate headers found and removed");
        return uniqueHeaders;
    }
    
    return validHeaders;
}

export async function saveUserDataToFirebase(dataToSave, headersToSave, saveFilteredData = false) {
    if (!currentUserId) {
        showMessage("No user logged in", "warning");
        return false;
    }

    try {
        let validatedData = validateData(dataToSave);
        const validatedHeaders = validateHeaders(headersToSave);

        const dataSize = JSON.stringify(validatedData).length;
        if (dataSize > 900000) {
            throw new Error(`Data too large: ${(dataSize / 1024 / 1024).toFixed(2)}MB. Maximum 1MB allowed.`);
        }

        if (validatedData.length > CONFIG.MAX_ROWS) {
            showMessage(`Large dataset detected. Keeping only latest ${CONFIG.MAX_ROWS} records for performance.`, "warning");
            validatedData = validatedData.slice(-CONFIG.MAX_ROWS);
        }

        const userData = {
            data: validatedData,
            headers: validatedHeaders,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            dataSize: dataSize,
            rowCount: validatedData.length
        };

        if (saveFilteredData && isFilterActive) {
            userData.filteredData = filteredData || [];
            userData.filterState = currentFilterState;
            userData.isFilterActive = true;
            userData.filteredDataSavedAt = new Date().toISOString();
        } else {
            userData.isFilterActive = false;
            userData.filterState = null;
        }
        
        await db.collection('users').doc(currentUserId).set(userData, { merge: true });
        
        console.log("User data saved successfully!");
        isDataModified = false;
        return true;
    } catch (error) {
        console.error("Error saving user data:", error);
        showMessage(`Data save error: ${error.message}`, "danger");
        return false;
    }
}

async function loadUserDataFromFirebase() {
    if (!currentUserId) {
        showMessage("No user logged in", "warning");
        return;
    }
    
    showMessage("Cloud से data load हो रहा है...", "info");

    try {
        const doc = await db.collection('users').doc(currentUserId).get();
        if (doc.exists) {
            const userData = doc.data();
            rawData = userData.data || [];
            headers = userData.headers || [];
            
            isFilterActive = userData.isFilterActive || false;
            currentFilterState = userData.filterState || null;

            if (isFilterActive && userData.filteredData && Array.isArray(userData.filteredData)) {
                savedFilteredData = userData.filteredData;
            } else {
                savedFilteredData = [...rawData];
            }
            
            showMessage(`Firebase से data successfully load किया! (${rawData.length} raw, ${savedFilteredData.length} saved filtered)`, "success");
            
            document.dispatchEvent(new CustomEvent('dataLoadedFromFirebase', {
                detail: {
                    rowCount: rawData.length,
                    filteredRowCount: savedFilteredData.length,
                    headers: headers,
                    lastUpdated: userData.lastUpdated,
                    isFilterActive: isFilterActive
                }
            }));
        } else {
            rawData = [];
            filteredData = [];
            savedFilteredData = [];
            headers = [];
            showMessage("आपके लिए कोई data नहीं मिला.", "info");
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        showMessage("Firebase से data load error: " + error.message, "danger");
        throw error;
    }
}

// ========================== AUTO-SAVE FUNCTIONALITY ==========================

function scheduleAutoSave() {
    if (!currentUserId) return;
    
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
        if (isDataModified) {
            await saveUserDataToFirebase(rawData, headers, true); 
            showMessage("Auto-save successful!", "success");
        }
    }, CONFIG.AUTO_SAVE_DELAY);
}

export function markDataAsModified() {
    isDataModified = true;
    scheduleAutoSave();
}

// ========================== FILE UPLOAD ==========================

export async function handleFile(e) {
    if (!currentUserId) {
        showMessage("Kripya login करें", "warning");
        return false;
    }

    const file = e.target.files[0];
    if (!file) return false;

    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showMessage(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum 10MB allowed.`, "danger");
        e.target.value = '';
        return false;
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isSupported = Object.values(SUPPORTED_FILE_TYPES).some(types => 
        types.includes(fileExtension)
    );
    
    if (!isSupported) {
        showMessage("Supported file formats: CSV, Excel (.xlsx, .xls)", "danger");
        e.target.value = '';
        return false;
    }

    const reader = new FileReader();
    
    return new Promise((resolve) => {
        reader.onload = async (evt) => {
            let data;
            try {
                if (file.name.endsWith('.csv')) {
                    data = Papa.parse(evt.target.result, { 
                        header: true, 
                        skipEmptyLines: true,
                        transform: (value) => value.trim(),
                        transformHeader: (header) => header.trim()
                    }).data;
                } else {
                    const wb = XLSX.read(evt.target.result, { type: 'binary' });
                    let sheetData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
                        defval: '',
                        raw: false,
                        header: 1
                    });
                    
                    if (sheetData.length > 0) {
                        const headers = sheetData[0];
                        data = sheetData.slice(1).map(row => {
                            const obj = {};
                            headers.forEach((header, index) => {
                                obj[header] = row[index] || '';
                            });
                            return obj;
                        });
                    }
                }
                
                data = validateData(data);
                
            } catch (parseError) {
                console.error("File parse error:", parseError);
                showMessage("File parse error. CSV या Excel file check करें.", "danger");
                resolve(false);
                return;
            }

            if (data && data.length > 0) {
                try {
                    // Clear existing visualizations and filters
                    visualizations.length = 0;
                    isFilterActive = false;
                    currentFilterState = null;
                    await saveDashboardSettings();
                    
                    const headersFromData = Object.keys(data[0]);
                    await saveUserDataToFirebase(data, headersFromData, false); 
                    await initData();
                    
                    e.target.value = '';
                    showMessage(`File successfully upload हुआ! ${data.length} rows loaded.`, "success");
                    resolve(true);
                } catch (saveError) {
                    console.error("Error saving uploaded data:", saveError);
                    showMessage("Data save करने मे error: " + saveError.message, "danger");
                    resolve(false);
                }
            } else {
                showMessage("File खाली है या data parse नहीं हुआ.", "warning");
                resolve(false);
            }
        };
        
        reader.onerror = () => {
            showMessage("File read error", "danger");
            resolve(false);
        };

        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    });
}

// ========================== PAGINATION ==========================

export function paginate(data, pageSize, pageNum) {
    const start = (pageNum - 1) * pageSize;
    return data.slice(start, start + pageSize);
}

export function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    currentPage += direction;
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    updatePaginationAndFilterUI();
    updateTableAndUI();
}

export function goToPage(pageNum) {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    currentPage = Math.max(1, Math.min(pageNum, totalPages));
    updatePaginationAndFilterUI();
    updateTableAndUI();
}

// ========================== SEARCH & FILTER ==========================

export function searchTable() {
    const input = document.getElementById('searchInput');
    const term = input ? input.value.toLowerCase().trim() : '';
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        performSearch(term);
    }, CONFIG.DEBOUNCE_DELAY);
}

function performSearch(term) {
    if (isOperationInProgress) {
        console.log('Search operation skipped - another operation in progress');
        return;
    }

    isOperationInProgress = true;
    
    try {
        let dataToSearch = isFilterActive ? [...savedFilteredData] : [...rawData];
        
        if (!term) {
            filteredData = dataToSearch;
        } else {
            filteredData = dataToSearch.filter(row => 
                Object.values(row).some(value => 
                    String(value).toLowerCase().includes(term)
                )
            );
        }
        
        currentPage = 1;
        currentDataForChat = [...filteredData];

        const updateAll = () => {
            updatePaginationAndFilterUI();

            setTimeout(() => {
                updateTableAndUI();
                
                setTimeout(() => {
                    plotAll();
                    
                    setTimeout(() => {
                        clearSummary();
                        if (filteredData.length) {
                            generateSummary(filteredData);
                        }
                        
                        if (term) {
                            showMessage(`${filteredData.length} results found for "${term}"`, 'info');
                        }
                        
                        isOperationInProgress = false;
                        if (pendingOperation) {
                            const op = pendingOperation;
                            pendingOperation = null;
                            setTimeout(() => {
                                if (op === 'applyFilters') applyFiltersAndSort();
                                else if (op === 'resetFilters') resetFiltersAndShowAllData();
                            }, 100);
                        }
                    }, CONFIG.BATCH_OPERATION_DELAY);
                    
                }, CONFIG.BATCH_OPERATION_DELAY);
                
            }, CONFIG.BATCH_OPERATION_DELAY);
        }

        updateAll();
        
    } catch (error) {
        console.error("Error in performSearch:", error);
        isOperationInProgress = false;
        pendingOperation = null;
    }
}

export function applyFiltersAndSort() {
    if (isOperationInProgress) {
        console.log('Filter operation skipped - another operation in progress. Queued.');
        pendingOperation = 'applyFilters';
        return;
    }

    isOperationInProgress = true;
    
    try {
        currentFilterState = getCurrentFilterState();
        
        const hasActiveFilters = Object.values(currentFilterState || {}).some(state => 
            state && Object.values(state).some(val => 
                val && (Array.isArray(val) ? val.length > 0 : String(val).trim() !== '')
            )
        );
        
        if (hasActiveFilters) {
            filteredData = applyFilters(rawData, headers);
            isFilterActive = true;
            savedFilteredData = [...filteredData];
        } else {
            filteredData = [...rawData];
            isFilterActive = false;
            savedFilteredData = [...rawData];
            currentFilterState = null;
        }
        
        currentPage = 1;
        currentDataForChat = [...filteredData];
        
        const processNextOperation = () => {
            isOperationInProgress = false;
            
            if (pendingOperation) {
                const op = pendingOperation;
                pendingOperation = null;
                console.log(`Processing pending operation: ${op}`);
                setTimeout(() => {
                    if (op === 'applyFilters') applyFiltersAndSort();
                    else if (op === 'resetFilters') resetFiltersAndShowAllData();
                }, 100);
            }
        };

        updatePaginationAndFilterUI();

        setTimeout(() => {
            updateTableAndUI();

            setTimeout(() => {
                plotAll();
                
                setTimeout(() => {
                    clearSummary();
                    if (filteredData.length) {
                        generateSummary(filteredData);
                    }
                    
                    setTimeout(async () => {
                        try {
                            await saveUserDataToFirebase(rawData, headers, hasActiveFilters);
                        } catch (e) {
                            console.error("Firebase save failed after filter:", e);
                        }
                        
                        const activeFilters = Object.values(currentFilterState || {}).filter(state => 
                            state && Object.values(state).some(val => 
                                val && (Array.isArray(val) ? val.length > 0 : String(val).trim() !== '')
                            )
                        ).length;
                        
                        if (hasActiveFilters) {
                            showMessage(`Filter apply हुआ! ${filteredData.length} rows (${activeFilters} active filters)`, 'info');
                        } else {
                            showMessage(`All filters reset! Showing all ${rawData.length} rows`, 'success');
                        }

                        processNextOperation();
                        
                    }, CONFIG.BATCH_OPERATION_DELAY);
                    
                }, CONFIG.BATCH_OPERATION_DELAY);
                
            }, CONFIG.BATCH_OPERATION_DELAY);
            
        }, CONFIG.BATCH_OPERATION_DELAY);
        
    } catch (error) {
        console.error("Error applying filters:", error);
        showMessage("Filter apply करने मे error: " + error.message, "danger");
        isOperationInProgress = false;
        pendingOperation = null;
    }
}

export function resetFiltersAndShowAllData() {
    if (isOperationInProgress || isResetting) {
        if (!isResetting) {
             console.log('Reset operation skipped - another operation in progress. Queued.');
             pendingOperation = 'resetFilters';
        } else {
             console.log('Reset operation skipped - currently inside reset process.');
        }
        return;
    }

    isOperationInProgress = true;
    isResetting = true;

    console.log('Starting reset process...');
    
    try {
        resetFilterUI(headers);
        
        filteredData = [...rawData];
        isFilterActive = false; 
        currentFilterState = null;
        savedFilteredData = [...rawData]; 
        
        currentPage = 1;
        currentDataForChat = [...filteredData];
        
        const processNextOperation = () => {
            isOperationInProgress = false;
            isResetting = false; 
            
            if (pendingOperation) {
                const op = pendingOperation;
                pendingOperation = null;
                console.log(`Processing pending operation: ${op}`);
                setTimeout(() => {
                    if (op === 'applyFilters') applyFiltersAndSort();
                    else if (op === 'resetFilters') resetFiltersAndShowAllData();
                }, 100);
            }
            console.log('Reset process finished.');
        };

        updatePaginationAndFilterUI();

        setTimeout(() => {
            updateTableAndUI();
            
            setTimeout(() => {
                plotAll();
                
                setTimeout(async () => {
                    try {
                        await saveUserDataToFirebase(rawData, headers, false);
                    } catch (e) {
                        console.error("Firebase save failed after reset:", e);
                    }
                    
                    showMessage(`All filters reset! Showing all ${rawData.length} rows`, 'success');

                    processNextOperation();
                    
                }, CONFIG.BATCH_OPERATION_DELAY);
                
            }, CONFIG.BATCH_OPERATION_DELAY);
            
        }, CONFIG.BATCH_OPERATION_DELAY);
        
    } catch (error) {
        console.error("Error resetting filters:", error);
        showMessage("Filters reset करने मे error: " + error.message, "danger");
        isOperationInProgress = false;
        isResetting = false; 
        pendingOperation = null;
    }
}

// ========================== ADD/UPDATE DATA ==========================

export async function saveData() {
    if (!currentUserId) {
        showMessage("Kripya login करें", "warning");
        return false;
    }

    try {
        const newRow = {};
        let isEmpty = true;
        
        document.querySelectorAll('#addDataForm input').forEach(input => {
            const col = input.dataset.col;
            if (col) { 
                newRow[col] = input.value.trim();
                if (input.value.trim()) isEmpty = false;
            }
        });

        if (!isEmpty) {
            if (!headers.length) { 
                headers = Object.keys(newRow); 
            }
            
            rawData.push(newRow);
            
            // NEW: Automatically apply current filters to new data
            if (isFilterActive && currentFilterState) {
                const tempFiltered = applyFilters([newRow], headers);
                if (tempFiltered.length > 0) {
                    filteredData.push(newRow);
                    savedFilteredData.push(newRow);
                }
                // If new row doesn't match filter, it won't be added to filteredData
                // but will remain in rawData
            } else {
                filteredData.push(newRow);
                savedFilteredData.push(newRow);
            }
            
            markDataAsModified();
            const success = await saveUserDataToFirebase(rawData, headers, isFilterActive); 
            
            if (success) {
                // NEW: Instead of reapplying all filters, just update UI
                currentPage = 1;
                currentDataForChat = [...filteredData];
                
                updatePaginationAndFilterUI();
                updateTableAndUI();
                updateControls(headers);
                
                plotAll();
                clearSummary();
                if (filteredData.length) {
                    generateSummary(filteredData);
                }
                
                $('#addDataModal').modal('hide');
                clearAddDataForm();
                showMessage("नया data successfully जोड़ा!", "success");
                return true;
            }
        } else {
            showMessage("Kripya kam se kam ek value दर्ज करें.", "warning");
        }
        
        return false;
    } catch (error) {
        console.error("Error saving data:", error);
        showMessage("Data save करने मे error: " + error.message, "danger");
        return false;
    }
}

export async function updateDataFromHandsontable(hData, hHeaders) {
    if (!hData?.length) {
        showMessage("Handsontable से data empty", "warning");
        return false;
    }

    try {
        const newData = hData.map(row => 
            Object.fromEntries(hHeaders.map((h, i) => [h, row[i]]))
        );
        
        const success = updateDataAndUI(newData, hHeaders);
        if (success) {
            markDataAsModified();
            await saveUserDataToFirebase(rawData, headers, isFilterActive); 
            showMessage("Handsontable से data update और save हुआ!", "success");
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error updating data from Handsontable:", error);
        showMessage("Handsontable update error: " + error.message, "danger");
        return false;
    }
}

export function updateDataAndUI(newData, newHeaders = null) {
    try {
        const oldRawDataLength = rawData.length;
        rawData = validateData(newData);
        
        // NEW: Smart filter reapplication when raw data changes
        if (isFilterActive && currentFilterState) {
            // Reapply current filters to updated raw data
            filteredData = applyFilters(rawData, headers);
            savedFilteredData = [...filteredData];
            
            // Show message if filtered data changed due to raw data updates
            if (oldRawDataLength !== rawData.length) {
                showMessage(`Data updated! ${rawData.length} total rows, ${filteredData.length} match current filters`, "info");
            }
        } else {
            filteredData = [...rawData];
            savedFilteredData = [...rawData];
        }
        
        headers = newHeaders?.length ? validateHeaders(newHeaders) : Object.keys(rawData[0] || {});
        
        currentPage = 1;
        currentDataForChat = [...filteredData];

        updatePaginationAndFilterUI();
        updateTableAndUI();
        updateControls(headers);
        
        plotAll();
        clearSummary();
        if (filteredData.length) {
            generateSummary(filteredData);
        }
        
        return true;
    } catch (error) {
        console.error("Error updating data and UI:", error);
        showMessage("Data update error: " + error.message, "danger");
        return false;
    }
}

// ========================== MEMORY & CLEAR ==========================

export function cleanupData() {
    if (rawData.length > CONFIG.MAX_ROWS) {
        const originalLength = rawData.length;
        rawData = rawData.slice(-CONFIG.MAX_ROWS);
        
        // NEW: Reapply filters after cleanup
        if (isFilterActive && currentFilterState) {
            filteredData = applyFilters(rawData, headers);
            savedFilteredData = [...filteredData];
        } else {
            filteredData = [...rawData];
            savedFilteredData = [...rawData];
        }
        
        console.log(`Dataset optimized: ${originalLength} -> ${rawData.length} rows`);
        showMessage(`Large dataset optimized for performance. Keeping latest ${CONFIG.MAX_ROWS} records.`, "info");
        markDataAsModified();
    }
}

export function clearAllData() {
    if (confirm("क्या आप पक्का सारा data clear करना चाहते हैं? ये action undo नहीं हो सकता.")) {
        rawData = [];
        filteredData = [];
        savedFilteredData = [];
        headers = [];
        currentDataForChat = [];
        currentPage = 1;
        isFilterActive = false;
        currentFilterState = null;
        
        updateTableAndUI();
        updateControls(headers);
        updatePaginationAndFilterUI();
        clearSummary();
        plotAll();
        
        if (currentUserId) {
            saveUserDataToFirebase([], [], false); 
        }
        
        showMessage("सारा data clear हो गया!", "success");
        
        // Show no data popup after clearing (only on index.html)
        checkAndShowNoDataPopup();
    }
}

// ========================== EXPORT DATA ==========================

export function exportToCSV() {
    if (!filteredData.length) {
        showMessage("Export करने के लिए कोई data नहीं है", "warning");
        
        // Show no data popup if trying to export when no data (only on index.html)
        checkAndShowNoDataPopup();
        return;
    }

    try {
        const csv = Papa.unparse({
            fields: headers,
            data: filteredData.map(row => headers.map(header => row[header]))
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `data_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage("CSV export successfully!", "success");
    } catch (error) {
        console.error("Export error:", error);
        showMessage("Export करने मे error: " + error.message, "danger");
    }
}

// ========================== EVENT HANDLERS (for Data Logic) ==========================

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('filtersReset', function(e) {
        console.log('Event received: filtersReset');
        if (!isResetting) { 
             resetFiltersAndShowAllData();
        } else {
             console.log('filtersReset received, but ignoring to prevent infinite loop.');
        }
    });
});

// ========================== UTILITY FUNCTIONS ==========================

export function getDataStats() {
    return {
        totalRows: rawData.length,
        filteredRows: filteredData.length,
        headers: headers.length,
        currentPage: currentPage,
        totalPages: Math.ceil(filteredData.length / rowsPerPage),
        isModified: isDataModified,
        isFilterActive: isFilterActive,
        filterState: currentFilterState
    };
}

export function refreshData() {
    // NEW: Smart refresh that preserves filters
    if (isFilterActive && currentFilterState) {
        // Reapply current filters to current raw data
        filteredData = applyFilters(rawData, headers);
        savedFilteredData = [...filteredData];
        showMessage(`Filters reapplied! ${filteredData.length} rows match current filters`, "info");
    } else {
        // No active filters, just show all data
        filteredData = [...rawData];
        savedFilteredData = [...rawData];
    }
    
    currentPage = 1;
    currentDataForChat = [...filteredData];
    
    updatePaginationAndFilterUI();
    updateTableAndUI();
    plotAll();
    clearSummary();
    if (filteredData.length) {
        generateSummary(filteredData);
    }
}

export function areFiltersActive() {
    return isFilterActive;
}

window.changePage = changePage;