import { allActiveChartInstances } from './main.js';

// रेडीमेड इफ़ेक्ट्स टेम्पलेट्स
export const chartEffectsTemplates = [
    {
        id: 'effect-shadow-light',
        name: 'हल्की परछाई',
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowOffsetY: 5,
        backgroundColor: '#f8f9fa',
        borderColor: '#e9ecef',
        borderWidth: 1
    },
    {
        id: 'effect-shadow-dark',
        name: 'गहरी परछाई',
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowBlur: 15,
        shadowOffsetX: 5,
        shadowOffsetY: 5,
        backgroundColor: '#2c2c2c',
        borderColor: '#444444',
        borderWidth: 1
    },
    {
        id: 'effect-glow',
        name: 'चमक (Glow)',
        shadowColor: '#007bff',
        shadowBlur: 15,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        backgroundColor: '#ffffff',
        borderColor: '#007bff',
        borderWidth: 2
    },
    {
        id: 'effect-border-simple',
        name: 'साधारण बॉर्डर',
        shadowColor: 'transparent',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        borderWidth: 2
    }
];

// ===============================
// Utility Functions
// ===============================

/**
 * चार्ट DOM एलिमेंट प्राप्त करें
 */
function getChartDom(chartInstanceOrId) {
    if (chartInstanceOrId && typeof chartInstanceOrId.getDom === 'function') {
        return chartInstanceOrId.getDom(); // ECharts instance
    }
    if (typeof chartInstanceOrId === 'string') {
        return document.getElementById(chartInstanceOrId); // by id
    }
    if (chartInstanceOrId instanceof HTMLElement) {
        return chartInstanceOrId; // already DOM
    }
    return null;
}

/**
 * इफ़ेक्ट ऑब्जेक्ट वैलिडेशन
 */
function validateEffectObject(effectObj) {
    if (!effectObj || typeof effectObj !== 'object') {
        throw new Error('इफ़ेक्ट ऑब्जेक्ट वैध नहीं है');
    }

    const requiredProps = ['shadowColor', 'shadowBlur', 'backgroundColor', 'borderColor', 'borderWidth'];
    const missingProps = requiredProps.filter(prop => !effectObj.hasOwnProperty(prop));
    
    if (missingProps.length > 0) {
        throw new Error(`आवश्यक प्रॉपर्टीज गुम हैं: ${missingProps.join(', ')}`);
    }

    // टाइप चेक
    if (typeof effectObj.shadowBlur !== 'number' || effectObj.shadowBlur < 0) {
        throw new Error('shadowBlur एक सकारात्मक संख्या होनी चाहिए');
    }

    if (typeof effectObj.borderWidth !== 'number' || effectObj.borderWidth < 0) {
        throw new Error('borderWidth एक सकारात्मक संख्या होनी चाहिए');
    }

    return true;
}

/**
 * डिबाउंस फंक्शन
 */
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

// ===============================
// Unified Effect Function
// ===============================

/**
 * चार्ट पर इफ़ेक्ट लागू करें
 */
export function applyEffect(chartInstanceOrId, effectObj) {
    try {
        const chartDom = getChartDom(chartInstanceOrId);
        if (!chartDom) {
            console.warn('चार्ट DOM नहीं मिला:', chartInstanceOrId);
            return false;
        }

        if (!effectObj) {
            throw new Error('इफ़ेक्ट ऑब्जेक्ट आवश्यक है');
        }

        // वैलिडेशन
        validateEffectObject(effectObj);

        const {
            shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY,
            backgroundColor, borderColor, borderWidth
        } = effectObj;

        // शैडो (CSS-based for all)
        if (shadowColor && shadowBlur !== undefined) {
            chartDom.style.boxShadow = `${shadowOffsetX || 0}px ${shadowOffsetY || 0}px ${shadowBlur}px ${shadowColor}`;
        } else {
            chartDom.style.boxShadow = '';
        }

        // बैकग्राउंड
        if (backgroundColor) {
            if (chartDom.__echarts__) {
                try {
                    chartDom.__echarts__.setOption({ backgroundColor });
                } catch (e) {
                    console.warn('ECharts बैकग्राउंड सेट करने में त्रुटि:', e);
                }
            }
            chartDom.style.backgroundColor = backgroundColor;
        } else {
            chartDom.style.backgroundColor = '';
        }

        // बॉर्डर
        if (borderColor && borderWidth !== undefined) {
            chartDom.style.border = `${borderWidth}px solid ${borderColor}`;
            chartDom.style.borderRadius = '8px'; // बेहतर दिखने के लिए
        } else {
            chartDom.style.border = '';
            chartDom.style.borderRadius = '';
        }

        // फीडबैक एनिमेशन
        chartDom.style.transition = "all 0.4s ease";
        chartDom.classList.add("chart-effect-applied");
        
        setTimeout(() => {
            chartDom.classList.remove("chart-effect-applied");
        }, 800);

        return true;
    } catch (error) {
        console.error('इफ़ेक्ट लागू करने में त्रुटि:', error);
        showErrorAlert(`इफ़ेक्ट लागू करने में त्रुटि: ${error.message}`);
        return false;
    }
}

