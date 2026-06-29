
 
 // js/liveDataHandler.js
 
 import { showMessage } from './utils.js';
 import { updateDataAndUI } from '../store/DataHandler.js';
 import { plotAll } from './charts.js';
 import { mapApiData } from './DataMapper.js';
 
 
 let apiIntervalId = null;
 let abortController = null;
 let isPaused = false;
 
 // -----------------------------
 // API डेटा fetch करना
 // -----------------------------
 export async function fetchDataFromApi(apiUrl, retryCount = 0, maxRetries = 3) {
     if (!apiUrl) {
         showMessage("API URL खाली है। कृपया एक वैध URL दर्ज करें।", "warning");
         return false;
     }
     
     if (abortController) abortController.abort(); // previous request cancel करें
     abortController = new AbortController();
     const { signal } = abortController;
     
     try {
         const response = await fetch(apiUrl, { signal });
         
         if (!response.ok) {
             throw new Error(`HTTP error! status: ${response.status}`);
         }
         
         const contentType = response.headers.get("content-type");
         const dataText = await response.text();
         let apiData = [];
         
         if (contentType?.includes("application/json")) {
             const jsonData = JSON.parse(dataText);
             apiData = mapApiData(jsonData).data;
             
         } else if (contentType?.includes("text/csv")) {
             if (typeof Papa === 'undefined') {
                 throw new Error("PapaParse loaded नहीं है। HTML में <script src='papaparse.min.js'> डालें।");
             }
             const parsed = Papa.parse(dataText, {
                 header: true,
                 dynamicTyping: true,
                 skipEmptyLines: true
             });
             apiData = parsed.data;
             
         } else if (contentType?.includes("text/plain")) {
             try {
                 const jsonData = JSON.parse(dataText);
                 apiData = mapApiData(jsonData).data;
             } catch {
                 throw new Error("API ने सादा टेक्स्ट लौटाया जो कि JSON फॉर्मेट में नहीं है।");
             }
         } else {
             throw new Error(`असमर्थित डेटा फॉर्मेट: ${contentType || 'नहीं मिला'}`);
         }
         
         if (apiData.length > 0) {
             updateDataAndUI(apiData);
             plotAll();
             showMessage("API से लाइव डेटा सफलतापूर्वक लोड हो गया है!", "success");
             return true;
         } else {
             throw new Error("API से कोई डेटा नहीं मिला।");
         }
         
     } catch (error) {
         if (error.name === 'AbortError') {
             console.warn('पिछली API कॉल रद्द कर दी गई।');
             return false;
         }
         
         console.error("API से डेटा प्राप्त करने में त्रुटि:", error);
         
         if (retryCount < maxRetries) {
             console.warn(`Retrying API fetch... (${retryCount + 1})`);
             await new Promise(r => setTimeout(r, 2000)); // 2 सेकंड delay
             return fetchDataFromApi(apiUrl, retryCount + 1, maxRetries);
         } else {
             showMessage(`API fetch failed: ${error.message}`, "danger");
             stopLiveUpdate();
             return false;
         }
     }
 }
 
 // -----------------------------
 // Live update शुरू करना
 // -----------------------------
 export function startLiveUpdate(apiUrl, intervalInSeconds) {
     stopLiveUpdate(); // previous interval clean करें
     
     isPaused = false;
     
     fetchDataFromApi(apiUrl).then(success => {
         if (success && intervalInSeconds > 0) {
             apiIntervalId = setInterval(async () => {
                 if (!isPaused) await fetchDataFromApi(apiUrl);
             }, intervalInSeconds * 1000);
             
             showMessage(`लाइव डेटा अपडेट शुरू किया गया: हर ${intervalInSeconds} सेकंड में।`, "success");
         } else if (success) {
             showMessage("पहला डेटा लोड हो गया है, लेकिन इंटरवल 0 होने के कारण लाइव अपडेट शुरू नहीं हुआ है।", "info");
         }
     });
 }
 
 // -----------------------------
 // Live update बंद करना
 // -----------------------------
 export function stopLiveUpdate() {
     if (apiIntervalId) {
         clearInterval(apiIntervalId);
         apiIntervalId = null;
         showMessage("लाइव डेटा अपडेट बंद कर दिया गया है।", "info");
     }
 }
 
 // -----------------------------
 // Live update pause/resume
 // -----------------------------
 export function toggleLiveUpdatePause() {
     isPaused = !isPaused;
     showMessage(isPaused ? "लाइव अपडेट pause कर दिया गया।" : "लाइव अपडेट resume किया गया।", "info");
 }