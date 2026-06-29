
// js/filter.js

/**
 * सभी फ़िल्टर और सॉर्ट नियमों को लागू करता है और फ़िल्टर्ड डेटा वापस करता है।
 * @param {Array} rawData - मूल डेटा।
 * @param {Array} headers - डेटा के कॉलम हेडर।
 * @returns {Array} - फ़िल्टर और सॉर्ट किया गया डेटा।
 */
export function applyFiltersAndSort(rawData, headers) {
    let data = [...rawData];
    
    // --- 1. Text Filter ---
    const filterCol = document.getElementById('filterCol')?.value || null;
    const filterValue = document.getElementById('filterValue')?.value || '';
    const operator = document.getElementById('textFilterOperator')?.value || 'includes';
    const filterValueLower = filterValue.toLowerCase();
    
    if (filterCol && filterValue) {
        data = data.filter(row => {
            const cell = row[filterCol] ? String(row[filterCol]).toLowerCase() : '';
            switch (operator) {
                case 'startsWith': return cell.startsWith(filterValueLower);
                case 'endsWith': return cell.endsWith(filterValueLower);
                case 'equals': return cell === filterValueLower;
                case 'doesNotInclude': return !cell.includes(filterValueLower);
                case 'includes':
                default: return cell.includes(filterValueLower);
            }
        });
    }
    
    // --- 2. Multi-Select Filter ---
    const multiCol = document.getElementById('multiSelectFilterCol')?.value;
    const selectedValues = Array.from(document.querySelectorAll('#multiSelectOptions input[type="checkbox"]:checked'))
        .map(el => el.value);
    
    if (multiCol && selectedValues.length > 0) {
        data = data.filter(row => {
            const value = row[multiCol] ? String(row[multiCol]) : '';
            return selectedValues.includes(value);
        });
    }
    
    // --- 3. Numeric Range Filter ---
    const numericCol = document.getElementById('filterNumericCol')?.value;
    const minValue = parseFloat(document.getElementById('minNumericValue')?.value);
    const maxValue = parseFloat(document.getElementById('maxNumericValue')?.value);
    
    if (numericCol && (!isNaN(minValue) || !isNaN(maxValue))) {
        data = data.filter(row => {
            const value = parseFloat(row[numericCol]);
            if (isNaN(value)) return false;
            const minValid = isNaN(minValue) || value >= minValue;
            const maxValid = isNaN(maxValue) || value <= maxValue;
            return minValid && maxValid;
        });
    }
    
    // --- 4. Date Range Filter ---
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    
    if (startDate && endDate) {
        const dateCol = headers.find(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('tarikh')) || headers[0];
        const start = new Date(startDate); start.setHours(0,0,0,0);
        const end = new Date(endDate); end.setHours(23,59,59,999);
        
        data = data.filter(row => { 
            const dateValue = row[dateCol]; 
            if (!dateValue) return false; 
            const rowDate = new Date(dateValue); 
            return !isNaN(rowDate) && rowDate >= start && rowDate <= end; 
        }); 
    }
    
    // --- 5. Group By ---
    const groupByCols = Array.from(document.getElementById('groupByCols')?.selectedOptions || [])
        .map(option => option.value);
    
    if (groupByCols.length > 0) {
        const groupedMap = new Map();
        data.forEach(row => { 
            const key = groupByCols.map(col => row[col]).join(' - '); 
            if (!groupedMap.has(key)) { 
                groupedMap.set(key, { count: 0, sum: {} }); 
                headers.forEach(h => { 
                    if (!groupByCols.includes(h) && !isNaN(parseFloat(row[h]))) 
                        groupedMap.get(key).sum[h] = 0; 
                }); 
            } 
            const group = groupedMap.get(key); 
            group.count++; 
            headers.forEach(h => { 
                if (!groupByCols.includes(h) && !isNaN(parseFloat(row[h]))) 
                    group.sum[h] += parseFloat(row[h]) || 0; 
            }); 
        }); 
        data = Array.from(groupedMap.entries()).map(([key, value]) => { 
            const obj = {}; 
            groupByCols.forEach((col, i) => obj[col] = key.split(' - ')[i]); 
            obj['कुल पंक्तियाँ'] = value.count; 
            Object.assign(obj, value.sum); 
            return obj; 
        }); 
    }
    
    // --- 6. Multi-Column Sort ---
    const sortRules = Array.from(document.getElementById('sortRulesContainer')?.querySelectorAll('.sort-rule') || [])
        .map(ruleDiv => ({
            column: ruleDiv.querySelector('.sort-col-select')?.value,
            order: ruleDiv.querySelector('input[name^="sortOrder_"]:checked')?.value || 'asc'
        }))
        .filter(rule => rule.column);
    
    if (sortRules.length > 0) {
        data.sort((a, b) => {
            for (const {column, order} of sortRules) {
                const valA = a[column], valB = b[column];
                const isNumeric = !isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB));
                let cmp = 0;
                if (isNumeric) cmp = parseFloat(valA) - parseFloat(valB);
                else cmp = String(valA || '').localeCompare(String(valB || ''));
                if (cmp !== 0) return order === 'asc' ? cmp : -cmp;
            }
            return 0;
        });
    }
    
    return data;
}

