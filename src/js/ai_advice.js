// js/ai_advice.js
import { showSpinner, hideSpinner, showMessage } from './utils.js';
import { visualizations } from './charts.js';

// नए HTML कंटेनर्स को प्राप्त करें
const aiAdviceOverlay = document.querySelector('.ai-advice-overlay');
const aiAdviceContainer = document.querySelector('.ai-advice-container');
const aiAdviceContent = document.getElementById('aiAdviceContent');
const closeAiAdviceBtn = document.getElementById('closeAiAdviceBtn');

// Showdown कन्वर्टर बनाएँ
const converter = typeof showdown !== 'undefined' ? new showdown.Converter() : null;

// Speech Synthesis वेरिएबल्स
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let isSpeaking = false;
let availableVoices = [];

// क्लोज बटन के लिए इवेंट लिसनर
closeAiAdviceBtn?.addEventListener('click', () => {
    hideAiAdviceModal();
});

// ओवरले पर क्लिक करने से मोडल बंद हो
aiAdviceOverlay?.addEventListener('click', () => {
    hideAiAdviceModal();
});

// मोडल छुपाएं
function hideAiAdviceModal() {
    stopSpeaking();
    if (aiAdviceOverlay) aiAdviceOverlay.style.display = 'none';
    if (aiAdviceContainer) aiAdviceContainer.style.display = 'none';
    if (aiAdviceContent) aiAdviceContent.innerHTML = '';
}

// मोडल दिखाएं
function showAiAdviceModal() {
    if (aiAdviceOverlay) aiAdviceOverlay.style.display = 'block';
    if (aiAdviceContainer) aiAdviceContainer.style.display = 'block';
}

// Available voices load करें
function loadVoices() {
    availableVoices = speechSynthesis.getVoices();
    console.log('Available voices:', availableVoices);
}

// आवाज़ बंद करें
function stopSpeaking() {
    if (speechSynthesis && isSpeaking) {
        speechSynthesis.cancel();
        isSpeaking = false;
        updateSpeechButton();
    }
}

// आवाज़ शुरू करें
function startSpeaking(text) {
    if (!speechSynthesis) {
        showMessage("Text-to-Speech सपोर्टेड नहीं है", "warning");
        return;
    }
    
    stopSpeaking();
    
    // Selected voice प्राप्त करें
    const voiceSelect = document.getElementById('voiceSelect');
    const selectedVoiceIndex = voiceSelect ? voiceSelect.value : '';
    const selectedVoice = availableVoices[selectedVoiceIndex];
    
    // Speed और pitch settings
    const speedSelect = document.getElementById('speedSelect');
    const pitchSelect = document.getElementById('pitchSelect');
    
    const speed = speedSelect ? parseFloat(speedSelect.value) : 0.9;
    const pitch = pitchSelect ? parseFloat(pitchSelect.value) : 1.0;
    
    currentUtterance = new SpeechSynthesisUtterance(text);
    
    // Selected voice सेट करें
    if (selectedVoice) {
        currentUtterance.voice = selectedVoice;
        currentUtterance.lang = selectedVoice.lang;
    } else {
        // Default Hindi voice ढूंढें
        const hindiVoice = availableVoices.find(voice => 
            voice.lang.includes('hi') || voice.lang.includes('IN')
        );
        if (hindiVoice) {
            currentUtterance.voice = hindiVoice;
            currentUtterance.lang = 'hi-IN';
        } else {
            currentUtterance.lang = 'en-US';
        }
    }
    
    currentUtterance.rate = speed;
    currentUtterance.pitch = pitch;
    currentUtterance.volume = 1;
    
    currentUtterance.onstart = () => {
        isSpeaking = true;
        updateSpeechButton();
        highlightSpeakingText();
    };
    
    currentUtterance.onend = () => {
        isSpeaking = false;
        updateSpeechButton();
        removeHighlight();
    };
    
    currentUtterance.onerror = (event) => {
        console.error('Speech error:', event);
        isSpeaking = false;
        updateSpeechButton();
        removeHighlight();
        showMessage("आवाज़ चलाने में त्रुटि", "danger");
    };
    
    speechSynthesis.speak(currentUtterance);
}

// स्पीच बटन अपडेट करें
function updateSpeechButton() {
    const speechBtn = document.getElementById('speechControlBtn');
    if (speechBtn) {
        if (isSpeaking) {
            speechBtn.innerHTML = '<i class="bi bi-pause-fill"></i> रोकें';
            speechBtn.classList.remove('btn-outline-primary');
            speechBtn.classList.add('btn-warning');
        } else {
            speechBtn.innerHTML = '<i class="bi bi-play-fill"></i> आवाज़ चलाएं';
            speechBtn.classList.remove('btn-warning');
            speechBtn.classList.add('btn-outline-primary');
        }
    }
}

