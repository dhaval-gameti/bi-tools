// js/charts.js
import { showMessage } from './utils.js';
import { filteredData, headers, saveDashboardSettings } from '../store/DataHandler.js';
import { initializeDragAndResize } from './drag_drop.js';
import { getAiChartAdvice, attachToggleAiAdviceListeners } from './ai_advice.js';
import { allActiveChartInstances } from './main.js';

//=========================================chart folder की file import करना
//=========================================
import { commonChartOptions, getRandomColor } from '../chart/uility.js';
import { getBarChartOption } from '../chart/bar.js';
import { getLineChartOption } from '../chart/line.js'
import { getPieChartOption } from '../chart/pie.js'
import { getScatterChartOption } from '../chart/scatter.js'
import { getFunnelChartOption } from '../chart/funneled.js'
import { getGaugeChartOption } from '../chart/gauge.js'
import { getRadarChartOption } from '../chart/radar.js'
import { getTreemapChartOption } from '../chart/tree_map.js'
import { getBar3DChartOption } from '../chart/bar3d.js'
import { getLine3DChartOption } from '../chart/line3d.js'

// Constants
const CHART_CONSTANTS = {
    DEFAULT_SIZE: { width: '600px', height: '400px' },
    DEFAULT_POSITION: { top: '20px', left: '20px' },
    ANIMATION_DURATION: 1000,
    DEBOUNCE_DELAY: 100,
    RESIZE_DEBOUNCE: 250,
    CACHE_LIMIT: 50
};

const ERROR_MESSAGES = {
    INVALID_CONFIG: 'अमान्य चार्ट कॉन्फ़िगरेशन',
    CONTAINER_NOT_FOUND: 'कंटेनर नहीं मिला',
    DATA_UNAVAILABLE: 'डेटा उपलब्ध नहीं',
    DASHBOARD_NOT_FOUND: 'डैशबोर्ड कंटेनर नहीं मिला'
};

// Global variables
export let visualizations = [];
let plotAllTimeout;
let resizeTimeout;
const dataCache = new Map();

// Global chart settings object
export let chartGlobalSettings = {
    gridShowHide: true,
    tooltipOnOff: true,
    zoomEnable: true,
    animationDuration: 1000,
    axisFormat: 'none',
    legendPosition: 'bottom',
    showLabels: true,
    colorPalette: ['#5470C6', '#91CC75', '#EE6666', '#FC8452', '#73C0DE', '#3BA272', '#FACC14', '#9A60B4', '#EA7CCC']
};

// City filter state
export let cityFilterState = {
    enabled: false,
    selectedCities: []
};

// Chart freeze state
export let chartFreezeState = new Map();

// Chart button permissions state
export let chartButtonPermissions = new Map();

// Utility Functions
const ChartUtils = {
    createContainerElement(chartConfig) {
        const container = document.createElement('div');
        container.id = `container-${chartConfig.id}`;
        container.className = 'visualization-container card p-3 mb-3 chart-item';
        container.style.cssText = `
            position: absolute;
            width: ${chartConfig.size?.width || CHART_CONSTANTS.DEFAULT_SIZE.width};
            height: ${chartConfig.size?.height || CHART_CONSTANTS.DEFAULT_SIZE.height};
            top: ${chartConfig.position?.top || CHART_CONSTANTS.DEFAULT_POSITION.top};
            left: ${chartConfig.position?.left || CHART_CONSTANTS.DEFAULT_POSITION.left};
            z-index: 100;
            cursor: grab;
        `;
        return container;
    },

    getFilteredData(data, chartConfig) {
        // If chart is frozen, return the frozen data
        if (chartFreezeState.has(chartConfig.id) && chartFreezeState.get(chartConfig.id).isFrozen) {
            return chartFreezeState.get(chartConfig.id).frozenData;
        }

        const cacheKey = JSON.stringify({
            columns: chartConfig.columns,
            filters: chartConfig.filters,
            cityFilter: cityFilterState
        });

        if (dataCache.has(cacheKey)) {
            return dataCache.get(cacheKey);
        }

        const filteredData = getFilteredDataByChart(data, chartConfig);
        dataCache.set(cacheKey, filteredData);
        
        // Cache cleanup
        if (dataCache.size > CHART_CONSTANTS.CACHE_LIMIT) {
            const firstKey = dataCache.keys().next().value;
            dataCache.delete(firstKey);
        }
        
        return filteredData;
    },

    validateChartConfig(chartConfig) {
        const required = ['id', 'type', 'columns'];
        return required.every(field => chartConfig[field]);
    },

    validateInput(xAxisCol, yAxisCols) {
        if (!xAxisCol || !yAxisCols || yAxisCols.length === 0) {
            showMessage("कृपया X-अक्ष कॉलम और Y-अक्ष कॉलम चुनें।", "warning");
            return false;
        }
        return true;
    }
};


/**
 * चार्ट बटन अनुमतियों को प्रबंधित करने के लिए पॉपअप दिखाता है
 */
