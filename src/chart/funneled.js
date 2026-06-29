import { headers } from '../store/DataHandler.js';
import { chartGlobalSettings } from '../js/charts.js';
import { commonChartOptions, getRandomColor } from './uility.js';
export function getFunnelChartOption(config, data) {
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
            type: 'funnel',
            data: seriesData.sort((a, b) => b.value - a.value),
            itemStyle: { color: params => chartGlobalSettings.colorPalette[params.dataIndex % chartGlobalSettings.colorPalette.length] },
            label: { show: true, position: 'inside', formatter: '{b}:{c}' }
        }]
    };
    return commonChartOptions(option, config);
}