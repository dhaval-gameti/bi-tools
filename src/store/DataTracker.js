// dataSizeAnalyzer.js
import { rawData, headers, filteredData } from './DataHandler.js';

/**
 * Data size aur memory usage analyze karne ke liye utility functions
 */

// Configuration
const SIZE_CONFIG = {
    BYTES_PER_CHAR: 2, // UTF-16 encoding ke liye
    MEMORY_UNITS: ['Bytes', 'KB', 'MB', 'GB'],
    WARNING_THRESHOLD: {
        ROWS: 10000,
        MEMORY: 50 * 1024 * 1024 // 50MB
    }
};

// Global analysis results
let sizeAnalysis = {
    lastUpdated: null,
    rawData: {},
    filteredData: {},
    headers: {},
    comparison: {}
};

// ========================== SIZE CALCULATION FUNCTIONS ==========================

/**
 * Kisi object ka approximate memory size calculate karta hai
 */
export function calculateObjectSize(obj) {
    if (obj === null || obj === undefined) return 0;
    
    let size = 0;
    
    if (typeof obj === 'string') {
        size = obj.length * SIZE_CONFIG.BYTES_PER_CHAR;
    } else if (typeof obj === 'number') {
        size = 8; // 64-bit double
    } else if (typeof obj === 'boolean') {
        size = 4;
    } else if (Array.isArray(obj)) {
        size = obj.reduce((total, item) => total + calculateObjectSize(item), 0);
    } else if (typeof obj === 'object') {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                size += calculateObjectSize(key) + calculateObjectSize(obj[key]);
            }
        }
    }
    
    return size;
}

/**
 * Complete dataset ka size analysis karta hai
 */
export function analyzeDataSize() {
    const analysisTime = new Date().toISOString();
    
    // Raw Data Analysis
    const rawDataSize = calculateObjectSize(rawData);
    const rawDataStats = {
        rowCount: rawData.length,
        columnCount: headers.length,
        totalSize: rawDataSize,
        formattedSize: formatBytes(rawDataSize),
        averageRowSize: rawData.length > 0 ? rawDataSize / rawData.length : 0,
        memoryUsage: getMemoryUsageEstimate(rawData)
    };
    
    // Filtered Data Analysis
    const filteredDataSize = calculateObjectSize(filteredData);
    const filteredDataStats = {
        rowCount: filteredData.length,
        columnCount: headers.length,
        totalSize: filteredDataSize,
        formattedSize: formatBytes(filteredDataSize),
        averageRowSize: filteredData.length > 0 ? filteredDataSize / filteredData.length : 0,
        memoryUsage: getMemoryUsageEstimate(filteredData)
    };
    
    // Headers Analysis
    const headersSize = calculateObjectSize(headers);
    const headersStats = {
        count: headers.length,
        totalSize: headersSize,
        formattedSize: formatBytes(headersSize),
        averageHeaderSize: headers.length > 0 ? headersSize / headers.length : 0
    };
    
    // Comparison Analysis
    const comparisonStats = {
        filteredVsRawRatio: rawData.length > 0 ? (filteredData.length / rawData.length) * 100 : 0,
        sizeReduction: rawDataSize > 0 ? ((rawDataSize - filteredDataSize) / rawDataSize) * 100 : 0,
        efficiencyScore: calculateEfficiencyScore(rawDataStats, filteredDataStats)
    };
    
    sizeAnalysis = {
        lastUpdated: analysisTime,
        rawData: rawDataStats,
        filteredData: filteredDataStats,
        headers: headersStats,
        comparison: comparisonStats
    };
    
    return sizeAnalysis;
}

// ========================== UTILITY FUNCTIONS ==========================

/**
 * Bytes ko human-readable format mein convert karta hai
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = SIZE_CONFIG.MEMORY_UNITS;
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Memory usage estimate provide karta hai
 */
function getMemoryUsageEstimate(data) {
    const size = calculateObjectSize(data);
    const estimatedMemory = size * 1.5; // V8 engine overhead estimate
    
    return {
        estimated: estimatedMemory,
        formatted: formatBytes(estimatedMemory),
        warning: estimatedMemory > SIZE_CONFIG.WARNING_THRESHOLD.MEMORY
    };
}

/**
 * Data efficiency score calculate karta hai
 */
