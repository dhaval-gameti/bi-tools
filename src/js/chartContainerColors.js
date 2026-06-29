// js/chartContainerColors.js

let chartContainerColorTemplates = [];
let allActiveChartInstances = [];

// Store reference to chart instances
export function setActiveChartInstances(instances) {
    allActiveChartInstances = instances;
}

// Load templates function
export function loadChartContainerColorTemplates() {
    return fetch('../src/data/chartContainerColors.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            chartContainerColorTemplates = data;
            console.log('Templates loaded successfully:', chartContainerColorTemplates.length, 'templates');
            return chartContainerColorTemplates;
        })
        .catch(error => {
            console.error('Failed to load chart container color templates:', error);
            chartContainerColorTemplates = [];
            return [];
        });
}

/**
 * Renders the chart container color template options in the specified gallery element.
 * @param {HTMLElement} galleryElement - The HTML element where the templates will be displayed.
 * @param {function} onSelectCallback - Callback function to execute when a template is selected.
 */
export function renderChartContainerColorTemplates(galleryElement, onSelectCallback) {
    loadChartContainerColorTemplates().then(() => {
        if (!galleryElement) {
            console.error('Gallery element not found for rendering templates');
            return;
        }

        galleryElement.innerHTML = '';
        
        if (!chartContainerColorTemplates || chartContainerColorTemplates.length === 0) {
            galleryElement.innerHTML = '<p class="text-muted small">कोई टेम्पलेट उपलब्ध नहीं है</p>';
            return;
        }

        chartContainerColorTemplates.forEach(template => {
            const templateDiv = document.createElement('div');
            templateDiv.classList.add('template-card', 'rounded', 'shadow-sm', 'p-2', 'text-center', 'cursor-pointer');
            templateDiv.setAttribute('data-template-id', template.id);
            
            Object.assign(templateDiv.style, {
                width: '100px',
                height: '70px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                ...template.style
            });
            
            const innerColorPreview = document.createElement('div');
            innerColorPreview.style.cssText = `
                width: 40px; 
                height: 20px; 
                background: ${template.chartBackgroundColor?.type ? 
                    `linear-gradient(45deg, ${template.chartBackgroundColor.colorStops?.map(cs => cs.color).join(', ') || '#fff'})` 
                    : template.chartBackgroundColor || '#fff'}; 
                border: 1px solid #ccc; 
                margin-bottom: 5px;
                border-radius: 3px;
            `;
            templateDiv.appendChild(innerColorPreview);
            
            const templateName = document.createElement('small');
            templateName.classList.add('fw-bold');
            templateName.textContent = template.name;
            templateName.style.color = template.style?.color || '#000';
            templateName.style.fontSize = '12px';
            
            templateDiv.appendChild(templateName);
            galleryElement.appendChild(templateDiv);
            
            templateDiv.addEventListener('click', () => {
                // Remove border from all cards
                galleryElement.querySelectorAll('.template-card').forEach(card => {
                    card.classList.remove('border', 'border-primary', 'border-3');
                    card.style.transform = 'scale(1)';
                });
                
                // Add border to selected card
                templateDiv.classList.add('border', 'border-primary', 'border-3');
                templateDiv.style.transform = 'scale(1.05)';
                
                console.log('Template selected:', template.id);
                
                if (onSelectCallback) {
                    onSelectCallback(template.id);
                }
            });
        });
    }).catch(error => {
        console.error('Error rendering templates:', error);
        galleryElement.innerHTML = '<p class="text-danger small">टेम्पलेट लोड करने में त्रुटि</p>';
    });
}

/**
 * Renders a list of existing charts in the specified element for user selection,
 * including a small preview of the chart.
 * @param {HTMLElement} listElement - The element where the list of charts will be rendered.
 * @param {Array<Object>} existingCharts - The array of chart instances.
 */