function showChartButtonPermissionsPopup(chartId) {
    try {
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (!chartConfig) return;

        // Get current permissions or initialize default ones
        const currentPermissions = chartButtonPermissions.get(chartId) || {
            fullscreen: true,
            delete: true,
            download: true,
            aiAdvice: true,
            edit: true,
            filter: true,
            freeze: true
        };

        // Create popup HTML
        const popupHTML = `
            <div class="modal fade" id="chartPermissionsModal" tabindex="-1" aria-labelledby="chartPermissionsModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="chartPermissionsModalLabel">चार्ट बटन अनुमतियाँ</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p class="text-muted mb-3">उन बटनों को चुनें जो चार्ट कंटेनर पर दिखाई देंगे:</p>
                            
                            <div class="permissions-list">
                                <div class="form-check mb-2">
                                    <input class="form-check-input permission-checkbox" type="checkbox" value="fullscreen" id="perm-fullscreen" ${currentPermissions.fullscreen ? 'checked' : ''}>
                                    <label class="form-check-label" for="perm-fullscreen">
                                        <i class="bi bi-arrows-fullscreen me-2"></i>फुलस्क्रीन बटन
                                    </label>
                                </div>
                                
                                <div class="form-check mb-2">
                                    <input class="form-check-input permission-checkbox" type="checkbox" value="delete" id="perm-delete" ${currentPermissions.delete ? 'checked' : ''}>
                                    <label class="form-check-label" for="perm-delete">
                                        <i class="bi bi-trash me-2"></i>डिलीट बटन
                                    </label>
                                </div>
                                
                                <div class="form-check mb-2">
                                    <input class="form-check-input permission-checkbox" type="checkbox" value="download" id="perm-download" ${currentPermissions.download ? 'checked' : ''}>
                                    <label class="form-check-label" for="perm-download">
                                        <i class="bi bi-download me-2"></i>डाउनलोड बटन
                                    </label>
                                </div>
                                
                                <div class="form-check mb-2">
                                    <input class="form-check-input permission-checkbox" type="checkbox" value="aiAdvice" id="perm-aiAdvice" ${currentPermissions.aiAdvice ? 'checked' : ''}>
                                    <label class="form-check-label" for="perm-aiAdvice">
                                        <i class="bi bi-robot me-2"></i>AI सलाह बटन
                                    </label>
                                </div>
                                
                                <div class="form-check mb-2">
                                    <input class="form-check-input permission-checkbox" type="checkbox" value="edit" id="perm-edit" ${currentPermissions.edit ? 'checked' : ''}>
                                    <label class="form-check-label" for="perm-edit">
                                        <i class="bi bi-pencil-square me-2"></i>एडिट बटन
                                    </label>
                                </div>
                                
                                <div class="form-check mb-2">
                                    <input class="form-check-input permission-checkbox" type="checkbox" value="filter" id="perm-filter" ${currentPermissions.filter ? 'checked' : ''}>
                                    <label class="form-check-label" for="perm-filter">
                                        <i class="bi bi-funnel me-2"></i>फिल्टर बटन
                                    </label>
                                </div>
                                
                                <div class="form-check mb-2">
                                    <input class="form-check-input permission-checkbox" type="checkbox" value="freeze" id="perm-freeze" ${currentPermissions.freeze ? 'checked' : ''}>
                                    <label class="form-check-label" for="perm-freeze">
                                        <i class="bi bi-pause-circle me-2"></i>फ्रीज बटन
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">रद्द करें</button>
                            <button type="button" class="btn btn-primary" id="saveChartPermissions">परिवर्तन सहेजें</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('chartPermissionsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', popupHTML);

        // Get modal instance
        const permissionsModal = new bootstrap.Modal(document.getElementById('chartPermissionsModal'));
        
        // Save button event listener
        document.getElementById('saveChartPermissions').addEventListener('click', () => {
            saveChartButtonPermissions(chartId);
            permissionsModal.hide();
        });

        // Show modal
        permissionsModal.show();

        // Remove modal from DOM when hidden
        document.getElementById('chartPermissionsModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        console.error("Error showing chart permissions popup:", error);
        showMessage("अनुमति पॉपअप दिखाने में त्रुटि", "danger");
    }
}

/**
 * चार्ट बटन अनुमतियों को सहेजता है
 */
function saveChartButtonPermissions(chartId) {
    try {
        const checkboxes = document.querySelectorAll('.permission-checkbox');
        const permissions = {};

        checkboxes.forEach(checkbox => {
            permissions[checkbox.value] = checkbox.checked;
        });

        // Save permissions
        chartButtonPermissions.set(chartId, permissions);
        
        // Re-plot chart to reflect changes
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (chartConfig) {
            plotChart(chartConfig);
        }

        showMessage("चार्ट बटन अनुमतियाँ सफलतापूर्वक सहेजी गईं!", "success");
    } catch (error) {
        console.error("Error saving chart permissions:", error);
        showMessage("अनुमतियाँ सहेजने में त्रुटि", "danger");
    }
}

/**
 * चार्ट के लिए बटन HTML जेनरेट करता है (अनुमतियों के आधार पर)
 */
function generateChartButtonsHTML(chartConfig) {
    const permissions = chartButtonPermissions.get(chartConfig.id) || {
        fullscreen: true,
        delete: true,
        download: true,
        aiAdvice: true,
        edit: true,
        filter: true,
        freeze: true
    };

    const isFrozen = chartFreezeState.get(chartConfig.id)?.isFrozen || false;
    const isPlotlyChart = ['candlestick', 'ohlc'].includes(chartConfig.type);

    // Plotly-specific buttons
    const plotlyButtons = (isPlotlyChart && permissions.download) ? `
        <button class="btn btn-sm btn-outline-secondary plotly-zoom me-1" data-chart-id="${chartConfig.id}" title="Zoom">
            <i class="bi bi-zoom-in"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary plotly-pan me-1" data-chart-id="${chartConfig.id}" title="Pan">
            <i class="bi bi-arrows-move"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary plotly-reset me-1" data-chart-id="${chartConfig.id}" title="Reset Axes">
            <i class="bi bi-arrow-counterclockwise"></i>
        </button>
    ` : '';

    // Main buttons based on permissions
    const buttons = [];

    // Delete button (always in dropdown)
    if (permissions.delete) {
        buttons.push(`
            <li>
                <a class="dropdown-item delete-chart" href="#" data-chart-id="${chartConfig.id}">
                    <i class="bi bi-trash"></i> चार्ट हटाएं
                </a>
            </li>
        `);
    }

    // AI Advice button (always in dropdown)
    if (permissions.aiAdvice) {
        buttons.push(`
            <li>
                <a class="dropdown-item get-ai-advice" href="#" data-chart-id="${chartConfig.id}">
                    <i class="bi bi-robot"></i> AI सलाह लें
                </a>
            </li>
        `);
    }

    // Individual buttons based on permissions
    const individualButtons = [];

    if (permissions.filter) {
        individualButtons.push(`
            <div class="dropdown d-inline-block">
                <button class="btn btn-sm btn-outline-primary chart-filter-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-chart-id="${chartConfig.id}" title="चार्ट डेटा फ़िल्टर">
                    <i class="bi bi-funnel"></i>
                </button>
                <div class="dropdown-menu p-3 chart-filter-dropdown" style="max-height: 300px; overflow-y: auto; width: 300px;" data-chart-id="${chartConfig.id}">
                    <h6 class="dropdown-header">कॉलम के अनुसार फ़िल्टर करें</h6>
                    <div class="filter-options-container">
                    </div>
                </div>
            </div>
        `);
    }

    if (permissions.download) {
        individualButtons.push(`
            <button class="btn btn-sm btn-outline-secondary download-chart me-1" data-chart-id="${chartConfig.id}" title="चार्ट डाउनलोड करें">
                <i class="bi bi-download"></i>
            </button>
        `);
    }

    if (permissions.fullscreen) {
        individualButtons.push(`
            <button class="btn btn-sm btn-outline-secondary fullscreen-chart me-1" data-chart-id="${chartConfig.id}" title="फुलस्क्रीन">
                <i class="bi bi-arrows-fullscreen"></i>
            </button>
        `);
    }

    if (permissions.freeze) {
        individualButtons.push(`
            <button class="btn btn-sm ${isFrozen ? 'btn-warning' : 'btn-outline-warning'} freeze-chart me-1" data-chart-id="${chartConfig.id}" title="${isFrozen ? 'चार्ट अनफ्रीज करें' : 'चार्ट फ्रीज करें'}">
                <i class="bi ${isFrozen ? 'bi-pause-circle-fill' : 'bi-pause-circle'}"></i>
            </button>
        `);
    }

    if (permissions.edit) {
        individualButtons.push(`
            <button class="btn btn-sm btn-outline-secondary edit-chart me-1" data-chart-id="${chartConfig.id}" title="चार्ट संपादित करें">
                <i class="bi bi-pencil-square"></i>
            </button>
        `);
    }

    return `
        ${plotlyButtons}
        ${individualButtons.join('')}
        <div class="dropdown d-inline-block">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="चार्ट विकल्प">
                <i class="bi bi-three-dots-vertical"></i>
            </button>
            <ul class="dropdown-menu">
                ${buttons.join('')}
                <li>
                    <a class="dropdown-item chart-permissions-btn" href="#" data-chart-id="${chartConfig.id}">
                        <i class="bi bi-gear"></i> बटन अनुमतियाँ संपादित करें
                    </a>
                </li>
            </ul>
        </div>
    `;
}

/**
 * चार्ट को फ्रीज/अनफ्रीज करता है
 */
export function toggleChartFreeze(chartId) {
    try {
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (!chartConfig) return;

        const currentState = chartFreezeState.get(chartId);
        const isCurrentlyFrozen = currentState?.isFrozen || false;

        if (isCurrentlyFrozen) {
            // Unfreeze the chart
            chartFreezeState.delete(chartId);
            showMessage(`चार्ट "${chartConfig.title}" अनफ्रीज किया गया`, "success");
        } else {
            // Freeze the chart with current data
            const currentData = ChartUtils.getFilteredData(filteredData, chartConfig);
            chartFreezeState.set(chartId, {
                isFrozen: true,
                frozenData: [...currentData], // Create a copy of the data
                frozenAt: new Date().toLocaleString()
            });
            showMessage(`चार्ट "${chartConfig.title}" फ्रीज किया गया`, "success");
        }

        // Update the freeze button appearance
        updateFreezeButtonAppearance(chartId);
        
        // Re-plot the chart to reflect freeze state
        plotChart(chartConfig);
        
    } catch (error) {
        console.error("Error toggling chart freeze:", error);
        showMessage("चार्ट फ्रीज करने में त्रुटि", "danger");
    }
}

/**
 * फ्रीज बटन की appearance अपडेट करता है
 */
function updateFreezeButtonAppearance(chartId) {
    const container = document.getElementById(`container-${chartId}`);
    if (!container) return;

    const freezeButton = container.querySelector('.freeze-chart');
    const freezeIcon = freezeButton?.querySelector('i');
    
    if (freezeButton && freezeIcon) {
        const isFrozen = chartFreezeState.get(chartId)?.isFrozen || false;
        
        if (isFrozen) {
            freezeIcon.className = 'bi bi-pause-circle-fill';
            freezeButton.title = 'चार्ट अनफ्रीज करें';
            freezeButton.classList.remove('btn-outline-warning');
            freezeButton.classList.add('btn-warning');
        } else {
            freezeIcon.className = 'bi bi-pause-circle';
            freezeButton.title = 'चार्ट फ्रीज करें';
            freezeButton.classList.remove('btn-warning');
            freezeButton.classList.add('btn-outline-warning');
        }
    }
}

/**
 * शहर फिल्टर सेटिंग्स को अपडेट करता है
 */
export function updateCityFilterSettings() {
    try {
        const cityFilterEnabled = document.getElementById('cityFilterEnabled')?.checked || false;
        const cityFilterSelect = document.getElementById('cityFilterSelect');
        
        if (!cityFilterSelect) return;
        
        const selectedCities = Array.from(cityFilterSelect.selectedOptions).map(option => option.value);
        
        cityFilterState = {
            enabled: cityFilterEnabled,
            selectedCities: selectedCities
        };
        
        console.log("City filter updated:", cityFilterState);
        dataCache.clear(); // Clear cache when filters change
        plotAll();
    } catch (error) {
        console.error("Error updating city filter:", error);
        showMessage("शहर फिल्टर अपडेट करने में त्रुटि", "danger");
    }
}

/**
 * शहर फिल्टर ड्रॉपडाउन को भरता है
 */
export function populateCityFilter() {
    try {
        const cityFilterSelect = document.getElementById('cityFilterSelect');
        if (!cityFilterSelect || !filteredData || filteredData.length === 0) return;
        
        const allCities = new Set();
        filteredData.forEach(row => {
            Object.values(row).forEach(value => {
                if (typeof value === 'string' && value.trim() !== '') {
                    allCities.add(value.trim());
                }
            });
        });
        
        cityFilterSelect.innerHTML = '';
        Array.from(allCities).sort().forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            option.selected = cityFilterState.selectedCities.includes(city);
            cityFilterSelect.appendChild(option);
        });
        
        console.log(`Populated city filter with ${allCities.size} cities`);
    } catch (error) {
        console.error("Error populating city filter:", error);
    }
}

/**
 * डेटा को शहर फिल्टर के आधार पर फिल्टर करता है
 */
function getFilteredDataByCities(data) {
    if (!cityFilterState.enabled || cityFilterState.selectedCities.length === 0) {
        return data;
    }
    
    const filtered = data.filter(row => {
        return Object.values(row).some(value => 
            cityFilterState.selectedCities.includes(String(value).trim())
        );
    });
    
    console.log(`City filter applied: ${filtered.length} records out of ${data.length}`);
    return filtered;
}

/**
 * डेटा को विशिष्ट चार्ट फिल्टर के आधार पर फिल्टर करता है
 */
function getFilteredDataByChart(data, chartConfig) {
    try {
        let currentData = data;

        // 1. City Filter (Global)
        currentData = getFilteredDataByCities(currentData);
        
        // 2. Chart Specific Filters (Internal)
        if (chartConfig.filters && chartConfig.filters.length > 0) {
            chartConfig.filters.forEach(filter => {
                if (filter.selectedValues && filter.selectedValues.length > 0) {
                    const columnName = filter.columnName;
                    currentData = currentData.filter(row => 
                        filter.selectedValues.includes(String(row[columnName]).trim())
                    );
                }
            });
        }

        return currentData;
        
    } catch (error) {
        console.error("Error filtering chart data:", error);
        return data;
    }
}

/**
 * एक विशिष्ट चार्ट को हटाता है और प्रदर्शन को अपडेट करता है
 */
export async function clearChart(chartId) {
    try {
        console.log("Clearing chart with ID:", chartId);
        
        const chartContainer = document.getElementById(`container-${chartId}`);
        if (!chartContainer) {
            console.warn(`Container not found: container-${chartId}`);
            return;
        }

        // Event listeners remove करें
        if (chartContainer._listeners) {
            Object.keys(chartContainer._listeners).forEach(event => {
                chartContainer.removeEventListener(event, chartContainer._listeners[event]);
            });
        }

        // ECharts instance dispose
        const chartDom = document.getElementById(chartId);
        if (chartDom) {
            const chartInstance = echarts.getInstanceByDom(chartDom);
            if (chartInstance && !chartInstance.isDisposed) {
                chartInstance.dispose();
            } else {
                try {
                    Plotly.purge(chartDom);
                } catch (e) {
                    // Not a Plotly chart
                }
            }
        }

        // Moveable destroy
        if (chartContainer.moveable) {
            chartContainer.moveable.destroy();
            chartContainer.moveable = null;
        }

        // Freeze state clean up
        chartFreezeState.delete(chartId);

        // Button permissions clean up
        chartButtonPermissions.delete(chartId);

        // Arrays से remove
        visualizations = visualizations.filter(v => v.id !== chartId);
        const instanceIndex = allActiveChartInstances.findIndex(instance => 
            instance._dom?.id === chartId
        );
        if (instanceIndex > -1) {
            allActiveChartInstances.splice(instanceIndex, 1);
        }

        // DOM से remove
        chartContainer.remove();

        await saveDashboardSettings();
        console.log("Chart successfully cleared:", chartId);
        
    } catch (error) {
        console.error("Error clearing chart:", error);
        showMessage("चार्ट हटाने में त्रुटि", "danger");
    }
}

/**
 * चार्ट कॉन्फ़िगरेशन बनाता है
 */
async function createChartConfig(xAxisCol, yAxisCols, zAxisCol) {
    const chartType = document.getElementById('chartType')?.value;
    const color = document.getElementById('colorPicker')?.value || '#5470C6';
    const chartTitle = document.getElementById('chartTitle')?.value || 'चार्ट';
    const xAxisLabel = document.getElementById('xAxisLabel')?.value || xAxisCol;
    const yAxisLabel = document.getElementById('yAxisLabel')?.value || yAxisCols.join(', ');
    const customShapeUrl = document.getElementById('customShapeUrl')?.value || '';

    if (!chartType) {
        throw new Error("चार्ट प्रकार आवश्यक है");
    }

    // Position calculation
    const dashboardContent = document.getElementById('dashboardContent');
    let newTop = 20;
    let newLeft = 20;
    
    if (visualizations.length > 0) {
        let maxRight = 0;
        let lowestTop = 0;
        visualizations.forEach(viz => {
            const vizLeft = parseFloat(viz.position.left) || 0;
            const vizWidth = parseFloat(viz.size.width) || 600;
            const vizTop = parseFloat(viz.position.top) || 0;
            if (vizLeft + vizWidth > maxRight) {
                maxRight = vizLeft + vizWidth;
                lowestTop = vizTop;
            }
        });
        
        const dashboardRect = dashboardContent.getBoundingClientRect();
        newLeft = maxRight + 50;
        newTop = lowestTop;
        
        if (newLeft + 650 > dashboardRect.width) {
            let maxBottom = 0;
            visualizations.forEach(viz => {
                const vizTop = parseFloat(viz.position.top) || 0;
                const vizHeight = parseFloat(viz.size.height) || 400;
                if (vizTop + vizHeight > maxBottom) {
                    maxBottom = vizTop + vizHeight;
                }
            });
            newLeft = 20;
            newTop = maxBottom + 20;
        }
    }
    
    const columnsForChart = [xAxisCol, ...yAxisCols];
    if (zAxisCol) {
        columnsForChart.push(zAxisCol);
    }
    
    return {
        id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: chartType,
        color: color,
        title: chartTitle,
        xAxisLabel: xAxisLabel,
        yAxisLabel: yAxisLabel,
        zAxisLabel: zAxisCol || '',
        customShape: customShapeUrl,
        columns: columnsForChart.filter(c => c),
        position: { top: `${newTop}px`, left: `${newLeft}px` },
        size: { width: `600px`, height: `400px` },
        filters: []
    };
}

/**
 * चार्ट प्रकार के लिए वैलिडेशन
 */
function validateChartType(chartType, xAxisCol, yAxisCols, zAxisCol) {
    switch (chartType) {
        case 'pie':
        case 'doughnut':
        case 'rose-radius':
        case 'rose-area':
        case 'funnel':
        case 'gauge':
            if (!xAxisCol || !yAxisCols || yAxisCols.length === 0) {
                throw new Error("इस चार्ट प्रकार के लिए एक लेबल कॉलम और एक मान कॉलम चुनें।");
            }
            break;
            
        case 'scatter':
        case 'bubble':
            if (!xAxisCol || yAxisCols.length === 0) {
                throw new Error("स्कैटर/बबल चार्ट के लिए X-अक्ष और Y-अक्ष कॉलम चुनें।");
            }
            if (chartType === 'bubble' && yAxisCols.length < 2) {
                throw new Error("बबल चार्ट के लिए कम से कम दो मान कॉलम (Y-अक्ष और आकार के लिए) चुनें।");
            }
            break;
            
        case 'treemap':
            if (yAxisCols.length < 1) {
                throw new Error("ट्रीमैप के लिए एक लेबल कॉलम और एक मान कॉलम चुनें।");
            }
            break;
            
        case 'radar':
            if (yAxisCols.length === 0) {
                throw new Error("राडार चार्ट के लिए कम से कम एक मान कॉलम चुनें।");
            }
            break;
            
        case 'candlestick':
        case 'ohlc':
            if (yAxisCols.length < 4) {
                throw new Error("इस चार्ट के लिए 4 मान कॉलम (open, close, low, high) चुनें।");
            }
            break;
            
        case 'bar3D':
            if (!zAxisCol || yAxisCols.length === 0) {
                throw new Error("3D बार चार्ट के लिए X, Y, और Z-अक्ष कॉलम चुनें।");
            }
            break;
            
        case 'line3D':
            if (!zAxisCol || yAxisCols.length === 0) {
                throw new Error("3D लाइन चार्ट के लिए X, Y, और Z-अक्ष कॉलम चुनें।");
            }
            break;
            
        default:
            if (!xAxisCol) {
                throw new Error("कृपया X-अक्ष कॉलम चुनें।");
            }
    }
}

/**
 * नया विज़ुअलाइज़ेशन कॉन्फ़िगरेशन जोड़ता है और उसे तुरंत प्लॉट करता है
 */
export async function addVisualization(xAxisCol, yAxisCols, zAxisCol) {
    try {
        // Input validation
        if (!ChartUtils.validateInput(xAxisCol, yAxisCols)) {
            return;
        }

        const chartType = document.getElementById('chartType')?.value;
        if (!chartType) {
            showMessage("कृपया चार्ट प्रकार चुनें।", "warning");
            return;
        }

        // Chart type validation
        validateChartType(chartType, xAxisCol, yAxisCols, zAxisCol);

        const chartConfig = await createChartConfig(xAxisCol, yAxisCols, zAxisCol);
        visualizations.push(chartConfig);
        
        await saveDashboardSettings();
        await plotChart(chartConfig);
        
        showMessage("नया विज़ुअलाइज़ेशन सफलतापूर्वक जोड़ा गया!", "success");
        
    } catch (error) {
        console.error("Error adding visualization:", error);
        showMessage(error.message || "विज़ुअलाइज़ेशन जोड़ने में त्रुटि", "danger");
    }
}

/**
 * चार्ट के लिए बटन लिसनर्स जोड़ता है
 */
function addChartButtonListeners(container, chartConfig) {
    const listeners = {
        // Delete chart button
        deleteChart: (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearChart(e.currentTarget.dataset.chartId);
        },
        
        // AI advice button
        aiAdvice: (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.chartId;
            const chartDivToAdvise = document.getElementById(id);
            const title = container.querySelector('.chart-title').textContent;
            if (chartDivToAdvise) {
                getAiChartAdvice(chartDivToAdvise, title);
            }
        },
        
        // Fullscreen button
        fullscreen: (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.chartId;
            const chartDom = document.getElementById(id);
            toggleFullscreen(chartDom);
        },
        
        // Edit button
        editChart: (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.chartId;
            editChart(id);
        },
        
        // Filter button
        filterChart: (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.chartId;
            handleChartFilterClick(id);
        },
        
        // Freeze button
        freezeChart: (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.chartId;
            toggleChartFreeze(id);
        },
        
        // Permissions button
        permissions: (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.chartId;
            showChartButtonPermissionsPopup(id);
        }
    };

    // Add event listeners
    const deleteBtn = container.querySelector('.delete-chart');
    const aiAdviceBtn = container.querySelector('.get-ai-advice');
    const fullscreenBtn = container.querySelector('.fullscreen-chart');
    const editBtn = container.querySelector('.edit-chart');
    const filterBtn = container.querySelector('.chart-filter-btn');
    const freezeBtn = container.querySelector('.freeze-chart');
    const permissionsBtn = container.querySelector('.chart-permissions-btn');

    if (deleteBtn) deleteBtn.addEventListener('click', listeners.deleteChart);
    if (aiAdviceBtn) aiAdviceBtn.addEventListener('click', listeners.aiAdvice);
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', listeners.fullscreen);
    if (editBtn) editBtn.addEventListener('click', listeners.editChart);
    if (filterBtn) filterBtn.addEventListener('click', listeners.filterChart);
    if (freezeBtn) freezeBtn.addEventListener('click', listeners.freezeChart);
    if (permissionsBtn) permissionsBtn.addEventListener('click', listeners.permissions);

    // Store listeners for cleanup
    container._listeners = listeners;
}

/**
 * Plotly चार्ट के लिए बटन लिसनर्स जोड़ता है
 */
function addPlotlyButtonListeners(container, chartConfig) {
    const chartDom = document.getElementById(chartConfig.id);
    if (!chartDom) return;

    setTimeout(() => {
        // Zoom button
        container.querySelector('.plotly-zoom')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            Plotly.relayout(chartDom, {'dragmode': 'zoom'});
        });
        
        // Pan button
        container.querySelector('.plotly-pan')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            Plotly.relayout(chartDom, {'dragmode': 'pan'});
        });
        
        // Reset button
        container.querySelector('.plotly-reset')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            Plotly.relayout(chartDom, {
                'xaxis.autorange': true,
                'yaxis.autorange': true
            });
        });
        
        // Download button for Plotly
        container.querySelector('.download-chart')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            Plotly.downloadImage(chartDom, {
                format: 'png',
                filename: chartConfig.title,
                height: 600,
                width: 800
            });
        });
    }, 500);
}

/**
 * दिए गए चार्ट कॉन्फ़िग और डेटा के आधार पर चार्ट प्लॉट करता है
 */
export function plotChart(chartConfig) {
    try {
        console.log("Plotting chart:", chartConfig.id);
        
        // Validation
        if (!ChartUtils.validateChartConfig(chartConfig)) {
            throw new Error(ERROR_MESSAGES.INVALID_CONFIG);
        }

        const containerToAppendTo = document.getElementById('dashboardContent');
        if (!containerToAppendTo) {
            throw new Error(ERROR_MESSAGES.DASHBOARD_NOT_FOUND);
        }

        // Remove existing container
        let existingContainer = document.getElementById(`container-${chartConfig.id}`);
        if (existingContainer) {
            if (existingContainer.moveable) {
                existingContainer.moveable.destroy();
            }
            if (existingContainer._listeners) {
                Object.keys(existingContainer._listeners).forEach(event => {
                    existingContainer.removeEventListener(event, existingContainer._listeners[event]);
                });
            }
            existingContainer.remove();
        }
        
        // Create new container
        const chartContainer = ChartUtils.createContainerElement(chartConfig);
        const isPlotlyChart = ['candlestick', 'ohlc'].includes(chartConfig.type);
        
        // City filter status
        const cityFilterStatus = cityFilterState.enabled && cityFilterState.selectedCities.length > 0 
            ? `<div class="city-filter-status position-absolute top-0 start-0 p-2">
                 <span class="badge bg-info" title="Selected cities: ${cityFilterState.selectedCities.join(', ')}">
                     <i class="bi bi-filter"></i> ${cityFilterState.selectedCities.length} Global
                 </span>
               </div>`
            : '';

        // Freeze status
        const isFrozen = chartFreezeState.get(chartConfig.id)?.isFrozen || false;
        const freezeStatus = isFrozen 
            ? `<div class="freeze-status position-absolute top-0 start-50 translate-middle-x p-2">
                 <span class="badge bg-warning text-dark" title="चार्ट फ्रीज किया गया - डेटा अपडेट नहीं होगा">
                     <i class="bi bi-pause-circle-fill"></i>
                 </span>
               </div>`
            : '';
        
        // Generate buttons based on permissions
        const chartButtonsHTML = generateChartButtonsHTML(chartConfig);

        const customShapeHtml = chartConfig.customShape
            ? `<div class="chart-custom-shape position-absolute" style="z-index: 101; pointer-events: none; top: 10px; left: 10px;">
                    <img src="${chartConfig.customShape}" alt="कस्टम शेप" style="width: 50px; height: 50px;">
               </div>`
            : '';
        
        chartContainer.innerHTML = `
            ${cityFilterStatus}
            ${freezeStatus}
            ${customShapeHtml}
            <h4 class="chart-title text-center mb-3">${chartConfig.title}</h4>
            <div class="chart-buttons position-absolute top-0 end-0 p-2">
                ${chartButtonsHTML}
            </div>
            <div id="${chartConfig.id}" class="chart-canvas" style="width: 100%; height: calc(100% - 70px);"></div>
        `;
        
        // Append to dashboard
        const offcanvasSidebar = document.getElementById('offcanvasSidebar');
        if (offcanvasSidebar && containerToAppendTo.contains(offcanvasSidebar)) {
            containerToAppendTo.insertBefore(chartContainer, offcanvasSidebar);
        } else {
            containerToAppendTo.appendChild(chartContainer);
        }

        // Get filtered data
        const chartData = ChartUtils.getFilteredData(filteredData, chartConfig);
        const chartDom = document.getElementById(chartConfig.id);
        
        if (!chartDom) {
            throw new Error("चार्ट DOM एलिमेंट नहीं मिला");
        }

        // Initialize chart
        if (isPlotlyChart) {
            plotPlotlyChart(chartConfig, chartData);
            addPlotlyButtonListeners(chartContainer, chartConfig);
        } else {
            const chart = echarts.init(chartDom, document.body.classList.contains('dark-theme') ? 'dark' : 'light', {
                renderer: 'canvas',
                useDirtyRect: false
            });
            allActiveChartInstances.push(chart);
            const option = getChartOption(chartConfig, chartData);
            chart.setOption(option, true);
            
            // Download button for ECharts
            chartContainer.querySelector('.download-chart')?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const dataURL = chart.getDataURL({
                    type: 'png',
                    pixelRatio: 2,
                    backgroundColor: '#fff'
                });
                const downloadLink = document.createElement('a');
                downloadLink.href = dataURL;
                downloadLink.download = `${chartConfig.title}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            });
        }
        
        // Add button listeners
        addChartButtonListeners(chartContainer, chartConfig);
        
        // Initialize drag and resize
        const chartInstance = isPlotlyChart ? null : echarts.getInstanceByDom(chartDom);
        chartContainer.moveable = initializeDragAndResize(chartContainer, chartInstance, isPlotlyChart);

        // Moveable listeners
        chartContainer.moveable.on("dragEnd", async ({ target }) => {
            const updatedConfig = visualizations.find(v => v.id === chartConfig.id);
            if (updatedConfig) {
                updatedConfig.position = {
                    top: target.style.top,
                    left: target.style.left
                };
                await saveDashboardSettings();
            }
        });

        chartContainer.moveable.on("resizeEnd", async ({ target }) => {
            const updatedConfig = visualizations.find(v => v.id === chartConfig.id);
            if (updatedConfig) {
                updatedConfig.size = {
                    width: target.style.width,
                    height: target.style.height
                };
                await saveDashboardSettings();
            }
            
            if (isPlotlyChart) {
                Plotly.relayout(chartDom, {
                    width: chartContainer.offsetWidth,
                    height: chartContainer.offsetHeight - 70
                });
            } else {
                echarts.getInstanceByDom(chartDom)?.resize();
            }
        });

        attachToggleAiAdviceListeners();
        
    } catch (error) {
        console.error("Error plotting chart:", error);
        showMessage(`चार्ट बनाने में त्रुटि: ${error.message}`, "danger");
    }
}

