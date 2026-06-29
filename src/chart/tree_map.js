import { headers } from '../store/DataHandler.js';
import { chartGlobalSettings } from '../js/charts.js';
import { commonChartOptions, getRandomColor } from './uility.js';
export function getTreemapChartOption(config, data) {
        const sampledData = data.length > 500 ? data.filter((_, i) => i % 10 === 0) : data;
        const xAxisColumn = config.columns[0];
        const valueCol = config.columns[1];
        const treeData = [{
                name: 'ट्रीमैप',
                children: sampledData.map(row => ({
                        name: String(row[xAxisColumn] || 'Unknown'),
                        value: isNaN(parseFloat(row[valueCol])) ? 0 : parseFloat(row[valueCol])
                }))
        }];
        const option = {
                tooltip: { trigger: 'item' },
                series: [{
                        type: 'treemap',
                        data: treeData,
                        leafDepth: 1,
                        label: { show: true, formatter: '{b}' },
                        breadcrumb: { show: false }
                }]
        };
        return commonChartOptions(option, config);
}