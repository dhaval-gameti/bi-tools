// js/main_core.js

// Vedra Bi की मुख्य.js फ़ाइल का पहला हिस्सा।
// इसमें मुख्य इनिशियलाइज़ेशन, DOMContentLoaded लिसनर, और मुख्य UI/मेन्यू लॉजिक शामिल है।

// आवश्यक मॉड्यूल्स आयात करें
import { populateColumnDragLists, initializeDragAndDrop, getChartColumns, populateDropZones } from './chartcolomdrag.js';
import { renderChartContainerColorTemplates, applyChartContainerColor, renderDashboardChartOverview, applyCustomChartContainerColor } from './chartContainerColors.js';
import {
    applyEffect, // शायद इसकी ज़रूरत न हो अगर main_handlers में लागू हो रहा है
    chartEffectsTemplates,
    renderChartEffectsTemplates,
    renderDashboardChartList
} from './chartEffects.js';
import { auth, showMessage, attachEventListener, toggleTheme, downloadTemplate } from './utils.js';
import {
    initData,
    headers, // headers को main_handlers में इस्तेमाल किया जाता है, पर main_core को initData के लिए ज़रूरत पड़ सकती है
    saveDashboardSettings
    
} from '../store/DataHandler.js';
import {
    displayStats
} from '../store/UIHandler.js';
import { visualizations, chartGlobalSettings } from './charts.js';
import { sendChatMessage, generateSummary } from './chat.js'; // इसे शायद DOMContentLoaded के अंदर कॉल किया जाएगा
import { backgroundTemplates, renderBackgroundTemplates } from './backgroundTemplates.js';
import { initializeTextboxEditor } from './editor.js';
import { toggleLockMode } from './drag_drop.js';
import { createChartTypeGallery } from './chartTypeGallery.js'
import { initializeLoginAndAuth } from './login.js';

// main_handlers.js से इवेंट हैंडलर फ़ंक्शन आयात करें
import { attachGlobalEventHandlers } from './main_handlers.js';





// Sabhi active chart instances ko track karne wala array
export let allActiveChartInstances = [];



// ====================================================================
// एडवांस्ड चार्ट सेटिंग्स नियंत्रणों को पॉपुलेट करने का फ़ंक्शन
// इसे main_handlers.js या एक नए यूटिलिटी फ़ाइल में भी ले जाया जा सकता है,
// लेकिन इसे यहाँ Modal लॉजिक के साथ रखते हैं।
// ====================================================================
function populateAdvancedChartSettingsControls() {
    const gridShowHide = document.getElementById('gridShowHide');
    const tooltipOnOff = document.getElementById('tooltipOnOff');
    const zoomEnable = document.getElementById('zoomEnable');
    const animationDuration = document.getElementById('animationDuration');
    const animationDurationValue = document.getElementById('animationDurationValue');
    const axisFormat = document.getElementById('axisFormat');
    const legendPosition = document.getElementById('legendPosition');
    const showLabels = document.getElementById('showLabels');

    if (gridShowHide) gridShowHide.checked = chartGlobalSettings.gridShowHide;
    if (tooltipOnOff) tooltipOnOff.checked = chartGlobalSettings.tooltipOnOff;
    if (zoomEnable) zoomEnable.checked = chartGlobalSettings.zoomEnable;
    if (animationDuration) {
        animationDuration.value = chartGlobalSettings.animationDuration;
        if (animationDurationValue) animationDurationValue.textContent = chartGlobalSettings.animationDuration;
    }
    if (axisFormat) axisFormat.value = chartGlobalSettings.axisFormat;
    if (legendPosition) legendPosition.value = chartGlobalSettings.legendPosition;
    if (showLabels) showLabels.checked = chartGlobalSettings.showLabels;
}

// ====================================================================
// Modal को विशिष्ट सामग्री के साथ खोलने का फ़ंक्शन
// ====================================================================
function openModalWithContent(targetContentId) {
    const modal = new bootstrap.Modal(document.getElementById('mainMenuModal'), {
        backdrop: 'static'
    });
    const modalTitle = document.getElementById('mainMenuModalLabel');
    const modalBody = document.querySelector('#mainMenuModal .modal-body');

    // सभी सामग्री क्षेत्रों को पहले छिपाएं
    document.querySelectorAll('.modal-content-area').forEach(el => el.style.display = 'none');
    
    // क्लिक किए गए मेनू आइटम के लिए विशिष्ट सामग्री दिखाएं
    const contentToShow = document.getElementById(targetContentId);
    if (contentToShow) {
        contentToShow.style.display = 'block';
    }

    // Modal का शीर्षक सेट करें
    switch(targetContentId) {
        case 'advancedSettingsContent':
            modalTitle.textContent = 'एडवांस्ड चार्ट सेटिंग्स';
            populateAdvancedChartSettingsControls(); // Controls को पॉपुलेट करें
            break;
        case 'dataStatisticsContent':
            modalTitle.textContent = 'डेटा सांख्यिकी';
            displayStats(); // सांख्यिकी दिखाएं
            break;
        case 'dashboardViewContent':
            modalTitle.textContent = 'डैशबोर्ड दृश्य';
            break;
        default:
            modalTitle.textContent = 'सेटिंग्स';
            break;
    }

    // Modal दिखाएं
    modal.show();
    
    // मॉडल बंद होने पर बैकड्रॉप को हटाने के लिए इवेंट लिसनर
    const mainMenuModal = document.getElementById('mainMenuModal');
    if (mainMenuModal) {
        mainMenuModal.addEventListener('hidden.bs.modal', function () {
            const body = document.body;
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => {
                backdrop.remove();
            });
            body.classList.remove('modal-open');
            body.style.overflow = '';
            body.style.paddingRight = '';
        });
    }
}