// ==========================================================      
// CHART FILTER LOGIC      
// ==========================================================      

/**
 * चार्ट विशिष्ट फ़िल्टर ड्रॉपडाउन को भरता है और इवेंट हैंडलर जोड़ता है
 */
function handleChartFilterClick(chartId) {
    try {
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (!chartConfig || !filteredData || filteredData.length === 0) return;

        const filterContainer = document.querySelector(`#container-${chartId} .filter-options-container`);
        if (!filterContainer) return;

        filterContainer.innerHTML = '';
        
        const uniqueColumns = [...new Set(chartConfig.columns.filter(col => col))];

        uniqueColumns.forEach(columnName => {
            const uniqueValues = new Set();
            filteredData.forEach(row => {
                const value = String(row[columnName]).trim();
                if (value !== '') {
                    uniqueValues.add(value);
                }
            });
            const sortedValues = Array.from(uniqueValues).sort();

            if (sortedValues.length === 0) return;

            const currentFilter = chartConfig.filters.find(f => f.columnName === columnName);
            const selectedValues = currentFilter ? currentFilter.selectedValues : sortedValues;

            const columnDiv = document.createElement('div');
            columnDiv.classList.add('mb-3', 'border-bottom', 'pb-2');
            columnDiv.innerHTML = `<h6 class="text-primary">${columnName}</h6>`;

            // Select All/Deselect All button
            const selectAllBtn = document.createElement('button');
            selectAllBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'mb-2', 'w-100', 'toggle-select-btn');
            selectAllBtn.textContent = 'सभी चुनें / अचयनित करें';
            columnDiv.appendChild(selectAllBtn);

            const optionsDiv = document.createElement('div');
            optionsDiv.classList.add('filter-options');

            sortedValues.forEach(value => {
                const isChecked = selectedValues.includes(value);
                const checkboxId = `${chartId}-${columnName}-${value.replace(/[^a-zA-Z0-9]/g, '_')}`;
                
                const formCheck = document.createElement('div');
                formCheck.classList.add('form-check', 'small');
                
                formCheck.innerHTML = `
                    <input class="form-check-input chart-filter-checkbox" type="checkbox" value="${value}" id="${checkboxId}" ${isChecked ? 'checked' : ''} data-column-name="${columnName}">
                    <label class="form-check-label" for="${checkboxId}" title="${value}">
                        ${value.length > 25 ? value.substring(0, 25) + '...' : value}
                    </label>
                `;
                optionsDiv.appendChild(formCheck);
            });

            columnDiv.appendChild(optionsDiv);
            filterContainer.appendChild(columnDiv);
            
            // Add listener for Select All/Deselect All
            selectAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const checkboxes = optionsDiv.querySelectorAll('.chart-filter-checkbox');
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                checkboxes.forEach(cb => cb.checked = !allChecked);
                
                const newSelectedValues = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);
                applyChartFilters(chartId, columnName, newSelectedValues);
            });

            // Add change listener to each checkbox
            optionsDiv.querySelectorAll('.chart-filter-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const colName = e.target.dataset.columnName;
                    const checkboxes = optionsDiv.querySelectorAll(`.chart-filter-checkbox[data-column-name="${colName}"]`);
                    
                    const newSelectedValues = Array.from(checkboxes)
                        .filter(cb => cb.checked)
                        .map(cb => cb.value);
                    
                    applyChartFilters(chartId, colName, newSelectedValues);
                });
            });
        });
    } catch (error) {
        console.error("Error handling chart filter click:", error);
    }
}

