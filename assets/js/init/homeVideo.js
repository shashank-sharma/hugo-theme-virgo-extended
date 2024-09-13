export default function renderRandomVideo(videoSources, containerId) {
    if (!Array.isArray(videoSources) || videoSources.length === 0) {
        console.error('Invalid or empty video sources array');
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

    let currentIndex = Math.floor(Math.random() * videoSources.length);

    function getNextVideo() {
        currentIndex = (currentIndex + 1) % videoSources.length;
        return videoSources[currentIndex];
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

    function transitionToNewVideo() {
        const oldVideo = container.querySelector('video');
        const newVideo = createVideoElement(getNextVideo());
        
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
    }

    function preloadVideos() {
        return Promise.all(videoSources.map(src => {
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

    // Start preloading
    preloadVideos().then(videos => {
        preloadedVideos = videos;
        hideLoadingScreen();
        const initialVideo = createVideoElement(getNextVideo());
        container.appendChild(initialVideo);
        container.addEventListener('click', transitionToNewVideo);
    }).catch(error => {
        console.error('Error preloading videos:', error);
        hideLoadingScreen();
    });
}