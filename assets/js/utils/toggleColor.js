// Import DarkReader for theme switching
import { enable, disable, isEnabled } from 'js/libs/darkreader.min';
import $ from 'js/libs/jquery.min';
import { isHomePage, getDarkOfLocalStorage, isNightTime } from './darkModeInit';
import * as params from '@params';

let sun = `<svg t="1657283336399" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2283" width="16" height="16"><path d="M512 288c-123.488 0-224 100.512-224 224 0 123.488 100.512 224 224 224s224-100.512 224-224C736 388.512 635.488 288 512 288zM512 672c-88.384 0-160-71.616-160-160s71.616-160 160-160 160 71.616 160 160S600.384 672 512 672zM512 224c17.664 0 32-14.336 32-32L544 128c0-17.664-14.336-32-32-32s-32 14.336-32 32l0 64C480 209.664 494.336 224 512 224zM512 800c-17.664 0-32 14.336-32 32l0 64c0 17.664 14.336 32 32 32s32-14.336 32-32l0-64C544 814.336 529.664 800 512 800zM760.864 308.32l45.248-45.248c12.512-12.512 12.512-32.736 0-45.248-12.512-12.512-32.736-12.512-45.248 0l-45.248 45.248c-12.512 12.512-12.512 32.736 0 45.248C728.128 320.832 748.384 320.832 760.864 308.32zM263.136 715.68l-45.248 45.248c-12.512 12.512-12.512 32.736 0 45.248s32.736 12.512 45.248 0l45.248-45.248c12.512-12.544 12.512-32.768 0-45.248C295.872 703.168 275.616 703.136 263.136 715.68zM224 512c0-17.664-14.336-32-32-32L128 480c-17.664 0-32 14.336-32 32s14.336 32 32 32l64 0C209.664 544 224 529.664 224 512zM896 480l-64 0c-17.664 0-32 14.336-32 32s14.336 32 32 32l64 0c17.664 0 32-14.336 32-32S913.664 480 896 480zM263.072 308.32c12.512 12.512 32.768 12.512 45.248 0 12.512-12.512 12.512-32.736 0-45.248l-45.248-45.248c-12.512-12.512-32.736-12.512-45.248 0-12.512 12.512-12.512 32.736 0 45.248L263.072 308.32zM760.928 715.616c-12.544-12.512-32.768-12.512-45.248 0-12.512 12.512-12.544 32.736 0 45.248l45.248 45.248c12.512 12.512 32.736 12.512 45.248 0s12.512-32.736 0-45.248L760.928 715.616z" p-id="2284" fill="#8a8a8a"></path></svg>`;
let moon = `<svg t="1695286075420" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3452" width="16" height="16"><path d="M427.989333 181.12A395.84 395.84 0 0 0 426.666667 213.333333c0 211.754667 172.245333 384 384 384 10.816 0 21.557333-0.437333 32.213333-1.322666C805.344 743.733333 671.232 853.333333 512 853.333333c-188.213333 0-341.333333-153.12-341.333333-341.333333 0-159.232 109.6-293.344 257.322666-330.88M512 85.333333C276.362667 85.333333 85.333333 276.362667 85.333333 512c0 235.648 191.029333 426.666667 426.666667 426.666667 235.648 0 426.666667-191.018667 426.666667-426.666667 0-9.525333-0.426667-18.933333-1.045334-28.309333A297.418667 297.418667 0 0 1 810.666667 512c-164.949333 0-298.666667-133.717333-298.666667-298.666667 0-45.408 10.186667-88.426667 28.309333-126.954666A424.672 424.672 0 0 0 512 85.333333z" p-id="3453" fill="#8a8a8a"></path></svg>`;

let initColor = {
	brightness: 100, 
	contrast: 100,
	sepia: 0,
};

function setInitialColorMode() {
    // Check if we're on homepage and if homepage dark mode is disabled
    if (isHomePage() && !params.params.enableHomepageDarkMode) {
        // Force light mode on homepage when disabled - ignore localStorage and time
        disableDarkModeWithoutSaving();
        return;
    }
    
    const storedPreference = getDarkOfLocalStorage();
    if (storedPreference) {
        // User has explicit preference - apply it and save icon state
        if (storedPreference === 'on') {
            enableDarkModeWithoutSaving();
            $('#light-dark a').html(sun); // Set icon to sun for dark mode
        } else {
            disableDarkModeWithoutSaving();
            $('#light-dark a').html(moon); // Set icon to moon for light mode
        }
    } else {
        // No user preference - use time-based detection but DON'T save to localStorage
        if (isNightTime()) {
            enableDarkModeWithoutSaving();
            $('#light-dark a').html(sun); // Set icon to sun for dark mode
        } else {
            disableDarkModeWithoutSaving();
            $('#light-dark a').html(moon); // Set icon to moon for light mode
        }
    }
}

function setDarkOfLocalStorage(flag) {
    localStorage.setItem('dark', flag);
}

// Functions that apply mode changes AND save to localStorage (for user toggles)
function enableDarkMode() {
    enableDarkModeWithoutSaving();
    setDarkOfLocalStorage('on');
}

function disableDarkMode() {
    disableDarkModeWithoutSaving();
    setDarkOfLocalStorage('off');
}

// Functions that only apply mode changes WITHOUT saving to localStorage (for initial load)
function enableDarkModeWithoutSaving() {
    document.documentElement.classList.add('dark-mode');
    document.documentElement.style.setProperty('background-color', '#1a1a1a', 'important');
    document.documentElement.style.setProperty('color-scheme', 'dark');
    enable(initColor);
    $('#light-dark a').html(sun);
    $("#header-logo").addClass('inverted');
    
    // Trigger custom event for video switching
    document.dispatchEvent(new CustomEvent('darkModeToggle'));
}

function disableDarkModeWithoutSaving() {
    document.documentElement.classList.remove('dark-mode');
    document.documentElement.style.removeProperty('background-color');
    document.documentElement.style.setProperty('color-scheme', 'light');
    disable();
    $('#light-dark a').html(moon);
    $("#header-logo").removeClass('inverted');
    
    // Trigger custom event for video switching
    document.dispatchEvent(new CustomEvent('darkModeToggle'));
}

setInitialColorMode();

export default function toggleColor() {
    // Don't allow toggling on homepage if dark mode is disabled
    if (isHomePage() && !params.params.enableHomepageDarkMode) {
        return;
    }
    
    let _isEnabled = isEnabled();
    if (_isEnabled) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

function delDarkOfLocalStorage() {
    localStorage.removeItem('dark');
}
