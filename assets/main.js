import greet from "js/init/greet";
import initEventBinding from "js/init/eventBinding";
import home from "js/init/home";
import homeVideo from "js/init/homeVideo";
import initConstellation from "./js/init/constellation";
import initImage from "js/init/initImage";
import initCodeBlock from "js/init/initCodeBlock";
import enhanceOrgMode from './js/init/enhanceOrgMode';
import enhanceMarkdown from './js/init/enhanceMarkdown';
import runMisc from './js/init/runMisc';
import BlogHeader from './js/init/blogHeader';
import initHeaderImageCaption from './js/init/initHeaderImageCaption';
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

    // Initialize constellation if API endpoint is configured
    if (params.params.backend && params.params.backend.constellationapiendpoint) {
        requestAnimationFrame(() => {
            const overlay = document.getElementById('constellation-overlay');
            if (overlay) {
            const isMobile = window.innerWidth < 768;

            const getAvoidZones = () => {
                const width = window.innerWidth;
                const height = window.innerHeight;
                return [
                    // Top-left logo area
                    { x: 0, y: 52, width: 320, height: 60 },
                    // Center video area
                    { 
                        x: width * 0.3, 
                        y: height * 0.19, 
                        width: width * 0.3, 
                        height: height * 0.5
                    }
                ];
            };

            const constellationCleanup = initConstellation(overlay, { 
                opacity: 0.4,
                hoverOpacity: 1.0,
                avoidZones: getAvoidZones(), // Pass initial zones
                getAvoidZones: getAvoidZones, // Pass function for dynamic updates
                debugAvoidZones: false,
                videoContainerId: 'home-header-vector-body',
                apiEndpoint: params.params.backend.constellationapiendpoint,
                // New configuration
                maxSessions: 5,
                geometryScale: 1.4, // Explicitly set for more visibility
                minStarSize: isMobile ? 2 : 6,
                maxStarSize: isMobile ? 7 : 15,
                sessionRadius: isMobile ? 50 : 120,
                spacingMultiplier: 2.0, // Increased to prevent overlap
                sessionPadding: 30, // Extra distance between session clusters
                // Callback for successful loading
                onLoadSuccess: () => {
                    // Show constellation info star only when constellation loads successfully
                    initConstellationInfoStar();
                },
                onLoadFailure: () => {
                    // Hide constellation info star if constellation fails to load
                    const infoStar = document.getElementById('constellation-info-star');
                    if (infoStar) {
                        infoStar.style.display = 'none';
                    }
                }
            });
        }
    });
    } else {
        // No constellation API endpoint configured, hide the info star
        const infoStar = document.getElementById('constellation-info-star');
        if (infoStar) {
            infoStar.style.display = 'none';
        }
    }

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

// Home feature is now positioned within the video container, no need to move it

// Initialize constellation info star click handler
function initConstellationInfoStar() {
    const canvas = document.getElementById('constellation-info-star');
    if (!canvas) return;
    
    // Show the constellation info star since constellation loaded successfully
    canvas.style.display = 'block';
    
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const baseStarSize = 8;
    
    let animationTime = 0;
    let isHovering = false;
    let rotationAngle = 0;
    
    // Colors matching constellation theme
    const baseColors = {
        core: 'rgba(140, 140, 140, 0.55)',
        glow: 'rgba(140, 140, 140, 0.10)',
        geometry: 'rgba(120, 120, 120, 0.3)'
    };
    
    const hoverColors = {
        core: 'rgba(180, 180, 180, 0.8)',
        glow: 'rgba(180, 180, 180, 0.25)',
        geometry: 'rgba(160, 160, 160, 0.5)'
    };
    
    function drawSacredGeometry(x, y, radius, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        const colors = isHovering ? hoverColors : baseColors;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        
        // Add glow effect to geometry
        ctx.shadowColor = colors.geometry;
        ctx.shadowBlur = isHovering ? 8 : 4;
        ctx.strokeStyle = colors.geometry;
        
        // Draw outer circle (Flower of Life base)
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Draw Star of David (two overlapping triangles)
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3;
            const px = Math.cos(angle) * (radius * 0.7);
            const py = Math.sin(angle) * (radius * 0.7);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Draw inverted triangle
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3 + Math.PI;
            const px = Math.cos(angle) * (radius * 0.7);
            const py = Math.sin(angle) * (radius * 0.7);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Draw inner circle
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw connecting lines (Vesica Piscis inspired)
        const smallRadius = radius * 0.3;
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const startX = Math.cos(angle) * smallRadius;
            const startY = Math.sin(angle) * smallRadius;
            const endX = Math.cos(angle) * radius;
            const endY = Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        // Draw octagon for complexity
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const px = Math.cos(angle) * (radius * 0.85);
            const py = Math.sin(angle) * (radius * 0.85);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    }
    
    function drawStar() {
        ctx.clearRect(0, 0, size, size);
        
        const colors = isHovering ? hoverColors : baseColors;
        
        // Enhanced glow effect (fixed size)
        const glowRadius = baseStarSize * 5;
        const glowGradient = ctx.createRadialGradient(center, center, 0, center, center, glowRadius);
        glowGradient.addColorStop(0, colors.glow);
        glowGradient.addColorStop(0.3, `rgba(140, 140, 140, ${isHovering ? 0.1 : 0.05})`);
        glowGradient.addColorStop(1, 'rgba(140, 140, 140, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(center, center, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw rotating sacred geometry (fixed size)
        drawSacredGeometry(center, center, baseStarSize * 2.5, rotationAngle);
        
        // Draw core star (fixed size)
        ctx.fillStyle = colors.core;
        ctx.beginPath();
        ctx.arc(center, center, baseStarSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Add enhanced inner glow (fixed size)
        const innerGradient = ctx.createRadialGradient(center, center, 0, center, center, baseStarSize);
        innerGradient.addColorStop(0, `rgba(200, 200, 200, ${isHovering ? 0.5 : 0.3})`);
        innerGradient.addColorStop(0.7, `rgba(180, 180, 180, ${isHovering ? 0.2 : 0.1})`);
        innerGradient.addColorStop(1, 'rgba(140, 140, 140, 0)');
        
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(center, center, baseStarSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Add sparkle effect on hover (fixed distance)
        if (isHovering) {
            const sparkleCount = 6;
            ctx.fillStyle = 'rgba(220, 220, 220, 0.8)';
            for (let i = 0; i < sparkleCount; i++) {
                const angle = (i * Math.PI * 2) / sparkleCount + animationTime * 0.02;
                const distance = baseStarSize * 3;
                const sparkleX = center + Math.cos(angle) * distance;
                const sparkleY = center + Math.sin(angle) * distance;
                const sparkleSize = Math.sin(animationTime * 0.05 + i) * 1 + 1.5;
                
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    function animate() {
        animationTime++;
        rotationAngle += 0.01; // Slow rotation
        drawStar();
        requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Add click handler
    canvas.addEventListener('click', function() {
        window.open('/microblog/constellation-refactor/', '_blank');
    });
    
    // Add hover effects
    canvas.addEventListener('mouseenter', function() {
        isHovering = true;
        canvas.style.cursor = 'pointer';
    });
    
    canvas.addEventListener('mouseleave', function() {
        isHovering = false;
        canvas.style.cursor = 'default';
    });
}

// Initialize common behaviors
greet();
enhanceOrgMode();
initCodeBlock();
enhanceMarkdown();
initImage();
initHeaderImageCaption();
initEventBinding();
runMisc();
// initConstellationInfoStar() is now called conditionally when constellation loads successfully
BlogHeader.init();