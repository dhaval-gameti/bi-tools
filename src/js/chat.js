
//const LLAMA_API_URL = 'https://deepseek-n6ck.onrender.com/chat'; 

// Chat related variables
let chatHistory = []; // AI के साथ बातचीत का इतिहास रखेगा
const maxChatHistoryLength = 10; // बातचीत के कितने टर्न याद रखने हैं (user+assistant = 2 टर्न)

// Import headers and currentDataForChat from dataHandler.js
import { headers, currentDataForChat } from '../store/DataHandler.js';
// Import showMessage from utils.js
import { showMessage } from './utils.js';

// Showdown.js कन्वर्टर बनाएँ 
const converter = typeof showdown !== 'undefined' ? new showdown.Converter() : null;

// Function to generate a summary of the current filtered data
export async function generateSummary(data) {
    const summaryOutputDiv = document.getElementById('summaryOutput');
    const summaryTextDiv = document.getElementById('summaryText');

    if (!summaryOutputDiv || !summaryTextDiv) return;

    summaryOutputDiv.style.display = 'block';
    summaryTextDiv.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div> सारांश तैयार किया जा रहा है...';

    let prompt = "मेरे पास एक डेटासेट है। कृपया इसका एक संक्षिप्त, 3-बिंदु सारांश हिंदी में दें। यह एक बिक्री रिपोर्ट, प्रदर्शन रिपोर्ट या किसी अन्य प्रकार का डेटा हो सकता है। डेटा कोमा से अलग किया गया है। यहां डेटा के पहले कुछ पंक्तियाँ और कॉलम शीर्षलेख दिए गए हैं:\n\n";
    prompt += "कॉलम: " + headers.join(", ") + "\n\n"; 
    prompt += "डेटा के नमूने:\n";
    data.slice(0, 5).forEach(row => { 
        const sampleRow = headers && headers.length > 0 ? headers.map(h => row[h] || '').join(",") : Object.values(row).join(",");
        prompt += sampleRow + "\n";
    });
    prompt += "\nइस डेटासेट में क्या महत्वपूर्ण प्रवृत्तियाँ, मुख्य बिंदु या असामान्य पैटर्न हैं? संख्यात्मक मानों, तिथियों और श्रेणियों पर ध्यान दें। केवल 3 बिंदुओं का उपयोग करके उत्तर दें। मुजे इस डाटा का रिपोर्ट बनके दो। और साथ मे यह भी बतयो की इस डाटा पर कोनसा चार्ट आछा रहेगा";

    try {
        const response = await fetch(LLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ message: prompt }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        const result = await response.json();
        const summary = result.reply || "सारांश उपलब्ध नहीं है।";

        // Showdown.js का उपयोग करके HTML में कन्वर्ट करें
        summaryTextDiv.innerHTML = converter ? converter.makeHtml(summary) : summary;

    } catch (error) {
        console.error("AI सारांश जनरेट करते समय त्रुटि:", error);
        summaryTextDiv.innerHTML = `सारांश जनरेट नहीं किया जा सका। त्रुटि: ${error.message || error}`;
    }
}

// Function to send chat message and get response
export async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatHistoryDiv = document.getElementById('chatHistory');
    const userMessage = chatInput.value.trim();

    if (!userMessage) return;

    displayChatMessage(userMessage, 'user');
    chatInput.value = '';

    let dataContext = "";
    if (currentDataForChat && currentDataForChat.length > 0) { 
        dataContext += "यहां आपके द्वारा संदर्भित डेटासेट के पहले कुछ पंक्तियाँ और कॉलम शीर्षलेख दिए गए हैं:\n\n";
        dataContext += "कॉलम: " + headers.join(", ") + "\n\n"; 
        dataContext += "डेटा के नमूने:\n";
        currentDataForChat.slice(0, 5).forEach(row => {
            const sampleRow = headers && headers.length > 0 ? headers.map(h => row[h] || '').join(",") : Object.values(row).join(",");
            dataContext += sampleRow + "\n";
        });
        dataContext += "user को तुमहरा नाम vedra bi सहायक बताना हे।\nउपयोगकर्ता ने ऊपर दिए गए डेटासेट के संदर्भ में प्रश्न पूछा है।\n\n";
    }

    let messagesForAPI = chatHistory.map(entry => ({
        role: entry.type === 'user' ? 'user' : 'assistant',
        content: entry.message
    }));

    messagesForAPI.push({ role: 'user', content: dataContext + userMessage });

    if (messagesForAPI.length > maxChatHistoryLength * 2) {
        messagesForAPI = messagesForAPI.slice(messagesForAPI.length - (maxChatHistoryLength * 2));
    }

    displayChatMessage('AI सोच रहा है...', 'assistant', true);

    try {
        const response = await fetch(LLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ messages: messagesForAPI }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        const result = await response.json();
        const aiReply = result.reply || "माफ़ कीजिए, मुझे जवाब नहीं मिल पाया।";

        removeLoadingMessage();
        displayChatMessage(aiReply, 'assistant');

    } catch (error) {
        removeLoadingMessage();
        displayChatMessage(`क्षमा करें, AI से बात करते समय एक त्रुटि हुई: ${error.message}`, 'assistant');
        console.error("AI चैट में त्रुटि:", error);
    }
}

function displayChatMessage(message, type, isLoading = false) {
    const chatHistoryDiv = document.getElementById('chatHistory');
    if (!chatHistoryDiv) return;

    const messageElement = document.createElement('div');
    messageElement.className = `alert ${type === 'user' ? 'alert-primary' : 'alert-secondary'} p-2 mb-2`;

    // Showdown.js का उपयोग करके Markdown को HTML में बदलें
    messageElement.innerHTML = isLoading
        ? `<div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div> ${message}`
        : (converter ? converter.makeHtml(message) : message);

    if (isLoading) {
        messageElement.id = 'loadingMessage';
    }

    chatHistoryDiv.appendChild(messageElement);
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

    if (!isLoading) {
        chatHistory.push({ type: type, message: message });
    }
}

function removeLoadingMessage() {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}