export function renderDashboardChartOverview(listElement, existingCharts) {
    if (!listElement) {
        console.error('List element not found for chart overview');
        return;
    }
    
    listElement.innerHTML = '';
    
    if (!existingCharts || existingCharts.length === 0) {
        listElement.innerHTML = '<p class="text-muted small">कोई चार्ट उपलब्ध नहीं है।</p>';
        return;
    }
    
    existingCharts.forEach((chart, index) => {
        try {
            const chartDom = chart.getDom ? chart.getDom() : null;
            if (!chartDom) {
                console.warn('Chart DOM not found for chart:', chart);
                return;
            }
            
            const chartId = chartDom.id;
            const containerId = `container-${chartId}`;
            const chartTitle = chart.getOption?.().title?.[0]?.text || `चार्ट ${index + 1}`;
            
            // Get chart snapshot
            let chartImage = '';
            try {
                chartImage = chart.getDataURL({
                    pixelRatio: 1,
                    backgroundColor: 'transparent'
                });
            } catch (e) {
                console.warn('Could not get chart image:', e);
                chartImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA2MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNDQ0NDQ0MiLz4KPHN2Zz4=';
            }
            
            const div = document.createElement('div');
            div.classList.add('form-check', 'd-flex', 'align-items-center', 'mb-2');
            
            div.innerHTML = `
                <input class="form-check-input me-2" type="checkbox" value="${containerId}" id="checkbox-${containerId}">
                <label class="form-check-label d-flex align-items-center" for="checkbox-${containerId}" style="cursor: pointer;">
                    <img src="${chartImage}" alt="${chartTitle}" class="chart-preview-image border rounded me-2" style="width: 40px; height: 30px; object-fit: contain;">
                    <span class="small">${chartTitle}</span>
                </label>
            `;
            listElement.appendChild(div);
        } catch (error) {
            console.error('Error rendering chart overview item:', error);
        }
    });
}

/**
 * Applies the selected chart container color template.
 * @param {string} templateId - The ID of the selected template.
 * @param {Array<Object>} existingCharts - An array of current chart instances.
 * @param {boolean} applyToAll - Flag to indicate if the template should be applied to all charts.
 * @param {Array<string>} selectedChartIds - An array of IDs for selected charts if applyToAll is false.
 */
export function applyChartContainerColor(templateId, existingCharts, applyToAll, selectedChartIds = []) {
    console.log('applyChartContainerColor called with:', {
        templateId,
        existingChartsCount: existingCharts?.length,
        applyToAll,
        selectedChartIds
    });

    // Check if templates are loaded
    if (!chartContainerColorTemplates || chartContainerColorTemplates.length === 0) {
        console.error('Chart container color templates not loaded yet');
        alert('कृपया टेम्पलेट लोड होने का इंतज़ार करें');
        return;
    }

    const selectedTemplate = chartContainerColorTemplates.find(t => t.id === templateId);
    if (!selectedTemplate) {
        console.warn(`Chart container color template with ID ${templateId} not found. Available templates:`, 
            chartContainerColorTemplates.map(t => t.id));
        alert(`टेम्पलेट ID ${templateId} नहीं मिला`);
        return;
    }

    console.log('Applying template:', selectedTemplate);

    const chartContainers = document.querySelectorAll('.visualization-container');
    console.log('Found chart containers:', chartContainers.length);

    if (applyToAll) {
        // Apply to all charts
        chartContainers.forEach(container => {
            if (selectedTemplate.style) {
                Object.assign(container.style, selectedTemplate.style);
                console.log('Applied styles to container:', container.id);
            }
        });

        // Update chart backgrounds
        if (existingCharts && existingCharts.length > 0) {
            existingCharts.forEach(chart => {
                if (chart && typeof chart.setOption === 'function') {
                    try {
                        chart.setOption({
                            backgroundColor: selectedTemplate.chartBackgroundColor || 'transparent'
                        }, true);
                        console.log('Updated chart background:', chart.getDom?.()?.id);
                    } catch (error) {
                        console.error('Error updating chart background:', error);
                    }
                }
            });
        }
    } else {
        // Apply to selected charts only
        if (!selectedChartIds || selectedChartIds.length === 0) {
            alert('कृपया लागू करने के लिए कम से कम एक चार्ट चुनें');
            return;
        }

        selectedChartIds.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                if (selectedTemplate.style) {
                    Object.assign(container.style, selectedTemplate.style);
                    console.log('Applied styles to selected container:', containerId);
                }

                // Update chart background
                const chartId = containerId.replace('container-', '');
                const chartInstance = existingCharts?.find(chart => {
                    const chartDom = chart.getDom ? chart.getDom() : null;
                    return chartDom && chartDom.id === chartId;
                });
                
                if (chartInstance && typeof chartInstance.setOption === 'function') {
                    try {
                        chartInstance.setOption({
                            backgroundColor: selectedTemplate.chartBackgroundColor || 'transparent'
                        }, true);
                        console.log('Updated selected chart background:', chartId);
                    } catch (error) {
                        console.error('Error updating selected chart background:', error);
                    }
                }
            } else {
                console.warn(`Container with ID ${containerId} not found.`);
            }
        });
    }
    
    console.log(`Successfully applied chart container color template: ${templateId}`);
    alert(`टेम्पलेट "${selectedTemplate.name}" सफलतापूर्वक लागू किया गया!`);
}

