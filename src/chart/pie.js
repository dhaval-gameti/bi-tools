import { headers } from '../store/DataHandler.js';
import { chartGlobalSettings } from '../js/charts.js';
import { commonChartOptions, getRandomColor } from './uility.js';

export function getPieChartOption(config, data) {
        const sampledData = data.length > 500 ? data.filter((_, i) => i % 10 === 0) : data;
        const labelCol = config.columns[0];
        const valueCol = config.columns[1];
        const seriesData = sampledData.map(row => ({
                name: String(row[labelCol] || 'Unknown'),
                value: isNaN(parseFloat(row[valueCol])) ? 0 : parseFloat(row[valueCol])
        }));
        const option = {
                tooltip: { trigger: 'item' },
                series: [{
                        name: headers[valueCol] || valueCol,
                        type: 'pie',
                        radius: config.type === 'doughnut' ? ['40%', '65%'] : (config.type.includes('rose') ? '80%' : '65%'),
                        roseType: config.type.includes('rose') ? (config.type === 'rose-radius' ? 'radius' : 'area') : null,
                        center: ['50%', '50%'],
                        data: seriesData,
                        itemStyle: {
                                color: params => chartGlobalSettings.colorPalette[params.dataIndex % chartGlobalSettings.colorPalette
                                        .length]
                        },
                        label: {
                                show: chartGlobalSettings.showLabels,
                                formatter: '{b}: {c} ({d}%)',
                                color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333'
                        }
                }]
        };
        return commonChartOptions(option, config);
}