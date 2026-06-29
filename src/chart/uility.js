export function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export function commonChartOptions(option, config, chartGlobalSettings) {
    if (!option) option = {};
    if (!config) config = {};
    
    option.title = { 
        show: false, 
        text: config.title || 'Chart', 
        left: 'center' 
    };
    option.animationDuration = chartGlobalSettings?.animationDuration || 1000;
    option.tooltip = {
        show: chartGlobalSettings?.tooltipOnOff !== false,
        ...option.tooltip
    };
    
    option.legend = {
        show: chartGlobalSettings?.legendPosition !== 'none',
        bottom: chartGlobalSettings?.legendPosition === 'bottom' ? 0 : 'auto',
        top: chartGlobalSettings?.legendPosition === 'top' ? 20 : 'auto',
        left: chartGlobalSettings?.legendPosition === 'left' ? '5%' : 'auto',
        right: chartGlobalSettings?.legendPosition === 'right' ? '5%' : 'auto',
        orient: (chartGlobalSettings?.legendPosition === 'left' || chartGlobalSettings?.legendPosition === 'right') ? 'vertical' : 'horizontal'
    };
    
    if (config.columns && config.columns.length > 2) {
        option.color = chartGlobalSettings?.colorPalette || ['#5470C6', '#91CC75', '#EE6666', '#FC8452', '#73C0DE', '#3BA272', '#FACC14', '#9A60B4', '#EA7CCC'];
    } else {
        option.color = config.color || '#5470C6';
    }
    return option;
}


// uility.js mein ye functions add karo
export const getThemeColor = () => {
    return document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333';
};

export const getSampledData = (data, maxPoints = 100) => {
    if (data.length <= maxPoints) return data;
    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, i) => i % step === 0);
};

export const getAxisConfig = (isCategory, show, label, data, themeColor) => {
    return {
        show,
        type: isCategory ? 'category' : 'value',
        name: label,
        data: isCategory ? data : null,
        axisLabel: { color: themeColor }
    };
};