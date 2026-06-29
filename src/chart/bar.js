import { headers } from '../store/DataHandler.js';
import { chartGlobalSettings } from '../js/charts.js';
import { commonChartOptions } from './uility.js';

export function getBarChartOption(config, data) {
    // Error handling
    if (!config || !config.columns || config.columns.length < 2) {
        console.error('Invalid configuration for bar chart');
        return commonChartOptions({}, config, chartGlobalSettings);
    }

    if (!data || data.length === 0) {
        console.warn('No data available for bar chart');
        return commonChartOptions({}, config, chartGlobalSettings);
    }

    const isHorizontal = config.type === 'horizontal-bar';
    const isStacked = config.type === 'stacked-bar';
    const isGrouped = config.type === 'grouped-bar' || config.type === 'bar';

    // Better sampling
    const sampleSize = 500;
    const sampledData = data.length > sampleSize ? 
        data.filter((_, i) => i % Math.ceil(data.length / sampleSize) === 0) : 
        data;

    const xAxisColumn = config.columns[0];
    const yAxisColumns = config.columns.slice(1);

    // Theme function
    const getTextColor = () => document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333';

    // Fallback color palette
    const defaultColorPalette = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', 
                               '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];

    const series = yAxisColumns.map((col, index) => ({
        name: headers[col] || col,
        type: 'bar',
        data: sampledData.map(row => {
            if (!row || row[col] === null || row[col] === undefined) return null;
            const value = parseFloat(row[col]);
            return isNaN(value) ? null : value;
        }),
        stack: isStacked ? 'total' : undefined,
        itemStyle: { 
            color: chartGlobalSettings.colorPalette 
                ? chartGlobalSettings.colorPalette[index % chartGlobalSettings.colorPalette.length]
                : defaultColorPalette[index % defaultColorPalette.length]
        },
        label: {
            show: chartGlobalSettings.showLabels,
            position: isHorizontal ? 'right' : 'top',
            formatter: function(params) {
                return `${params.value}\n${headers[col] || col}`;
            },
            color: getTextColor()
        },
        emphasis: {
            focus: 'series',
            itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
        },
        animation: true,
        animationDuration: 1000,
        animationEasing: 'elasticOut'
    }));

    const xAxisConfig = {
        show: chartGlobalSettings.gridShowHide,
        type: isHorizontal ? 'value' : 'category',
        name: config.xAxisLabel,
        data: isHorizontal ? null : sampledData.map(row => row[xAxisColumn]),
        axisLabel: { 
            color: getTextColor(),
            rotate: isHorizontal ? 0 : (sampledData.length > 10 ? 45 : 0)
        }
    };

    const yAxisConfig = {
        show: chartGlobalSettings.gridShowHide,
        type: isHorizontal ? 'category' : 'value',
        name: config.yAxisLabel,
        data: isHorizontal ? sampledData.map(row => row[xAxisColumn]) : null,
        axisLabel: { 
            color: getTextColor() 
        }
    };

    const option = {
        tooltip: { 
            trigger: 'item',
            formatter: function(params) {
                if (Array.isArray(params)) {
                    let result = `${params[0].name}<br/>`;
                    params.forEach(param => {
                        result += `${param.seriesName}: <b>${param.value}</b><br/>`;
                    });
                    result += `Total: <b>${params.reduce((sum, param) => sum + param.value, 0)}</b>`;
                    return result;
                } else {
                    return `${params.name}<br/>${params.seriesName}: <b>${params.value}</b>`;
                }
            }
        },
        xAxis: xAxisConfig,
        yAxis: yAxisConfig,
        grid: {
            left: '5%',
            right: '5%',
            bottom: sampledData.length > 15 ? '20%' : '10%',
            top: sampledData.length > 20 ? '20%' : '15%',
            containLabel: true
        },
        dataZoom: chartGlobalSettings.zoomEnable ? [{ type: 'inside' }, { type: 'slider' }] : [],
        series: series,
        legend: {
            show: true,
            top: isStacked ? 'top' : 'bottom',
            textStyle: {
                color: getTextColor()
            }
        }
    };

    return commonChartOptions(option, config, chartGlobalSettings);
}