/**
 * Applies custom chart container and chart background styles from a JSON object.
 * @param {Object} customOptions - The custom style options from the user.
 * @param {Object} customOptions.style - CSS styles for the chart container.
 * @param {string|Object} customOptions.chartBackgroundColor - The ECharts background color option.
 * @param {Array<Object>} existingCharts - An array of current chart instances.
 * @param {boolean} applyToAll - Flag to indicate if the styles should be applied to all charts.
 * @param {Array<string>} selectedChartIds - An array of IDs for selected charts if applyToAll is false.
 */
export function applyCustomChartContainerColor(customOptions, existingCharts, applyToAll, selectedChartIds = []) {
    if (!customOptions || (!customOptions.style && !customOptions.chartBackgroundColor)) {
        console.warn('Invalid custom options provided. At least "style" or "chartBackgroundColor" must be present.');
        alert('अमान्य कस्टम विकल्प। कृपया स्टाइल या बैकग्राउंड कलर प्रदान करें।');
        return;
    }

    const chartContainers = document.querySelectorAll('.visualization-container');

    const applyStyles = (container, chartInstance) => {
        // Apply container styles
        if (customOptions.style) {
            Object.assign(container.style, customOptions.style);
        }

        // Apply chart background color
        if (chartInstance && customOptions.chartBackgroundColor) {
            try {
                chartInstance.setOption({
                    backgroundColor: customOptions.chartBackgroundColor
                }, true);
            } catch (error) {
                console.error('Error applying custom chart background:', error);
            }
        }
    };

    if (applyToAll) {
        chartContainers.forEach(container => {
            const chartId = container.id.replace('container-', '');
            const chartInstance = existingCharts?.find(chart => {
                const chartDom = chart.getDom ? chart.getDom() : null;
                return chartDom && chartDom.id === chartId;
            });
            applyStyles(container, chartInstance);
        });
    } else {
        if (!selectedChartIds || selectedChartIds.length === 0) {
            alert('कृपया लागू करने के लिए कम से कम एक चार्ट चुनें');
            return;
        }

        selectedChartIds.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                const chartId = containerId.replace('container-', '');
                const chartInstance = existingCharts?.find(chart => {
                    const chartDom = chart.getDom ? chart.getDom() : null;
                    return chartDom && chartDom.id === chartId;
                });
                applyStyles(container, chartInstance);
            } else {
                console.warn(`Container with ID ${containerId} not found.`);
            }
        });
    }

    console.log('Custom chart styles applied successfully.');
    alert('कस्टम स्टाइल सफलतापूर्वक लागू किए गए!');
}

// =================================================================================================
// कोड एडिटर के लिए लॉजिक
// =================================================================================================
let codeMirrorEditor = null;
let currentTextareaId = null;

/**
 * Initializes or re-initializes the CodeMirror editor.
 * This function clears the old instance and creates a new one to prevent bugs.
 */
