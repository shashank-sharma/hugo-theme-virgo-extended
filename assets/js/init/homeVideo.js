export default function renderRandomVideo(lightVideoSources, darkVideoSources, containerId) {
    // Validate inputs
    if (!Array.isArray(lightVideoSources) || lightVideoSources.length === 0) {
        console.error('Invalid or empty light video sources array');
        return;
    }
    
    if (!Array.isArray(darkVideoSources) || darkVideoSources.length === 0) {
        console.error('Invalid or empty dark video sources array');
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id "${containerId}" not found`);
        return;
    }

    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) {
        console.error('Loading screen element not found');
        return;
    }

    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    let currentMode = getDarkMode();
    let currentSources = currentMode ? darkVideoSources : lightVideoSources;
    let currentIndex = Math.floor(Math.random() * currentSources.length);
    let preloadedVideos = {};
    
    // Load stored video index
    if (localStorage.getItem("video_index") !== null) {
        currentIndex = parseInt(localStorage.getItem("video_index"));
    }

    function getDarkMode() {
        // Check if dark mode is active
        return document.documentElement.classList.contains('dark-mode') ||
               document.documentElement.hasAttribute('data-darkreader-scheme');
    }

    function getCurrentVideoSources() {
        const isDark = getDarkMode();
        return isDark ? darkVideoSources : lightVideoSources;
    }

    function getNextVideo() {
        const sources = getCurrentVideoSources();
        currentIndex = (currentIndex + 1) % sources.length;
        localStorage.setItem("video_index", currentIndex);
        return sources[currentIndex];
    }

    function getCurrentVideo() {
        const sources = getCurrentVideoSources();
        // Ensure index is within bounds for current mode
        if (currentIndex >= sources.length) {
            currentIndex = 0;
        }
        return sources[currentIndex];
    }

    function createVideoElement(src) {
        const videoElement = document.createElement('video');
        videoElement.autoplay = true;
        videoElement.loop = true;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.src = src;
        return videoElement;
    }

    function transitionToNewVideo(newSrc = null) {
        const oldVideo = container.querySelector('video');
        const videoSrc = newSrc || getNextVideo();
        const newVideo = createVideoElement(videoSrc);
        
        if (oldVideo) {
            oldVideo.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
            newVideo.style.transition = 'transform 0.5s ease-in, opacity 0.5s ease-in';
            newVideo.style.transform = 'translateY(1%)';
            newVideo.style.opacity = '0';
            
            container.appendChild(newVideo);
            newVideo.offsetHeight;

            oldVideo.style.transform = 'translateY(-1%)';
            oldVideo.style.opacity = '0';
            newVideo.style.transform = 'translateY(0)';
            newVideo.style.opacity = '1';

            setTimeout(() => {
                oldVideo.remove();
            }, 500);
        } else {
            // No existing video, just add the new one
            container.appendChild(newVideo);
        }
    }

    function handleModeChange() {
        const newMode = getDarkMode();
        if (newMode !== currentMode) {
            currentMode = newMode;
            currentSources = getCurrentVideoSources();
            
            // Transition to the equivalent video in the new mode
            const newVideoSrc = getCurrentVideo();
            transitionToNewVideo(newVideoSrc);
        }
    }

    function preloadVideos(sources) {
        return Promise.all(sources.map(src => {
            return new Promise((resolve, reject) => {
                const video = document.createElement('video');
                video.preload = 'auto';
                video.onloadeddata = () => resolve(video);
                video.onerror = reject;
                video.src = src;
            });
        }));
    }

    function hideLoadingScreen() {
        setTimeout(() => {
            loadingScreen.classList.add('closing');
            setTimeout(() => {
                loadingScreen.remove();
            }, 1000);
        }, 1000);
    }

    // Preload both light and dark videos
    Promise.all([
        preloadVideos(lightVideoSources),
        preloadVideos(darkVideoSources)
    ]).then(([lightVideos, darkVideos]) => {
        preloadedVideos = {
            light: lightVideos,
            dark: darkVideos
        };
        hideLoadingScreen();
        
        // Show initial video
        const initialVideo = createVideoElement(getCurrentVideo());
        container.appendChild(initialVideo);
        
        // Add click handler for manual transitions
        container.addEventListener('click', () => transitionToNewVideo());
        
        // Listen for dark mode changes
        const observer = new MutationObserver(handleModeChange);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'data-darkreader-scheme']
        });
        
        // Also listen for manual dark mode toggle events
        document.addEventListener('darkModeToggle', handleModeChange);
        
    }).catch(error => {
        console.error('Error preloading videos:', error);
        hideLoadingScreen();
    });
}