/**
 * चार्ट के इफ़ेक्ट रीसेट करें
 */
export function resetEffects(chartInstanceOrId) {
    const chartDom = getChartDom(chartInstanceOrId);
    if (!chartDom) return false;

    try {
        chartDom.style.boxShadow = '';
        chartDom.style.backgroundColor = '';
        chartDom.style.border = '';
        chartDom.style.borderRadius = '';
        
        if (chartDom.__echarts__) {
            chartDom.__echarts__.setOption({ backgroundColor: '' });
        }

        chartDom.classList.remove("chart-effect-applied");
        return true;
    } catch (error) {
        console.error('इफ़ेक्ट रीसेट करने में त्रुटि:', error);
        return false;
    }
}

/**
 * कस्टम इफ़ेक्ट सेव करें
 */
export function saveCustomEffect(effectObj, name) {
    try {
        const customEffects = JSON.parse(localStorage.getItem('customChartEffects') || '[]');
        const newEffect = {
            ...effectObj,
            id: `custom-effect-${Date.now()}`,
            name: name || `कस्टम इफ़ेक्ट ${customEffects.length + 1}`,
            createdAt: new Date().toISOString()
        };
        
        customEffects.push(newEffect);
        localStorage.setItem('customChartEffects', JSON.stringify(customEffects));
        
        showSuccessAlert('कस्टम इफ़ेक्ट सफलतापूर्वक सेव हुआ!');
        return newEffect.id;
    } catch (error) {
        console.error('कस्टम इफ़ेक्ट सेव करने में त्रुटि:', error);
        showErrorAlert('कस्टम इफ़ेक्ट सेव करने में त्रुटि');
        return null;
    }
}

/**
 * सेव्ड कस्टम इफ़ेक्ट्स लोड करें
 */
export function loadCustomEffects() {
    try {
        return JSON.parse(localStorage.getItem('customChartEffects') || '[]');
    } catch (error) {
        console.error('कस्टम इफ़ेक्ट्स लोड करने में त्रुटि:', error);
        return [];
    }
}

// ===============================
// Chart Effects Gallery Rendering
// ===============================

/**
 * इफ़ेक्ट टेम्पलेट्स गैलरी रेंडर करें
 */
export function renderChartEffectsTemplates(galleryElement, onSelectCallback) {
    if (!galleryElement) return;

    try {
        galleryElement.innerHTML = '';
        
        // प्री-डिफाइंड टेम्पलेट्स
        chartEffectsTemplates.forEach(template => {
            const templateDiv = createEffectTemplateCard(template);
            galleryElement.appendChild(templateDiv);

            templateDiv.addEventListener('click', () => {
                // सभी सेलेक्शन हटाएं
                galleryElement.querySelectorAll('.chart-effect-template-item').forEach(card => {
                    card.classList.remove('selected', 'border-primary');
                });
                
                // नया सेलेक्ट करें
                templateDiv.classList.add('selected', 'border-primary');
                if (onSelectCallback) onSelectCallback(template.id);
            });
        });

        // कस्टम इफ़ेक्ट्स
        const customEffects = loadCustomEffects();
        if (customEffects.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'w-100 border-top my-3';
            galleryElement.appendChild(separator);

            const customHeader = document.createElement('h6');
            customHeader.className = 'text-muted mb-2';
            customHeader.textContent = 'कस्टम इफ़ेक्ट्स';
            galleryElement.appendChild(customHeader);

            customEffects.forEach(template => {
                const templateDiv = createEffectTemplateCard(template);
                galleryElement.appendChild(templateDiv);

                templateDiv.addEventListener('click', () => {
                    galleryElement.querySelectorAll('.chart-effect-template-item').forEach(card => {
                        card.classList.remove('selected', 'border-primary');
                    });
                    templateDiv.classList.add('selected', 'border-primary');
                    if (onSelectCallback) onSelectCallback(template.id);
                });
            });
        }

    } catch (error) {
        console.error('इफ़ेक्ट गैलरी रेंडर करने में त्रुटि:', error);
        galleryElement.innerHTML = '<p class="text-danger">गैलरी लोड करने में त्रुटि</p>';
    }
}

