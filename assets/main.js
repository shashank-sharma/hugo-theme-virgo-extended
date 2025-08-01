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
}

greet();
enhanceOrgMode();
initCodeBlock();
enhanceMarkdown();
initImage();
initEventBinding();
runMisc();
BlogHeader.init();