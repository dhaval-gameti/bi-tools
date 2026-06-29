// js/drag_drop.js

import { showMessage } from './utils.js';
import { saveDashboardSettings } from '../store/DataHandler.js';
import { visualizations } from './charts.js'; // `visualizations` array आयात करें

export let isLockModeEnabled = false;

// Debounce function window resize के लिए
function debounce(func, wait) {
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

// नया function सभी charts को फिर से initialize करने के लिए
function reinitializeAllCharts() {
    document.querySelectorAll('.visualization-container').forEach(container => {
        const chartId = container.id.replace('container-', '');
        const chartDom = document.getElementById(chartId);
        const chartConfig = visualizations.find(v => v.id === chartId);
        
        if (chartDom && chartConfig) {
            // थोड़ा delay देकर initialize करें
            setTimeout(() => {
                const isPlotlyChart = ['candlestick', 'ohlc'].includes(chartConfig.type);
                if (isPlotlyChart) {
                    initializeDragAndResize(container, null, true);
                } else {
                    const chartInstance = echarts.getInstanceByDom(chartDom);
                    if (chartInstance) initializeDragAndResize(container, chartInstance);
                }
            }, 100);
        }
    });
}

// लॉक मोड toggle करने वाला function
export function toggleLockMode() {
    try {
        isLockModeEnabled = !isLockModeEnabled;
        const toggleButton = document.getElementById('toggleLockModeBtn');
        
        if (!toggleButton) {
            console.error('Toggle button not found');
            return;
        }
        
        // Button classes को पहले reset करें
        toggleButton.classList.remove('btn-success', 'btn-danger', 'btn-outline-secondary');
        
        if (isLockModeEnabled) {
            console.log("Drag & Resize Lock Mode is now ENABLED.");
            showMessage("डैशबोर्ड लॉक्ड: चार्ट को अब ड्रैग या रीसाइज नहीं किया जा सकता है।", 'info');
            toggleButton.innerHTML = '<i class="bi bi-unlock-fill"></i> अनलॉक डैशबोर्ड';
            toggleButton.classList.add('btn-danger');
            
            // सभी moveable instances को destroy करें
            document.querySelectorAll('.visualization-container').forEach(container => {
                if (container.cleanupMoveable) {
                    container.cleanupMoveable();
                }
            });
            
        } else {
            console.log("Drag & Resize Lock Mode is now DISABLED.");
            showMessage("डैशबोर्ड अनलॉक: आप अब चार्ट को ड्रैग और रीसाइज कर सकते हैं।", 'info');
            toggleButton.innerHTML = '<i class="bi bi-lock-fill"></i> लॉक डैशबोर्ड';
            toggleButton.classList.add('btn-success');
            
            // सभी charts को फिर से initialize करें
            reinitializeAllCharts();
        }
        
        saveDashboardSettings();
    } catch (error) {
        console.error('Error in toggleLockMode:', error);
        showMessage('लॉक मोड बदलने में त्रुटि', 'error');
    }
}

/**
 * Drag & Resize initialize करने वाला function
 * @param {HTMLElement} chartElement - चार्ट container
 * @param {object|null} echartsInstance - ECharts instance (optional)
 * @param {boolean} isPlotlyChart - Plotly chart है या नहीं
 */
export function initializeDragAndResize(chartElement, echartsInstance = null, isPlotlyChart = false) {
    try {
        if (isLockModeEnabled) return;
        if (!chartElement) {
            console.error('Chart element not found for drag-resize initialization');
            return;
        }
        
        // पहले existing event listeners को clean करें
        if (chartElement.cleanupMoveable) {
            chartElement.cleanupMoveable();
        }
        
        const moveable = new Moveable(document.body, {
            target: chartElement,
            draggable: true,
            resizable: true,
            scalable: false,
            rotatable: false,
            snappable: true,
            renderDirections: ["nw", "n", "ne", "w", "e", "sw", "s", "se"],
            edge: false,
            keepRatio: false,
            throttleResize: 1,
            throttleDrag: 1,
        });
        
        let hideTimer = null;
        let isInteracting = false;
        
        // केवल current chart के controls को manage करने के functions
        const getCurrentControlBox = () => chartElement.querySelector(".moveable-control-box");
        
        const showCurrentControls = () => {
            if (isLockModeEnabled) return;
            
            const currentBox = getCurrentControlBox();
            if (currentBox) {
                currentBox.style.opacity = "1";
                currentBox.style.transition = "opacity 0.2s ease";
            }
            
            // अन्य सभी controls को hide करें
            document.querySelectorAll(".moveable-control-box").forEach(box => {
                if (box !== currentBox) box.style.opacity = "0";
            });
            
            if (hideTimer) clearTimeout(hideTimer);
        };
        
        const hideCurrentControls = () => {
            if (isInteracting) return;
            
            hideTimer = setTimeout(() => {
                const currentBox = getCurrentControlBox();
                if (currentBox) {
                    currentBox.style.opacity = "0";
                    currentBox.style.transition = "opacity 0.3s ease";
                }
            }, 1000);
        };
        
        // Responsive: window resize पर chart resize
        const onWindowResize = () => {
            if (isPlotlyChart) {
                const chartDom = chartElement.querySelector('.chart-canvas');
                if (chartDom) Plotly.Plots.resize(chartDom);
            } else if (echartsInstance) {
                echartsInstance.resize();
            }
        };
        
        const debouncedResize = debounce(onWindowResize, 250);
        
        // Drag events
        moveable
            .on("dragStart", ({ target, inputEvent }) => {
                if (inputEvent && (inputEvent.target.closest('.chart-buttons') || inputEvent.target.closest('.dropdown-menu'))) {
                    moveable.stop();
                    return;
                }
                isInteracting = true;
                target.style.zIndex = '1000';
                showCurrentControls();
            })
            .on("drag", ({ target, left, top }) => {
                target.style.left = `${left}px`;
                target.style.top = `${top}px`;
            })
            .on("dragEnd", ({ target }) => {
                isInteracting = false;
                target.style.zIndex = '100';
                hideCurrentControls();
                saveDashboardSettings(); // Position save करें
            });
        
        // Resize events
        moveable
            .on("resizeStart", ({ target, inputEvent }) => {
                if (inputEvent && (inputEvent.target.closest('.chart-buttons') || inputEvent.target.closest('.dropdown-menu'))) {
                    moveable.stop();
                    return;
                }
                isInteracting = true;
                target.style.zIndex = '1000';
                showCurrentControls();
            })
            .on("resize", ({ target, width, height, delta }) => {
                delta[0] && (target.style.width = `${width}px`);
                delta[1] && (target.style.height = `${height}px`);
                
                if (isPlotlyChart) {
                    const chartDom = target.querySelector('.chart-canvas');
                    if (chartDom) Plotly.relayout(chartDom, { width, height: height - 70 });
                } else if (echartsInstance) {
                    echartsInstance.resize();
                }
            })
            .on("resizeEnd", ({ target }) => {
                isInteracting = false;
                target.style.zIndex = '100';
                if (echartsInstance) echartsInstance.resize();
                hideCurrentControls();
                saveDashboardSettings(); // Size save करें
            });
        
        // Mouse events for hover
        const handleMouseEnter = () => {
            if (!isLockModeEnabled && !isInteracting) {
                showCurrentControls();
            }
        };
        
        const handleMouseLeave = () => {
            if (!isLockModeEnabled && !isInteracting) {
                hideCurrentControls();
            }
        };
        
        chartElement.addEventListener('mouseenter', handleMouseEnter);
        chartElement.addEventListener('mouseleave', handleMouseLeave);
        
        // Initial controls state
        setTimeout(() => {
            if (!isLockModeEnabled) {
                hideCurrentControls();
            }
        }, 1000);
        
        // Store moveable + cleanup function
        chartElement.moveable = moveable;
        chartElement.cleanupMoveable = () => {
            if (moveable) {
                moveable.destroy();
            }
            window.removeEventListener('resize', debouncedResize);
            chartElement.removeEventListener('mouseenter', handleMouseEnter);
            chartElement.removeEventListener('mouseleave', handleMouseLeave);
            
            if (hideTimer) {
                clearTimeout(hideTimer);
            }
            
            delete chartElement.moveable;
            delete chartElement.cleanupMoveable;
        };
        
        return moveable;
        
    } catch (error) {
        console.error('Error initializing drag-resize:', error);
        showMessage('चार्ट ड्रैग/रीसाइज initialization में त्रुटि', 'error');
        return null;
    }
}

/**
 * किसी chart element को पूरी तरह cleanup करने का function
 */
export function destroyChartMoveable(chartElement) {
    try {
        if (chartElement && chartElement.cleanupMoveable) {
            chartElement.cleanupMoveable();
        }
    } catch (error) {
        console.error('Error destroying chart moveable:', error);
    }
}

/**
 * सभी charts के moveable instances को cleanup करने का function
 */
export function cleanupAllMoveables() {
    document.querySelectorAll('.visualization-container').forEach(container => {
        destroyChartMoveable(container);
    });
}

/**
 * Keyboard shortcut के लिए (Ctrl+L)
 */
export function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            toggleLockMode();
        }
    });
}

/**
 * Page unload पर cleanup करने का function
 */
export function initializePageCleanup() {
    window.addEventListener('beforeunload', () => {
        cleanupAllMoveables();
    });
}

// Page load पर keyboard shortcuts initialize करें
document.addEventListener('DOMContentLoaded', () => {
    initializeKeyboardShortcuts();
    initializePageCleanup();
});