/**
 * इफ़ेक्ट टेम्पलेट कार्ड बनाएं
 */
function createEffectTemplateCard(template) {
    const templateDiv = document.createElement('div');
    templateDiv.classList.add('chart-effect-template-item', 'border', 'bg-light', 'p-3', 'mb-2');
    templateDiv.dataset.id = template.id;

    const previewBox = document.createElement('div');
    previewBox.className = 'effect-preview-box';
    previewBox.style.cssText = `
        width: 80px;
        height: 50px;
        margin: 0 auto 8px;
        background-color: ${template.backgroundColor};
        border: ${template.borderWidth}px solid ${template.borderColor};
        box-shadow: ${template.shadowOffsetX}px ${template.shadowOffsetY}px ${template.shadowBlur}px ${template.shadowColor};
        border-radius: 6px;
        transition: transform 0.2s ease;
    `;
    templateDiv.appendChild(previewBox);

    const templateName = document.createElement('div');
    templateName.className = 'template-name text-center';
    templateName.textContent = template.name;
    templateDiv.appendChild(templateName);

    // हॉवर इफ़ेक्ट
    templateDiv.addEventListener('mouseenter', () => {
        previewBox.style.transform = 'scale(1.05)';
    });
    
    templateDiv.addEventListener('mouseleave', () => {
        previewBox.style.transform = 'scale(1)';
    });

    return templateDiv;
}

// ===============================
// Dashboard Chart List Rendering
// ===============================

/**
 * डैशबोर्ड चार्ट लिस्ट रेंडर करें
 */
export function renderDashboardChartList(listElement) {
    if (!listElement) return;

    try {
        listElement.innerHTML = '';
        let chartCount = 0;

        // ECharts इंस्टेंसेस
        allActiveChartInstances.forEach((chart, index) => {
            const chartDom = getChartDom(chart);
            if (!chartDom) return;

            const chartId = chartDom.id || `chart-${Date.now()}-${index}`;
            const option = chart.getOption ? chart.getOption() : {};
            const chartTitle = option.title?.[0]?.text || `चार्ट ${index + 1}`;
            const chartImage = chart.getDataURL ? chart.getDataURL({ pixelRatio: 1, backgroundColor: 'transparent' }) : '';

            const listItem = createChartListItem(chartId, chartTitle, chartImage, 'ECharts');
            listElement.appendChild(listItem);
            chartCount++;
        });

        // Plotly चार्ट्स
        document.querySelectorAll('.chart-canvas, .js-plotly-plot').forEach((dom, idx) => {
            if (!dom.__echarts__ && dom.id) {
                const chartId = dom.id;
                const chartTitle = dom.closest('.visualization-container')?.querySelector('.chart-title')?.textContent ||
                    `Plotly Chart ${idx + 1}`;

                let previewImage = '';
                try {
                    const canvas = dom.querySelector('canvas');
                    const svg = dom.querySelector('svg');
                    if (canvas) {
                        previewImage = canvas.toDataURL('image/png');
                    } else if (svg) {
                        previewImage = 'svg';
                    }
                } catch (e) {
                    console.warn('Plotly प्रिव्यू इमेज बनाने में त्रुटि:', e);
                }

                const listItem = createChartListItem(chartId, chartTitle, previewImage, 'Plotly');
                listElement.appendChild(listItem);
                chartCount++;
            }
        });

        if (chartCount === 0) {
            listElement.innerHTML = '<p class="text-muted small text-center">कोई चार्ट उपलब्ध नहीं है।</p>';
        } else {
            const counter = document.createElement('div');
            counter.className = 'text-muted small mt-2';
            counter.textContent = `कुल ${chartCount} चार्ट मिले`;
            listElement.appendChild(counter);
        }

    } catch (error) {
        console.error('चार्ट लिस्ट रेंडर करने में त्रुटि:', error);
        listElement.innerHTML = '<p class="text-danger">चार्ट लिस्ट लोड करने में त्रुटि</p>';
    }
}

