import { headers } from '../store/DataHandler.js';
import { chartGlobalSettings } from '../js/charts.js';
import { commonChartOptions, getRandomColor } from './uility.js';
export function getGaugeChartOption(config, data) {
    const sampledData = data.length > 500 ? data.filter((_, i) => i % 10 === 0) : data;
    const valueCol = config.columns[1];
    const value = sampledData[0] ? parseFloat(sampledData[0][valueCol]) : 0;
    const name = sampledData[0] ? String(sampledData[0][config.columns[0]] || 'Gauge') : 'Gauge';
    const option = {
        tooltip: { trigger: 'item' },
        series: [{
            type: 'gauge',
            data: [{ value: value, name: name }],
            progress: { show: true, width: 30 },
            axisLine: { lineStyle: { width: 30 } },
            detail: { value: value, fontSize: 30, offsetCenter: [0, '20%'] }
        }]
    };
    return commonChartOptions(option, config);
}
