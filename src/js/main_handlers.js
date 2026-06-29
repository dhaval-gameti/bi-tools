// js/main_handlers.js

// Vedra Bi की main.js फ़ाइल का दूसरा हिस्सा।
// इसमें डेटा प्रबंधन, चार्ट निर्माण, AI चैट, और डैशबोर्ड दृश्य के लिए सभी इवेंट हैंडलर शामिल हैं।

import { showMessage, attachEventListener, exportCsv, exportExcel, exportPdf } from './utils.js';
// आपकी मेन फ़ाइल (जहाँ आप ये इम्पोर्ट कर रहे थे)

// Core Data Logic and State Management (from DataHandler.js)
import {
    setCurrentUserId,
    initData,
    handleFile,
    searchTable,
    changePage,
    applyFiltersAndSort,
    saveData,
    filteredData, // State variable
    headers,     // State variable
    saveDashboardSettings,
    loadDashboardSettings,
    //populateAddDataForm
} from '../store/DataHandler.js'; 

// UI and Controls Logic (from UIHandler.js)
import {

   populateAddDataForm,
    displayStats
} from '../store/UIHandler.js'; 

//import {} from './dataTebledisplay.js'

import { addVisualization, plotAll, clearChart, applyAdvancedChartSettings, visualizations } from './charts.js';
import { sendChatMessage, generateSummary } from './chat.js';
import { fetchDataFromApi, startLiveUpdate, stopLiveUpdate } from './liveDataHandler.js';
import { populateColumnDragLists, getChartColumns, populateDropZones } from './chartcolomdrag.js';
import { renderDashboardChartOverview } from './chartContainerColors.js';
import { chartEffectsTemplates, renderDashboardChartList } from './chartEffects.js';
import { auth } from './utils.js';


// ECharts और Plotly को आयात करें (या मान लें कि वे वैश्विक रूप से उपलब्ध हैं, लेकिन मॉडर्न JS में आयात करना बेहतर है)
// यदि वे वैश्विक हैं, तो यह ठीक है, अन्यथा उन्हें आयात करना होगा।
// const echarts = window.echarts;
// const Plotly = window.Plotly;


/**
 * सभी वैश्विक इवेंट हैंडलर संलग्न करता है।
 * @param {Array} allActiveChartInstances - main_core.js से सक्रिय चार्ट इंस्टेंस का ऐरे
 */
