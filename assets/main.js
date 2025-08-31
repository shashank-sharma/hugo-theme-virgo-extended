import greet from "js/init/greet";
import initEventBinding from "js/init/eventBinding";
import home from "js/init/home";
import homeVideo from "js/init/homeVideo";
import initImage from "js/init/initImage";
import initCodeBlock from "js/init/initCodeBlock";
import enhanceOrgMode from './js/init/enhanceOrgMode';
import enhanceMarkdown from './js/init/enhanceMarkdown';
import runMisc from './js/init/runMisc';
import BlogHeader from './js/init/blogHeader';
import * as params from '@params';

function isHomePage() {
    return window.location.pathname === '/' || window.location.pathname === '/index.html';
}

if (params.params.backend && params.params.backend.deviceapiendpoint && isHomePage()) {
    home(params.params.backend.deviceapiendpoint)
} else {
    // Fade out left and side bars in posts page
    const relSidebar = document.querySelector('.rel');
    const tocSidebar = document.querySelector('#TableOfContents');
    const tocBorder = document.querySelector('.toc');

    if (relSidebar || tocSidebar) {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (!scrollTimeout) {
                scrollTimeout = setTimeout(() => {
                    handleScroll();
                    scrollTimeout = null;
                }, 100);
            }
        });
    
        // Handle scroll event
        function handleScroll() {
            const scrollPosition = window.scrollY;
            const totalHeight = document.documentElement.scrollHeight;
            const viewportHeight = window.innerHeight;
            const distanceFromBottom = totalHeight - (scrollPosition + viewportHeight);
            const shouldHide = distanceFromBottom < 100;
            
            tocBorder.style.borderLeft = shouldHide ? '0' : '1px solid #dee2e6';
            if (relSidebar) {
                relSidebar.style.transform = shouldHide ? 'translateX(-120%)' : 'translateX(0)';
            }
            if (tocBorder) {
                tocSidebar.style.transform = shouldHide ? 'translateX(120%)' : 'translateX(0)';
            }
        }
    }
}

if (params.params.video.src && isHomePage()) {
    console.log("Rendering video with dark mode support");
    const lightVideos = params.params.video.src || [];
    const darkVideos = params.params.video.darksrc || lightVideos; // Fallback to light videos if dark not available
    homeVideo(lightVideos, darkVideos, "home-header-vector-body")

    // Bind overlay button to open active world
    const btn = document.getElementById('home-feature-btn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Get current index and source matching current mode
            const isDark = document.documentElement.classList.contains('dark-mode') || document.documentElement.hasAttribute('data-darkreader-scheme');
            const sources = isDark ? (params.params.video.darksrc || lightVideos) : lightVideos;
            let idx = 0;
            const stored = localStorage.getItem('video_index');
            if (stored !== null) {
                const parsed = parseInt(stored);
                if (!Number.isNaN(parsed)) idx = parsed % sources.length;
            }
            const src = sources[idx] || sources[0] || '';
            // Derive slug from filename
            const match = src.match(/\/([^\/]+)\.(mp4|webm|mov)$/i);
            const derived = match ? match[1] : 'world';
            // Allow mapping multiple slugs to one destination via config
            const map = (params.params.video && params.params.video.worldmap) || {};
            const dest = map[derived] || derived;
            window.open(`/worlds/${dest}/`, '_blank', 'noopener');
        });
    }
}

greet();
enhanceOrgMode();
initCodeBlock();
enhanceMarkdown();
initImage();
initEventBinding();
runMisc();
BlogHeader.init();