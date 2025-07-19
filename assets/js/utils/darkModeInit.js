// Dark mode initialization script
export function getDarkOfLocalStorage() {
    return localStorage.getItem('dark');
}

export function isNightTime() {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6;
}

export function isHomePage() {
    return window.location.pathname === '/' || window.location.pathname === '/index.html';
}

export function shouldUseDarkMode() {
    const storedPreference = getDarkOfLocalStorage();
    if (storedPreference) {
        return storedPreference === 'on';
    }
    return typeof DARK !== 'undefined' && DARK || isNightTime();
}

// Basic initialization - just sets the minimal dark mode state without localStorage
// The full initialization with icons is handled by toggleColor.js
function initializeDarkMode() {
    const storedPreference = getDarkOfLocalStorage();
    
    if (storedPreference) {
        // User has explicit preference
        if (storedPreference === 'on') {
            document.documentElement.classList.add('dark-mode');
            document.documentElement.style.setProperty('background-color', '#1a1a1a', 'important');
            document.documentElement.style.setProperty('color-scheme', 'dark');
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.documentElement.style.removeProperty('background-color');
            document.documentElement.style.setProperty('color-scheme', 'light');
        }
    } else {
        // No user preference - use time-based detection but DON'T save to localStorage
        if (isNightTime()) {
            document.documentElement.classList.add('dark-mode');
            document.documentElement.style.setProperty('background-color', '#1a1a1a', 'important');
            document.documentElement.style.setProperty('color-scheme', 'dark');
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.documentElement.style.removeProperty('background-color');
            document.documentElement.style.setProperty('color-scheme', 'light');
        }
    }
}

// Run initialization immediately
initializeDarkMode(); 