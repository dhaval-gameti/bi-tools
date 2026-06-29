import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/modular/sortable.esm.js';

// -------------------------
// कॉलम लिस्ट पॉपुलेट करना
// -------------------------
export function populateColumnDragLists(columns) {
    const columnList = document.getElementById('columnList');
    const xAxisDropZone = document.getElementById('xAxisDropZone');
    const yAxisDropZone = document.getElementById('yAxisDropZone');
    const zAxisDropZone = document.getElementById('zAxisDropZone');
    
    // पहले सभी आइटम्स क्लियर करें
    [columnList, xAxisDropZone, yAxisDropZone, zAxisDropZone].forEach(el => el.innerHTML = '');
    
    columns.forEach(col => {
        const item = document.createElement('div');
        item.className = 'list-group-item';
        item.setAttribute('data-col', col);
        item.textContent = col;
        columnList.appendChild(item);
    });
}

// -------------------------
// ड्रॉप ज़ोन में कॉलम पॉपुलेट करना
// -------------------------
export function populateDropZones(allColumns, xAxis, yAxes, zAxis) {
    populateColumnDragLists(allColumns);
    
    const columnList = document.getElementById('columnList');
    const xAxisDropZone = document.getElementById('xAxisDropZone');
    const yAxisDropZone = document.getElementById('yAxisDropZone');
    const zAxisDropZone = document.getElementById('zAxisDropZone');
    
    if (xAxis) {
        const xAxisItem = columnList.querySelector(`[data-col="${xAxis}"]`);
        if (xAxisItem) xAxisDropZone.appendChild(xAxisItem);
    }
    
    if (yAxes?.length > 0) {
        yAxes.forEach(col => {
            const yAxisItem = columnList.querySelector(`[data-col="${col}"]`);
            if (yAxisItem) yAxisDropZone.appendChild(yAxisItem);
        });
    }
    
    if (zAxis) {
        const zAxisItem = columnList.querySelector(`[data-col="${zAxis}"]`);
        if (zAxisItem) zAxisDropZone.appendChild(zAxisItem);
    }
}

// -------------------------
// ड्रैग-एंड-ड्रॉप इनिशियलाइजेशन
// -------------------------
export function initializeDragAndDrop() {
    const columnList = document.getElementById('columnList');
    const xAxisDropZone = document.getElementById('xAxisDropZone');
    const yAxisDropZone = document.getElementById('yAxisDropZone');
    const zAxisDropZone = document.getElementById('zAxisDropZone');
    
    const sharedOptions = {
        group: 'shared',
        animation: 150,
        emptyInsertThreshold: 5
    };
    
    // मुख्य कॉलम लिस्ट
    new Sortable(columnList, {
        ...sharedOptions,
        pull: 'clone',
        put: true,
        onEnd(evt) {
            if (evt.from !== columnList && evt.to === columnList) evt.item.remove();
        }
    });
    
    // X और Z ड्रॉप ज़ोन (सिर्फ़ एक आइटम)
    [xAxisDropZone, zAxisDropZone].forEach(zone => {
        new Sortable(zone, {
            ...sharedOptions,
            onAdd(evt) {
                if (evt.to.children.length > 1) evt.from.appendChild(evt.item);
                updateChartConfig();
            },
            onRemove: updateChartConfig
        });
    });
    
    // Y ड्रॉप ज़ोन (multiple items)
    new Sortable(yAxisDropZone, {
        ...sharedOptions,
        onAdd: updateChartConfig,
        onRemove: updateChartConfig
    });
}

// -------------------------
// चार्ट कॉलम प्राप्त करना
// -------------------------
export function getChartColumns() {
    const xAxis = document.getElementById('xAxisDropZone').querySelector('.list-group-item');
    const yAxes = Array.from(document.getElementById('yAxisDropZone').querySelectorAll('.list-group-item')).map(el => el.getAttribute('data-col'));
    const zAxis = document.getElementById('zAxisDropZone').querySelector('.list-group-item');
    
    return {
        xAxis: xAxis?.getAttribute('data-col') || null,
        yAxes,
        zAxis: zAxis?.getAttribute('data-col') || null
    };
}

// -------------------------
// चार्ट कॉन्फ़िग अपडेट करना
// -------------------------
function updateChartConfig() {
    const { xAxis, yAxes, zAxis } = getChartColumns();
    console.log("X-अक्ष:", xAxis, "Y-अक्ष:", yAxes, "Z-अक्ष:", zAxis);
}