/**
 * चार्ट विशिष्ट फ़िल्टर लागू करता है और चार्ट को री-प्लॉट करता है
 */
async function applyChartFilters(chartId, columnName, selectedValues) {
    try {
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (!chartConfig) return;

        const existingFilterIndex = chartConfig.filters.findIndex(f => f.columnName === columnName);

        // Get all unique values for comparison
        const allUniqueValues = new Set();
        filteredData.forEach(row => {
            const value = String(row[columnName]).trim();
            if (value !== '') {
                allUniqueValues.add(value);
            }
        });
        const totalUnique = Array.from(allUniqueValues).length;

        if (selectedValues.length === totalUnique) {
            // All values selected, remove filter
            if (existingFilterIndex !== -1) {
                chartConfig.filters.splice(existingFilterIndex, 1);
            }
        } else {
            const newFilter = { columnName, selectedValues };
            if (existingFilterIndex !== -1) {
                chartConfig.filters[existingFilterIndex] = newFilter;
            } else {
                chartConfig.filters.push(newFilter);
            }
        }
        
        console.log(`Chart ${chartId} filters updated:`, chartConfig.filters);
        dataCache.clear(); // Clear cache when filters change

        await saveDashboardSettings();
        plotChart(chartConfig);
        showMessage(`चार्ट ${chartConfig.title} के लिए फ़िल्टर लागू किया गया।`, "success");
    } catch (error) {
        console.error("Error applying chart filters:", error);
        showMessage("फ़िल्टर लागू करने में त्रुटि", "danger");
    }
}