/**
 * मल्टी-सेलेक्ट फ़िल्टर विकल्पों को पॉपुलेट करता है।
 * @param {string} column - कॉलम का नाम जिसके लिए विकल्प पॉपुलेट करने हैं।
 * @param {Array} data - डेटा जिसके आधार पर विकल्प पॉपुलेट करने हैं।
 */
export function populateMultiSelectOptions(column, data) {
    const optionsDiv = document.getElementById('multiSelectOptions');
    optionsDiv.innerHTML = '';
    
    if (!column || data.length === 0) return;
    
    const uniqueValues = [...new Set(data.map(row => row[column] ? String(row[column]) : ''))];
    uniqueValues.forEach(value => {
        const safeId = `multi-select-${value.replace(/\s+/g,'_')}`;
        const div = document.createElement('div');
        div.classList.add('form-check');
        div.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${value}" id="${safeId}">
            <label class="form-check-label" for="${safeId}">${value}</label>
        `;
        optionsDiv.appendChild(div);
    });
}

/**
 * एक नया सॉर्ट नियम UI तत्व बनाता है।
 * @param {Array} headers - डेटा के कॉलम हेडर।
 * @returns {HTMLElement} - नया सॉर्ट नियम Div तत्व।
 */
export function createSortRuleElement(headers) {
    const div = document.createElement('div');
    const id = 'sortRule_' + Date.now();
    div.id = id;
    div.classList.add('sort-rule', 'mb-2', 'd-flex', 'align-items-center', 'gap-2');
    div.innerHTML = `
        <select class="form-select sort-col-select">
            <option value="">कॉलम चुनें</option>
            ${headers.map(h => `<option value="${h}">${h}</option>`).join('')}
        </select>
        <div class="btn-group" role="group">
            <input type="radio" class="btn-check" name="sortOrder_${id}" id="asc_${id}" value="asc" checked>
            <label class="btn btn-outline-secondary" for="asc_${id}"><i class="bi bi-sort-up"></i></label>
            <input type="radio" class="btn-check" name="sortOrder_${id}" id="desc_${id}" value="desc">
            <label class="btn btn-outline-secondary" for="desc_${id}"><i class="bi bi-sort-down"></i></label>
        </div>
        <button class="btn btn-danger btn-sm remove-sort-rule"><i class="bi bi-x-lg"></i></button>
    `;
    
    div.querySelector('.remove-sort-rule').addEventListener('click', () => div.remove());
    return div;
}

/**
 * सभी फ़िल्टर्स को डिफ़ॉल्ट मानों पर रीसेट करता है
 * @param {Array} headers - डेटा के कॉलम हेडर (सॉर्ट रूल्स के लिए)
 */
export function resetAllFilters(headers = []) {
    // 1. Text Filter Reset
    const filterCol = document.getElementById('filterCol');
    const filterValue = document.getElementById('filterValue');
    const textFilterOperator = document.getElementById('textFilterOperator');
    
    if (filterCol) filterCol.value = '';
    if (filterValue) filterValue.value = '';
    if (textFilterOperator) textFilterOperator.value = 'includes';
    
    // 2. Multi-Select Filter Reset
    const multiSelectFilterCol = document.getElementById('multiSelectFilterCol');
    const multiSelectOptions = document.getElementById('multiSelectOptions');
    
    if (multiSelectFilterCol) multiSelectFilterCol.value = '';
    if (multiSelectOptions) {
        // सभी चेकबॉक्स को अनचेक करें
        const checkboxes = multiSelectOptions.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = false);
    }
    
    // 3. Numeric Range Filter Reset
    const filterNumericCol = document.getElementById('filterNumericCol');
    const minNumericValue = document.getElementById('minNumericValue');
    const maxNumericValue = document.getElementById('maxNumericValue');
    
    if (filterNumericCol) filterNumericCol.value = '';
    if (minNumericValue) minNumericValue.value = '';
    if (maxNumericValue) maxNumericValue.value = '';
    
    // 4. Date Range Filter Reset
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (startDate) startDate.value = '';
    if (endDate) endDate.value = '';
    
    // 5. Group By Reset
    const groupByCols = document.getElementById('groupByCols');
    if (groupByCols) {
        // सभी सिलेक्टेड ऑप्शन्स को अनसिलेक्ट करें
        Array.from(groupByCols.options).forEach(option => option.selected = false);
    }
    
    // 6. Sort Rules Reset
    const sortRulesContainer = document.getElementById('sortRulesContainer');
    if (sortRulesContainer) {
        sortRulesContainer.innerHTML = '';
        // एक डिफ़ॉल्ट सॉर्ट रूल जोड़ें (वैकल्पिक)
        if (headers.length > 0) {
            const defaultSortRule = createSortRuleElement(headers);
            sortRulesContainer.appendChild(defaultSortRule);
        }
    }
    
    // 🚨 यह लाइन हटा दी गई है जो दोहरी कॉलिंग का कारण बन रही थी:
    // const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    // if (applyFiltersBtn) {
    //     applyFiltersBtn.click();
    // }
    
    // 7. केवल कस्टम इवेंट डिस्पैच करें
    dispatchFilterChangeEvent();
}

/**
 * फ़िल्टर परिवर्तन इवेंट डिस्पैच करता है
 */
function dispatchFilterChangeEvent() {
    const event = new CustomEvent('filtersReset', {
        detail: { timestamp: new Date().toISOString() }
    });
    document.dispatchEvent(event);
}

/**
 * रीसेट बटन को इनिशियलाइज़ करता है (यह फ़ंक्शन अब DataHandler.js में initializeCustomResetButton से ओवरराइड हो गया है)
 * @param {Array} headers - डेटा के कॉलम हेडर
 */
export function initializeResetButton(headers) {
    // Note: इस फ़ंक्शन का उपयोग DataHandler.js में नहीं किया जा रहा है,
    // इसलिए यह सुरक्षित है कि इसे खाली छोड़ दें या इसे DataHandler.js
    // में initializeCustomResetButton से बदल दें।
}

/**
 * डायनामिक फ़िल्टर कॉन्फ़िगरेशन
 */
export const filterConfig = {
    // डिफ़ॉल्ट फ़िल्टर वैल्यूज़
    defaults: {
        textFilter: {
            column: '',
            value: '',
            operator: 'includes'
        },
        multiSelect: {
            column: '',
            selectedValues: []
        },
        numericRange: {
            column: '',
            min: '',
            max: ''
        },
        dateRange: {
            start: '',
            end: ''
        },
        groupBy: {
            columns: []
        },
        sortRules: []
    },
    
    // फ़िल्टर एलिमेंट्स के IDs
    elements: {
        textFilter: {
            column: 'filterCol',
            value: 'filterValue',
            operator: 'textFilterOperator'
        },
        multiSelect: {
            column: 'multiSelectFilterCol',
            options: 'multiSelectOptions'
        },
        numericRange: {
            column: 'filterNumericCol',
            min: 'minNumericValue',
            max: 'maxNumericValue'
        },
        dateRange: {
            start: 'startDate',
            end: 'endDate'
        },
        groupBy: {
            container: 'groupByCols'
        },
        sortRules: {
            container: 'sortRulesContainer'
        }
    }
};

/**
 * करंट फ़िल्टर स्टेट को प्राप्त करता है
 * @returns {Object} - करंट फ़िल्टर स्टेट
 */
export function getCurrentFilterState() {
    return {
        textFilter: {
            column: document.getElementById('filterCol')?.value || '',
            value: document.getElementById('filterValue')?.value || '',
            operator: document.getElementById('textFilterOperator')?.value || 'includes'
        },
        multiSelect: {
            column: document.getElementById('multiSelectFilterCol')?.value || '',
            selectedValues: Array.from(document.querySelectorAll('#multiSelectOptions input[type="checkbox"]:checked'))
                .map(el => el.value)
        },
        numericRange: {
            column: document.getElementById('filterNumericCol')?.value || '',
            min: document.getElementById('minNumericValue')?.value || '',
            max: document.getElementById('maxNumericValue')?.value || ''
        },
        dateRange: {
            start: document.getElementById('startDate')?.value || '',
            end: document.getElementById('endDate')?.value || ''
        },
        groupBy: {
            columns: Array.from(document.getElementById('groupByCols')?.selectedOptions || [])
                .map(option => option.value)
        },
        sortRules: Array.from(document.getElementById('sortRulesContainer')?.querySelectorAll('.sort-rule') || [])
            .map(ruleDiv => ({
                column: ruleDiv.querySelector('.sort-col-select')?.value,
                order: ruleDiv.querySelector('input[name^="sortOrder_"]:checked')?.value || 'asc'
            }))
            .filter(rule => rule.column)
    };
}