function initializeCodeMirror() {
    const editorContainer = document.getElementById('editorContainer');
    
    if (!editorContainer) {
        console.error('Editor container not found');
        return;
    }
    
    // पुराने एडिटर इंस्टेंस को नष्ट करें
    if (codeMirrorEditor) {
        editorContainer.innerHTML = '';
        codeMirrorEditor = null;
    }

    // नया एडिटर इंस्टेंस बनाएँ
    try {
        codeMirrorEditor = CodeMirror(editorContainer, {
            mode: "application/json",
            lineNumbers: true,
            theme: "dracula",
            matchBrackets: true,
            autofocus: true,
            lint: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-lint-markers"],
            lineWrapping: true
        });
        
        console.log('CodeMirror editor initialized successfully');
    } catch (error) {
        console.error('Error initializing CodeMirror:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('chartContainerColors.js DOMContentLoaded executed');
    
    const scopeAllCharts = document.getElementById('scopeAllCharts');
    const scopeSelectedCharts = document.getElementById('scopeSelectedCharts');
    const dashboardChartOverview = document.getElementById('dashboardChartOverview');
    
    // UI Toggling for chart selection list
    if (scopeSelectedCharts) {
        scopeSelectedCharts.addEventListener('change', () => {
            if (dashboardChartOverview) {
                dashboardChartOverview.style.display = 'block';
                renderDashboardChartOverview(document.getElementById('chartSelectionList'), allActiveChartInstances);
            }
        });
    }

    if (scopeAllCharts) {
        scopeAllCharts.addEventListener('change', () => {
            if (dashboardChartOverview) {
                dashboardChartOverview.style.display = 'none';
            }
        });
    }

    // Handle button clicks to open the editor
    const openChartFormatEditorBtn = document.getElementById('openChartFormatEditorBtn');
    if (openChartFormatEditorBtn) {
        openChartFormatEditorBtn.addEventListener('click', () => {
            initializeCodeMirror();
            currentTextareaId = 'customChartContainerCode';
            const textarea = document.getElementById(currentTextareaId);
            if (textarea && codeMirrorEditor) {
                const code = textarea.value || '{}';
                codeMirrorEditor.setValue(code);
                // Wait for the modal to be fully displayed before refreshing
                setTimeout(() => {
                    codeMirrorEditor.refresh();
                }, 100);
            }
        });
    }
    
    // Handle the "Save" button click within the modal
    const saveCodeBtn = document.getElementById('saveCodeBtn');
    if (saveCodeBtn) {
        saveCodeBtn.addEventListener('click', () => {
            if (currentTextareaId && codeMirrorEditor) {
                const code = codeMirrorEditor.getValue();
                const textarea = document.getElementById(currentTextareaId);
                if (textarea) {
                    textarea.value = code;
                }
                const modal = bootstrap.Modal.getInstance(document.getElementById('codeEditorModal'));
                if (modal) {
                    modal.hide();
                }
            }
        });
    }

    // `applyCustomChartContainerCodeBtn` बटन पर क्लिक करने पर कस्टम कोड लागू करें
    const applyCustomChartContainerCodeBtn = document.getElementById('applyCustomChartContainerCodeBtn');
    if (applyCustomChartContainerCodeBtn) {
        applyCustomChartContainerCodeBtn.addEventListener('click', () => {
            const jsonString = document.getElementById('customChartContainerCode').value;
            try {
                const customOptions = JSON.parse(jsonString);
                const applyToAll = document.getElementById('scopeAllCharts')?.checked || false;
                const selectedChartIds = applyToAll ? [] : Array.from(document.querySelectorAll('#chartSelectionList input[type="checkbox"]:checked')).map(cb => cb.value);
                
                applyCustomChartContainerColor(customOptions, allActiveChartInstances, applyToAll, selectedChartIds);
            } catch (error) {
                alert(`JSON पार्स करने में त्रुटि: ${error.message}`);
                console.error("JSON parsing error:", error);
            }
        });
    }

    // Load templates on startup
    loadChartContainerColorTemplates().then(() => {
        console.log('Chart container color templates loaded on startup');
    });
});

// Global function for backward compatibility
window.applyChartContainerColor = applyChartContainerColor;
window.renderChartContainerColorTemplates = renderChartContainerColorTemplates;