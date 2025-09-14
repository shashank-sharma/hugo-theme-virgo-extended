class SessionConstellation {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            maxStars: 100, // Increased star limit
            maxSessions: 20, // Increased session limit
            starScale: options.starScale || 1,
            geometryScale: options.geometryScale || 1.5, // Further increased default size
            animationSpeed: options.animationSpeed || 1,
            showLabels: options.showLabels !== false,
            opacity: options.opacity || 0.8,
            spacingMultiplier: options.spacingMultiplier || 1.5, // Increased spacing
            horizontalBias: options.horizontalBias || 1.8, // Spread more horizontally
            avoidZones: options.avoidZones || [],
            getAvoidZones: options.getAvoidZones || null, // For dynamic resizing
            // New configurable options
            minStarSize: options.minStarSize || 3,
            maxStarSize: options.maxStarSize || 12,
            sessionRadius: options.sessionRadius || 100,
            hoverOpacity: options.hoverOpacity || 1.0,
            debugAvoidZones: options.debugAvoidZones || false,
            videoContainerId: options.videoContainerId || null,
            apiEndpoint: options.apiEndpoint || null,
            sessionPadding: options.sessionPadding || 20, // New option for distance between sessions
            ...options
        };
        
        // State
        this.canvas = null;
        this.ctx = null;
        this.sessions = [];
        this.stars = [];
        this.hoveredStar = null;
        this.animating = true;
        this.time = 0;
        this.mousePos = { x: 0, y: 0 };
        this.geometryType = 0; // For cycling through geometry types
        this.isMobile = false;
        this.targetOpacity = this.options.opacity;
        this.currentOpacity = this.options.opacity;
        this.isHoveringInteractiveElement = false;
        
        // Colors - Optimized for a white background with a gray color scheme
        this.colors = {
            star: {
                core: 'rgba(80, 80, 80, 0.55)',
                glow: 'rgba(80, 80, 80, 0.10)', // Dimmed the glow
                highlight: 'rgba(150, 150, 150, 0.9)'
            },
            geometry: 'rgba(100, 100, 100, 0.2)', // Increased visibility
            connection: 'rgb(120, 120, 120, 0.4)', // Opacity now controlled by globalAlpha
            label: 'rgba(50, 50, 50, 0.9)',
            labelBg: 'rgba(255, 255, 255, 0.7)'
        };
        
        // Sacred Geometry Patterns
        this.geometryPatterns = [
            'flowerOfLife',
            'metatron',
            'sriYantra',
            'vesicaPiscis',
            'seedOfLife'
        ];
        
        this.init();
    }
    
    _updateDimensionsAndAvoidZones() {
        if (typeof this.options.getAvoidZones === 'function') {
            this.options.avoidZones = this.options.getAvoidZones();
        }
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
    }

    init() {
        // Style container to be on the top half of the screen
        this.container.style.position = 'absolute';
        this.container.style.top = '-20%';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '60%'; // Increased height
        this.container.style.pointerEvents = 'none';
        this.container.style.zIndex = '10';
        this.container.style.mixBlendMode = 'multiply';

        this.detectMobile();
        this.setupCanvas();
        this.setupEventListeners();
        this.loadData();
        this.animate();
    }
    
    detectMobile() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth < 768;
        
        // Adjust options for mobile
        if (this.isMobile) {
            this.options.starScale *= 0.8;
            this.options.geometryScale *= 0.8;
            this.options.spacingMultiplier *= 0.7;
        }
    }
    
    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'constellation-canvas';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'auto';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        if (!this.isMobile) {
            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('mouseleave', () => {
                this.isHoveringInteractiveElement = false;
            });
        } else {
            this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
            this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e));
            this.canvas.addEventListener('touchend', () => this.hoveredStar = null);
        }
    }
    
    resize() {
        this._updateDimensionsAndAvoidZones();

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        // Re-detect mobile on resize
        this.detectMobile();
        this.layoutSessions();
    }
    
    // ========================================
    // Data Management
    // ========================================
    
    async loadData() {
        if (this.options.apiEndpoint) {
            try {
                const response = await fetch(this.options.apiEndpoint);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (data && Array.isArray(data.sessions) && data.sessions.length > 0) {
                    this.processSessions(data.sessions);
                    // Call success callback if provided
                    if (typeof this.options.onLoadSuccess === 'function') {
                        this.options.onLoadSuccess();
                    }
                } else {
                    console.error("API response is missing a 'sessions' array or it is empty. Constellation will not be rendered.");
                    this.destroy();
                    // Call failure callback if provided
                    if (typeof this.options.onLoadFailure === 'function') {
                        this.options.onLoadFailure();
                    }
                }
            } catch (error) {
                console.error("Failed to fetch constellation data. Constellation will not be rendered:", error);
                this.destroy();
                // Call failure callback if provided
                if (typeof this.options.onLoadFailure === 'function') {
                    this.options.onLoadFailure();
                }
            }
        } else {
            // If no API endpoint is provided, do not render the constellation.
            console.warn("No API endpoint provided for constellation. It will not be rendered.");
            this.destroy();
            // Call failure callback if provided
            if (typeof this.options.onLoadFailure === 'function') {
                this.options.onLoadFailure();
            }
        }
    }
    
    processSessions(sessionsData) {
        this.sessions = [];
        this.stars = [];
        
        // Limit sessions and stars
        let totalStars = 0;
        const processedSessions = [];
        
        for (let i = 0; i < Math.min(sessionsData.length, this.options.maxSessions); i++) {
            const session = sessionsData[i];
            if (totalStars >= this.options.maxStars) break;
            
            const apps = session.apps
                .filter(app => app.percentage >= 10)
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, Math.min(5, this.options.maxStars - totalStars));
            
            if (apps.length > 0) {
                processedSessions.push({
                    index: session.session_index,
                    apps: apps
                });
                totalStars += apps.length;
            }
        }
        
        this.sessions = processedSessions;
        this.layoutSessions();
    }
    
    // ========================================
    // Enhanced Layout for Horizontal Distribution
    // ========================================
    
    layoutSessions() {
        this._updateDimensionsAndAvoidZones();
        if (!this.sessions.length) return;
        
        this.stars = [];
        const padding = this.isMobile ? 40 : 80;
        const verticalOffset = this.height * 0.15; // Keep stars in upper portion
        const usableHeight = this.height * 0.7; // Use 70% of height
        
        // Calculate session positions with horizontal bias
        const sessionCenters = this.calculateHorizontalSessionCenters(
            this.sessions.length,
            this.width - padding * 2,
            usableHeight,
            padding,
            verticalOffset
        );
        
        // Resolve collisions between session clusters
        this.resolveSessionCollisions(sessionCenters);

        // Layout each session's stars with increased spacing
        this.sessions.forEach((session, index) => {
            const center = sessionCenters[index];
            const sessionStars = this.layoutSessionStars(session, center);
            this.stars.push(...sessionStars);
        });
    }
    
    resolveSessionCollisions(centers) {
        if (centers.length < 2) return;

        const iterations = 8; // Fewer iterations to avoid over-separation
        // Much more reasonable minimum distance
        const minDistance = this.isMobile ? 100 : 140; // Simple fixed minimum distance

        for (let i = 0; i < iterations; i++) {
            let hasCollisions = false;
            
            for (let j = 0; j < centers.length; j++) {
                for (let k = j + 1; k < centers.length; k++) {
                    const c1 = centers[j];
                    const c2 = centers[k];
                    const dx = c2.x - c1.x;
                    const dy = c2.y - c1.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < minDistance && dist > 0) {
                        hasCollisions = true;
                        const overlap = minDistance - dist;
                        const angle = Math.atan2(dy, dx);
                        const moveX = (overlap / 2) * Math.cos(angle);
                        const moveY = (overlap / 2) * Math.sin(angle);

                        c1.x -= moveX * 0.5; // Gentler movement
                        c1.y -= moveY * 0.5;
                        c2.x += moveX * 0.5;
                        c2.y += moveY * 0.5;
                    }
                }
            }
            
            // Early exit if no collisions detected
            if (!hasCollisions) break;
        }

        // Final pass to ensure all centers are within canvas bounds
        const margin = 80; // Fixed margin for bounds checking
        centers.forEach(center => {
            center.x = Math.max(margin, Math.min(this.width - margin, center.x));
            center.y = Math.max(margin, Math.min(this.height - margin, center.y));
        });
    }

    calculateHorizontalSessionCenters(count, width, height, padding, verticalOffset) {
        const centers = [];
        
        if (count === 1) {
            centers.push({
                x: width / 2 + padding,
                y: height / 2 + verticalOffset
            });
        } else {
            // Simple even distribution across full width with reasonable minimum spacing
            const minSpacing = this.isMobile ? 120 : 180; // Reasonable minimum spacing
            const availableWidth = width - (padding * 2);
            const idealSpacing = availableWidth / (count - 1);
            const actualSpacing = Math.max(minSpacing, idealSpacing);
            
            // If we need more space than available, compress evenly
            const totalRequiredWidth = (count - 1) * actualSpacing;
            const compressionFactor = totalRequiredWidth > availableWidth ? availableWidth / totalRequiredWidth : 1;
            
            for (let i = 0; i < count; i++) {
                const x = padding + (i * actualSpacing * compressionFactor);
                // Add slight vertical variation for visual interest
                const yVariation = (Math.sin((i / count) * Math.PI * 2) * height * 0.1);
                const y = verticalOffset + height / 2 + yVariation;
                
                centers.push({ x, y });
            }
        }
        
        return centers;
    }
    
    layoutSessionStars(session, center) {
        const stars = [];
        const apps = session.apps;
        
        // Get constellation pattern with tighter spacing for cohesive clusters
        const pattern = this.getConstellationPattern(apps.length);
        const baseRadius = this.isMobile ? 30 : 50; // Reduced from sessionRadius for tighter clusters
        const spacingFactor = 2.8; // Much tighter spacing within sessions
        
        apps.forEach((app, index) => {
            const patternPoint = pattern[index];
            const radius = baseRadius * patternPoint.r * spacingFactor;
            const angle = patternPoint.angle;
            
            // Apply moderate horizontal bias to keep clusters cohesive
            const horizontalBias = 2.8; // Reduced from this.options.horizontalBias for tighter clusters
            let x = center.x + Math.cos(angle) * radius * horizontalBias;
            let y = center.y + Math.sin(angle) * radius;
            
            // Minimal jitter to keep stars tightly clustered within sessions
            const jitterX = (Math.random() - 0.5) * 4;
            const jitterY = (Math.random() - 0.5) * 3;
            
            x += jitterX;
            y += jitterY;

            // Reposition star if it's inside an avoid zone
            for (const zone of this.options.avoidZones) {
                if (x > zone.x && x < zone.x + zone.width && y > zone.y && y < zone.y + zone.height) {
                    const to_left = x - zone.x;
                    const to_right = (zone.x + zone.width) - x;
                    const to_top = y - zone.y;
                    const to_bottom = (zone.y + zone.height) - y;

                    const min_dist = Math.min(to_left, to_right, to_top, to_bottom);

                    if (min_dist === to_left) x = zone.x;
                    else if (min_dist === to_right) x = zone.x + zone.width;
                    else if (min_dist === to_top) y = zone.y;
                    else y = zone.y + zone.height;
                }
            }

            const size = this.calculateStarSize(app.percentage);
            const margin = size * 4 + 15; // Margin for glow on top, left, and right
            const labelHeight = 60; // Approximate height for the label box below the star
            const bottomMargin = margin + labelHeight;

            // Clamp position to ensure stars and their labels are fully visible
            x = Math.max(margin, Math.min(this.width - margin, x));
            y = Math.max(margin, Math.min(this.height - bottomMargin, y));

            stars.push({
                x,
                y,
                app: app.app,
                percentage: app.percentage,
                size,
                session: session.index,
                phase: Math.random() * Math.PI * 2,
                connections: patternPoint.connections || [],
                geometryType: Math.floor(Math.random() * this.geometryPatterns.length)
            });
        });
        
        return stars;
    }
    
    getConstellationPattern(starCount) {
        // Enhanced patterns with better spacing
        const patterns = {
            2: [
                { r: 0.8, angle: -Math.PI/4, connections: [1] },
                { r: 0.8, angle: Math.PI * 3/4, connections: [0] }
            ],
            3: [
                { r: 0, angle: 0, connections: [1, 2] },
                { r: 1, angle: -Math.PI/3, connections: [0, 2] },
                { r: 1, angle: Math.PI/3, connections: [0, 1] }
            ],
            4: [
                { r: 0.3, angle: 0, connections: [1, 2, 3] },
                { r: 0.9, angle: -Math.PI/3, connections: [0, 3] },
                { r: 0.9, angle: Math.PI/3, connections: [0] },
                { r: 0.7, angle: Math.PI, connections: [0, 1] }
            ],
            5: [
                { r: 0, angle: 0, connections: [1, 2, 3, 4] },
                { r: 1, angle: 0, connections: [0, 2] },
                { r: 1, angle: Math.PI * 2/5, connections: [0, 1, 3] },
                { r: 1, angle: Math.PI * 4/5, connections: [0, 2, 4] },
                { r: 1, angle: -Math.PI * 2/5, connections: [0, 3] }
            ]
        };
        
        return patterns[starCount] || this.generatePattern(starCount);
    }
    
    generatePattern(starCount) {
        const pattern = [];
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        
        for (let i = 0; i < starCount; i++) {
            const angle = i * goldenAngle;
            const r = 0.5 + (i / starCount) * 0.5;
            const connections = [];
            
            // Create interesting connections
            if (i > 0) connections.push(i - 1);
            if (i < starCount - 1) connections.push(i + 1);
            if (i % 2 === 0 && i + 2 < starCount) connections.push(i + 2);
            
            pattern.push({ r, angle, connections });
        }
        
        return pattern;
    }
    
    calculateStarSize(percentage) {
        const minSize = this.options.minStarSize * this.options.starScale;
        const maxSize = this.options.maxStarSize * this.options.starScale;
        return minSize + (percentage / 100) * (maxSize - minSize);
    }
    
    // ========================================
    // Enhanced Sacred Geometry
    // ========================================
    
    drawSacredGeometry() {
        const ctx = this.ctx;
        
        this.stars.forEach(star => {
            const pulse = 0.9 + Math.sin(this.time + star.phase) * 0.1;
            const radius = (star.size + 15) * this.options.geometryScale * pulse;
            
            ctx.save();
            ctx.globalAlpha = this.currentOpacity * 0.6; // Increased visibility
            ctx.strokeStyle = this.colors.geometry;
            ctx.lineWidth = this.isMobile ? 0.7 : 1.2; // Increased visibility
            
            // Select geometry based on star importance and type
            const geometryIndex = (this.geometryType + star.geometryType) % this.geometryPatterns.length;
            const geometryMethod = this.geometryPatterns[geometryIndex];
            
            this[geometryMethod](star.x, star.y, radius, star.percentage);
            
            ctx.restore();
        });
    }
    
    // Flower of Life pattern
    flowerOfLife(x, y, radius, importance) {
        const ctx = this.ctx;
        const circles = importance > 30 ? 7 : 4;
        
        // Central circle
        this.drawCircle(x, y, radius * 0.5);
        
        // Surrounding circles
        for (let i = 0; i < circles; i++) {
            const angle = (i / circles) * Math.PI * 2;
            const cx = x + Math.cos(angle) * radius * 0.5;
            const cy = y + Math.sin(angle) * radius * 0.5;
            this.drawCircle(cx, cy, radius * 0.3);
        }
    }
    
    // Metatron's Cube pattern
    metatron(x, y, radius, importance) {
        const ctx = this.ctx;
        
        // Outer hexagon
        this.drawPolygon(x, y, 6, radius);
        
        // Inner hexagon
        this.drawPolygon(x, y, 6, radius * 0.5, Math.PI / 6);
        
        // Connecting lines
        if (importance > 25) {
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(
                    x + Math.cos(angle) * radius,
                    y + Math.sin(angle) * radius
                );
                ctx.stroke();
            }
        }
    }
    
    // Sri Yantra inspired pattern
    sriYantra(x, y, radius, importance) {
        const layers = importance > 40 ? 4 : 3;
        
        for (let i = 0; i < layers; i++) {
            const r = radius * (1 - i * 0.25);
            this.drawPolygon(x, y, 3, r, 0);
            this.drawPolygon(x, y, 3, r, Math.PI);
        }
        
        // Central bindu
        this.drawCircle(x, y, radius * 0.1);
    }
    
    // Vesica Piscis pattern
    vesicaPiscis(x, y, radius, importance) {
        const offset = radius * 0.3;
        
        this.drawCircle(x - offset, y, radius * 0.6);
        this.drawCircle(x + offset, y, radius * 0.6);
        
        if (importance > 20) {
            this.drawCircle(x, y - offset, radius * 0.4);
            this.drawCircle(x, y + offset, radius * 0.4);
        }
    }
    
    // Seed of Life pattern
    seedOfLife(x, y, radius, importance) {
        const circles = 7;
        const innerRadius = radius * 0.3;
        
        // Central circle
        this.drawCircle(x, y, innerRadius);
        
        // Six surrounding circles
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const cx = x + Math.cos(angle) * innerRadius;
            const cy = y + Math.sin(angle) * innerRadius;
            this.drawCircle(cx, cy, innerRadius);
        }
        
        // Outer ring if important
        if (importance > 35) {
            this.drawCircle(x, y, radius);
        }
    }
    
    // ========================================
    // Rendering
    // ========================================
    
    animate() {
        if (this.animating) {
            requestAnimationFrame(() => this.animate());
            this.time += 0.01 * this.options.animationSpeed;

            if (this.isHoveringInteractiveElement) {
                this.targetOpacity = this.options.hoverOpacity;
                this.setVideoOpacity(0.5);
            } else {
                this.targetOpacity = this.options.opacity;
                this.setVideoOpacity(1.0);
            }

            this.currentOpacity += (this.targetOpacity - this.currentOpacity) * 0.1;
        }
        
        this.render();
    }
    
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        
        // Group stars by session
        const sessionGroups = {};
        this.stars.forEach((star, index) => {
            if (!sessionGroups[star.session]) {
                sessionGroups[star.session] = [];
            }
            sessionGroups[star.session].push({ star, index, originalIndex: this.stars.indexOf(star) });
        });
        
        // Draw layers
        this.drawConnections(sessionGroups);
        this.drawSacredGeometry();
        this.drawStars();
        
        // Draw debug zones if enabled
        if (this.options.debugAvoidZones) {
            this.drawDebugZones();
        }

        // Draw labels
        if (this.options.showLabels && this.hoveredStar) {
            this.drawLabel(this.hoveredStar);
        }
    }
    
    setVideoOpacity(opacity) {
        if (!this.options.videoContainerId) return;
        const videoContainer = document.getElementById(this.options.videoContainerId);
        if (videoContainer) {
            const video = videoContainer.querySelector('video');
            if (video) {
                video.style.transition = 'opacity 0.3s ease-in-out';
                video.style.opacity = opacity;
            }
        }
    }

    drawDebugZones() {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;

        this.options.avoidZones.forEach(zone => {
            ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
            ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        });

        ctx.restore();
    }

    drawConnections(sessionGroups) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = this.currentOpacity * 0.25; // Normal: 0.1 opacity, Hover: 0.25 opacity
        ctx.strokeStyle = this.colors.connection;
        ctx.lineWidth = this.isMobile ? 0.7 : 1.5; // Increased visibility
        
        Object.values(sessionGroups).forEach(group => {
            group.forEach(({ star }) => {
                star.connections.forEach(targetLocalIndex => {
                    // Find the star in the original `this.stars` array by its local index in the pattern
                    const targetStarInfo = group.find(s => {
                        const originalStarIndexInSession = s.originalIndex - group[0].originalIndex;
                        return originalStarIndexInSession === targetLocalIndex;
                    });

                    if (targetStarInfo) {
                        const target = targetStarInfo.star;
                        // Draw only once by checking position
                        if (star.x < target.x) {
                            const dx = target.x - star.x;
                            const dy = target.y - star.y;
                            const cx = star.x + dx / 2;
                            const cy = star.y + dy / 2 - Math.abs(dx) * 0.1;
                            
                ctx.beginPath();
                            ctx.moveTo(star.x, star.y);
                            ctx.quadraticCurveTo(cx, cy, target.x, target.y);
                ctx.stroke();
            }
        }
            });
        });
        });
        
        ctx.restore();
    }
    
    drawStars() {
        const ctx = this.ctx;
        
        this.stars.forEach(star => {
            const pulse = 1 + Math.sin(this.time * 1.5 + star.phase) * 0.1;
            const size = star.size * pulse;
            
        ctx.save();
            ctx.globalAlpha = this.currentOpacity;
            
            // Outer glow
            const glowGradient = ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, size * 4
            );
            glowGradient.addColorStop(0, this.colors.star.glow);
            glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(star.x, star.y, size * 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Star core
            const coreGradient = ctx.createRadialGradient(
                star.x - size * 0.2, star.y - size * 0.2, 0,
                star.x, star.y, size
            );
            coreGradient.addColorStop(0, this.colors.star.core);
            coreGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.7)');
            coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = coreGradient;
                ctx.beginPath();
            ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner highlight
            ctx.fillStyle = this.colors.star.highlight;
            ctx.beginPath();
            ctx.arc(star.x, star.y, size * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            // Cross sparkle
            const sparkleLength = size * 1.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(star.x - sparkleLength, star.y);
            ctx.lineTo(star.x + sparkleLength, star.y);
            ctx.moveTo(star.x, star.y - sparkleLength);
            ctx.lineTo(star.x, star.y + sparkleLength);
                ctx.stroke();
            
        ctx.restore();
        });
    }

    drawLabel(star) {
        const ctx = this.ctx;
        const line1 = `${star.app} (${star.percentage.toFixed(1)}%)`;
        const line2 = `Session ${star.session}`;

        const lines = [line1, line2];
        const padding = 8;
        const fontSize = this.isMobile ? 10 : 12;
        const lineHeight = fontSize * 1.2;

        ctx.font = `${fontSize}px Quicksand, sans-serif`;

        let maxWidth = 0;
        lines.forEach(line => {
            const width = ctx.measureText(line).width;
            if (width > maxWidth) {
                maxWidth = width;
            }
        });

        const x = star.x;
        const y = star.y + star.size + 20;
        const boxWidth = maxWidth + padding * 2;
        const boxHeight = lines.length * lineHeight + padding * 2 - (lineHeight - fontSize);

        // Background
        ctx.fillStyle = this.colors.labelBg;
        ctx.fillRect(
            x - boxWidth / 2,
            y - padding,
            boxWidth,
            boxHeight
        );
        
        // Text
        ctx.fillStyle = this.colors.label;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        lines.forEach((line, index) => {
            ctx.fillText(line, x, y + index * lineHeight);
        });
    }
    
    // ========================================
    // Utilities
    // ========================================
    
    drawCircle(x, y, radius) {
        const ctx = this.ctx;
                ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
    
    drawPolygon(x, y, sides, radius, rotation = 0) {
        const ctx = this.ctx;
                ctx.beginPath();
        
        for (let i = 0; i <= sides; i++) {
            const angle = rotation + (i / sides) * Math.PI * 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        
                ctx.closePath();
                ctx.stroke();
            }
    
    // ========================================
    // Event Handlers
    // ========================================
    
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        
        this.hoveredStar = this.findNearestStar(this.mousePos);
        const overConnection = this.isOverConnection(this.mousePos);
        this.isHoveringInteractiveElement = !!this.hoveredStar || overConnection;
    }
    
    handleTouch(event) {
        if (event.touches.length > 0) {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos = {
                x: event.touches[0].clientX - rect.left,
                y: event.touches[0].clientY - rect.top
            };
            
            this.hoveredStar = this.findNearestStar(this.mousePos);
            event.preventDefault();
        }
    }
    
    findNearestStar(pos) {
        let nearest = null;
        let minDist = Infinity;
        const threshold = this.isMobile ? 30 : 20;
        
        this.stars.forEach(star => {
            const dist = Math.hypot(star.x - pos.x, star.y - pos.y);
            
            if (dist < threshold && dist < minDist) {
                minDist = dist;
                nearest = star;
            }
        });
        
        return nearest;
    }
    
    isOverConnection(pos) {
        const threshold = 10; // Hover threshold in pixels
        const sessionGroups = {};
        this.stars.forEach((star, index) => {
            if (!sessionGroups[star.session]) {
                sessionGroups[star.session] = [];
            }
            sessionGroups[star.session].push({ star, originalIndex: index });
        });

        for (const group of Object.values(sessionGroups)) {
            for (const { star } of group) {
                for (const targetLocalIndex of star.connections) {
                    const targetStarInfo = group.find(s => {
                        const originalStarIndexInSession = s.originalIndex - group[0].originalIndex;
                        return originalStarIndexInSession === targetLocalIndex;
                    });

                    if (targetStarInfo) {
                        const target = targetStarInfo.star;
                        if (star.x < target.x) { // Check each line only once
                            const dist = this.pointToLineSegmentDistance(pos, star, target);
                            if (dist < threshold) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    pointToLineSegmentDistance(p, v, w) {
        const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const closestX = v.x + t * (w.x - v.x);
        const closestY = v.y + t * (w.y - v.y);
        return Math.hypot(p.x - closestX, p.y - closestY);
    }

    // ========================================
    // Public API
    // ========================================
    
    toggleAnimation() {
        this.animating = !this.animating;
        if (this.animating) {
            this.animate();
        }
    }
    
    toggleLabels() {
        this.options.showLabels = !this.options.showLabels;
    }
    
    cycleGeometry() {
        this.geometryType = (this.geometryType + 1) % this.geometryPatterns.length;
    }
    
    randomizeData() {
        const randomSessions = [];
        const sessionCount = Math.floor(Math.random() * 3) + 2;
        
        const appNames = [
            'VS Code', 'Chrome', 'Slack', 'Figma', 'Terminal', 
            'Notion', 'GitHub', 'Docker', 'Spotify', 'Discord',
            'Photoshop', 'IntelliJ', 'Postman', 'MongoDB'
        ];
        
        for (let i = 0; i < sessionCount; i++) {
            const appCount = Math.floor(Math.random() * 3) + 2;
            const apps = [];
            let remaining = 100;
            const usedApps = new Set();
            
            for (let j = 0; j < appCount; j++) {
                let appName;
                do {
                    appName = appNames[Math.floor(Math.random() * appNames.length)];
                } while (usedApps.has(appName));
                usedApps.add(appName);
                
                const percentage = j === appCount - 1 ? 
                    remaining : 
                    Math.random() * remaining * 0.7;
                
                apps.push({
                    app: appName,
                    percentage: Math.max(10, percentage)
                });
                
                remaining -= percentage;
            }
            
            randomSessions.push({
                session_index: i + 1,
                total_duration_seconds: Math.floor(Math.random() * 10000) + 5000,
                apps: apps
            });
        }
        
        this.processSessions(randomSessions);
    }
    
    destroy() {
        this.animating = false;
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

export default function initConstellation(container, options = {}) {
    if (!container) return () => {};

    const constellation = new SessionConstellation(container, options);

    // Return a cleanup function
    return () => {
        if (constellation) {
            constellation.destroy();
        }
    };
}
