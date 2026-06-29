// js/login.js

import { auth, showMessage } from './utils.js';
import {
    setCurrentUserId,
    initData,
    headers,
    loadDashboardSettings
} from '../store/DataHandler.js';
import { plotAll } from './charts.js';
import { displayGoogleSheetsTable as loadAndDisplayUserData } from './dataTebledisplay.js';
import { populateColumnDragLists, initializeDragAndDrop } from './chartcolomdrag.js';

// Error messages को हिंदी में map करने के लिए
const errorMessagesHindi = {
    'auth/invalid-email': 'अमान्य ईमेल पता',
    'auth/user-disabled': 'यूजर डिसेबल है',
    'auth/user-not-found': 'यूजर नहीं मिला',
    'auth/wrong-password': 'गलत पासवर्ड',
    'auth/email-already-in-use': 'ईमेल पहले से उपयोग में है',
    'auth/popup-closed-by-user': 'पॉपअप बंद कर दिया गया',
    'auth/cancelled-popup-request': 'पॉपअप रिक्वेस्ट रद्द की गई'
};

// UI element helper
const getElement = id => document.getElementById(id);

// Loading state handler
const setLoadingState = (isLoading) => {
    ['loginBtn', 'registerBtn', 'googleLoginBtn'].forEach(id => {
        const btn = getElement(id);
        if (btn) {
            btn.disabled = isLoading;
            btn.textContent = isLoading ? 'कृपया प्रतीक्षा करें...' : btn.dataset.originalText;
        }
    });
};

// Initialize login page logic
function initializeLoginPageLogic() {
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage !== 'login.html') return;
    
    const emailInput = getElement('emailInput');
    const passwordInput = getElement('passwordInput');
    const loginErrorDiv = getElement('loginError');
    
    // Save original button texts
    ['loginBtn', 'registerBtn', 'googleLoginBtn'].forEach(id => {
        const btn = getElement(id);
        if (btn) btn.dataset.originalText = btn.textContent;
    });
    
    const showError = (error) => {
        const msg = errorMessagesHindi[error.code] || error.message || 'त्रुटि हुई';
        if (loginErrorDiv) {
            loginErrorDiv.textContent = msg;
            loginErrorDiv.style.display = 'block';
        }
    };
    
    const attachEvent = (id, handler) => {
        const el = getElement(id);
        if (el) el.addEventListener('click', handler);
    };
    
    // ईमेल/पासवर्ड लॉगिन
    attachEvent('loginBtn', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        loginErrorDiv.style.display = 'none';
        setLoadingState(true);
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            showError(error);
        } finally {
            setLoadingState(false);
        }
    });
    
    // ईमेल/पासवर्ड रजिस्ट्रेशन
    attachEvent('registerBtn', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        loginErrorDiv.style.display = 'none';
        setLoadingState(true);
        
        try {
            await auth.createUserWithEmailAndPassword(email, password);
        } catch (error) {
            showError(error);
        } finally {
            setLoadingState(false);
        }
    });
    
    // Google लॉगिन
    attachEvent('googleLoginBtn', async () => {
        loginErrorDiv.style.display = 'none';
        setLoadingState(true);
        
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await auth.signInWithPopup(provider);
        } catch (error) {
            showError(error);
        } finally {
            setLoadingState(false);
        }
    });
}

// Auth state listener
function initializeAuthStateListener() {
    const currentPage = window.location.pathname.split('/').pop();
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // लॉगिन हुआ यूजर
            if (currentPage === 'login.html') {
                window.location.href = 'index.html';
                return;
            }
            
            setCurrentUserId(user.uid);
            const userEmailSpan = getElement('userEmail');
            const userInfoDiv = getElement('userInfo');
            if (userEmailSpan) userEmailSpan.textContent = user.email;
            if (userInfoDiv) userInfoDiv.style.display = 'flex';
            
            try {
                await initData();
                await loadDashboardSettings();
                plotAll();
                loadAndDisplayUserData();
                
                if (headers.length > 0) {
                    populateColumnDragLists(headers);
                    const isLockModeEnabled = getElement('toggleLockModeBtn')?.textContent.includes('Unlock');
                    if (!isLockModeEnabled) initializeDragAndDrop();
                }
            } catch (err) {
                console.error('डेटा लोड में त्रुटि:', err);
            }
        } else {
            // लॉगआउट हुआ यूजर
            setCurrentUserId(null);
            const userInfoDiv = getElement('userInfo');
            if (userInfoDiv) userInfoDiv.style.display = 'none';
            
            initData();
            loadAndDisplayUserData();
            populateColumnDragLists([]);
            
            if (currentPage === 'index.html' || currentPage === '') {
                window.location.href = 'login.html';
            }
        }
    });
}

// Export main function
export function initializeLoginAndAuth() {
    initializeLoginPageLogic();
    initializeAuthStateListener();
}