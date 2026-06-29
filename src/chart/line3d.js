import { headers } from '../store/DataHandler.js';
import { chartGlobalSettings } from '../js/charts.js';
import { commonChartOptions, getRandomColor } from './uility.js';

export function getLine3DChartOption(config, data, userSettings = {}) {
        const xAxisColumn = config.columns[0];
        const yAxisColumns = config.columns.slice(1); // multiple Y-columns
        const zAxisColumn = config.columns[config.columns.length - 1]; // Z-axis value
        
        if (!yAxisColumns.length) {
                showMessage("3D Line चार्ट के लिए कम से कम एक Y कॉलम चुनें।", "warning");
                return {};
        }
        
        // User-configurable settings with defaults
        const settings = {
                lineWidth: userSettings.lineWidth || 4,
                lineOpacity: userSettings.lineOpacity || 0.9,
                autoRotate: userSettings.autoRotate !== undefined ? userSettings.autoRotate : true,
                rotateSpeed: userSettings.rotateSpeed || 1.5,
                zoomSensitivity: userSettings.zoomSensitivity || 1.2,
                panSensitivity: userSettings.panSensitivity || 0.8,
                labelFontSize: userSettings.labelFontSize || 12,
                showLabels: userSettings.showLabels !== undefined ? userSettings.showLabels : chartGlobalSettings.showLabels
        };
        
        // Series तैयार करना
        const series = yAxisColumns.map((yCol, colIndex) => {
                const seriesData = data.map(row => {
                        const xVal = parseFloat(row[xAxisColumn]) || 0;
                        const yVal = parseFloat(row[yCol]) || 0;
                        const zVal = parseFloat(row[zAxisColumn]) || 0;
                        return [xVal, yVal, zVal];
                });
                
                return {
                        name: yCol,
                        type: 'line3D',
                        data: seriesData,
                        lineStyle: {
                                width: settings.lineWidth,
                                color: chartGlobalSettings.colorPalette[colIndex % chartGlobalSettings.colorPalette.length],
                                opacity: settings.lineOpacity
                        },
                        label: {
                                show: settings.showLabels,
                                formatter: params => `${params.value[1]}`,
                                textStyle: { fontSize: settings.labelFontSize, color: '#000' }
                        },
                        emphasis: {
                                label: { show: true },
                                lineStyle: { width: settings.lineWidth + 1 }
                        }
                };
        });
        
        const option = {
                tooltip: {
                        show: chartGlobalSettings.tooltipOnOff,
                        formatter: params => {
                                const param = params[0];
                                const [x, y, z] = param.value;
                                return `<b>${param.seriesName}</b><br>${config.xAxisLabel}: ${x}<br>${param.seriesName}: ${y}<br>${config.zAxisLabel}: ${z}`;
                        }
                },
                xAxis3D: {
                        name: config.xAxisLabel,
                        type: 'value',
                        axisLabel: { color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333' }
                },
                yAxis3D: {
                        name: 'Y Value',
                        type: 'value',
                        axisLabel: { color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333' }
                },
                zAxis3D: {
                        name: config.zAxisLabel,
                        type: 'value',
                        axisLabel: { color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333' }
                },
                grid3D: {
                        boxWidth: 300,
                        boxDepth: 150,
                        boxHeight: 150,
                        viewControl: {
                                autoRotate: settings.autoRotate,
                                autoRotateAfterStill: 5,
                                rotateSensitivity: settings.rotateSpeed,
                                zoomSensitivity: settings.zoomSensitivity,
                                panSensitivity: settings.panSensitivity,
                                damping: 0.9,
                                minDistance: 100,
                                maxDistance: 600
                        },
                        light: { main: { shadow: true, intensity: 1.3, alpha: 30 }, ambient: { intensity: 0.5 } }
                },
                series: series
        };
        
        return commonChartOptions(option, config);
}