function calculateEfficiencyScore(rawStats, filteredStats) {
    const rowEfficiency = rawStats.rowCount > 0 ? 
        (filteredStats.rowCount / rawStats.rowCount) * 100 : 100;
    
    const sizeEfficiency = rawStats.totalSize > 0 ? 
        (filteredStats.totalSize / rawStats.totalSize) * 100 : 100;
    
    // Lower percentage = better filtering (less data being used)
    return {
        rowEfficiency: Math.round(rowEfficiency),
        sizeEfficiency: Math.round(sizeEfficiency),
        overallScore: Math.round((rowEfficiency + sizeEfficiency) / 2)
    };
}

// ========================== DETAILED ANALYSIS FUNCTIONS ==========================

/**
 * Har column ka detailed size analysis provide karta hai
 */
export function analyzeColumnsSize() {
    if (!rawData.length || !headers.length) return [];
    
    const columnAnalysis = headers.map(header => {
        const columnValues = rawData.map(row => row[header]);
        const totalSize = calculateObjectSize(columnValues);
        const nonEmptyValues = columnValues.filter(val => 
            val !== null && val !== undefined && val !== ''
        );
        
        return {
            name: header,
            totalSize: totalSize,
            formattedSize: formatBytes(totalSize),
            valueCount: columnValues.length,
            nonEmptyCount: nonEmptyValues.length,
            emptyCount: columnValues.length - nonEmptyValues.length,
            dataTypes: analyzeDataTypes(columnValues),
            averageValueSize: nonEmptyValues.length > 0 ? totalSize / nonEmptyValues.length : 0,
            memoryImpact: (totalSize / calculateObjectSize(rawData)) * 100
        };
    });
    
    // Sort by size (descending)
    return columnAnalysis.sort((a, b) => b.totalSize - a.totalSize);
}

/**
 * Column values ke data types analyze karta hai
 */
