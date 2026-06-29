// js/chart_actions.js

import { getAiChartAdvice } from './ai_advice.js';
import { showMessage } from './utils.js';

// चार्ट को डिलीट करने का फ़ंक्शन
export function handleDeleteChart(chartElement) {
    if (confirm("क्या आप वाकई इस चार्ट को डिलीट करना चाहते हैं?")) {
        chartElement.remove();
        showMessage('चार्ट सफलतापूर्वक डिलीट हो गया है।', 'success');
    }
}

// AI सलाह को ट्रिगर करने का फ़ंक्शन
export function handleAiAdvice(chartCanvas, chartTitle) {
    if (chartCanvas) {
        getAiChartAdvice(chartCanvas, chartTitle);
    } else {
        showMessage('AI सलाह के लिए चार्ट कैनवास नहीं मिला।', 'warning');
        console.warn("AI सलाह के लिए चार्ट कैनवास नहीं मिला।");
    }
}

// सभी चार्ट पर इवेंट लिसनर्स अटैच करने का फ़ंक्शन
export function attachChartActionListeners() {
    document.querySelectorAll('.chart-delete-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const chartItem = event.target.closest('.chart-item');
            if (chartItem) {
                handleDeleteChart(chartItem);
            }
        });
    });

    document.querySelectorAll('.chart-ai-advice-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const chartItem = event.target.closest('.chart-item');
            const chartCanvas = chartItem.querySelector('.chart-canvas');
            const chartTitleElement = chartItem.querySelector('.chart-title');
            const chartTitle = chartTitleElement ? chartTitleElement.textContent : "यह चार्ट";

            if (chartCanvas) {
                handleAiAdvice(chartCanvas, chartTitle);
            }
        });
    });
}
