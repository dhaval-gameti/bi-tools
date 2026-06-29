import { headers } from '../store/DataHandler.js';
import { chartGlobalSettings } from '../js/charts.js';
import { commonChartOptions, getRandomColor } from './uility.js';
export function getScatterChartOption(config, data) {
    const sampledData = data.length > 500 ? data.filter((_, i) => i % 10 === 0) : data;
    const xAxisColumn = config.columns[0];
    const yAxisColumn = config.columns[1];
    const sizeColumn = config.columns[2];
    const seriesData = sampledData.map(row => {
        const xVal = parseFloat(row[xAxisColumn]);
        const yVal = parseFloat(row[yAxisColumn]);
        const sizeVal = sizeColumn ? parseFloat(row[sizeColumn]) : 10;
        if (isNaN(xVal) || isNaN(yVal)) return null;
        return [xVal, yVal, sizeVal];
    }).filter(d => d !== null);
    const option = {
        tooltip: { trigger: 'item' },
        xAxis: {
            show: chartGlobalSettings.gridShowHide,
            type: 'value',
            name: config.xAxisLabel,
            axisLabel: { color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333' }
        },
        yAxis: {
            show: chartGlobalSettings.gridShowHide,
            type: 'value',
            name: config.yAxisLabel,
            axisLabel: { color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333' }
        },
        series: [{
            name: headers[yAxisColumn] || yAxisColumn,
            type: 'scatter',
            data: seriesData,
            symbolSize: config.type === 'bubble' ? function(dataItem) { return dataItem[2] ? dataItem[2] * 0.5 : 10; } : 10,
            itemStyle: { color: config.color || getRandomColor() }
        }]
    };
    return commonChartOptions(option, config);
}
