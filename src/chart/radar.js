import { headers } from '../store/DataHandler.js';
import { chartGlobalSettings } from '../js/charts.js';
import { commonChartOptions, getRandomColor } from './uility.js';
export function getRadarChartOption(config, data) {
        const sampledData = data.length > 500 ? data.filter((_, i) => i % 10 === 0) : data;
        const xAxisColumn = config.columns[0];
        const yAxisColumns = config.columns.slice(1);
        const option = {
                tooltip: { trigger: 'item' },
                legend: {
                        show: chartGlobalSettings.legendPosition !== 'none',
                        data: yAxisColumns.map(col => headers[col] || col)
                },
                radar: {
                        indicator: yAxisColumns.map(col => ({ name: headers[col] || col, max: Math.max(...sampledData.map(row => parseFloat(row[col]) ||
                                        0)) * 1.2 })),
                        axisName: { color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333' }
                },
                series: [{
                        name: config.title,
                        type: 'radar',
                        data: [{
                                value: yAxisColumns.map(col => parseFloat(sampledData[0][col]) || 0),
                                name: String(sampledData[0][xAxisColumn] || 'Dataset'),
                                itemStyle: { color: config.color || getRandomColor() }
                        }]
                }]
        };
        return commonChartOptions(option, config);
}