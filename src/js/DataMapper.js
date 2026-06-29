// js/DataMapper.js

/**
 * Extracts and maps data from various API formats into a standardized array of objects.
 * @param {object|array} apiData - The raw data received from the API.
 * @returns {{headers: string[], data: object[]}} - An object containing mapped headers and the data array.
 */
export function mapApiData(apiData) {
    let extractedData = [];
    let headers = [];
    
    // Case 1: Direct array of objects
    if (Array.isArray(apiData) && apiData.length > 0) {
        extractedData = apiData.map(cleanKeys);
        headers = Object.keys(extractedData[0]);
    }
    // Case 2: Nested object
    else if (typeof apiData === 'object' && apiData !== null) {
        const dataKey = findDataKey(apiData);
        if (dataKey && typeof apiData[dataKey] === 'object') {
            const nestedData = apiData[dataKey];
            
            // Convert nested object into array
            extractedData = Object.entries(nestedData).map(([timestamp, values]) => {
                const entry = { timestamp, ...values };
                return cleanKeys(entry);
            });
            
            if (extractedData.length > 0) {
                headers = Object.keys(extractedData[0]);
            }
        }
    }
    
    if (extractedData.length === 0) {
        throw new Error("API डेटा को सही तरीके से मैप नहीं किया जा सका: कोई वैध data key या array नहीं मिला।");
    }
    
    return { headers, data: extractedData };
}

/**
 * Finds the most likely data key within a nested object.
 */
function findDataKey(data) {
    const commonKeys = [
        "Time Series", "Data", "Records", "results", "entries", "feed",
        "items", "rows", "values", "datasets", "series"
    ];
    for (const key of commonKeys) {
        const foundKey = Object.keys(data).find(k => k.toLowerCase().includes(key.toLowerCase()));
        if (foundKey) return foundKey;
    }
    return null;
}

/**
 * Cleans and flattens object keys for readability.
 */
function cleanKeys(entry) {
    const cleaned = {};
    for (const key in entry) {
        let newKey = key.replace(/^\d+[\.\s-]*/, '').trim(); // Remove "1. ", "2-", etc.
        newKey = newKey.replace(/\s+/g, '_').toLowerCase(); // normalize: "Close Price" → "close_price"
        if (typeof entry[key] === 'object' && entry[key] !== null && !Array.isArray(entry[key])) {
            // Flatten nested object
            const subObj = cleanKeys(entry[key]);
            for (const subKey in subObj) {
                cleaned[`${newKey}_${subKey}`] = subObj[subKey];
            }
        } else {
            cleaned[newKey] = entry[key];
        }
    }
    return cleaned;
}