/**
 * चार्ट लिस्ट आइटम बनाएं
 */
function createChartListItem(chartId, chartTitle, previewImage, chartType) {
    const div = document.createElement('div');
    div.classList.add('form-check', 'd-flex', 'align-items-center', 'mb-2', 'p-2', 'border', 'rounded');
    
    let previewHtml = '';
    if (previewImage === 'svg') {
        previewHtml = `<div class="bg-light border rounded me-2 d-flex align-items-center justify-content-center" style="width:40px; height:30px;">
            <small class="text-muted">SVG</small>
        </div>`;
    } else if (previewImage) {
        previewHtml = `<img src="${previewImage}" alt="${chartTitle}" width="40" height="30" class="chart-preview-image border rounded me-2">`;
    } else {
        previewHtml = `<div class="bg-light border rounded me-2 d-flex align-items-center justify-content-center" style="width:40px; height:30px;">
            <i class="bi bi-bar-chart text-muted"></i>
        </div>`;
    }

    div.innerHTML = `
        <input class="form-check-input me-2" type="checkbox" value="${chartId}" id="effects-checkbox-${chartId}">
        <label class="form-check-label d-flex align-items-center w-100" for="effects-checkbox-${chartId}">
            ${previewHtml}
            <div class="flex-grow-1">
                <div class="small fw-bold">${chartTitle}</div>
                <div class="text-muted" style="font-size: 0.7rem;">${chartType}</div>
            </div>
        </label>
    `;

    return div;
}

// ===============================
// JSON Parser for custom effect
// ===============================

/**
 * कस्टम इफ़ेक्ट कोड पार्स करें
 */
function parseCustomEffectCode(jsonString) {
    const errorAlert = document.getElementById('codeErrorAlert');
    if (errorAlert) {
        errorAlert.style.display = 'none';
    }

    try {
        if (!jsonString.trim()) {
            throw new Error('JSON कोड खाली है');
        }

        const parsed = JSON.parse(jsonString);
        validateEffectObject(parsed);
        return parsed;
    } catch (error) {
        const errorMessage = `JSON पार्स करने में त्रुटि: ${error.message}`;
        console.error(errorMessage);
        
        if (errorAlert) {
            errorAlert.textContent = errorMessage;
            errorAlert.style.display = 'block';
        } else {
            showErrorAlert(errorMessage);
        }
        return null;
    }
}

// ===============================
// CodeMirror Setup
// ===============================

let codeMirrorEditor = null;
let currentTextareaId = null;

/**
 * CodeMirror एडिटर इनिशियलाइज़ करें
 */
function initializeCodeMirror() {
    if (!codeMirrorEditor) {
        const editorContainer = document.getElementById('editorContainer');
        if (!editorContainer) {
            console.error('CodeMirror कंटेनर नहीं मिला');
            return;
        }

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

            // रीसाइज ऑब्जर्वर
            const resizeObserver = new ResizeObserver(() => {
                if (codeMirrorEditor) {
                    setTimeout(() => codeMirrorEditor.refresh(), 100);
                }
            });
            resizeObserver.observe(editorContainer);

        } catch (error) {
            console.error('CodeMirror इनिशियलाइज़ करने में त्रुटि:', error);
        }
    }
}

// ===============================
// UI Helper Functions
// ===============================

/**
 * एरर अलर्ट दिखाएं
 */
function showErrorAlert(message) {
    showAlert(message, 'danger');
}

/**
 * सक्सेस अलर्ट दिखाएं
 */
function showSuccessAlert(message) {
    showAlert(message, 'success');
}

/**
 * अलर्ट दिखाएं
 */