// ==========================================================      
// PLOT ALL FUNCTION      
// ==========================================================      

/**
 * सभी मौजूदा विज़ुअलाइज़ेशन को साफ़ करता है और पुनः प्लॉट करता है
 */
export async function plotAll() {
    // Debounce implementation
    if (plotAllTimeout) {
        clearTimeout(plotAllTimeout);
    }
    
    plotAllTimeout = setTimeout(async () => {
        try {
            console.log("Plotting all visualizations:", visualizations);
            const dashboardContent = document.getElementById('dashboardContent');
            if (!dashboardContent) {
                throw new Error(ERROR_MESSAGES.DASHBOARD_NOT_FOUND);
            }
            
            // Clear existing chart containers that are NOT frozen
            const existingChartContainers = document.querySelectorAll('.visualization-container');
            existingChartContainers.forEach(container => {
                const chartId = container.id.replace('container-', '');
                // If chart is frozen, skip removing its container
                if (chartFreezeState.get(chartId)?.isFrozen) {
                    return;
                }
                const chartDom = document.getElementById(chartId);
                if (chartDom) {
                    const chartInstance = echarts.getInstanceByDom(chartDom);
                    if (chartInstance) {
                        chartInstance.dispose();
                        // Remove from allActiveChartInstances
                        const index = allActiveChartInstances.indexOf(chartInstance);
                        if (index > -1) {
                            allActiveChartInstances.splice(index, 1);
                        }
                    } else {
                        try {
                            Plotly.purge(chartDom);
                        } catch (e) {
                            // Not a Plotly chart
                        }
                    }
                }
                container.moveable?.destroy();
                container.remove();
            });
            
            // Clear previous empty chart message
            const existingMessage = dashboardContent.querySelector('.no-charts-message');
            if (existingMessage) {
                existingMessage.remove();
            }
            
            dataCache.clear();
            
            // Empty dashboard message
            if (visualizations.length === 0) {
                const messageHtml = filteredData && filteredData.length > 0 ?
                    '<div class="no-charts-message text-muted text-center p-4" style="position: absolute; top: 150px; left: 50%; transform: translateX(-50%);"><p><i class="bi bi-info-circle"></i> कोई चार्ट उपलब्ध नहीं है।</p><p>साइडबार से \'डेटा और चार्ट सेटिंग्स\' में जाकर चार्ट जोड़ें।</p></div>' :
                    '<div class="no-charts-message text-muted text-center p-4" style="position: absolute; top: 150px; left: 50%; transform: translateX(-50%);"><p><i class="bi bi-info-circle"></i> डेटा नहीं मिला। कृपया डेटा अपलोड करें।</p></div>';
                
                const messageDiv = document.createElement('div');
                messageDiv.innerHTML = messageHtml;
                const messageElement = messageDiv.firstChild;
                
                const offcanvasSidebar = document.getElementById('offcanvasSidebar');
                if (offcanvasSidebar && dashboardContent.contains(offcanvasSidebar)) {
                    dashboardContent.insertBefore(messageElement, offcanvasSidebar);
                } else {
                    dashboardContent.appendChild(messageElement);
                }
                
                dashboardContent.style.minHeight = '500px';
                return;
            }
            
            // Re-plot only non-frozen charts
            visualizations.forEach(chartConfig => {
                if (!chartFreezeState.get(chartConfig.id)?.isFrozen) {
                    plotChart(chartConfig);
                }
            });
            
            // Calculate minHeight
            setTimeout(() => {
                let maxBottom = 0;
                const chartElements = document.querySelectorAll('.visualization-container');
                chartElements.forEach(el => {
                    const top = parseFloat(el.style.top);
                    const height = parseFloat(el.style.height);
                    if (!isNaN(top) && !isNaN(height)) {
                        const bottomPosition = top + height;
                        if (bottomPosition > maxBottom) {
                            maxBottom = bottomPosition;
                        }
                    }
                });
                
                if (maxBottom > 0) {
                    const requiredHeight = maxBottom + 40;
                    dashboardContent.style.minHeight = `${requiredHeight}px`;
                } else {
                    dashboardContent.style.minHeight = '500px';
                }
            }, 100);
            
            await saveDashboardSettings();
        } catch (error) {
            console.error("Error in plotAll:", error);
            showMessage("सभी चार्ट्स प्लॉट करने में त्रुटि", "danger");
        }
    }, CHART_CONSTANTS.DEBOUNCE_DELAY);
}

