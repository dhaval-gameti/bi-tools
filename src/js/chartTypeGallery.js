export class ChartTypeGallery {
    constructor(config = {}) {
        this.config = {
            galleryId: 'chartTypeGallery',
            selectId: 'chartType',
            displayImageId: 'selectedChartDisplayImage',
            zAxisContainerId: 'zAxisDropZoneContainer',
            modalId: 'chartGalleryModal',
            triggerButtonId: 'openChartGalleryBtn',
            modalGalleryId: 'chartGalleryModalContent',
            ...config
        };
        
        // Check if we're on index.html page
        this.isIndexPage = this.checkIfIndexPage();
        
        // If not index page, don't initialize
        if (!this.isIndexPage) {
            console.log('Chart gallery is only available on index.html page');
            return;
        }
        
        this.chartTypes = [
            // Bar Charts
            { value: 'bar', name: 'साधारण बार', category: 'bar', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/bar-chart-fill.svg' },
            { value: 'stacked-bar', name: 'स्टैक्ड बार', category: 'bar', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/bar-chart-fill.svg' },
            { value: 'horizontal-bar', name: 'हॉरिजॉन्टल बार', category: 'bar', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/bar-chart-fill.svg' },
            { value: 'grouped-bar', name: 'ग्रुप्ड बार', category: 'bar', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/bar-chart-line-fill.svg' },
            { value: 'bar3D', name: '3D बार चार्ट', category: 'bar', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/box-seam.svg' },
            
            // Line Charts
            { value: 'line', name: 'साधारण लाइन', category: 'line', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/graph-up.svg' },
            { value: 'line3D', name: '3D लाइन चार्ट', category: 'line', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/box-seam.svg' },
            { value: 'stacked-line', name: 'स्टैक्ड लाइन', category: 'line', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/graph-up-arrow.svg' },
            { value: 'smooth-line', name: 'स्मूद लाइन', category: 'line', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/graph-up.svg' },
            { value: 'step-line', name: 'स्टेप लाइन', category: 'line', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/graph-up-arrow.svg' },
            
            // Pie Charts
            { value: 'pie', name: 'साधारण पाई', category: 'pie', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/pie-chart-fill.svg' },
            { value: 'doughnut', name: 'डोनट', category: 'pie', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/circle-half.svg' },
            { value: 'rose-radius', name: 'रोज़ (Radius)', category: 'pie', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/pie-chart.svg' },
            { value: 'rose-area', name: 'रोज़ (Area)', category: 'pie', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/pie-chart.svg' },
            
            // Other Charts
            { value: 'scatter', name: 'स्कैटर प्लॉट', category: 'other', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/app.svg' },
            { value: 'bubble', name: 'बबल चार्ट', category: 'other', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/circles.svg' },
            { value: 'funnel', name: 'फ़नेल', category: 'other', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/funnel-fill.svg' },
            { value: 'gauge', name: 'गेज', category: 'other', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/speedometer.svg' },
            { value: 'radar', name: 'राडार', category: 'other', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/compass-fill.svg' },
            { value: 'treemap', name: 'ट्रीमैप', category: 'other', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/tree-fill.svg' },
            { value: 'candlestick', name: 'कैंडलस्टिक', category: 'other', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/graph-up-arrow.svg' },
            { value: 'ohlc', name: 'OHLC', category: 'other', image: 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/graph-up-arrow.svg' },
        ];
        
        this.categories = [
            { id: 'all', name: 'सभी चार्ट', icon: '<i class="bi bi-bar-chart-fill"></i>' },
            { id: 'bar', name: 'बार चार्ट', icon: '<i class="bi bi-bar-chart"></i>' },
            { id: 'line', name: 'लाइन चार्ट', icon: '<i class="bi bi-graph-up"></i>' },
            { id: 'pie', name: 'पाई चार्ट', icon: '<i class="bi bi-pie-chart"></i>' },
            { id: 'other', name: 'अन्य चार्ट', icon: '<i class="bi bi-collection"></i>' }
        ];
        
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.selectedCategory = 'all';
        this.init();
    }
    
    // Check if current page is index.html
    checkIfIndexPage() {
        // Multiple ways to check if we're on index.html page
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop();
        
        return currentPage === 'index.html' || 
               currentPage === '' || 
               currentPage === 'index.htm' ||
               currentPath.endsWith('/') ||
               document.querySelector('body[data-page="index"]') !== null ||
               document.getElementById('indexPageIndicator') !== null;
    }
    
    init() {
        // If not index page, don't initialize anything
        if (!this.isIndexPage) {
            this.hideAllGalleryElements();
            return;
        }
        
        this.createModal();
        this.createTriggerButton();
        this.injectStyles();
        this.createCategoryNavigation();
        this.createGallery();
        this.bindEvents();
        this.setupLazyLoading();
        this.initializeWithSavedSelection();
        this.enhanceAccessibility();
        
        this.hideOriginalGallery();
    }
    
    // Hide all gallery related elements if not on index page
    hideAllGalleryElements() {
        // Hide the original gallery
        const originalGallery = document.getElementById(this.config.galleryId);
        if (originalGallery) {
            originalGallery.style.display = 'none';
        }
        
        // Hide any existing modal
        const existingModal = document.getElementById(this.config.modalId);
        if (existingModal) {
            existingModal.style.display = 'none';
        }
        
        // Hide trigger button if exists
        const triggerButton = document.getElementById(this.config.triggerButtonId);
        if (triggerButton) {
            triggerButton.style.display = 'none';
        }
        
        // Remove any injected styles
        const galleryStyles = document.getElementById('chart-gallery-styles');
        if (galleryStyles) {
            galleryStyles.remove();
        }
    }
    
    hideOriginalGallery() {
        // Only hide if we're on index page
        if (!this.isIndexPage) return;
        
        const originalGallery = document.getElementById(this.config.galleryId);
        if (originalGallery) {
            originalGallery.style.display = 'none';
        }
    }
    
    createModal() {
        // Don't create modal if not on index page
        if (!this.isIndexPage) return;
        
        const existingModal = document.getElementById(this.config.modalId);
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHTML = `
            <div class="modal fade" id="${this.config.modalId}" tabindex="-1" aria-labelledby="chartGalleryModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content chart-gallery-modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="chartGalleryModalLabel">चार्ट प्रकार चुनें</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body chart-gallery-modal-body">
                            <div class="chart-search-container">
                                <div class="search-box">
                                    <input type="text" id="chartSearch" placeholder="🔍 चार्ट खोजें..." class="search-input">
                                </div>
                                <div class="chart-stats"></div>
                            </div>
                            <div class="category-navigation" id="categoryNavigation"></div>
                            <div id="${this.config.modalGalleryId}" class="chart-gallery-grid"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">बंद करें</button>
                            <button type="button" class="btn btn-primary" id="confirmChartSelection">चुनें</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    createCategoryNavigation() {
        // Don't create if not on index page
        if (!this.isIndexPage) return;
        
        const categoryNav = document.getElementById('categoryNavigation');
        if (!categoryNav) return;
        
        categoryNav.innerHTML = '';
        
        this.categories.forEach(category => {
            const categoryBtn = document.createElement('button');
            categoryBtn.className = `category-btn ${category.id === this.selectedCategory ? 'active' : ''}`;
            categoryBtn.dataset.category = category.id;
            categoryBtn.innerHTML = `
                <span class="category-icon">${category.icon}</span>
                <span class="category-name">${category.name}</span>
            `;
            
            categoryNav.appendChild(categoryBtn);
        });
    }
    
    createTriggerButton() {
        // Don't create if not on index page
        if (!this.isIndexPage) return;
        
        const existingButton = document.getElementById(this.config.triggerButtonId);
        if (existingButton) {
            existingButton.remove();
        }
        
        const originalGallery = document.getElementById(this.config.galleryId);
        if (originalGallery) {
            const buttonHTML = `
                <button type="button" class="btn btn-outline-primary w-100 mb-3" id="${this.config.triggerButtonId}">
                    <i class="bi bi-grid-3x3-gap"></i> चार्ट गैलरी देखें
                </button>
            `;
            
            originalGallery.insertAdjacentHTML('beforebegin', buttonHTML);
        }
    }
    
    injectStyles() {
        // Don't inject styles if not on index page
        if (!this.isIndexPage) return;
        
        if (document.getElementById('chart-gallery-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'chart-gallery-styles';
        style.textContent = `
            .chart-gallery-modal-content {
                max-height: 85vh;
                display: flex;
                flex-direction: column;
            }
            
            .chart-gallery-modal-body {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                padding: 16px;
            }
            
            .category-navigation {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                padding: 0 4px;
                flex-wrap: wrap;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .category-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                border: 2px solid #e9ecef;
                background: white;
                border-radius: 10px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                transition: all 0.3s ease;
                font-family: inherit;
                color: #495057;
                flex-shrink: 0;
            }
            
            .category-btn:hover {
                border-color: #007bff;
                color: #007bff;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0,123,255,0.1);
            }
            
            .category-btn.active {
                background: #007bff;
                color: white;
                border-color: #007bff;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0,123,255,0.2);
            }
            
            .category-icon {
                font-size: 16px;
            }
            
            .category-name {
                white-space: nowrap;
            }
            
            .chart-gallery-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 12px;
                padding: 8px 4px;
                width: 100%;
                max-width: 100%;
                margin: 0 auto;
                overflow-y: auto;
                flex: 1;
                max-height: 400px;
                min-height: 200px;
            }
            
            .chart-search-container {
                margin-bottom: 16px;
                padding: 0 4px;
                flex-shrink: 0;
            }
            
            .search-box {
                display: flex;
                gap: 12px;
                align-items: center;
                flex-wrap: wrap;
            }
            
            .search-input {
                flex: 1;
                min-width: 180px;
                padding: 10px 14px;
                border: 2px solid #e9ecef;
                border-radius: 10px;
                font-size: 13px;
                transition: all 0.3s ease;
                background: white;
                font-family: inherit;
            }
            
            .search-input:focus {
                outline: none;
                border-color: #007bff;
                box-shadow: 0 0 0 2px rgba(0,123,255,0.1);
            }
            
            .chart-stats {
                display: flex;
                justify-content: space-between;
                margin: 8px 4px 0;
                font-size: 11px;
                color: #6c757d;
                padding: 0 2px;
            }
            
            .chart-type-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding: 12px 8px;
                margin: 0;
                cursor: pointer;
                border-radius: 12px;
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                box-shadow: 
                    0 1px 4px rgba(0,0,0,0.08),
                    0 1px 2px rgba(0,0,0,0.05);
                border: 2px solid transparent;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .chart-type-item::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(0,123,255,0.1), transparent);
                transition: left 0.6s ease;
            }
            
            .chart-type-item:hover {
                background: linear-gradient(135deg, #eef6ff 0%, #e3f2fd 100%);
                transform: translateY(-2px) scale(1.02);
                box-shadow: 
                    0 4px 12px rgba(0,123,255,0.12),
                    0 2px 6px rgba(0,0,0,0.08);
                border-color: #007bff;
            }
            
            .chart-type-item:hover::before {
                left: 100%;
            }
            
            .chart-type-item.selected {
                background: linear-gradient(135deg, #e8f1ff 0%, #d4e6ff 100%);
                border: 2px solid #007bff;
                box-shadow: 
                    0 3px 12px rgba(0,123,255,0.15),
                    0 1px 4px rgba(0,0,0,0.1),
                    inset 0 1px 2px rgba(255,255,255,0.8);
                transform: translateY(-1px);
            }
            
            .chart-type-item.selected::after {
                content: '✓';
                position: absolute;
                top: 6px;
                right: 6px;
                width: 16px;
                height: 16px;
                background: #007bff;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
            }
            
            .chart-type-item img {
                width: 40px;
                height: 40px;
                object-fit: contain;
                border-radius: 10px;
                border: 1.5px solid #e9ecef;
                padding: 5px;
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                filter: brightness(0.9) contrast(1.1);
            }
            
            .chart-type-item:hover img {
                transform: scale(1.15) rotate(3deg);
                border-color: #007bff;
                background: linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%);
                box-shadow: 0 2px 8px rgba(0,123,255,0.15);
                filter: brightness(1) contrast(1.2);
            }
            
            .chart-type-item.selected img {
                transform: scale(1.1);
                border-color: #007bff;
                background: #ffffff;
                box-shadow: 0 2px 6px rgba(0,123,255,0.2);
            }
            
            .chart-type-item span {
                font-size: 11px;
                font-weight: 600;
                text-align: center;
                color: #495057;
                line-height: 1.2;
                transition: all 0.3s ease;
                max-width: 100%;
                word-wrap: break-word;
            }
            
            .chart-type-item:hover span {
                color: #007bff;
                font-weight: 700;
            }
            
            .chart-type-item.selected span {
                color: #0056b3;
                font-weight: 700;
            }
            
            .chart-type-item.hidden {
                display: none;
            }
            
            .chart-type-item.fade-out {
                animation: fadeOut 0.3s ease forwards;
            }
            
            @keyframes fadeOut {
                from { 
                    opacity: 1; 
                    transform: scale(1); 
                }
                to { 
                    opacity: 0; 
                    transform: scale(0.8); 
                }
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(15px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .chart-type-item {
                animation: fadeInUp 0.3s ease forwards;
                opacity: 0;
            }
            
            .no-results {
                grid-column: 1 / -1;
                text-align: center;
                padding: 30px 15px;
                color: #6c757d;
                font-size: 13px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .no-results h4 {
                margin: 0 0 6px 0;
                color: #495057;
                font-size: 14px;
            }
            
            .no-results p {
                margin: 0;
                font-size: 12px;
            }
            
            /* Custom scrollbar for gallery */
            .chart-gallery-grid::-webkit-scrollbar {
                width: 6px;
            }
            
            .chart-gallery-grid::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
            }
            
            .chart-gallery-grid::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 3px;
            }
            
            .chart-gallery-grid::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
            
            @media (max-width: 768px) {
                .chart-gallery-grid {
                    grid-template-columns: repeat(auto-fit, minmax(85px, 1fr));
                    gap: 10px;
                    max-height: 350px;
                }
                
                .chart-type-item {
                    padding: 10px 6px;
                    gap: 5px;
                }
                
                .chart-type-item img {
                    width: 36px;
                    height: 36px;
                }
                
                .chart-type-item span {
                    font-size: 10px;
                }
                
                .category-navigation {
                    gap: 5px;
                }
                
                .category-btn {
                    padding: 8px 12px;
                    font-size: 12px;
                }
                
                .category-icon {
                    font-size: 14px;
                }
                
                .modal-dialog {
                    margin: 20px;
                    max-width: calc(100% - 40px);
                }
            }
            
            @media (max-width: 480px) {
                .chart-gallery-grid {
                    grid-template-columns: repeat(auto-fit, minmax(75px, 1fr));
                    gap: 8px;
                    max-height: 300px;
                }
                
                .chart-type-item {
                    padding: 8px 4px;
                    border-radius: 10px;
                }
                
                .chart-type-item img {
                    width: 32px;
                    height: 32px;
                }
                
                .chart-type-item span {
                    font-size: 9px;
                }
                
                .category-btn {
                    padding: 6px 10px;
                    font-size: 11px;
                }
                
                .category-name {
                    display: none;
                }
                
                .category-btn {
                    flex-direction: column;
                    gap: 3px;
                }
                
                .modal-dialog {
                    margin: 10px;
                    max-width: calc(100% - 20px);
                }
                
                .chart-gallery-modal-body {
                    padding: 12px;
                }
            }
            
            @media (max-height: 600px) {
                .chart-gallery-grid {
                    max-height: 250px;
                }
                
                .chart-gallery-modal-content {
                    max-height: 95vh;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    createGallery() {
        // Don't create if not on index page
        if (!this.isIndexPage) return;
        
        const modalGallery = document.getElementById(this.config.modalGalleryId);
        if (!modalGallery) return;
        
        modalGallery.innerHTML = '';
        
        const filteredCharts = this.getFilteredCharts();
        
        filteredCharts.forEach((chart, index) => {
            const item = this.createChartItem(chart, index);
            modalGallery.appendChild(item);
        });
        
        this.updateStats();
    }
    
    createChartItem(chart, index) {
        const item = document.createElement('div');
        item.className = 'chart-type-item';
        item.dataset.value = chart.value;
        item.dataset.category = chart.category;
        item.style.animationDelay = `${index * 0.03}s`;
        
        const img = document.createElement('img');
        img.src = this.getChartImage(chart.value);
        img.alt = chart.name;
        img.loading = 'lazy';
        
        const span = document.createElement('span');
        span.textContent = chart.name;
        
        item.appendChild(img);
        item.appendChild(span);
        
        return item;
    }
    
    getFilteredCharts() {
        if (this.selectedCategory === 'all') {
            return this.chartTypes;
        }
        return this.chartTypes.filter(chart => chart.category === this.selectedCategory);
    }
    
    getChartImage(chartType) {
        const imageMap = {
            'pie': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/pie-chart-fill.svg',
            'doughnut': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/circle-half.svg',
            'rose-radius': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/pie-chart.svg',
            'rose-area': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/pie-chart.svg',
            'bar': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/bar-chart-fill.svg',
            'stacked-bar': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/bar-chart-fill.svg',
            'horizontal-bar': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/bar-chart-fill.svg',
            'grouped-bar': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/bar-chart-line-fill.svg',
            'bar3D': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/box-seam.svg',
            'line': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/graph-up.svg',
            'line3D': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/box-seam.svg',
            'stacked-line': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/graph-up-arrow.svg',
            'smooth-line': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/graph-up.svg',
            'step-line': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/graph-up-arrow.svg',
            'scatter': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/app.svg',
            'bubble': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/circles.svg',
            'funnel': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/funnel-fill.svg',
            'gauge': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/speedometer.svg',
            'radar': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/compass-fill.svg',
            'treemap': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/tree-fill.svg',
            'candlestick': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/graph-up-arrow.svg',
            'ohlc': 'https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/graph-up-arrow.svg',
        };
        
        return imageMap[chartType] || this.getDefaultImage();
    }
    
    getDefaultImage() {
        return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMTIiIGZpbGw9IiNmOGY5ZmEiLz4KPHBhdGggZD0iTTE2IDMySDBWNDhIMTZWMzJaIiBmaWxsPSIjMDA3YmZmIi8+CjxwYXRoIGQ9Ik0zMiAxNkgxNlY0OEgzMlYxNloiIGZpbGw9IiMwMDU2YjMiLz4KPHBhdGggZD0iTTQ4IDBIMzJWNDhINDhWMFoiIGZpbGw9IiMwMDNmN2YiLz4KPC9zdmc+";
    }
    
    bindEvents() {
        // Don't bind events if not on index page
        if (!this.isIndexPage) return;
        
        const modalGallery = document.getElementById(this.config.modalGalleryId);
        
        if (!modalGallery) return;
        
        // Chart item click events in MODAL
        modalGallery.addEventListener('click', (e) => {
            const item = e.target.closest('.chart-type-item');
            if (!item) return;
            
            this.selectChartItem(item);
        });
        
        // Category navigation events
        const categoryNav = document.getElementById('categoryNavigation');
        if (categoryNav) {
            categoryNav.addEventListener('click', (e) => {
                const categoryBtn = e.target.closest('.category-btn');
                if (!categoryBtn) return;
                
                this.handleCategoryChange(categoryBtn.dataset.category);
            });
        }
        
        // Search functionality in MODAL
        const searchInput = document.getElementById('chartSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterCharts();
            }, 300));
        }
        
        // Trigger button click event
        const triggerButton = document.getElementById(this.config.triggerButtonId);
        if (triggerButton) {
            triggerButton.addEventListener('click', () => {
                this.openModal();
            });
        }
        
        // Confirm selection button
        const confirmButton = document.getElementById('confirmChartSelection');
        if (confirmButton) {
            confirmButton.addEventListener('click', () => {
                this.confirmSelection();
            });
        }
        
        // Modal shown event - reset selection when modal opens
        const modal = document.getElementById(this.config.modalId);
        if (modal) {
            modal.addEventListener('show.bs.modal', () => {
                this.resetModalSelection();
            });
            
            modal.addEventListener('hidden.bs.modal', () => {
                this.onModalClose();
            });
        }
        
        // Auto-select first item in modal
        this.autoSelectFirstItem();
    }
    
    handleCategoryChange(category) {
        // Don't handle if not on index page
        if (!this.isIndexPage) return;
        
        this.selectedCategory = category;
        
        // Update category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        // Recreate gallery with filtered charts
        this.createGallery();
        
        // Auto-select first item in the new category
        this.autoSelectFirstItem();
    }
    
    openModal() {
        // Don't open if not on index page
        if (!this.isIndexPage) return;
        
        const modal = new bootstrap.Modal(document.getElementById(this.config.modalId));
        modal.show();
    }
    
    resetModalSelection() {
        // Don't reset if not on index page
        if (!this.isIndexPage) return;
        
        // Clear any existing selection when modal opens
        document.querySelectorAll('.chart-type-item').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Select the currently active chart from select element
        const chartTypeSelect = document.getElementById(this.config.selectId);
        if (chartTypeSelect && chartTypeSelect.value) {
            const currentItem = document.querySelector(`[data-value="${chartTypeSelect.value}"]`);
            if (currentItem) {
                this.selectChartItem(currentItem);
            }
        }
    }
    
    confirmSelection() {
        // Don't confirm if not on index page
        if (!this.isIndexPage) return;
        
        const selectedItem = document.querySelector('.chart-type-item.selected');
        if (!selectedItem) {
            alert('कृपया कोई चार्ट प्रकार चुनें');
            return;
        }
        
        const chartValue = selectedItem.dataset.value;
        const chart = this.chartTypes.find(c => c.value === chartValue);
        
        if (chart) {
            const chartTypeSelect = document.getElementById(this.config.selectId);
            const selectedChartDisplayImage = document.getElementById(this.config.displayImageId);
            
            if (chartTypeSelect) {
                chartTypeSelect.value = chartValue;
                chartTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            if (selectedChartDisplayImage) {
                selectedChartDisplayImage.src = this.getChartImage(chartValue);
                selectedChartDisplayImage.style.display = 'block';
                selectedChartDisplayImage.alt = chart.name;
            }
            
            this.handle3DCharts(chartValue);
            this.saveSelection(chartValue);
            
            console.log(`चयनित चार्ट प्रकार: ${chart.name}`);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById(this.config.modalId));
            if (modal) {
                modal.hide();
            }
        }
    }
    
    onModalClose() {
        // Don't handle if not on index page
        if (!this.isIndexPage) return;
        
        // Reset search and category when modal closes
        this.searchTerm = '';
        this.selectedCategory = 'all';
        
        const searchInput = document.getElementById('chartSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Reset category navigation
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === 'all');
        });
        
        this.filterCharts();
    }
    
    selectChartItem(selectedItem) {
        // Only select items in modal gallery and only if on index page
        if (!this.isIndexPage) return;
        
        const modalGallery = document.getElementById(this.config.modalGalleryId);
        if (modalGallery && modalGallery.contains(selectedItem)) {
            document.querySelectorAll('.chart-type-item').forEach(el => {
                el.classList.remove('selected');
            });
            selectedItem.classList.add('selected');
        }
    }
    
    handle3DCharts(chartValue) {
        // Don't handle if not on index page
        if (!this.isIndexPage) return;
        
        const zAxisDropZoneContainer = document.getElementById(this.config.zAxisContainerId);
        if (zAxisDropZoneContainer) {
            if (chartValue === 'bar3D' || chartValue === 'line3D') {
                zAxisDropZoneContainer.style.display = 'block';
            } else {
                zAxisDropZoneContainer.style.display = 'none';
            }
        }
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    filterCharts() {
        // Don't filter if not on index page
        if (!this.isIndexPage) return;
        
        const items = document.querySelectorAll('.chart-type-item');
        let visibleCount = 0;
        
        items.forEach(item => {
            const matchesSearch = !this.searchTerm || 
                                item.dataset.value.toLowerCase().includes(this.searchTerm) ||
                                item.querySelector('span').textContent.toLowerCase().includes(this.searchTerm);
            
            const shouldShow = matchesSearch;
            
            if (shouldShow) {
                item.classList.remove('hidden', 'fade-out');
                visibleCount++;
            } else {
                item.classList.add('fade-out');
                setTimeout(() => {
                    item.classList.add('hidden');
                }, 300);
            }
        });
        
        this.showNoResults(visibleCount === 0);
        this.updateStats(visibleCount);
    }
    
    showNoResults(show) {
        // Don't show if not on index page
        if (!this.isIndexPage) return;
        
        const modalGallery = document.getElementById(this.config.modalGalleryId);
        let noResults = modalGallery.querySelector('.no-results');
        
        if (show && !noResults) {
            noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = `
                <h4>कोई परिणाम नहीं मिला</h4>
                <p>कृपया अपनी खोज बदलें या फ़िल्टर समायोजित करें</p>
            `;
            modalGallery.appendChild(noResults);
        } else if (!show && noResults) {
            noResults.remove();
        }
    }
    
    updateStats(visibleCount = null) {
        // Don't update if not on index page
        if (!this.isIndexPage) return;
        
        let statsContainer = document.querySelector('.chart-stats');
        
        if (!statsContainer) {
            statsContainer = document.createElement('div');
            statsContainer.className = 'chart-stats';
            document.querySelector('.chart-search-container').appendChild(statsContainer);
        }
        
        const totalCount = this.getFilteredCharts().length;
        const currentCount = visibleCount !== null ? visibleCount : totalCount;
        
        statsContainer.innerHTML = `
            <span>कुल: ${totalCount}</span>
            <span>दिख रहे: ${currentCount}</span>
        `;
    }
    
    setupLazyLoading() {
        // Don't setup if not on index page
        if (!this.isIndexPage) return;
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target.querySelector('img');
                        if (img && img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            document.querySelectorAll('.chart-type-item').forEach(item => {
                observer.observe(item);
            });
        }
    }
    
    saveSelection(chartType) {
        try {
            localStorage.setItem('lastSelectedChart', chartType);
        } catch (e) {
            console.warn('LocalStorage unavailable');
        }
    }
    
    loadSelection() {
        try {
            return localStorage.getItem('lastSelectedChart');
        } catch (e) {
            return null;
        }
    }
    
    initializeWithSavedSelection() {
        // Don't initialize if not on index page
        if (!this.isIndexPage) return;
        
        const savedChart = this.loadSelection();
        if (savedChart) {
            const savedItem = document.querySelector(`[data-value="${savedChart}"]`);
            if (savedItem) {
                setTimeout(() => {
                    this.selectChartItem(savedItem);
                }, 100);
            }
        }
    }
    
    autoSelectFirstItem() {
        // Don't auto-select if not on index page
        if (!this.isIndexPage) return;
        
        const firstChartItem = document.querySelector('.chart-type-item');
        if (firstChartItem && !this.loadSelection()) {
            setTimeout(() => {
                this.selectChartItem(firstChartItem);
            }, 100);
        }
    }
    
    enhanceAccessibility() {
        // Don't enhance if not on index page
        if (!this.isIndexPage) return;
        
        document.querySelectorAll('.chart-type-item').forEach((item, index) => {
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'button');
            item.setAttribute('aria-label', `Select ${item.querySelector('span').textContent} chart`);
            
            item.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
        
        document.querySelectorAll('.category-btn').forEach((btn, index) => {
            btn.setAttribute('tabindex', '0');
            btn.setAttribute('role', 'button');
            btn.setAttribute('aria-label', `Show ${btn.dataset.category} charts`);
            
            btn.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
        });
    }
    
    // Public method to refresh gallery
    refresh() {
        // Don't refresh if not on index page
        if (!this.isIndexPage) return;
        
        this.createCategoryNavigation();
        this.createGallery();
    }
    
    // Public method to add new chart type
    addChartType(chartConfig) {
        this.chartTypes.push(chartConfig);
        this.refresh();
    }
    
    // Public method to get selected chart
    getSelectedChart() {
        const selectedItem = document.querySelector('.chart-type-item.selected');
        return selectedItem ? selectedItem.dataset.value : null;
    }
}

// Legacy function for backward compatibility
export function createChartTypeGallery() {
    return new ChartTypeGallery();
}

// Auto-initialize if needed
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chartTypeGallery') && !window.chartGalleryInstance) {
        window.chartGalleryInstance = new ChartTypeGallery();
    }
});