function showAlert(message, type) {
    // अलर्ट कंटेनर खोजें या बनाएं
    let alertContainer = document.getElementById('effectAlertsContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'effectAlertsContainer';
        alertContainer.className = 'position-fixed top-0 end-0 p-3';
        alertContainer.style.zIndex = '1060';
        document.body.appendChild(alertContainer);
    }

    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    alertContainer.insertAdjacentHTML('beforeend', alertHtml);

    // ऑटो हाइड
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            const bsAlert = new bootstrap.Alert(alertElement);
            bsAlert.close();
        }
    }, 5000);
}

/**
 * डिबाउंस्ड चार्ट लिस्ट अपडेट
 */
const debouncedRenderChartList = debounce((listElement) => {
    renderDashboardChartList(listElement);
}, 300);

// ===============================
// DOMContentLoaded Logic
// ===============================

document.addEventListener('DOMContentLoaded', function() {
    try {
        // एलिमेंट्स
        const applyChartEffects = document.getElementById('applyChartEffects');
        const resetAllEffects = document.getElementById('resetAllEffects');
        const saveCustomEffectBtn = document.getElementById('saveCustomEffectBtn');
        const refreshChartsListBtn = document.getElementById('refreshChartsListBtn');

        // रेडियो बटन्स
        const customEffectsRadio = document.getElementById('customEffectsRadio');
        const templateEffectsRadio = document.getElementById('templateEffectsRadio');
        const customCodeRadio = document.getElementById('customCodeRadio');

        // सेक्शन्स
        const customEffectsSection = document.getElementById('customEffectsSection');
        const templateEffectsSection = document.getElementById('templateEffectsSection');
        const customCodeEffectsSection = document.getElementById('customCodeEffectsSection');

        // वैलिडेशन
        if (!applyChartEffects) {
            throw new Error('मुख्य एलिमेंट्स नहीं मिले');
        }

        // टैब स्विचिंग
        function setupTabSwitching() {
            const radios = [customEffectsRadio, templateEffectsRadio, customCodeRadio];
            const sections = [customEffectsSection, templateEffectsSection, customCodeEffectsSection];

            radios.forEach((radio, index) => {
                if (radio) {
                    radio.addEventListener('change', () => {
                        sections.forEach((section, sectionIndex) => {
                            if (section) {
                                section.style.display = sectionIndex === index ? 'block' : 'none';
                            }
                        });
                    });
                }
            });
        }

        // कोड एडिटर मोडल सेटअप
        function setupCodeEditor() {
            const codeEditorModal = new bootstrap.Modal(document.getElementById('codeEditorModal'));
            const openChartFormatEditorBtn = document.getElementById('openChartFormatEditorBtn');
            const openChartEffectEditorBtn = document.getElementById('openChartEffectEditorBtn');
            const saveCodeBtn = document.getElementById('saveCodeBtn');

            if (openChartFormatEditorBtn) {
                openChartFormatEditorBtn.addEventListener('click', () => {
                    initializeCodeMirror();
                    currentTextareaId = 'customChartContainerCode';
                    const textarea = document.getElementById(currentTextareaId);
                    if (textarea && codeMirrorEditor) {
                        codeMirrorEditor.setValue(textarea.value);
                        codeEditorModal.show();
                    }
                });
            }

            if (openChartEffectEditorBtn) {
                openChartEffectEditorBtn.addEventListener('click', () => {
                    initializeCodeMirror();
                    currentTextareaId = 'customEffectCode';
                    const textarea = document.getElementById(currentTextareaId);
                    if (textarea && codeMirrorEditor) {
                        codeMirrorEditor.setValue(textarea.value);
                        codeEditorModal.show();
                    }
                });
            }

            if (saveCodeBtn) {
                saveCodeBtn.addEventListener('click', () => {
                    if (currentTextareaId && codeMirrorEditor) {
                        const textarea = document.getElementById(currentTextareaId);
                        if (textarea) {
                            textarea.value = codeMirrorEditor.getValue();
                        }
                    }
                    codeEditorModal.hide();
                });
            }

            // मोडल शो इवेंट
            const codeEditorModalElement = document.getElementById('codeEditorModal');
            if (codeEditorModalElement) {
                codeEditorModalElement.addEventListener('shown.bs.modal', () => {
                    if (codeMirrorEditor) {
                        setTimeout(() => {
                            codeMirrorEditor.refresh();
                            codeMirrorEditor.focus();
                        }, 100);
                    }
                });
            }
        }

        // मेन एप्लाई बटन
        function setupApplyButton() {
            applyChartEffects.addEventListener('click', () => {
                let selectedEffect = null;

                try {
                    if (customEffectsRadio?.checked) {
                        // कस्टम इफ़ेक्ट्स
                        selectedEffect = {
                            shadowColor: document.getElementById('shadowColor')?.value || 'rgba(0, 0, 0, 0.2)',
                            shadowBlur: parseInt(document.getElementById('shadowBlur')?.value) || 10,
                            shadowOffsetX: parseInt(document.getElementById('shadowOffsetX')?.value) || 0,
                            shadowOffsetY: parseInt(document.getElementById('shadowOffsetY')?.value) || 5,
                            backgroundColor: document.getElementById('backgroundColor')?.value || '#ffffff',
                            borderColor: document.getElementById('borderColor')?.value || '#000000',
                            borderWidth: parseInt(document.getElementById('borderWidth')?.value) || 1
                        };
                    } else if (templateEffectsRadio?.checked) {
                        // टेम्पलेट इफ़ेक्ट्स
                        const selectedTemplateId = document.querySelector('.chart-effect-template-item.selected')?.dataset.id;
                        if (selectedTemplateId) {
                            selectedEffect = chartEffectsTemplates.find(t => t.id === selectedTemplateId) ||
                                           loadCustomEffects().find(t => t.id === selectedTemplateId);
                        }
                    } else if (customCodeRadio?.checked) {
                        // कस्टम कोड
                        const customCode = document.getElementById('customEffectCode')?.value;
                        if (customCode) {
                            selectedEffect = parseCustomEffectCode(customCode);
                        }
                    }

                    if (!selectedEffect) {
                        throw new Error('कृपया एक इफ़ेक्ट चुनें, टेम्पलेट चुनें या कोड दर्ज करें।');
                    }

                    // चार्ट्स सिलेक्शन
                    const applyToAll = document.getElementById('applyToAllRadio')?.checked;
                    let chartsToUpdate = [];

                    if (applyToAll) {
                        // सभी चार्ट्स
                        allActiveChartInstances.forEach(chartInst => chartsToUpdate.push(chartInst));
                        document.querySelectorAll('.chart-canvas, .js-plotly-plot').forEach(dom => {
                            if (!dom.__echarts__) chartsToUpdate.push(dom);
                        });
                    } else {
                        // सिलेक्टेड चार्ट्स
                        const chartList = document.getElementById('chartSelectionListEffects');
                        if (chartList) {
                            const checkedBoxes = chartList.querySelectorAll('input[type="checkbox"]:checked');
                            if (checkedBoxes.length === 0) {
                                throw new Error('कृपया कम से कम एक चार्ट सिलेक्ट करें');
                            }

                            checkedBoxes.forEach(checkbox => {
                                const chartId = checkbox.value;
                                const chartInstance = echarts?.getInstanceByDom?.(document.getElementById(chartId));
                                if (chartInstance) {
                                    chartsToUpdate.push(chartInstance);
                                } else {
                                    const chartDom = document.getElementById(chartId);
                                    if (chartDom) chartsToUpdate.push(chartDom);
                                }
                            });
                        }
                    }

                    if (chartsToUpdate.length === 0) {
                        throw new Error('कोई चार्ट उपलब्ध नहीं है');
                    }

                    // इफ़ेक्ट अप्लाई करें
                    let successCount = 0;
                    chartsToUpdate.forEach(chart => {
                        if (applyEffect(chart, selectedEffect)) {
                            successCount++;
                        }
                    });

                    showSuccessAlert(`${successCount} चार्ट्स पर इफ़ेक्ट सफलतापूर्वक लागू हुआ`);

                } catch (error) {
                    showErrorAlert(error.message);
                }
            });
        }

        // रीसेट बटन
        function setupResetButton() {
            if (resetAllEffects) {
                resetAllEffects.addEventListener('click', () => {
                    try {
                        let chartsToReset = [];
                        
                        // सभी एक्टिव चार्ट्स
                        allActiveChartInstances.forEach(chartInst => chartsToReset.push(chartInst));
                        document.querySelectorAll('.chart-canvas, .js-plotly-plot').forEach(dom => {
                            chartsToReset.push(dom);
                        });

                        let resetCount = 0;
                        chartsToReset.forEach(chart => {
                            if (resetEffects(chart)) {
                                resetCount++;
                            }
                        });

                        showSuccessAlert(`${resetCount} चार्ट्स रीसेट हो गए`);
                    } catch (error) {
                        showErrorAlert(`रीसेट करने में त्रुटि: ${error.message}`);
                    }
                });
            }
        }

        // सेव कस्टम इफ़ेक्ट बटन
        function setupSaveCustomEffectButton() {
            if (saveCustomEffectBtn) {
                saveCustomEffectBtn.addEventListener('click', () => {
                    try {
                        const effectName = prompt('इफ़ेक्ट का नाम दर्ज करें:');
                        if (!effectName) return;

                        const effectObj = {
                            shadowColor: document.getElementById('shadowColor')?.value || 'rgba(0, 0, 0, 0.2)',
                            shadowBlur: parseInt(document.getElementById('shadowBlur')?.value) || 10,
                            shadowOffsetX: parseInt(document.getElementById('shadowOffsetX')?.value) || 0,
                            shadowOffsetY: parseInt(document.getElementById('shadowOffsetY')?.value) || 5,
                            backgroundColor: document.getElementById('backgroundColor')?.value || '#ffffff',
                            borderColor: document.getElementById('borderColor')?.value || '#000000',
                            borderWidth: parseInt(document.getElementById('borderWidth')?.value) || 1
                        };

                        if (saveCustomEffect(effectObj, effectName)) {
                            // गैलरी रिफ्रेश करें
                            const galleryElement = document.getElementById('effectsTemplatesGallery');
                            if (galleryElement) {
                                renderChartEffectsTemplates(galleryElement);
                            }
                        }
                    } catch (error) {
                        showErrorAlert(`कस्टम इफ़ेक्ट सेव करने में त्रुटि: ${error.message}`);
                    }
                });
            }
        }

        // रिफ्रेश चार्ट्स लिस्ट बटन
        function setupRefreshChartsList() {
            if (refreshChartsListBtn) {
                refreshChartsListBtn.addEventListener('click', () => {
                    const listElement = document.getElementById('chartSelectionListEffects');
                    if (listElement) {
                        debouncedRenderChartList(listElement);
                        showSuccessAlert('चार्ट लिस्ट रिफ्रेश हो गई');
                    }
                });
            }
        }

        // इनिशियलाइज़ेशन
        function initialize() {
            setupTabSwitching();
            setupCodeEditor();
            setupApplyButton();
            setupResetButton();
            setupSaveCustomEffectButton();
            setupRefreshChartsList();

            // इनिशियल रेंडर
            const galleryElement = document.getElementById('effectsTemplatesGallery');
            if (galleryElement) {
                renderChartEffectsTemplates(galleryElement);
            }

            const listElement = document.getElementById('chartSelectionListEffects');
            if (listElement) {
                debouncedRenderChartList(listElement);
            }

            console.log('चार्ट इफ़ेक्ट्स सिस्टम सफलतापूर्वक लोड हुआ');
        }

        initialize();

    } catch (error) {
        console.error('DOMContentLoaded में त्रुटि:', error);
        showErrorAlert(`सिस्टम लोड करने में त्रुटि: ${error.message}`);
    }
});

// CSS स्टाइल्स ऑटो एड
const effectStyles = `
.chart-effect-template-item {
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 8px;
    border: 2px solid transparent !important;
}

.chart-effect-template-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.chart-effect-template-item.selected {
    border: 2px solid #007bff !important;
    background-color: #e7f3ff !important;
}

.effect-preview-box {
    transition: transform 0.2s ease;
}

.chart-effect-applied {
    animation: pulse-effect 0.8s ease;
}

@keyframes pulse-effect {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
}

.chart-preview-image {
    object-fit: contain;
}

.template-name {
    font-size: 0.8rem;
    font-weight: 500;
}
`;

// स्टाइल्स ऑटो एड
if (document.head) {
    const styleElement = document.createElement('style');
    styleElement.textContent = effectStyles;
    document.head.appendChild(styleElement);
}