// ==========================================================      
// REMAINING FUNCTIONS      
// ==========================================================      

/**
 * रियल-टाइम अपडेट के लिए किसी विशिष्ट चार्ट के डेटा को अपडेट करता है
 */
export function updateChartData(chartId, data) {
    try {
        // Skip update if chart is frozen
        if (chartFreezeState.get(chartId)?.isFrozen) {
            return;
        }

        const chartDom = document.getElementById(chartId);
        if (!chartDom) return;
        
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (!chartConfig) return;
        
        const isPlotlyChart = ['candlestick', 'ohlc'].includes(chartConfig.type);
        const filteredChartData = ChartUtils.getFilteredData(data, chartConfig);
        
        if (isPlotlyChart) {
            plotPlotlyChart(chartConfig, filteredChartData);
        } else {
            const chartInstance = echarts.getInstanceByDom(chartDom);
            if (!chartInstance) return;
            const option = getChartOption(chartConfig, filteredChartData);
            chartInstance.setOption(option);
        }
    } catch (error) {
        console.error("Error updating chart data:", error);
    }
}

/**
 * Plotly चार्ट जनरेशन
 */
function plotPlotlyChart(config, data) {
    try {
        const chartDom = document.getElementById(config.id);
        if (!chartDom) return;
        
        if (data.length === 0 || config.columns.length < 5) {
            Plotly.purge(chartDom);
            chartDom.innerHTML = '<div class="text-center text-muted mt-5">फ़िल्टर किए गए डेटा में अपर्याप्त मान।</div>';
            return;
        }
        
        const dates = data.map(row => row[config.columns[0]]);
        const open = data.map(row => parseFloat(row[config.columns[1]]));
        const high = data.map(row => parseFloat(row[config.columns[2]]));
        const low = data.map(row => parseFloat(row[config.columns[3]]));
        const close = data.map(row => parseFloat(row[config.columns[4]]));
        
        const trace = {
            x: dates,
            open: open,
            high: high,
            low: low,
            close: close,
            type: config.type === 'ohlc' ? 'ohlc' : 'candlestick',
            name: config.title,
            increasing: { line: { color: '#00da3c' } },
            decreasing: { line: { color: '#ec0000' } },
            xaxis: 'x',
            yaxis: 'y'
        };
        
        const layout = {
            dragmode: chartGlobalSettings.zoomEnable ? 'zoom' : false,
            xaxis: {
                title: config.xAxisLabel,
                rangeslider: { visible: false },
                showgrid: chartGlobalSettings.gridShowHide,
                tickfont: {
                    color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333'
                },
                gridcolor: document.body.classList.contains('dark-theme') ? '#444' : '#ddd'
            },
            yaxis: {
                title: config.yAxisLabel,
                showgrid: chartGlobalSettings.gridShowHide,
                tickfont: {
                    color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333'
                },
                gridcolor: document.body.classList.contains('dark-theme') ? '#444' : '#ddd'
            },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: {
                color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333'
            },
            showlegend: true,
            legend: {
                x: 1,
                y: 1,
                bgcolor: 'rgba(0,0,0,0)',
                font: { color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333' }
            }
        };
        
        const configPlotly = {
            displayModeBar: false,
            responsive: true
        };
        
        Plotly.newPlot(chartDom, [trace], layout, configPlotly);
    } catch (error) {
        console.error("Error plotting Plotly chart:", error);
    }
}

/**
 * मेन `getChartOption` फ़ंक्शन
 */
export function getChartOption(chartConfig, data) {
    if (['candlestick', 'ohlc'].includes(chartConfig.type)) {
        return;
    }
    
    if (data.length === 0) {
        return commonChartOptions({
            title: {
                text: 'फ़िल्टर किए गए डेटा में कोई रिकॉर्ड नहीं',
                left: 'center',
                top: 'middle'
            }
        }, chartConfig);
    }
    
    try {
        switch (chartConfig.type) {
            case 'bar':
            case 'stacked-bar':
            case 'grouped-bar':
            case 'horizontal-bar':
                return getBarChartOption(chartConfig, data);
            case 'line':
            case 'stacked-line':
            case 'smooth-line':
            case 'step-line':
                return getLineChartOption(chartConfig, data);
            case 'pie':
            case 'doughnut':
            case 'rose-radius':
            case 'rose-area':
                return getPieChartOption(chartConfig, data);
            case 'scatter':
            case 'bubble':
                return getScatterChartOption(chartConfig, data);
            case 'funnel':
                return getFunnelChartOption(chartConfig, data);
            case 'gauge':
                return getGaugeChartOption(chartConfig, data);
            case 'radar':
                return getRadarChartOption(chartConfig, data);
            case 'treemap':
                return getTreemapChartOption(chartConfig, data);
            case 'bar3D':
                return getBar3DChartOption(chartConfig, data);
            case 'line3D':
                return getLine3DChartOption(chartConfig, data);
            default:
                return commonChartOptions({}, chartConfig);
        }
    } catch (error) {
        console.error("Error getting chart option:", error);
        return commonChartOptions({
            title: {
                text: 'चार्ट बनाने में त्रुटि',
                left: 'center',
                top: 'middle'
            }
        }, chartConfig);
    }
}

/**
 * एडवांस्ड चार्ट सेटिंग्स को अपडेट करता है
 */
export async function applyAdvancedChartSettings() {
    try {
        chartGlobalSettings.gridShowHide = document.getElementById('gridShowHide')?.checked || false;
        chartGlobalSettings.tooltipOnOff = document.getElementById('tooltipOnOff')?.checked || false;
        chartGlobalSettings.zoomEnable = document.getElementById('zoomEnable')?.checked || false;
        chartGlobalSettings.animationDuration = parseInt(document.getElementById('animationDuration')?.value) || 1000;
        chartGlobalSettings.axisFormat = document.getElementById('axisFormat')?.value || 'none';
        chartGlobalSettings.legendPosition = document.getElementById('legendPosition')?.value || 'bottom';
        chartGlobalSettings.showLabels = document.getElementById('showLabels')?.checked || false;
        
        console.log("Applied Advanced Chart Settings:", chartGlobalSettings);
        dataCache.clear();
        
        await saveDashboardSettings();
        plotAll();
        showMessage("चार्ट सेटिंग्स सफलतापूर्वक लागू की गईं!", "success");
    } catch (error) {
        console.error("Error applying advanced chart settings:", error);
        showMessage("चार्ट सेटिंग्स लागू करने में त्रुटि", "danger");
    }
}

// Helper functions
function toggleFullscreen(chartDom) {
    try {
        const container = chartDom.parentElement;
        if (!document.fullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    } catch (error) {
        console.error("Error toggling fullscreen:", error);
    }
}

function editChart(chartId) {
    try {
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (!chartConfig) return;
        
        document.getElementById('chartType').value = chartConfig.type;
        document.getElementById('colorPicker').value = chartConfig.color;
        document.getElementById('chartTitle').value = chartConfig.title;
        document.getElementById('xAxisLabel').value = chartConfig.xAxisLabel;
        document.getElementById('yAxisLabel').value = chartConfig.yAxisLabel;
        
        document.getElementById('chartSettings').classList.remove('d-none');
        window.editingChartId = chartId;
    } catch (error) {
        console.error("Error editing chart:", error);
        showMessage("चार्ट संपादित करने में त्रुटि", "danger");
    }
}

// Optimized resize listener
window.addEventListener('resize', () => {
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
        allActiveChartInstances.forEach(chart => {
            if (chart && !chart.isDisposed) {
                chart.resize();
            }
        });
    }, CHART_CONSTANTS.RESIZE_DEBOUNCE);
});

// Export ChartUtils for testing
export { ChartUtils };