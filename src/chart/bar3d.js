import { headers } from '../store/DataHandler.js';
import { chartGlobalSettings } from '../js/charts.js';
import { commonChartOptions, getRandomColor } from './uility.js';

export function getBar3DChartOption(config, data, userSettings = {}) {
    const xAxisColumn = config.columns[0];
    const yAxisColumns = config.columns.slice(1);

    if (!yAxisColumns.length) {
        showMessage("3D बार चार्ट के लिए कम से कम एक मान कॉलम (Y-अक्ष) चुनें।", "warning");
        return {};
    }

    const xData = data.map(row => String(row[xAxisColumn]));

    // User-configurable settings with defaults
    const settings = {
        barSize: userSettings.barSize || 1.5,
        barOpacity: userSettings.barOpacity || 0.9,
        gradient: userSettings.gradient || true,
        autoRotate: userSettings.autoRotate !== undefined ? userSettings.autoRotate : true,
        rotateSpeed: userSettings.rotateSpeed || 1.5,
        zoomSensitivity: userSettings.zoomSensitivity || 1.2,
        panSensitivity: userSettings.panSensitivity || 0.8,
        lightIntensity: userSettings.lightIntensity || 1.3,
        labelFontSize: userSettings.labelFontSize || 12,
        showLabels: userSettings.showLabels !== undefined ? userSettings.showLabels : chartGlobalSettings.showLabels
    };

    // Series तैयार करना
    const series = yAxisColumns.map((yCol, colIndex) => {
        const zData = data.map(row => parseFloat(row[yCol]) || 0);
        const seriesData = xData.map((x, idx) => [x, yCol, zData[idx]]);

        let colorOption = chartGlobalSettings.colorPalette[colIndex % chartGlobalSettings.colorPalette.length];
        if (settings.gradient) {
            colorOption = {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                    { offset: 0, color: chartGlobalSettings.colorPalette[colIndex % chartGlobalSettings.colorPalette.length] },
                    { offset: 1, color: '#ffffff' }
                ]
            };
        }

        return {
            name: yCol,
            type: 'bar3D',
            data: seriesData,
            shading: 'realistic',
            barSize: settings.barSize,
            itemStyle: { color: colorOption, opacity: settings.barOpacity },
            label: {
                show: settings.showLabels,
                formatter: params => `${params.value[2]}`,
                textStyle: { fontSize: settings.labelFontSize, borderWidth: 0.5, color: '#000' }
            },
            emphasis: {
                label: { show: true },
                itemStyle: { opacity: 1, color: '#ff5722' }
            }
        };
    });

    // सभी Z-values का max
    const allZValues = [];
    yAxisColumns.forEach(yCol => {
        data.forEach(row => allZValues.push(parseFloat(row[yCol]) || 0));
    });

    const option = {
        tooltip: {
            show: chartGlobalSettings.tooltipOnOff,
            formatter: params => {
                const param = params[0];
                return `<b>${param.value[0]}</b><br>${param.value[1]}: ${param.value[2]}`;
            }
        },
        visualMap: {
            max: Math.max(...allZValues),
            dimension: 2,
            inRange: { color: chartGlobalSettings.colorPalette }
        },
        xAxis3D: { name: config.xAxisLabel || xAxisColumn, type: 'category', data: xData, axisLabel: { rotate: 30, interval: 0 } },
        yAxis3D: { name: 'मान कॉलम', type: 'category', data: yAxisColumns, axisLabel: { rotate: 30, interval: 0 } },
        zAxis3D: { name: config.yAxisLabel || 'Value', type: 'value' },
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
            light: { main: { shadow: true, intensity: settings.lightIntensity, alpha: 30 }, ambient: { intensity: 0.5 } }
        },
        series: series
    };

    return commonChartOptions(option, config);
}