// बोले जा रहे text को highlight करें
function highlightSpeakingText() {
    const contentDiv = document.querySelector('.ai-response-content');
    if (contentDiv) {
        contentDiv.classList.add('speaking-active');
    }
}

// Highlight हटाएं
function removeHighlight() {
    const contentDiv = document.querySelector('.ai-response-content');
    if (contentDiv) {
        contentDiv.classList.remove('speaking-active');
    }
}

// Voice selection dropdown बनाएं
function createVoiceSelector() {
    const voiceSelector = document.createElement('select');
    voiceSelector.id = 'voiceSelect';
    voiceSelector.className = 'form-select form-select-sm';
    
    // Default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'डिफॉल्ट आवाज़ चुनें';
    voiceSelector.appendChild(defaultOption);
    
    // Available voices के options
    availableVoices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelector.appendChild(option);
    });
    
    return voiceSelector;
}

// Speed control बनाएं
function createSpeedControl() {
    const speedDiv = document.createElement('div');
    speedDiv.className = 'voice-control-group';
    
    speedDiv.innerHTML = `
        <label class="form-label">गति:</label>
        <select id="speedSelect" class="form-select form-select-sm">
            <option value="0.7">धीमी</option>
            <option value="0.9" selected>सामान्य</option>
            <option value="1.1">तेज</option>
            <option value="1.3">बहुत तेज</option>
        </select>
    `;
    
    return speedDiv;
}

// Pitch control बनाएं
function createPitchControl() {
    const pitchDiv = document.createElement('div');
    pitchDiv.className = 'voice-control-group';
    
    pitchDiv.innerHTML = `
        <label class="form-label">आवाज़:</label>
        <select id="pitchSelect" class="form-select form-select-sm">
            <option value="0.8">निचली</option>
            <option value="1.0" selected>सामान्य</option>
            <option value="1.2">ऊँची</option>
            <option value="1.4">बहुत ऊँची</option>
        </select>
    `;
    
    return pitchDiv;
}