export function attachGlobalEventHandlers(allActiveChartInstances) {

    // केवल 'index.html' या रूट पर ही इवेंट हैंडलर संलग्न करें
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'index.html' || currentPage === '') {

        // ====================================================================
        // 1. डेटा अपलोड और प्रबंधन हैंडलर
        // ====================================================================
        
        // फाइल अपलोड
        attachEventListener('fileInput', 'change', async (e) => {
            await handleFile(e);
            if (headers.length > 0) {
                populateColumnDragLists(headers); // ड्रैग-एंड-ड्रॉप लिस्ट को पॉपुलेट करें
            }
        });
        
        // नया डेटा जोड़ें
        attachEventListener('addDataBtn', 'click', populateAddDataForm);
        attachEventListener('saveData', 'click', saveData);
        attachEventListener('downloadTemplate', 'click', () => downloadTemplate());
        
        // लाइव डेटा/API
        attachEventListener('fetchDataFromApiBtn', 'click', async () => {
            const apiUrl = document.getElementById('apiInput').value;
            const interval = parseInt(document.getElementById('updateInterval').value, 10);
            if (apiUrl) {
                startLiveUpdate(apiUrl, interval);
            } else {
                showMessage("कृपया एक API URL दर्ज करें।", "warning");
            }
        });
        attachEventListener('stopLiveUpdateBtn', 'click', stopLiveUpdate);
        
        // डेटा एडिट करें
        attachEventListener('editDataBtn', 'click', () => {
            if (auth.currentUser) {
                window.location.href = 'edit_data.html';
            } else {
                showMessage("डेटा एडिट करने के लिए कृपया लॉगिन करें।", "warning");
                window.location.href = 'login.html';
            }
        });
        // ====================================================================
// 2. डेटा टेबल इंटरेक्शन हैंडलर
// ====================================================================
attachEventListener('searchInput', 'input', searchTable);
attachEventListener('searchBtn', 'click', searchTable);
attachEventListener('prevPage', 'click', () => changePage(-1));
attachEventListener('nextPage', 'click', () => changePage(1));
attachEventListener('exportCsv', 'click', () => exportCsv(filteredData));
attachEventListener('exportExcel', 'click', () => exportExcel(filteredData));
attachEventListener('exportPdf', 'click', () => exportPdf(filteredData, headers));
attachEventListener('applyFilterSort', 'click', applyFiltersAndSort);

// ✅ नया reset button event listener जोड़ें
attachEventListener('resetFiltersBtn', 'click', () => resetAllFilters(headers));

attachEventListener('statsCol', 'change', displayStats);
        // ====================================================================
        // 3. चार्ट और विज़ुअलाइज़ेशन हैंडलर
        // ====================================================================
        
        // विज़ुअलाइज़ेशन जोड़ें
        attachEventListener('addVisualizationBtn', 'click', () => {
            const selectedColumns = getChartColumns();
            const xAxisCol = selectedColumns.xAxis;
            const yAxisCols = selectedColumns.yAxes;
            const zAxisCol = selectedColumns.zAxis;
            
            if (!xAxisCol || yAxisCols.length === 0) {
                showMessage("कृपया X और Y-अक्ष के लिए कॉलम ड्रैग करके डालें।", "warning");
                return;
            }

            const chartType = document.getElementById('chartType').value;
            if ((chartType === 'bar3D' || chartType === 'line3D') && !zAxisCol) {
                showMessage("3D चार्ट के लिए Z-अक्ष कॉलम आवश्यक है। कृपया एक कॉलम ड्रैग करके डालें।", "warning");
                return;
            }

            addVisualization(xAxisCol, yAxisCols, zAxisCol); 
            // डैशबोर्ड की न्यूनतम ऊंचाई बढ़ाएँ
            const visualizationsDiv = document.getElementById('visualizations');
            if (visualizationsDiv) {
                const currentHeight = visualizationsDiv.offsetHeight;
                const newHeight = currentHeight + 500;
                visualizationsDiv.style.minHeight = `${newHeight}px`;
            }
        });

        // एडवांस्ड चार्ट सेटिंग्स लागू करें
        attachEventListener('animationDuration', 'input', function() {
            document.getElementById('animationDurationValue').textContent = this.value;
        });
        attachEventListener('applyChartSettings', 'click', applyAdvancedChartSettings);
        
        // थीम टॉगल करें (थीम बदलने पर सभी चार्ट री-प्लॉट करें)
        attachEventListener('toggleTheme', 'click', () => {
            // main_core.js में उपलब्ध है
            // toggleTheme();
            plotAll();
        });

        // ====================================================================
        // 4. चार्ट कंटेनर रंग/शैली हैंडलर
        // ====================================================================

        // रेडीमेड टेम्पलेट्स लागू करें
        attachEventListener('applyChartContainerColorBtn', 'click', () => {
            const scopeAllChartsRadio = document.getElementById('scopeAllCharts');
            const selectedChartContainerColorTemplateId = document.querySelector('#chartContainerColorGallery .selected')?.dataset.templateId || 'default-container-color';
            const applyToAll = scopeAllChartsRadio?.checked;
            let selectedChartIds = [];
            
            if (!applyToAll) {
                const checkboxes = document.querySelectorAll('#chartSelectionList input[type="checkbox"]:checked');
                selectedChartIds = Array.from(checkboxes).map(checkbox => checkbox.value);
                if (selectedChartIds.length === 0) {
                    showMessage("कृपया रंग लागू करने के लिए कम से कम एक चार्ट चुनें।", "warning");
                    return;
                }
            }
            
            applyChartContainerColor(selectedChartContainerColorTemplateId, allActiveChartInstances, applyToAll, selectedChartIds);
            
            const offcanvasSidebar = document.getElementById('offcanvasSidebar');
            bootstrap.Offcanvas.getInstance(offcanvasSidebar)?.hide();
            showMessage("चार्ट कंटेनर रंग सफलतापूर्वक लागू किया गया है!", "success");
        });

        // कस्टम कोड लागू करें
        attachEventListener('applyCustomChartContainerCodeBtn', 'click', () => {
            try {
                const codeString = document.getElementById('customChartContainerCode').value;
                if (!codeString.trim()) {
                    showMessage("कृपया लागू करने के लिए कुछ कोड दर्ज करें।", "warning");
                    return;
                }

                const customOptions = JSON.parse(codeString);
                const scopeAllChartsRadio = document.getElementById('scopeAllCharts');
                const applyToAll = scopeAllChartsRadio?.checked;
                let selectedChartIds = [];

                if (!applyToAll) {
                    const checkboxes = document.querySelectorAll('#chartSelectionList input[type="checkbox"]:checked');
                    selectedChartIds = Array.from(checkboxes).map(checkbox => checkbox.value);
                    if (selectedChartIds.length === 0) {
                        showMessage("कृपया रंग लागू करने के लिए कम से कम एक चार्ट चुनें।", "warning");
                        return;
                    }
                }

                applyCustomChartContainerColor(customOptions, allActiveChartInstances, applyToAll, selectedChartIds);

                const offcanvasSidebar = document.getElementById('offcanvasSidebar');
                bootstrap.Offcanvas.getInstance(offcanvasSidebar)?.hide();
                showMessage("कस्टम कंटेनर शैली सफलतापूर्वक लागू की गई!", "success");

            } catch (e) {
                showMessage("त्रुटि: अमान्य JSON कोड। कृपया इसे ठीक करें।", "danger");
                console.error(e);
            }
        });


        // ====================================================================
        // 5. चार्ट इफ़ेक्ट्स हैंडलर
        // ====================================================================

        attachEventListener('applyChartEffects', 'click', () => {
            const customEffectsRadio = document.getElementById('customEffectsRadio');
            const templateEffectsRadio = document.getElementById('templateEffectsRadio');
            const customCodeRadio = document.getElementById('customCodeRadio');
            const applyToAllRadio = document.getElementById('applyToAllRadio');
            const applyToSelectedRadio = document.getElementById('applyToSelectedRadio');
            
            const isCustom = customEffectsRadio?.checked;
            const isTemplate = templateEffectsRadio?.checked;
            const isCustomCode = customCodeRadio?.checked;
            
            let chartsToApplyEffect = [];

            if (applyToAllRadio?.checked) {
                chartsToApplyEffect = allActiveChartInstances;
            } else if (applyToSelectedRadio?.checked) {
                const checkboxes = document.querySelectorAll('#chartSelectionListEffects input[type="checkbox"]:checked');
                if (checkboxes.length === 0) {
                    showMessage("कृपया प्रभाव लागू करने के लिए कम से कम एक चार्ट चुनें।", "warning");
                    return;
                }
                const selectedChartIds = Array.from(checkboxes).map(checkbox => checkbox.value);
                chartsToApplyEffect = allActiveChartInstances.filter(chart => selectedChartIds.includes(chart.getDom().id));
            } else {
                showMessage("कृपया प्रभाव लागू करने का विकल्प चुनें।", "warning");
                return;
            }

            if (chartsToApplyEffect.length === 0) {
                showMessage("कोई चार्ट उपलब्ध नहीं है। कृपया पहले एक चार्ट जोड़ें।", "warning");
                return;
            }

            let effectOptions = {};
            if (isCustom) {
                effectOptions = {
                    shadowColor: document.getElementById('shadowColor').value,
                    shadowBlur: parseInt(document.getElementById('shadowBlur').value),
                    shadowOffsetX: parseInt(document.getElementById('shadowOffsetX').value),
                    shadowOffsetY: parseInt(document.getElementById('shadowOffsetY').value),
                    backgroundColor: document.getElementById('backgroundColor').value,
                    borderColor: document.getElementById('borderColor').value,
                    borderWidth: parseInt(document.getElementById('borderWidth').value)
                };
            } else if (isTemplate) {
                const selectedTemplateItem = document.querySelector('.chart-effect-template-item.selected');
                if (selectedTemplateItem) {
                    const templateIndex = selectedTemplateItem.dataset.index;
                    effectOptions = chartEffectsTemplates[templateIndex];
                } else {
                    showMessage("कृपया लागू करने के लिए एक टेम्पलेट चुनें।", "warning");
                    return;
                }
            } else if (isCustomCode) {
                try {
                    const code = document.getElementById('customEffectCode').value;
                    effectOptions = JSON.parse(code);
                } catch (e) {
                    showMessage("कस्टम कोड में अमान्य JSON: " + e.message, "danger");
                    return;
                }
            }

            chartsToApplyEffect.forEach(chartInstance => {
                const chartContainer = document.getElementById(`container-${chartInstance.getDom().id}`);
                if (!chartContainer) return;

                // chartEffects.js से आयातित (या अपेक्षित) फ़ंक्शंस
                // **ध्यान दें:** आपकी मूल फ़ाइल में applyEffect फ़ंक्शन का उपयोग नहीं किया गया था,
                // बल्कि सीधे DOM हेरफेर किया गया था।
                // हम यहाँ मान लेते हैं कि addShadow, addBackgroundColor, addBorder chartEffects.js में हैं।
                // यदि नहीं, तो आपको उन्हें chartEffects.js में जोड़ना होगा या इस logic को main_handlers.js में ही लागू करना होगा।
                // हम यहाँ मूल logic को बनाए रखते हुए चलते हैं:
                
                chartContainer.style.boxShadow = `${effectOptions.shadowOffsetX}px ${effectOptions.shadowOffsetY}px ${effectOptions.shadowBlur}px ${effectOptions.shadowColor}`;
                chartContainer.style.backgroundColor = effectOptions.backgroundColor;
                chartContainer.style.border = `${effectOptions.borderWidth}px solid ${effectOptions.borderColor}`;
                
                // chartEffects.js से applyEffect फ़ंक्शन का उपयोग करने का बेहतर तरीका होगा:
                // applyEffect(chartInstance.getDom().id, effectOptions);
                // लेकिन, चूँकि आपका मूल कोड कंटेनर पर स्टाइल लागू करता है, हम उसी का अनुकरण करते हैं।
            });

            showMessage("चार्ट इफ़ेक्ट्स सफलतापूर्वक लागू किए गए!", "success");
            saveDashboardSettings();
        });


        // ====================================================================
        // 6. AI Chat Assistant हैंडलर
        // ====================================================================
        attachEventListener('sendChatBtn', 'click', sendChatMessage);
        attachEventListener('chatInput', 'keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });


        // ====================================================================
        // 7. डैशबोर्ड दृश्य नियंत्रण हैंडलर
        // ====================================================================
        
        attachEventListener('toggleVisualizations', 'change', (e) => {
            document.getElementById('visualizationsSection').style.display = e.target.checked ? 'block' : 'none';
        });
        attachEventListener('toggleDataTable', 'change', (e) => {
            document.getElementById('dataTableSection').style.display = e.target.checked ? 'block' : 'none';
        });
        attachEventListener('toggleSummary', 'change', (e) => {
            document.getElementById('summaryOutputSection').style.display = e.target.checked ? 'block' : 'none';
        });
        attachEventListener('toggleChat', 'change', (e) => {
            document.getElementById('chatAssistantSection').style.display = e.target.checked ? 'block' : 'none';
        });
        attachEventListener('downloadFullDashboard', 'click', () => {
            showMessage("पूर्ण डैशबोर्ड डाउनलोड करने की सुविधा जल्द ही आ रही है!", "info");
        });


        // ====================================================================
        // 8. म्यूटेशन ऑब्जर्वर (चार्ट जोड़ना/हटाना/रीसाइज़ करना)
        // ====================================================================
        const visualizationsDiv = document.getElementById('visualizations');
        if (visualizationsDiv) {
            const visualizationsObserver = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        // साइडबार लिस्ट अपडेट करें
                        renderDashboardChartOverview(document.getElementById('chartSelectionList'), allActiveChartInstances);
                        renderDashboardChartList(document.getElementById('chartSelectionListEffects'));
                        
                        // सभी चार्ट को रीसाइज़ करें (यह सुनिश्चित करने के लिए कि वे लेआउट परिवर्तनों का जवाब दें)
                        visualizations.forEach(config => {
                            const chartDom = document.getElementById(config.id);
                            if (chartDom) {
                                // ECharts Resize
                                const chartInstance = echarts.getInstanceByDom(chartDom);
                                if (chartInstance) {
                                    chartInstance.resize();
                                } 
                                // Plotly Resize
                                else if (['candlestick', 'ohlc'].includes(config.type)) {
                                    const container = document.getElementById(`container-${config.id}`);
                                    Plotly.relayout(chartDom, {
                                        width: parseFloat(container.style.width),
                                        height: parseFloat(container.style.height) - 70 // Adjust for title/buttons
                                    });
                                }
                            }
                        });
                    }
                }
            });
            visualizationsObserver.observe(visualizationsDiv, { childList: true });
        }


        // ====================================================================
        // 9. चार्ट क्रियाएँ (डाउनलोड, डिलीट, फ़ुलस्क्रीन, एडिट)
        // ====================================================================

        if (visualizationsDiv) {
            visualizationsDiv.addEventListener('click', (event) => {
                const target = event.target.closest('button');
                if (!target) return;
                
                const chartId = target.dataset.chartId;
                if (!chartId) return;
                
                const chartDom = document.getElementById(chartId);
                const chartConfig = visualizations.find(v => v.id === chartId);
                const isPlotlyChart = chartConfig && ['candlestick', 'ohlc'].includes(chartConfig.type);

                if (target.classList.contains('download-chart')) {
                    if (!chartDom) return;

                    if (isPlotlyChart) {
                        Plotly.downloadImage(chartDom, {
                            format: 'png',
                            filename: chartId,
                            width: chartDom.offsetWidth,
                            height: chartDom.offsetHeight
                        }).then(() => showMessage("Plotly चार्ट सफलतापूर्वक डाउनलोड किया गया!", "success"))
                          .catch(error => showMessage("Plotly चार्ट डाउनलोड करने में त्रुटि: " + error.message, "danger"));
                    } else {
                        const chartInstance = echarts.getInstanceByDom(chartDom);
                        if (chartInstance) {
                            const link = document.createElement('a');
                            link.href = chartInstance.getDataURL({
                                type: 'png',
                                pixelRatio: 2,
                                backgroundColor: document.body.classList.contains('dark-theme') ? '#212529' : '#fff'
                            });
                            link.download = `${chartId}.png`;
                            link.click();
                            showMessage("ECharts सफलतापूर्वक डाउनलोड किया गया!", "success");
                        } else {
                            showMessage("चार्ट डाउनलोड करने में त्रुटि: ECharts इंस्टेंस नहीं मिला।", "danger");
                        }
                    }
                } else if (target.classList.contains('delete-chart')) {
                    clearChart(chartId);
                    showMessage("चार्ट सफलतापूर्वक हटाया गया!", "info");
                } else if (target.classList.contains('fullscreen-chart')) {
                    const chartContainer = document.getElementById(`container-${chartId}`);
                    if (!chartContainer) return;
                    
                    if (!document.fullscreenElement) {
                        chartContainer.requestFullscreen().then(() => {
                            // रीसाइज़ लॉजिक
                            if (isPlotlyChart) {
                                Plotly.relayout(chartDom, {
                                    width: window.innerWidth,
                                    height: window.innerHeight - 70
                                });
                            } else {
                                echarts.getInstanceByDom(chartDom)?.resize();
                            }
                        });
                    } else {
                        document.exitFullscreen().then(() => {
                             // रीसाइज़ लॉजिक (वापस सामान्य आकार में)
                            const container = document.getElementById(`container-${chartId}`);
                            if (isPlotlyChart) {
                                Plotly.relayout(chartDom, {
                                    width: parseFloat(container.style.width),
                                    height: parseFloat(container.style.height) - 70
                                });
                            } else {
                                echarts.getInstanceByDom(chartDom)?.resize();
                            }
                        });
                    }
                } else if (target.classList.contains('edit-chart')) { // Edit Chart Button
                    if (chartConfig) {
                        // Offcanvas खोलें
                        const bsOffcanvas = new bootstrap.Offcanvas(document.getElementById('offcanvasSidebar'));
                        bsOffcanvas.show();

                        // 'Data & Chart' मेनू आइटम को सक्रिय करें (UI अपडेट)
                        const dataChartMenuLink = document.querySelector('[data-menu-target="chartSettingsContent"]');
                        if (dataChartMenuLink) {
                            document.querySelectorAll('.main-menu-bar .nav-link').forEach(l => l.classList.remove('active'));
                            dataChartMenuLink.classList.add('active');
                        }

                        // संबंधित सामग्री दिखाएं
                        document.querySelectorAll('.offcanvas-content').forEach(c => c.style.display = 'none');
                        document.getElementById('chartSettingsContent').style.display = 'block';

                        // UI को कॉन्फ़िगरेशन से पॉपुलेट करें (चार्ट प्रकार, ड्रैग ज़ोन)
                        const chartTypeSelect = document.getElementById('chartType');
                        chartTypeSelect.value = chartConfig.type;
                        
                        // गैलरी और डिस्प्ले इमेज अपडेट करें
                        document.querySelectorAll('.chart-type-item').forEach(el => el.classList.remove('selected'));
                        const selectedChartGalleryItem = document.querySelector(`.chart-type-item[data-value="${chartConfig.type}"]`);
                        if (selectedChartGalleryItem) {
                            selectedChartGalleryItem.classList.add('selected');
                            document.getElementById('selectedChartDisplayImage').src = selectedChartGalleryItem.querySelector('img').src;
                            document.getElementById('selectedChartDisplayImage').style.display = 'block';
                        }

                        // ड्रैग-एंड-ड्रॉप ज़ोन को पॉपुलेट करें
                        populateDropZones(headers, chartConfig.xAxis, chartConfig.yAxes, chartConfig.zAxis);

                        // 3D-अक्ष कंटेनर की दृश्यता सेट करें
                        const zAxisDropZoneContainer = document.getElementById('zAxisDropZoneContainer');
                        if (zAxisDropZoneContainer) {
                            zAxisDropZoneContainer.style.display = (chartConfig.type === 'bar3D' || chartConfig.type === 'line3D') ? 'block' : 'none';
                        }
                    }
                }
            });
        }
    }
    
    // ====================================================================
    // 10. लॉगआउट हैंडलर (हमेशा उपलब्ध)
    // ====================================================================
    attachEventListener('logoutBtn', 'click', async () => {
        try {
            await auth.signOut();
            showMessage("सफलतापूर्वक लॉगआउट किया!", "info");
            // Offcanvas को बंद करें यदि वह खुला है
            const offcanvasSidebar = document.getElementById('offcanvasSidebar');
            bootstrap.Offcanvas.getInstance(offcanvasSidebar)?.hide();
        } catch (error) {
            showMessage("लॉगआउट करते समय त्रुटि हुई: " + error.message, "danger");
        }
    });

}