function analyzeDataTypes(values) {
    const typeCount = {};
    
    values.forEach(value => {
        let type = typeof value;
        
        if (value === null) type = 'null';
        else if (value === '') type = 'empty_string';
        else if (Array.isArray(value)) type = 'array';
        else if (type === 'number' && Number.isInteger(value)) type = 'integer';
        
        typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    return Object.entries(typeCount)
        .sort(([,a], [,b]) => b - a)
        .reduce((acc, [type, count]) => {
            acc[type] = count;
            return acc;
        }, {});
}

// ========================== PERFORMANCE MONITORING ==========================

/**
 * Data operations ki performance monitor karta hai
 */
export function monitorDataPerformance() {
    const performanceMetrics = {
        loadTime: null,
        filterTime: null,
        analysisTime: null,
        memoryBefore: null,
        memoryAfter: null
    };
    
    return {
        startOperation: (operationName) => {
            performanceMetrics[`${operationName}Start`] = performance.now();
            performanceMetrics.memoryBefore = getMemoryInfo();
        },
        
        endOperation: (operationName) => {
            const endTime = performance.now();
            const startTime = performanceMetrics[`${operationName}Start`];
            
            if (startTime) {
                performanceMetrics[`${operationName}Time`] = endTime - startTime;
                performanceMetrics.memoryAfter = getMemoryInfo();
            }
            
            return performanceMetrics[`${operationName}Time`];
        },
        
        getMetrics: () => performanceMetrics
    };
}

/**
 * Current memory usage information provide karta hai
 */
function getMemoryInfo() {
    if (performance.memory) {
        return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit,
            formatted: {
                used: formatBytes(performance.memory.usedJSHeapSize),
                total: formatBytes(performance.memory.totalJSHeapSize),
                limit: formatBytes(performance.memory.jsHeapSizeLimit)
            }
        };
    }
    return null;
}

// ========================== ALERTS AND WARNINGS ==========================

/**
 * Data size ke basis par warnings generate karta hai
 */
export function generateSizeWarnings() {
    const analysis = analyzeDataSize();
    const warnings = [];
    
    // Row count warnings
    if (analysis.rawData.rowCount > SIZE_CONFIG.WARNING_THRESHOLD.ROWS) {
        warnings.push({
            type: 'warning',
            message: `Large dataset detected: ${analysis.rawData.rowCount} rows. Performance issues ho sakte hain.`,
            suggestion: 'Consider filtering ya pagination use karein.'
        });
    }
    
    // Memory usage warnings
    if (analysis.rawData.memoryUsage.warning) {
        warnings.push({
            type: 'danger',
            message: `High memory usage: ${analysis.rawData.memoryUsage.formatted}. Browser slow ho sakta hai.`,
            suggestion: 'Data ko chunks mein process karein ya server-side processing consider karein.'
        });
    }
    
    // Efficiency warnings
    if (analysis.comparison.efficiencyScore.overallScore > 90) {
        warnings.push({
            type: 'info',
            message: 'Filters effective nahi hain. Almost saara data display ho raha hai.',
            suggestion: 'More specific filters apply karein.'
        });
    }
    
    return warnings;
}

// ========================== EXPORT AND REPORTING ==========================

/**
 * Complete size analysis report generate karta hai
 */
export function generateSizeReport() {
    const analysis = analyzeDataSize();
    const columnAnalysis = analyzeColumnsSize();
    const warnings = generateSizeWarnings();
    
    return {
        timestamp: analysis.lastUpdated,
        summary: {
            totalRows: analysis.rawData.rowCount,
            totalColumns: analysis.headers.count,
            totalMemory: analysis.rawData.memoryUsage.formatted,
            overallEfficiency: analysis.comparison.efficiencyScore.overallScore
        },
        detailedAnalysis: analysis,
        columnBreakdown: columnAnalysis,
        warnings: warnings,
        recommendations: generateRecommendations(analysis, columnAnalysis)
    };
}

/**
 * Data optimization ke liye recommendations generate karta hai
 */
function generateRecommendations(analysis, columnAnalysis) {
    const recommendations = [];
    
    // Large dataset recommendations
    if (analysis.rawData.rowCount > 5000) {
        recommendations.push({
            type: 'performance',
            priority: 'high',
            message: 'Large dataset ke liye server-side processing consider karein',
            action: 'Implement pagination aur lazy loading'
        });
    }
    
    // Memory optimization recommendations
    if (analysis.rawData.memoryUsage.warning) {
        recommendations.push({
            type: 'memory',
            priority: 'high',
            message: 'Memory usage optimize karein',
            action: 'Unnecessary columns remove karein aur data compression use karein'
        });
    }
    
    // Column-specific recommendations
    columnAnalysis.slice(0, 3).forEach(column => {
        if (column.memoryImpact > 20) {
            recommendations.push({
                type: 'column',
                priority: 'medium',
                message: `"${column.name}" column maximum memory use kar raha hai (${column.formattedSize})`,
                action: 'Is column ko review karein - data type optimize kar sakte hain?'
            });
        }
    });
    
    return recommendations;
}

// ========================== REAL-TIME MONITORING ==========================

/**
 * Real-time data size monitoring provide karta hai
 */
export class DataSizeMonitor {
    constructor(updateInterval = 5000) {
        this.updateInterval = updateInterval;
        this.monitorInterval = null;
        this.subscribers = [];
        this.lastReport = null;
    }
    
    startMonitoring() {
        this.monitorInterval = setInterval(() => {
            const report = generateSizeReport();
            this.lastReport = report;
            
            // Notify all subscribers
            this.subscribers.forEach(callback => {
                try {
                    callback(report);
                } catch (error) {
                    console.error('Size monitor subscriber error:', error);
                }
            });
        }, this.updateInterval);
        
        console.log('Data size monitoring started');
    }
    
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
            console.log('Data size monitoring stopped');
        }
    }
    
    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }
    
    getLastReport() {
        return this.lastReport || generateSizeReport();
    }
}

// ========================== INITIALIZATION ==========================

/**
 * DataSizeAnalyzer ko initialize karta hai
 */
export function initializeDataSizeAnalyzer() {
    console.log('Data Size Analyzer initialized');
    
    // Initial analysis
    const initialReport = generateSizeReport();
    console.log('Initial Data Size Analysis:', initialReport);
    
    return {
        analyzeDataSize,
        analyzeColumnsSize,
        generateSizeReport,
        generateSizeWarnings,
        formatBytes,
        monitorDataPerformance,
        DataSizeMonitor
    };
}



// Auto-initialize jab module load ho
const dataSizeAnalyzer = initializeDataSizeAnalyzer();
export default dataSizeAnalyzer;