// स्पीच कंट्रोल बटन बनाएं
function createSpeechControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'speech-controls mb-3 p-3 border rounded';
    
    controlsDiv.innerHTML = `
        <div class="speech-header mb-2">
            <small class="text-muted"><i class="bi bi-megaphone"></i> आवाज़ से सुनें</small>
        </div>
        <div class="voice-controls-container">
            <div class="row g-2 align-items-end">
                <div class="col-md-4">
                    <label class="form-label small">आवाज़ चुनें:</label>
                    <div id="voiceSelectorContainer"></div>
                </div>
                <div class="col-md-3">
                    <div id="speedControlContainer"></div>
                </div>
                <div class="col-md-3">
                    <div id="pitchControlContainer"></div>
                </div>
                <div class="col-md-2">
                    <div class="d-grid gap-1">
                        <button id="speechControlBtn" class="btn btn-outline-primary btn-sm">
                            <i class="bi bi-play-fill"></i> चलाएं
                        </button>
                        <button id="stopSpeechBtn" class="btn btn-outline-danger btn-sm">
                            <i class="bi bi-stop-fill"></i> रोकें
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return controlsDiv;
}

// टाइपिंग एनिमेशन फ़ंक्शन
function typeWriter(element, text, speed = 20) {
    return new Promise((resolve) => {
        let i = 0;
        element.innerHTML = '';
        
        const cursor = document.createElement('span');
        cursor.className = 'ai-typing-cursor';
        element.appendChild(cursor);
        
        function type() {
            if (i < text.length) {
                element.removeChild(cursor);
                element.innerHTML += text.charAt(i);
                element.appendChild(cursor);
                i++;
                element.scrollTop = element.scrollHeight;
                setTimeout(type, speed);
            } else {
                element.removeChild(cursor);
                resolve();
            }
        }
        
        type();
    });
}

// HTML को पार्स करके टेक्सट निकालने का फ़ंक्शन
function htmlToText(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
}

// मार्कडाउन को HTML में बदलने के बाद टाइपिंग शुरू करें
async function displayAiResponseWithTyping(container, markdownText) {
    const htmlContent = converter ? converter.makeHtml(markdownText) : markdownText;
    const textContent = htmlToText(htmlContent);
    await typeWriter(container, textContent, 15);
    return textContent;
}

export async function getAiChartAdvice(chartDiv, chartTitle = "यह चार्ट") {
    if (!aiAdviceContainer || !aiAdviceContent) {
        showMessage("AI सलाह कंटेनर नहीं मिला।", "danger");
        return;
    }
    
    stopSpeaking();
    showAiAdviceModal();
    
    aiAdviceContent.innerHTML = `
        <div class="d-flex justify-content-center align-items-center my-4" style="min-height: 100px;">
            <div class="spinner-border text-primary" role="status"></div>
            <span class="ms-3">AI सलाह तैयार हो रही है...</span>
        </div>
    `;
    
    try {
        let imageDataUrl;
        const chartId = chartDiv.id;
        const chartConfig = visualizations.find(v => v.id === chartId);
        
        if (!chartConfig) {
            throw new Error("चार्ट कॉन्फ़िगरेशन नहीं मिला।");
        }
        
        const isPlotlyChart = ['candlestick', 'ohlc'].includes(chartConfig.type);
        
        if (isPlotlyChart) {
            imageDataUrl = await Plotly.toImage(chartDiv, {
                format: 'png',
                width: chartDiv.offsetWidth,
                height: chartDiv.offsetHeight
            });
        } else {
            const chartInstance = echarts.getInstanceByDom(chartDiv);
            if (chartInstance) {
                imageDataUrl = chartInstance.getDataURL({
                    pixelRatio: 2,
                    backgroundColor: '#fff'
                });
            } else {
                throw new Error("ECharts इंस्टेंस नहीं मिला।");
            }
        }
        
        const message = `कृपया इस चार्ट का विश्लेषण करें। यह ${chartTitle} के बारे में है। चार्ट में क्या दिखाया गया है, क्या पैटर्न हैं, और क्या महत्वपूर्ण अंतर्दृष्टि हैं?`;
        
        const response = await fetch('https://image-processing-mzhc.onrender.com/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                image_base64: imageDataUrl
            }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`AI API error: ${errorData.error || response.statusText}`);
        }
        
        const data = await response.json();
        
        aiAdviceContent.innerHTML = '';
        
        // Speech controls जोड़ें
        const speechControls = createSpeechControls();
        aiAdviceContent.appendChild(speechControls);
        
        // Voice controls populate करें
        const voiceContainer = document.getElementById('voiceSelectorContainer');
        const speedContainer = document.getElementById('speedControlContainer');
        const pitchContainer = document.getElementById('pitchControlContainer');
        
        if (voiceContainer) voiceContainer.appendChild(createVoiceSelector());
        if (speedContainer) speedContainer.appendChild(createSpeedControl());
        if (pitchContainer) pitchContainer.appendChild(createPitchControl());
        
        // कंटेंट के लिए डिव बनाएं
        const contentDiv = document.createElement('div');
        contentDiv.className = 'ai-response-content';
        aiAdviceContent.appendChild(contentDiv);
        
        // टाइपिंग शुरू करें और टेक्सट प्राप्त करें
        const responseText = await displayAiResponseWithTyping(contentDiv, data.reply);
        
        // Event listeners
        const speechControlBtn = document.getElementById('speechControlBtn');
        const stopSpeechBtn = document.getElementById('stopSpeechBtn');
        
        speechControlBtn.addEventListener('click', () => {
            if (isSpeaking) {
                stopSpeaking();
            } else {
                startSpeaking(responseText);
            }
        });
        
        stopSpeechBtn.addEventListener('click', () => {
            stopSpeaking();
        });
        
        showMessage('AI सलाह सफलतापूर्वक प्राप्त हुई!', 'success');
        
    } catch (error) {
        console.error("AI सलाह प्राप्त करने में त्रुटि:", error);
        aiAdviceContent.innerHTML =
            `<div class="text-danger p-3">
                <i class="bi bi-exclamation-triangle-fill"></i> 
                AI सलाह प्राप्त करने में त्रुटि: ${error.message}
            </div>`;
        showMessage(`AI सलाह में त्रुटि: ${error.message}`, 'danger');
    }
}

// Voices load होने पर
if (speechSynthesis) {
    speechSynthesis.onvoiceschanged = loadVoices;
    // Initial load
    setTimeout(loadVoices, 100);
}

export function attachToggleAiAdviceListeners() {
    // इस फ़ंक्शन को खाली छोड़ दें। यह पहले से ही charts.js में अटैच है।
}