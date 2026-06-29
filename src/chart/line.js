import { headers } from '../store/DataHandler.js';
import { chartGlobalSettings } from '../js/charts.js';
import { commonChartOptions } from './uility.js';

export function getLineChartOption(config, data) {
    // Error handling
    if (!config || !config.columns || config.columns.length < 2) {
        console.error('Invalid configuration for line chart');
        return commonChartOptions({}, config, chartGlobalSettings);
    }

    if (!data || data.length === 0) {
        console.warn('No data available for line chart');
        return commonChartOptions({}, config, chartGlobalSettings);
    }

    const isSmooth = config.type === 'smooth-line';
    const isArea = config.type === 'area-line';
    const isStacked = config.type === 'stacked-line';

    // Better sampling for better performance
    const sampleSize = 1000;
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
        type: 'line',
        data: sampledData.map(row => {
            if (!row || row[col] === null || row[col] === undefined) return null;
            const value = parseFloat(row[col]);
            return isNaN(value) ? null : value;
        }),
        stack: isStacked ? 'total' : undefined,
        smooth: isSmooth,
        areaStyle: isArea ? {} : undefined,
        symbol: sampledData.length > 50 ? 'none' : 'circle',
        symbolSize: 6,
        lineStyle: {
            width: 2,
            type: config.lineStyle || 'solid'
        },
        itemStyle: { 
            color: chartGlobalSettings.colorPalette 
                ? chartGlobalSettings.colorPalette[index % chartGlobalSettings.colorPalette.length]
                : defaultColorPalette[index % defaultColorPalette.length]
        },
        label: {
            show: chartGlobalSettings.showLabels,
            position: 'top',
            formatter: function(params) {
                return `${params.value}`;
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
        animationEasing: 'cubicOut'
    }));

    const xAxisConfig = {
        show: chartGlobalSettings.gridShowHide,
        type: 'category',
        name: config.xAxisLabel,
        data: sampledData.map(row => row[xAxisColumn]),
        axisLabel: { 
            color: getTextColor(),
            rotate: sampledData.length > 10 ? 45 : 0,
            interval: sampledData.length > 20 ? 'auto' : 0
        },
        boundaryGap: true
    };

    const yAxisConfig = {
        show: chartGlobalSettings.gridShowHide,
        type: 'value',
        name: config.yAxisLabel,
        axisLabel: { 
            color: getTextColor() 
        },
        splitLine: {
            show: chartGlobalSettings.gridShowHide,
            lineStyle: {
                color: document.body.classList.contains('dark-theme') ? 
                    'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                type: 'dashed'
            }
        }
    };

    const option = {
        tooltip: { 
            trigger: 'axis',
            formatter: function(params) {
                let result = `${params[0].name}<br/>`;
                params.forEach(param => {
                    const marker = `<span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${param.color}"></span>`;
                    result += `${marker} ${param.seriesName}: <b>${param.value}</b><br/>`;
                });
                return result;
            }
        },
        xAxis: xAxisConfig,
        yAxis: yAxisConfig,
        grid: {
            left: '5%',
            right: '5%',
            bottom: sampledData.length > 15 ? '15%' : '10%',
            top: '15%',
            containLabel: true
        },
        dataZoom: chartGlobalSettings.zoomEnable ? [
            { 
                type: 'inside',
                xAxisIndex: [0]
            }, 
            { 
                type: 'slider',
                xAxisIndex: [0],
                bottom: '5%'
            }
        ] : [],
        series: series,
        legend: {
            show: true,
            top: 'top',
            textStyle: {
                color: getTextColor()
            }
        }
    };

    return commonChartOptions(option, config, chartGlobalSettings);
}