

const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = firebase.firestore();

// --- Generic Helper Functions ---

// Attach event listener to an element by ID
export function attachEventListener(id, eventType, handler) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener(eventType, handler);
    } else {
        console.warn(`Element with ID '${id}' not found. Cannot attach event listener.`);
    }
}



// Advanced Notification System - UNIQUE & MODERN
export function showMessage(message, type = 'info', options = {}) {
    const {
        duration = 5000,
            position = 'top-right',
            icon = true,
            action = null,
            dismissible = true
    } = options;
    
    // Create notification container
    let notificationContainer = document.getElementById('advancedNotificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'advancedNotificationContainer';
        notificationContainer.className = 'advanced-notification-container';
        document.body.appendChild(notificationContainer);
        
        // Add custom styles
        addNotificationStyles();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `advanced-notification ${type} ${position}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    
    // Notification content
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                ${getNotificationIcon(type)}
            </div>
            <div class="notification-body">
                <div class="notification-title">${getNotificationTitle(type)}</div>
                <div class="notification-message">${message}</div>
                ${action ? `
                <div class="notification-actions">
                    <button class="btn-action" onclick="${action.handler}">
                        ${action.text}
                    </button>
                </div>
                ` : ''}
            </div>
            ${dismissible ? `
            <button class="notification-close" onclick="this.parentElement.remove()">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            ` : ''}
        </div>
        <div class="notification-progress"></div>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove if duration provided
    if (duration > 0) {
        const progressBar = notification.querySelector('.notification-progress');
        if (progressBar) {
            progressBar.style.animation = `progress ${duration}ms linear forwards`;
        }
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 43000);
            }
        }, duration);
    }
    
    return notification;
}

// Custom icons for each type
function getNotificationIcon(type) {
    const icons = {
        'success': `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
        `,
        'error': `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
        `,
        'warning': `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
        `,
        'info': `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
        `
    };
    return icons[type] || icons.info;
}

function getNotificationTitle(type) {
    const titles = {
        'success': 'सफलता',
        'error': 'त्रुटि',
        'warning': 'चेतावनी',
        'info': 'सूचना'
    };
    return titles[type] || 'सूचना';
}

// Add custom styles dynamically
function addNotificationStyles() {
    const styles = `
        <style>
        .advanced-notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            min-width: 320px;
            max-width: 400px;
            pointer-events: none;
        }

        .advanced-notification {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1);
            margin-bottom: 12px;
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: all;
            border-left: 4px solid;
            overflow: hidden;
        }

        .advanced-notification.show {
            transform: translateX(0);
            opacity: 1;
        }

        .advanced-notification.success {
            border-left-color: #10b981;
        }

        .advanced-notification.error {
            border-left-color: #ef4444;
        }

        .advanced-notification.warning {
            border-left-color: #f59e0b;
        }

        .advanced-notification.info {
            border-left-color: #3b82f6;
        }

        .notification-content {
            display: flex;
            align-items: flex-start;
            padding: 16px;
            position: relative;
        }

        .notification-icon {
            flex-shrink: 0;
            margin-right: 12px;
            margin-top: 2px;
        }

        .notification-icon svg {
            display: block;
        }

        .success .notification-icon { color: #10b981; }
        .error .notification-icon { color: #ef4444; }
        .warning .notification-icon { color: #f59e0b; }
        .info .notification-icon { color: #3b82f6; }

        .notification-body {
            flex: 1;
            min-width: 0;
        }

        .notification-title {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
            color: #1f2937;
        }

        .notification-message {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.4;
        }

        .notification-actions {
            margin-top: 8px;
        }

        .btn-action {
            background: transparent;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 4px 12px;
            font-size: 12px;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-action:hover {
            background: #f9fafb;
            border-color: #9ca3af;
        }

        .notification-close {
            background: none;
            border: none;
            padding: 4px;
            margin-left: 8px;
            cursor: pointer;
            color: #9ca3af;
            border-radius: 4px;
            transition: all 0.2s;
            flex-shrink: 0;
        }

        .notification-close:hover {
            background: #f3f4f6;
            color: #374151;
        }

        .notification-progress {
            height: 3px;
            background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1));
            animation: progress 5000ms linear forwards;
        }

        .success .notification-progress { background: linear-gradient(90deg, #10b981, rgba(16, 185, 129, 0.3)); }
        .error .notification-progress { background: linear-gradient(90deg, #ef4444, rgba(239, 68, 68, 0.3)); }
        .warning .notification-progress { background: linear-gradient(90deg, #f59e0b, rgba(245, 158, 11, 0.3)); }
        .info .notification-progress { background: linear-gradient(90deg, #3b82f6, rgba(59, 130, 246, 0.3)); }

        @keyframes progress {
            from { width: 100%; }
            to { width: 0%; }
        }

        /* Dark theme support */
        @media (prefers-color-scheme: dark) {
            .advanced-notification {
                background: #374151;
                color: white;
            }
            .notification-title { color: #f9fafb; }
            .notification-message { color: #d1d5db; }
            .btn-action {
                background: #4b5563;
                border-color: #6b7280;
                color: #f9fafb;
            }
            .btn-action:hover {
                background: #6b7280;
            }
            .notification-close:hover {
                background: #4b5563;
                color: #f9fafb;
            }
        }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', styles);
}


// Export data to CSV
export function exportCsv(data, filename = 'exported_data.csv') {
    if (!data || data.length === 0) {
        showMessage('निर्यात करने के लिए कोई डेटा नहीं है।', 'warning');
        return;
    }
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    showMessage('CSV सफलतापूर्वक निर्यात किया गया!', 'success');
}

// Export data to Excel
export function exportExcel(data, filename = 'exported_data.xlsx') {
    if (!data || data.length === 0) {
        showMessage('निर्यात करने के लिए कोई डेटा नहीं है।', 'warning');
        return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, filename);
    showMessage('Excel सफलतापूर्वक निर्यात किया गया!', 'success');
}

// Export data to PDF
export function exportPdf(data, headers, filename = 'exported_data.pdf') {
    if (!data || data.length === 0) {
        showMessage('निर्यात करने के लिए कोई डेटा नहीं है।', 'warning');
        return;
    }
    const doc = new jspdf.jsPDF();
    const tableHeaders = headers.map(h => String(h));
    const tableBody = data.map(row => tableHeaders.map(header => row[header] !== undefined ? String(row[header]) : ''));

    doc.autoTable({
        head: [tableHeaders],
        body: tableBody,
        startY: 10,
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        didDrawPage: function(data) {
            doc.setFontSize(10);
            doc.text("Data Export", data.settings.margin.left, 8);
            doc.setFontSize(8);
            const pageCount = doc.internal.getNumberOfPages();
            doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 5);
        }
    });
    doc.save(filename);
    showMessage('PDF सफलतापूर्वक निर्यात किया गया!', 'success');
}

// Toggle theme (light/dark)
export function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    const offcanvas = document.getElementById('offcanvasNav');
    if (offcanvas) {
        offcanvas.classList.toggle('dark-theme', isDark);
    }
    showMessage(`थीम बदल दी गई: ${isDark ? 'डार्क' : 'लाइट'}`, 'info');
}

// Download sample data template
export function downloadTemplate() {
    const templateData = [
        { "उत्पाद का नाम": "उत्पाद A", "बिक्री (इकाइयाँ)": 100, "राजस्व": 15000, "तारीख": "2023-01-05", "श्रेणी": "इलेक्ट्रॉनिक्स" },
        { "उत्पाद का नाम": "उत्पाद B", "बिक्री (इकाइयाँ)": 50, "राजस्व": 7500, "तारीख": "2023-01-10", "श्रेणी": "कपड़े" },
        { "उत्पाद का नाम": "उत्पाद C", "बिक्री (इकाइयाँ)": 200, "राजस्व": 20000, "तारीख": "2023-01-15", "श्रेणी": "किताबें" },
        { "उत्पाद का नाम": "उत्पाद A", "बिक्री (इकाइयाँ)": 120, "राजस्व": 18000, "तारीख": "2023-02-01", "श्रेणी": "इलेक्ट्रॉनिक्स" },
        { "उत्पाद का नाम": "उत्पाद D", "बिक्री (इकाइयाँ)": 80, "राजस्व": 12000, "तारीख": "2023-02-05", "श्रेणी": "घर का सामान" }
    ];
    exportCsv(templateData, 'sample_data_template.csv');
}

// Control dashboard visibility based on auth state
export function setDashboardVisibility(loggedIn) {
    console.log("setDashboardVisibility called with loggedIn:", loggedIn);

    const authOverlay = document.getElementById('authOverlay');
    const dashboardContent = document.getElementById('dashboardContent');
    const mainContentContainer = document.querySelector('.main-content-container');
    const offcanvasToggleBtn = document.querySelector('.btn-primary.position-fixed');
    const offcanvas = document.getElementById('offcanvasNav');
    const userInfoDiv = document.getElementById('userInfo');
    const userInfoHr = document.getElementById('userInfoHr');

    // Check if critical DOM elements exist
    if (!authOverlay || !dashboardContent || !mainContentContainer) {
        console.error("DOM elements not found:", {
            authOverlay: !!authOverlay,
            dashboardContent: !!dashboardContent,
            mainContentContainer: !!mainContentContainer
        });
        return;
    }

    if (loggedIn) {
        console.log("Showing dashboard content");
        authOverlay.style.display = 'none';
        authOverlay.style.zIndex = '-1';
        dashboardContent.style.display = 'block';
        mainContentContainer.classList.remove('content-hidden');
        if (offcanvasToggleBtn) offcanvasToggleBtn.classList.remove('content-hidden');
        if (offcanvas) offcanvas.classList.remove('content-hidden');
        if (userInfoDiv) userInfoDiv.style.display = 'flex';
        if (userInfoHr) userInfoHr.style.display = 'block';
    } else {
        console.log("Showing auth overlay");
        authOverlay.style.display = 'flex';
        authOverlay.style.zIndex = '1050';
        dashboardContent.style.display = 'none';
        mainContentContainer.classList.add('content-hidden');
        if (offcanvasToggleBtn) offcanvasToggleBtn.classList.add('content-hidden');
        if (offcanvas) offcanvas.classList.add('content-hidden');
        if (userInfoDiv) userInfoDiv.style.display = 'none';
        if (userInfoHr) userInfoHr.style.display = 'none';
    }
}

// --- Spinner Utility Functions (NEW ADDITIONS) ---
export function showSpinner(spinnerElement) {
    if (spinnerElement) {
        spinnerElement.style.display = 'block';
    }
}

export function hideSpinner(spinnerElement) {
    if (spinnerElement) {
        spinnerElement.style.display = 'none';
    }
}