// ====================================================================
// DOMContentLoaded Listener और मुख्य UI लॉजिक
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // लॉगिन और ऑथेंटिकेशन लॉजिक को इनिशियलाइज़ करें
    initializeLoginAndAuth();
    
    // मुख्य कॉम्पोनेंट्स को इनिशियलाइज़ करें
    createChartTypeGallery();
 //   initializeChatbot(); // चैटबॉट को इनिशियलाइज़ करें
    
    // Offcanvas Sidebar Instance
    const offcanvasSidebar = document.getElementById('offcanvasSidebar');
    const bsOffcanvas = offcanvasSidebar ? new bootstrap.Offcanvas(offcanvasSidebar) : null;
    const mainMenuLinks = document.querySelectorAll('.main-menu-bar .nav-link');
    const dashboardContent = document.querySelector('.main-content-container');
    const dashboardSection = document.getElementById('dashboardSection');
    
    // ----------------------------------------------------
    // Chart Container Color / Custom Style Logic (साइडबार के अंदर)
    // ----------------------------------------------------
    const chartContainerColorGallery = document.getElementById('chartContainerColorGallery');
    let selectedChartContainerColorTemplateId = 'default-container-color';

    // चार्ट कंटेनर कलर टेम्पलेट्स को रेंडर करें
    if (chartContainerColorGallery) {
        renderChartContainerColorTemplates(chartContainerColorGallery, (templateId) => {
            selectedChartContainerColorTemplateId = templateId;
        });
    }

    // 'सभी चार्ट' और 'चयनित चार्ट' रेडियो बटन पर इवेंट हैंडलर
    document.getElementById('scopeAllCharts')?.addEventListener('change', (e) => {
        document.getElementById('dashboardChartOverview').style.display = e.target.checked ? 'none' : 'block';
    });

    document.getElementById('scopeSelectedCharts')?.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.getElementById('dashboardChartOverview').style.display = 'block';
            renderDashboardChartOverview(document.getElementById('chartSelectionList'), allActiveChartInstances);
        }
    });

    // ----------------------------------------------------
    // Background Template Logic
    // ----------------------------------------------------
    renderBackgroundTemplates('backgroundTemplateGallery');
    
    let selectedTemplateIndex = -1;
    const backgroundTemplateGallery = document.getElementById('backgroundTemplateGallery');
    if (backgroundTemplateGallery) {
        backgroundTemplateGallery.addEventListener('click', (event) => {
            const clickedItem = event.target.closest('.background-template-item');
            if (clickedItem) {
                document.querySelectorAll('.background-template-item').forEach(item => {
                    item.style.border = '1px solid #ddd';
                    item.classList.remove('selected');
                });
                clickedItem.style.border = '2px solid #007bff';
                clickedItem.classList.add('selected');
                selectedTemplateIndex = parseInt(clickedItem.dataset.index);
            }
        });
    }

    // ----------------------------------------------------
    // Chart Effects Radio Button Logic
    // ----------------------------------------------------
    const setupEffectRadios = (radioId, sectionId) => {
        document.getElementById(radioId)?.addEventListener('change', () => {
            document.getElementById('customEffectsSection').style.display = 'none';
            document.getElementById('templateEffectsSection').style.display = 'none';
            document.getElementById('customCodeEffectsSection').style.display = 'none';
            document.getElementById(sectionId).style.display = 'block';

            if (radioId === 'templateEffectsRadio' && document.getElementById('chartEffectsTemplateGallery')) {
                 renderChartEffectsTemplates(document.getElementById('chartEffectsTemplateGallery'), () => {});
            }
        });
    };

    setupEffectRadios('customEffectsRadio', 'customEffectsSection');
    setupEffectRadios('templateEffectsRadio', 'templateEffectsSection');
    setupEffectRadios('customCodeRadio', 'customCodeEffectsSection');

    // Effects Scope Radio Logic
    document.getElementById('applyToAllRadio')?.addEventListener('change', (e) => {
        document.getElementById('dashboardChartOverviewEffects').style.display = e.target.checked ? 'none' : 'block';
    });
    document.getElementById('applyToSelectedRadio')?.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.getElementById('dashboardChartOverviewEffects').style.display = 'block';
            renderDashboardChartList(document.getElementById('chartSelectionListEffects'));
        }
    });

    // ----------------------------------------------------
    // Load Saved Dashboard Colors
    // ----------------------------------------------------
    const savedBackgroundColor = localStorage.getItem('dashboardBackgroundColor');
    const savedTextColor = localStorage.getItem('dashboardTextColor');
    if (dashboardContent) {
        if (savedBackgroundColor) dashboardContent.style.backgroundColor = savedBackgroundColor;
        if (savedTextColor) dashboardContent.style.color = savedTextColor;
    }

    // ----------------------------------------------------
    // Main Menu Links Logic (Modal/Offcanvas Control)
    // ----------------------------------------------------
    mainMenuLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); 
            
            // 'active' क्लास को टॉगल करें
            mainMenuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            const targetContentId = this.dataset.menuTarget;

            if (this.dataset.bsToggle === 'modal') {
                openModalWithContent(targetContentId);
            } else if (this.dataset.bsToggle === 'offcanvas') {
                // Offcanvas सामग्री को टॉगल करें
                document.querySelectorAll('.offcanvas-content').forEach(content => content.style.display = 'none');
                if (targetContentId) {
                    const targetContent = document.getElementById(targetContentId);
                    if (targetContent) targetContent.style.display = 'block';
                }
                
                if (bsOffcanvas) bsOffcanvas.show(); // Offcanvas खोलें

                // Offcanvas-specific logic (Initial rendering)
                if (targetContentId === 'textboxContent') initializeTextboxEditor();
                if (targetContentId === 'userInfoContent') {
                    // यूजर इंफो अपडेट
                    const userEmailSpan = document.getElementById('userEmail');
                    const userInfoDiv = document.getElementById('userInfo');
                    if (auth.currentUser) {
                        if (userEmailSpan) userEmailSpan.textContent = auth.currentUser.email;
                        if (userInfoDiv) userInfoDiv.style.display = 'flex';
                    } else {
                        if (userInfoDiv) userInfoDiv.style.display = 'none';
                    }
                }
                if (targetContentId === 'chartEffectsContent' && document.getElementById('applyToSelectedRadio')?.checked) {
                    renderDashboardChartList(document.getElementById('chartSelectionListEffects'));
                }
                if (targetContentId === 'chartSettingsContent') {
                    // 3D चार्ट के लिए Z-अक्ष को दिखाएं या छिपाएं
                    const chartType = document.getElementById('chartType').value;
                    const zAxisDropZoneContainer = document.getElementById('zAxisDropZoneContainer');
                    if (zAxisDropZoneContainer) {
                         zAxisDropZoneContainer.style.display = (chartType === 'bar3D' || chartType === 'line3D') ? 'block' : 'none';
                    }
                }
            }
        });
    });

    // Offcanvas बंद होने पर सामग्री छिपाएं
    if (offcanvasSidebar) {
        offcanvasSidebar.addEventListener('hidden.bs.offcanvas', () => {
            document.querySelectorAll('.offcanvas-content').forEach(content => content.style.display = 'none');
        });
    }

    // Lock Mode Button (drag_drop.js से)
    attachEventListener('toggleLockModeBtn', 'click', toggleLockMode);

    // Apply Background Template Button
    attachEventListener('applyTemplateBtn', 'click', () => {
         if (selectedTemplateIndex !== -1 && dashboardContent) {
            const selectedTemplate = backgroundTemplates[selectedTemplateIndex];
            dashboardContent.style.backgroundColor = selectedTemplate.backgroundColor;
            dashboardContent.style.color = selectedTemplate.textColor;
            localStorage.setItem('dashboardBackgroundColor', selectedTemplate.backgroundColor);
            localStorage.setItem('dashboardTextColor', selectedTemplate.textColor);
            localStorage.setItem('selectedBackgroundTemplateIndex', selectedTemplateIndex);
            showMessage(`टेम्पलेट '${selectedTemplate.name}' सफलतापूर्वक लागू किया गया है!`, 'success');
            saveDashboardSettings();
        } else {
            showMessage('कृपया लागू करने के लिए एक टेम्पलेट चुनें।', 'warning');
        }
    });

    // main_handlers.js से सभी इवेंट हैंडलर संलग्न करें
    attachGlobalEventHandlers(allActiveChartInstances);


    // डिफ़ॉल्ट रूप से: डैशबोर्ड सेक्शन को सक्रिय रखें
    if (dashboardSection) dashboardSection.classList.add('active');
    
    // लोडिंग ओवरले को छिपाएं  
    setTimeout(function() {  
        const loadingOverlay = document.getElementById('loadingOverlay');  
        if (loadingOverlay) {  
            loadingOverlay.style.display = 'none';  
        }  
    }, 1000); 
});

