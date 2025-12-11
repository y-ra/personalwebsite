// Wait for DOM to be ready before initializing everything
(function() {
    'use strict';
    
    // Pixel Art Portal Game
    let canvas = null;
    let ctx = null;
    
    // Pixel scale
    const pixelSize = 4;
    
    // Game state
    const state = {
        images: [],
        imageSprites: {},
        sidewalkSprite: null,
        vinesSprite: null,
        swordSprite: null,
        treasureChestSprite: null,
        glitchSprites: [],
        glitchSounds: [],
        thunderAudio: null,
        treasureChestHovered: false,
        hoveredIconIndex: -1, // Track which icon is hovered (deprecated, kept for compatibility)
        hoveredIconIndexBySword: -1, // Track which icon sword is hovering over
        hoveredIconIndexByMouse: -1, // Track which icon mouse is hovering over
        mouseX: 0,
        mouseY: 0,
        player: { 
            x: 0, 
            y: 0, 
            color: '#FF5555',
            velocityX: 0,
            width: 8 * pixelSize,
            height: 8 * pixelSize
        },
        floorLevel: 750, // Default, will be updated
        currentScene: 'main', // 'main' or 'edge'
        sceneTransitionCooldown: 0, // Cooldown to prevent rapid scene switching
        glitchEffect: {
            active: false,
            intensity: 0,
            flashes: [],
            duration: 0,
            currentSound: null,
            cooldown: 0, // Cooldown period to prevent rapid reactivation
            justReturned: false // Flag to prevent glitch when returning to portal
        },
        storm: {
            clouds: [],
            rain: [],
            lightning: {
                active: false,
                timer: 0,
                duration: 0
            }
        },
        sections: [
            { 
                name: 'About', 
                glowColor: '#0d1b4d', // Very dark navy blue
                id: 'about',
                imageFile: 'about.png',
                preview: 'Learn about me, my background, and motivations.'
            },
            { 
                name: 'Resume', 
                glowColor: '#0d3a6b', // Very dark blue
                id: 'resume',
                imageFile: 'resume.png',
                preview: 'View or download my resume.'
            },
            { 
                name: 'Portfolio', 
                glowColor: '#0a1f4d', // Very dark blue
                id: 'portfolio',
                imageFile: 'portfolio.png',
                preview: 'Game projects, music work, software engineering, and more.'
            },
            { 
                name: 'Contact', 
                glowColor: '#1a2f6b', // Very dark indigo
                id: 'contact',
                imageFile: 'contact.png',
                preview: 'Get in touch!'
            }
        ],
        currentSection: -1,
        showPreview: false,
        moveSpeed: 5,
        savedPlayerPosition: null
    };
    
    // Get canvas elements
    function getCanvasElements() {
        if (!canvas) {
            canvas = document.getElementById('gameCanvas');
            if (canvas) {
                ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('Could not get 2d context from canvas');
                }
            }
        }
        return canvas && ctx;
    }
    
    // Set canvas size
    function resizeCanvas() {
        if (!getCanvasElements()) return;
        
        // Update mobile detection on resize
        state.isMobile = isMobileDevice();
        
        // Show/hide mobile message based on device type
        const mobileMessage = document.getElementById('mobile-message');
        const instructionsEl = document.querySelector('.instructions');
        if (state.isMobile) {
            if (mobileMessage) {
                mobileMessage.style.display = 'flex';
            }
            if (instructionsEl) {
                instructionsEl.style.display = 'none';
            }
        } else {
            if (mobileMessage) {
                mobileMessage.style.display = 'none';
            }
            if (instructionsEl) {
                instructionsEl.style.display = 'block';
            }
        }
        
        const headerHeight = 70;
        canvas.width = window.innerWidth;
        // Canvas extends all the way to bottom of viewport (footer overlays it)
        canvas.height = window.innerHeight - headerHeight;
        
        // Calculate actual footer height dynamically
        const footerElement = document.querySelector('.site-footer');
        const actualFooterHeight = footerElement ? footerElement.offsetHeight : 50;
        
        // Sidewalk starts 120px above footer and extends to footer top
        state.floorLevel = canvas.height - actualFooterHeight - 120;
        
        // Reinitialize images if they exist (only on desktop)
        if (!state.isMobile && state.images && state.images.length > 0) {
            initImages();
        }
    }
    
    // Load image sprites
    function loadImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const total = state.sections.length + 4; // +1 for vines, +1 for sword, +1 for sidewalk, +1 for treasure chest
            
            // Load sidewalk
            const sidewalkImg = new Image();
            sidewalkImg.onload = () => {
                state.sidewalkSprite = sidewalkImg;
                loaded++;
                if (loaded === total) {
                    resolve();
                }
            };
            sidewalkImg.onerror = () => {
                console.warn('Failed to load sidewalk.png');
                loaded++;
                if (loaded === total) {
                    resolve();
                }
            };
            sidewalkImg.src = 'assets/sidewalk.png';
            
            // Load vines
            const vinesImg = new Image();
            vinesImg.onload = () => {
                state.vinesSprite = vinesImg;
                loaded++;
                if (loaded === total) {
                    resolve();
                }
            };
            vinesImg.onerror = () => {
                console.warn('Failed to load vines.png');
                loaded++;
                if (loaded === total) {
                    resolve();
                }
            };
            vinesImg.src = 'assets/vines.png';
            
            // Load sword
            const swordImg = new Image();
            swordImg.onload = () => {
                state.swordSprite = swordImg;
                loaded++;
                if (loaded === total) {
                    resolve();
                }
            };
            swordImg.onerror = () => {
                console.warn('Failed to load sword.gif');
                loaded++;
                if (loaded === total) {
                    resolve();
                }
            };
            swordImg.src = 'assets/sword.gif';
            
            // Load treasure chest
            const treasureChestImg = new Image();
            treasureChestImg.onload = () => {
                state.treasureChestSprite = treasureChestImg;
                loaded++;
                if (loaded === total) {
                    resolve();
                }
            };
            treasureChestImg.onerror = () => {
                console.warn('Failed to load treasure-chest.png');
                loaded++;
                if (loaded === total) {
                    resolve();
                }
            };
            treasureChestImg.src = 'assets/treasure-chest.png';
            
            // Load section images
            state.sections.forEach((section, index) => {
                const img = new Image();
                img.onload = () => {
                    state.imageSprites[section.id] = img;
                    loaded++;
                    if (loaded === total) {
                        resolve();
                    }
                };
                img.onerror = () => {
                    console.warn(`Failed to load image: ${section.imageFile}`);
                    // Create a placeholder colored rectangle
                    const placeholder = document.createElement('canvas');
                    placeholder.width = 100;
                    placeholder.height = 100;
                    const pCtx = placeholder.getContext('2d');
                    pCtx.fillStyle = section.glowColor;
                    pCtx.fillRect(0, 0, 100, 100);
                    state.imageSprites[section.id] = placeholder;
                    loaded++;
                    if (loaded === total) {
                        resolve();
                    }
                };
                img.src = `assets/${section.imageFile}`;
            });
        });
    }
    
    // Load glitch sprites
    function loadGlitchSprites() {
        return new Promise((resolve) => {
            let loaded = 0;
            const total = 8;
            
            for (let i = 1; i <= 8; i++) {
                const img = new Image();
                img.onload = () => {
                    state.glitchSprites.push(img);
                    loaded++;
                    if (loaded === total) {
                        resolve();
                    }
                };
                img.onerror = () => {
                    console.warn(`Failed to load glitch-${i}.png`);
                    loaded++;
                    if (loaded === total) {
                        resolve();
                    }
                };
                img.src = `assets/glitch-${i}.png`;
            }
        });
    }
    
    // Load audio files
    function loadAudio() {
        return new Promise((resolve) => {
            // Load thunder audio
            state.thunderAudio = new Audio('assets/thunder.mp3');
            state.thunderAudio.loop = true;
            // THUNDER VOLUME
            state.thunderAudio.volume = 0.75;
            state.thunderAudio.preload = 'auto';
            
            // Load glitch sounds - create multiple copies of each for better randomness
            let loaded = 0;
            
            for (let i = 1; i <= 8; i++) {
                // Create 3 copies of each sound for better randomness
                for (let copy = 0; copy < 3; copy++) {
                    const audio = new Audio(`assets/glitch-${i}.mp3`);
                    audio.preload = 'auto';
                    state.glitchSounds.push(audio);
                }
                loaded++;
            }
            
            // Set up thunder audio event handlers
            state.thunderAudio.oncanplaythrough = () => {
                // Thunder loaded - try to play immediately
                playThunderAudio();
            };
            state.thunderAudio.onerror = () => {
                console.warn('Failed to load thunder.mp3');
            };
            
            // Try to play immediately when loaded
            state.thunderAudio.onloadeddata = () => {
                playThunderAudio();
            };
            
            // Also try to play after a short delay to work around browser restrictions
            setTimeout(() => {
                playThunderAudio();
            }, 500);
            
            // Set up user interaction handlers as fallback (but try to play immediately first)
            const playThunderOnInteraction = () => {
                playThunderAudio();
            };
            
            // Add multiple event listeners for better compatibility (as fallback)
            document.addEventListener('click', playThunderOnInteraction, { once: true });
            document.addEventListener('keydown', playThunderOnInteraction, { once: true });
            document.addEventListener('touchstart', playThunderOnInteraction, { once: true });
            document.addEventListener('mousedown', playThunderOnInteraction, { once: true });
            
            // Resolve after a short delay to allow audio to load
            setTimeout(() => {
                resolve();
            }, 100);
        });
    }
    
    // Helper function to play thunder audio
    function playThunderAudio() {
        if (state.thunderAudio) {
            // Try to play regardless of readyState - browser will handle buffering
            const playPromise = state.thunderAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    // If autoplay is blocked, try again after a short delay
                    if (e.name === 'NotAllowedError' || e.name === 'NotSupportedError') {
                        setTimeout(() => {
                            playThunderAudio();
                        }, 1000);
                    } else {
                        console.warn('Could not play thunder audio:', e);
                    }
                });
            }
        }
    }
    
    // Track active media elements that should pause thunder
    let activeMediaElements = new Set();
    
    // Helper function to pause thunder audio
    function pauseThunderAudio() {
        if (state.thunderAudio && !state.thunderAudio.paused) {
            state.thunderAudio.pause();
        }
    }
    
    // Make pauseThunderAudio available globally
    window.pauseThunderAudio = pauseThunderAudio;
    
    // Helper function to resume thunder audio
    function resumeThunderAudio() {
        // Only resume if no media is currently playing
        if (activeMediaElements.size === 0 && state.thunderAudio && state.thunderAudio.paused) {
            playThunderAudio();
        }
    }
    
    // Make resumeThunderAudio available globally
    window.resumeThunderAudio = resumeThunderAudio;
    
    // Helper function to set up media element listeners for thunder pause/resume
    function setupMediaThunderControl(mediaElement) {
        if (!mediaElement || mediaElement.hasAttribute('data-thunder-listeners')) {
            return; // Already set up
        }
        
        mediaElement.setAttribute('data-thunder-listeners', 'true');
        
        const onPlay = function() {
            activeMediaElements.add(mediaElement);
            pauseThunderAudio();
        };
        
        const onPause = function() {
            activeMediaElements.delete(mediaElement);
            resumeThunderAudio();
        };
        
        const onEnded = function() {
            activeMediaElements.delete(mediaElement);
            resumeThunderAudio();
        };
        
        mediaElement.addEventListener('play', onPlay);
        mediaElement.addEventListener('pause', onPause);
        mediaElement.addEventListener('ended', onEnded);
        
        // If already playing, add it to the set
        if (!mediaElement.paused) {
            activeMediaElements.add(mediaElement);
            pauseThunderAudio();
        }
    }
    
    // Make setupMediaThunderControl available globally
    window.setupMediaThunderControl = setupMediaThunderControl;
    
    // Initialize images on the sidewalk
    function initImages() {
        if (!canvas || !ctx) {
            console.error('Canvas or context not available');
            return;
        }
        
        // Ensure floor level is set - calculate based on actual footer height
        if (!state.floorLevel || state.floorLevel <= 0) {
            const footerElement = document.querySelector('.site-footer');
            const actualFooterHeight = footerElement ? footerElement.offsetHeight : 50;
            state.floorLevel = canvas.height - actualFooterHeight - 120;
        }
        
        state.images = [];
        
        // Mobile layout: vertical arrangement with smaller icons
        // COMMENTED OUT - Mobile devices now show a message instead
        /*
        if (state.isMobile) {
            const imageSize = 50; // Smaller icons for mobile
            const centerX = canvas.width / 2;
            const startY = state.floorLevel - 300; // Start higher up
            const verticalSpacing = 80; // Space between icons vertically
            
            for (let i = 0; i < state.sections.length; i++) {
                const x = centerX - imageSize / 2; // Center horizontally
                const y = startY + (i * verticalSpacing); // Stack vertically
                
                state.images.push({
                    x: x,
                    y: y,
                    width: imageSize,
                    height: imageSize,
                    glowColor: state.sections[i].glowColor,
                    section: i,
                    active: false,
                    glitchActive: false,
                    hovered: false,
                    currentOffsetY: 0,
                    targetOffsetY: 0
                });
            }
        } else {
        */
        if (!state.isMobile) {
            // Desktop layout: horizontal arrangement
            const imageSize = 80;
            const gapSize = 200;
            const centerX = canvas.width / 2;
            const iconSpacing = 120;
            
            // Position icons by their centers to ensure symmetry
            const leftIcon2CenterX = centerX - gapSize / 2 - iconSpacing;
            const leftIcon2X = leftIcon2CenterX - imageSize / 2;
            
            const leftIcon1CenterX = leftIcon2CenterX - iconSpacing;
            const leftIcon1X = leftIcon1CenterX - imageSize * 2;
            
            const rightIcon3CenterX = centerX + gapSize / 2 + iconSpacing;
            const rightIcon3X = rightIcon3CenterX - imageSize / 2;
            
            const rightIcon4CenterX = rightIcon3CenterX + iconSpacing;
            const rightIcon4X = rightIcon4CenterX + imageSize;
            
            for (let i = 0; i < state.sections.length; i++) {
                let x;
                const y = state.floorLevel - imageSize + 20;
                
                if (i === 0) {
                    x = leftIcon1X;
                } else if (i === 1) {
                    x = leftIcon2X;
                } else if (i === 2) {
                    x = rightIcon3X;
                } else {
                    x = rightIcon4X;
                }
                
                state.images.push({
                    x: x,
                    y: y,
                    width: imageSize,
                    height: imageSize,
                    glowColor: state.sections[i].glowColor,
                    section: i,
                    active: false,
                    glitchActive: false,
                    hovered: false,
                    currentOffsetY: 0,
                    targetOffsetY: 0
                });
            }
        }
        
        // Set player initial position - spawn in the middle of the sidewalk
        if (canvas) {
            state.player.x = canvas.width / 2; // Spawn in the middle of the sidewalk
            state.player.y = state.floorLevel - state.player.height + 20; // Positioned on thicker sidewalk
        }
    }
    
    // Draw player using sword sprite
    function drawPlayer(x, y) {
        if (!ctx) return;
        
        if (state.swordSprite) {
            const swordSize = 48; // Larger sword
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                state.swordSprite,
                x - swordSize / 2,
                y - swordSize / 2,
                swordSize,
                swordSize
            );
            ctx.restore();
        } else {
            // Fallback if sprite not loaded
            ctx.fillStyle = state.player.color;
            ctx.fillRect(x - 4 * pixelSize, y - 4 * pixelSize, 8 * pixelSize, 8 * pixelSize);
        }
    }
    
    // Draw images on sidewalk
    // onlyHovered: if true, only draw hovered icons; if false, only draw non-hovered icons; if undefined, draw all
    function drawImages(onlyHovered) {
        if (!ctx) return;
        
        state.images.forEach((image, index) => {
            const sprite = state.imageSprites[state.sections[image.section].id];
            if (!sprite) return;
            
            const section = state.sections[image.section];
            // Icon is hovered if either sword OR mouse is over it
            const isHovered = state.hoveredIconIndexBySword === index || state.hoveredIconIndexByMouse === index;
            
            // Filter based on onlyHovered parameter
            if (onlyHovered === true && !isHovered) return; // Only draw hovered
            if (onlyHovered === false && isHovered) return; // Only draw non-hovered
            
            // Smooth transition for hover offset (similar to CSS transition: transform 0.3s ease)
            image.targetOffsetY = isHovered ? -5 : 0;
            
            // Smooth interpolation towards target (easing function similar to CSS ease)
            // Using 0.2 for ~0.3s transition at 60fps (matches footer email transition)
            const transitionSpeed = 0.2;
            const diff = image.targetOffsetY - image.currentOffsetY;
            image.currentOffsetY += diff * transitionSpeed;
            
            // Stop animation when very close to target to avoid infinite tiny movements
            if (Math.abs(diff) < 0.01) {
                image.currentOffsetY = image.targetOffsetY;
            }
            
            const drawX = image.x;
            const drawY = image.y + image.currentOffsetY;
            
            // Draw glitch effect if active
            if (image.glitchActive) {
                drawGlitchEffect(image);
            }
            
            // Draw hover glow effect
            const electricBlue = '#7DF5FF';
            if (isHovered) {
                ctx.save();
                ctx.shadowBlur = 20;
                ctx.shadowColor = electricBlue;
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = 'transparent';
                ctx.fillRect(drawX - 5, drawY - 5, image.width + 10, image.height + 10);
                ctx.restore();
            }
            
            // Draw the image
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            if (isHovered) {
                ctx.filter = 'brightness(1.3)';
            }
            ctx.drawImage(sprite, drawX, drawY, image.width, image.height);
            ctx.restore();
            
            // Draw label above icon
            ctx.save();
            ctx.font = 'bold 16px "Sora", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            
            if (isHovered) {
                ctx.fillStyle = electricBlue;
                ctx.shadowBlur = 10;
                ctx.shadowColor = electricBlue;
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            }
            
            const labelX = image.x + image.width / 2;
            const labelY = drawY - 10;
            ctx.fillText(section.name, labelX, labelY);
            ctx.restore();
        });
    }
    
    // Draw treasure chest in edge scene
    function drawTreasureChest() {
        if (!ctx || !canvas || !state.treasureChestSprite) return;
        
        // TREASURE CHEST SIZE
        const imageSize = 120; // Larger than other icons
        const chestX = canvas.width / 2 - imageSize / 2; // Centered horizontally
        const chestY = state.floorLevel - (imageSize - 40); // Same Y position as icons
        
        const electricBlue = '#7DF5FF';
        const isHovered = state.treasureChestHovered;
        
        // Draw hover glow effect
        if (isHovered) {
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = electricBlue;
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = 'transparent';
            ctx.fillRect(chestX - 5, chestY - 5, imageSize + 10, imageSize + 10);
            ctx.restore();
        }
        
        // Draw the treasure chest
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        if (isHovered) {
            ctx.filter = 'brightness(1.3)';
        }
        ctx.drawImage(state.treasureChestSprite, chestX, chestY, imageSize, imageSize);
        ctx.restore();
        
        // Draw label above treasure chest
        if (isHovered) {
            ctx.save();
            ctx.font = 'bold 16px "Sora", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillStyle = electricBlue;
            ctx.shadowBlur = 10;
            ctx.shadowColor = electricBlue;
            
            const labelX = chestX + imageSize / 2;
            const labelY = chestY - 10;
            ctx.fillText('Press enter to open', labelX, labelY);
            ctx.restore();
        }
    }
    
    // Draw glitch effect using glitch PNGs
    function drawGlitchEffect(image) {
        if (!ctx || state.glitchSprites.length === 0) return;
        
        // Don't draw glitch if effect duration has expired
        if (state.glitchEffect.duration <= 0) {
            return;
        }
        
        const flashes = state.glitchEffect.flashes;
        const imageCenterX = image.x + image.width / 2;
        const imageCenterY = image.y + image.height / 2;
        
        // Create new flashes rapidly (scaled to icon size)
        if (state.glitchEffect.duration > 0 && Math.random() > 0.3) {
            const numFlashes = Math.floor(Math.random() * 2) + 1; // 1-2 flashes at a time (reduced from 1-3)
            const iconScale = image.width / 120; // Scale factor based on icon size (was 120, now 80)
            for (let i = 0; i < numFlashes; i++) {
                const spriteIndex = Math.floor(Math.random() * state.glitchSprites.length);
                flashes.push({
                    sprite: state.glitchSprites[spriteIndex],
                    x: imageCenterX + (Math.random() - 0.5) * image.width * 1.2,
                    y: imageCenterY + (Math.random() - 0.5) * image.height * 1.2,
                    rotation: (Math.random() - 0.5) * Math.PI * 2, // Random rotation
                    scale: (0.08 + Math.random() * 0.15) * iconScale, // Smaller scale (reduced from 0.15-0.5 to 0.08-0.23)
                    alpha: 0.8 + Math.random() * 0.2,
                    age: 0,
                    maxAge: 2 + Math.random() * 2 // Shorter flash duration (reduced from 2-5 to 2-4)
                });
            }
        }
        
        // Draw flashes
        flashes.forEach(flash => {
            flash.age++;
            if (flash.age < flash.maxAge) {
                ctx.save();
                ctx.translate(flash.x, flash.y);
                ctx.rotate(flash.rotation);
                ctx.scale(flash.scale, flash.scale);
                ctx.globalAlpha = flash.alpha * (1 - flash.age / flash.maxAge);
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(
                    flash.sprite,
                    -flash.sprite.width / 2,
                    -flash.sprite.height / 2
                );
                ctx.restore();
            }
        });
        
        // Remove old flashes
        state.glitchEffect.flashes = flashes.filter(f => f.age < f.maxAge);
    }
    
    // Play random glitch sound
    function playGlitchSound() {
        if (state.glitchSounds.length > 0) {
            // Stop any currently playing glitch sound
            if (state.glitchEffect.currentSound) {
                try {
                    state.glitchEffect.currentSound.pause();
                    state.glitchEffect.currentSound.currentTime = 0;
                } catch (e) {
                    // Ignore errors when stopping sound
                }
            }
            
            // Use crypto.getRandomValues for better randomness, fallback to Math.random
            let randomIndex;
            if (window.crypto && window.crypto.getRandomValues) {
                const array = new Uint32Array(1);
                window.crypto.getRandomValues(array);
                randomIndex = array[0] % state.glitchSounds.length;
            } else {
                randomIndex = Math.floor(Math.random() * state.glitchSounds.length);
            }
            
            const sound = state.glitchSounds[randomIndex];
            const GLITCH_VOLUME = 0.25; // GLITCH VOLUME
            
            // Clone and play to allow multiple simultaneous plays
            try {
                const soundClone = sound.cloneNode();
                soundClone.volume = GLITCH_VOLUME;
                soundClone.play().catch(e => console.warn('Could not play glitch sound:', e));
                state.glitchEffect.currentSound = soundClone;
            } catch (e) {
                // Fallback: try playing original
                sound.currentTime = 0;
                sound.volume = GLITCH_VOLUME;
                sound.play().catch(err => console.warn('Could not play glitch sound:', err));
                state.glitchEffect.currentSound = sound;
            }
        }
    }
    
    // Draw sidewalk using sidewalk.png image
    function drawSidewalk() {
        if (!ctx || !canvas) return;
        
        // Get actual footer height dynamically
        const footerElement = document.querySelector('.site-footer');
        const actualFooterHeight = footerElement ? footerElement.offsetHeight : 50;
        
        // Calculate where footer starts (in canvas coordinates)
        // Canvas top is at headerHeight (70px), so footer starts at window.innerHeight - actualFooterHeight
        // In canvas coordinates, that's (window.innerHeight - headerHeight) - actualFooterHeight = canvas.height - actualFooterHeight
        const sidewalkBottom = canvas.height - actualFooterHeight;
        const sidewalkHeight = sidewalkBottom - state.floorLevel;
        
        // Draw sidewalk image stretched across the full width
        if (state.sidewalkSprite && state.sidewalkSprite.width > 0 && state.sidewalkSprite.height > 0) {
            const sidewalkImgWidth = state.sidewalkSprite.width;
            const sidewalkImgHeight = state.sidewalkSprite.height;
            
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            
            // Stretch sidewalk image across the full width, extending exactly to where footer starts
            ctx.drawImage(
                state.sidewalkSprite,
                0, 0, sidewalkImgWidth, sidewalkImgHeight, // Source
                0, state.floorLevel, canvas.width, sidewalkHeight  // Destination (stretched to full width, touching footer)
            );
            
            ctx.restore();
        } else if (state.sidewalkSprite) {
            // If sprite exists but dimensions are 0, it might not be loaded yet
            console.warn('Sidewalk sprite loaded but dimensions are 0');
        } else {
            // Fallback if sidewalk image not loaded
            ctx.fillStyle = '#b0b0b0';
            ctx.fillRect(0, state.floorLevel, canvas.width, sidewalkHeight);
        }
    }
    
    // Draw section name - DISABLED
    function drawSectionName() {
        // Section name heading removed
        return;
    }
    
    // Update section preview
    function updateSectionPreview() {
        const previewElement = document.getElementById('section-preview');
        if (!previewElement) return;
        
        if (state.showPreview && state.currentSection >= 0) {
            const section = state.sections[state.currentSection];
            previewElement.innerHTML = `
                <h3>${section.name}</h3>
                <p>${section.preview}</p>
                <button class="explore-btn" data-section-id="${section.id}">Explore</button>
            `;
            
            // Add click handler to explore button
            const exploreBtn = previewElement.querySelector('.explore-btn');
            if (exploreBtn) {
                exploreBtn.addEventListener('click', function() {
                    window.navigateToSection(section.id);
                });
            }
            previewElement.style.display = 'flex';
        } else {
            previewElement.style.display = 'none';
        }
    }
    
    // Check collision with images
    function checkImageCollision() {
        const playerCenterX = state.player.x;
        const playerCenterY = state.player.y + state.player.height / 2;
        let onAnyImage = false;
        let hoveredIndexBySword = -1;
        
        state.images.forEach((image, index) => {
            const imageCenterX = image.x + image.width / 2;
            const imageCenterY = image.y + image.height / 2;
            const distanceX = Math.abs(playerCenterX - imageCenterX);
            const distanceY = Math.abs(playerCenterY - imageCenterY);
            
            // Check if player is over image (using same collision detection as mouse hover)
            const isSwordOverIcon = distanceX < image.width / 2 + 10 && distanceY < image.height / 2 + 10;
            
            if (isSwordOverIcon) {
                hoveredIndexBySword = index;
            }
            
            // Check if player is over image (using same collision detection as hover/enter - 10px buffer)
            if (distanceX < image.width / 2 + 10 &&
                distanceY < image.height / 2 + 10) {
                
                onAnyImage = true;
                
                // Activate image and trigger glitch
                if (!image.active) {
                    // Deactivate all other images
                    state.images.forEach(img => {
                        if (img !== image) {
                            img.active = false;
                            img.glitchActive = false;
                        }
                    });
                    image.active = true;
                    state.currentSection = image.section;
                    state.showPreview = true;
                    
                    // Only trigger glitch if cooldown has expired and we didn't just return to portal
                    if (state.glitchEffect.cooldown <= 0 && !state.glitchEffect.justReturned) {
                        image.glitchActive = true;
                        state.glitchEffect.active = true;
                        state.glitchEffect.intensity = 1;
                        state.glitchEffect.flashes = [];
                        // Random glitch duration between 12-15 frames (0.2-0.25 seconds at 60fps)
                        // CHANGE GLITCH DURATION HERE:
                        state.glitchEffect.duration = 12 + Math.floor(Math.random() * 4);
                        // Set cooldown to prevent rapid reactivation (duration + 30 frames buffer)
                        state.glitchEffect.cooldown = state.glitchEffect.duration + 30;
                        playGlitchSound();
                    }
                    updateSectionPreview();
                }
            } else {
                // Deactivate when player leaves
                if (image.active) {
                    image.active = false;
                    image.glitchActive = false;
                }
            }
        });
        
        // Set hoveredIconIndexBySword based on sword position
        // This allows sword and mouse to hover different icons simultaneously
        state.hoveredIconIndexBySword = hoveredIndexBySword;
        
        // Check mouse position for hover effect (independent of sword)
        let hoveredIndexByMouse = -1;
        state.images.forEach((image, index) => {
            const iconCenterX = image.x + image.width / 2;
            const iconCenterY = image.y + image.height / 2;
            const distanceX = Math.abs(state.mouseX - iconCenterX);
            const distanceY = Math.abs(state.mouseY - iconCenterY);
            
            if (distanceX < image.width / 2 + 10 && distanceY < image.height / 2 + 10) {
                hoveredIndexByMouse = index;
            }
        });
        
        state.hoveredIconIndexByMouse = hoveredIndexByMouse;
        
        // Deactivate all images when not on any
        if (!onAnyImage) {
            state.images.forEach(img => {
                img.active = false;
                img.glitchActive = false;
            });
            state.currentSection = -1;
            state.showPreview = false;
            state.glitchEffect.active = false;
            state.glitchEffect.intensity = 0;
            state.glitchEffect.flashes = [];
            state.glitchEffect.duration = 0;
            state.glitchEffect.cooldown = 0; // Reset cooldown when leaving all images
            // Stop any playing glitch sound
            if (state.glitchEffect.currentSound) {
                try {
                    state.glitchEffect.currentSound.pause();
                    state.glitchEffect.currentTime = 0;
                    state.glitchEffect.currentSound = null;
                } catch (e) {
                    // Ignore errors when stopping sound
                }
            }
            updateSectionPreview();
        }
        
        // Update glitch effect
        if (state.glitchEffect.active) {
            state.glitchEffect.duration--;
            if (state.glitchEffect.duration <= 0) {
                state.glitchEffect.active = false;
                state.glitchEffect.flashes = [];
                // Deactivate glitch for all images when effect expires
                state.images.forEach(img => {
                    if (img.glitchActive) {
                        img.glitchActive = false;
                    }
                });
                // Stop the glitch sound when effect ends
                if (state.glitchEffect.currentSound) {
                    try {
                        state.glitchEffect.currentSound.pause();
                        state.glitchEffect.currentSound.currentTime = 0;
                        state.glitchEffect.currentSound = null;
                    } catch (e) {
                        // Ignore errors when stopping sound
                    }
                }
            }
        }
        
        // Update cooldown timer
        if (state.glitchEffect.cooldown > 0) {
            state.glitchEffect.cooldown--;
        }
    }
    
    // Update glitch flashes (handled in drawGlitchEffect)
    
    // Initialize storm effects
    function initStorm() {
        if (!canvas) return;
        
        // Create clouds
        for (let i = 0; i < 8; i++) {
            state.storm.clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * 200 + 50,
                width: 150 + Math.random() * 100,
                height: 60 + Math.random() * 40,
                speed: 0.3 + Math.random() * 0.5,
                opacity: 0.6 + Math.random() * 0.3
            });
        }
        
        // Create rain particles
        for (let i = 0; i < 100; i++) {
            state.storm.rain.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                speed: 3 + Math.random() * 4,
                length: 5 + Math.random() * 10
            });
        }
        
        // Initialize lightning timer (30-60 seconds at 60fps = 1800-3600 frames)
        // Start with a shorter timer for first flash, then use longer intervals
        state.storm.lightning.timer = 300 + Math.random() * 300; // 5-10 seconds for first flash
    }
    
    // Draw stormy background
    function drawStorm() {
        if (!ctx) return;
        
        // Dark stormy sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f1419');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw clouds
        ctx.fillStyle = '#2a2a3a';
        state.storm.clouds.forEach(cloud => {
            ctx.globalAlpha = cloud.opacity;
            // Draw cloud as multiple circles
            for (let i = 0; i < 5; i++) {
                const offsetX = (i - 2) * 30;
                const offsetY = Math.sin(i) * 10;
                ctx.beginPath();
                ctx.arc(cloud.x + offsetX, cloud.y + offsetY, cloud.height / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            cloud.x += cloud.speed;
            if (cloud.x > canvas.width + 100) {
                cloud.x = -100;
            }
        });
        ctx.globalAlpha = 1;
        
        // Draw lightning
        if (state.storm.lightning.active) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.8;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;
            state.storm.lightning.duration--;
            if (state.storm.lightning.duration <= 0) {
                state.storm.lightning.active = false;
            }
        } else {
            // Initialize timer if not set
            if (state.storm.lightning.timer === undefined || state.storm.lightning.timer === null) {
                state.storm.lightning.timer = 300 + Math.random() * 300; // 5-10 seconds for first flash
            }
            
            // Decrement timer
            state.storm.lightning.timer--;
            
            // Trigger lightning when timer reaches 0
            if (state.storm.lightning.timer <= 0) {
                state.storm.lightning.active = true;
                state.storm.lightning.duration = 2 + Math.random() * 3;
                // Set next lightning to happen in 20-35 seconds (1200-2100 frames at 60fps)
                state.storm.lightning.timer = 1200 + Math.random() * 900;
            }
        }
        
        // Draw rain
        ctx.strokeStyle = '#6b9bd1';
        ctx.lineWidth = 1;
        state.storm.rain.forEach(drop => {
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x, drop.y + drop.length);
            ctx.stroke();
            
            drop.y += drop.speed;
            if (drop.y > canvas.height) {
                drop.y = -10;
                drop.x = Math.random() * canvas.width;
            }
        });
        ctx.globalAlpha = 1;
    }
    
    // Main draw function
    function draw() {
        if (!canvas || !ctx) return;
        
        // Draw stormy background
        drawStorm();
        
        // Always draw sidewalk
        drawSidewalk();
        
        // Only draw images and section name in main scene
        if (state.currentScene === 'main' && state.images.length > 0) {
            // Draw ALL icons first (including hovered ones) - this ensures sword appears above them
            drawImages(); // Draw all icons with all their effects
            // Draw sword AFTER all icons so it appears on top
            ctx.save();
            ctx.globalAlpha = 1.0; // Ensure full opacity
            drawPlayer(state.player.x, state.player.y);
            ctx.restore();
            drawSectionName();
        } else if (state.currentScene === 'edge') {
            // In edge scene, draw treasure chest first, then sword on top
            drawTreasureChest();
            // Draw sword AFTER treasure chest so it appears on top
            ctx.save();
            ctx.globalAlpha = 1.0; // Ensure full opacity
            drawPlayer(state.player.x, state.player.y);
            ctx.restore();
        }
    }
    
    // Update physics
    function updatePhysics() {
        // Update player position (no jumping, just horizontal movement)
        // On mobile, player stays centered (no movement needed with vertical layout)
        // COMMENTED OUT - Mobile devices now show a message instead
        // if (!state.isMobile) {
        if (!state.isMobile) {
            state.player.x += state.player.velocityX;
        }
        
        // Keep player on sidewalk level
        state.player.y = state.floorLevel - state.player.height + 20; // Positioned on thicker sidewalk
        
        // Update transition cooldown
        if (state.sceneTransitionCooldown > 0) {
            state.sceneTransitionCooldown--;
        }
        
        // Scene transitions only work on desktop (mobile doesn't use edge scenes)
        // COMMENTED OUT - Mobile devices now show a message instead
        // if (!state.isMobile && state.sceneTransitionCooldown === 0) {
        if (!state.isMobile && state.sceneTransitionCooldown === 0) {
            // Simple edge detection
            const edgeThreshold = 10; // pixels from edge to trigger transition
            const atLeftEdge = state.player.x <= state.player.width / 2 + edgeThreshold;
            const atRightEdge = state.player.x >= canvas.width - state.player.width / 2 - edgeThreshold;
            
            // Transition from main to edge scene
            if (state.currentScene === 'main') {
                if (atLeftEdge && keys['a']) {
                    // Moving left at left edge → go to edge scene, appear at right edge
                    state.currentScene = 'edge';
                    state.player.x = canvas.width - state.player.width / 2 - 50;
                    state.sceneTransitionCooldown = 15;
                } else if (atRightEdge && keys['d']) {
                    // Moving right at right edge → go to edge scene, appear at left edge
                    state.currentScene = 'edge';
                    state.player.x = state.player.width / 2 + 50;
                    state.sceneTransitionCooldown = 15;
                }
            }
            // Transition from edge back to main scene
            else if (state.currentScene === 'edge') {
                if (atLeftEdge && keys['a']) {
                    // At left edge, moving left (through the edge) → return to main, appear at right edge
                    state.currentScene = 'main';
                    state.player.x = canvas.width - state.player.width / 2 - 50;
                    state.sceneTransitionCooldown = 15;
                } else if (atRightEdge && keys['d']) {
                    // At right edge, moving right (through the edge) → return to main, appear at left edge
                    state.currentScene = 'main';
                    state.player.x = state.player.width / 2 + 50;
                    state.sceneTransitionCooldown = 15;
                }
            }
        }
        
        // Normal boundary checks (keep player on screen) - desktop only
        if (!state.isMobile) {
            if (state.player.x < state.player.width / 2) {
                state.player.x = state.player.width / 2;
            }
            if (state.player.x > canvas.width - state.player.width / 2) {
                state.player.x = canvas.width - state.player.width / 2;
            }
        } else {
            // On mobile, keep player centered
            // COMMENTED OUT - Mobile devices now show a message instead
            // state.player.x = canvas.width / 2;
        }
        
        // Only check collisions with images in main scene
        if (state.currentScene === 'main') {
            checkImageCollision();
        }
        
        // Check treasure chest collision in edge scene (desktop only)
        if (state.currentScene === 'edge' && !state.isMobile) {
            checkTreasureChestCollision();
        }
    }
    
    // Check collision with treasure chest
    function checkTreasureChestCollision() {
        if (!canvas || !state.treasureChestSprite) return;
        
        const imageSize = 80;
        const chestX = canvas.width / 2 - imageSize / 2;
        const chestY = state.floorLevel - imageSize + 20;
        const chestCenterX = chestX + imageSize / 2;
        const chestCenterY = chestY + imageSize / 2;
        
        const playerCenterX = state.player.x;
        const playerCenterY = state.player.y + state.player.height / 2;
        
        const distanceX = Math.abs(playerCenterX - chestCenterX);
        const distanceY = Math.abs(playerCenterY - chestCenterY);
        
        // Check if sword is over treasure chest (same detection as icons)
        state.treasureChestHovered = distanceX < imageSize / 2 + 10 && distanceY < imageSize / 2 + 10;
    }
    
    // Detect mobile device
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.innerWidth <= 768 && 'ontouchstart' in window);
    }
    
    // Store mobile state
    state.isMobile = isMobileDevice();
    
    // Handle keyboard input
    const keys = {};
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ') {
            e.preventDefault(); // Prevent page scroll
        }
        
        // Skip keyboard movement on mobile (icons are arranged vertically, no movement needed)
        // COMMENTED OUT - Mobile devices now show a message instead
        /*
        if (state.isMobile) {
            // Still handle Enter and Escape keys
            if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'Backspace') {
                // Let these keys through for navigation
            } else {
                return; // Ignore movement keys on mobile
            }
        }
        */
        
        // Handle arrow keys and WASD (desktop only)
        const keyMap = {
            'ArrowLeft': 'a',
            'ArrowRight': 'd',
            'a': 'a',
            'A': 'a',
            'd': 'd',
            'D': 'd'
        };
        
        if (keyMap[e.key]) {
            keys[keyMap[e.key]] = true;
        } else {
            keys[e.key.toLowerCase()] = true;
        }
        
        // Enter key: Open treasure chest modal (only in edge scene)
        if (e.key === 'Enter' && state.currentScene === 'edge' && state.treasureChestHovered) {
            e.preventDefault();
            // Play coin sound when opening treasure chest
            const coinSound = new Audio('assets/coin.mp3');
            coinSound.volume = 0.5;
            coinSound.play().catch(err => {
                console.log('Could not play coin sound:', err);
            });
            if (typeof window.showTreasureChestModal === 'function') {
                window.showTreasureChestModal();
            }
            return;
        }
        
        // Enter key: Navigate to section if sword is over an icon (only in main scene)
        if (e.key === 'Enter' && state.currentScene === 'main') {
            e.preventDefault();
            
            // Check if sword is currently over any icon
            const playerX = state.player.x;
            const playerY = state.player.y + state.player.height / 2;
            
            for (let i = 0; i < state.images.length; i++) {
                const img = state.images[i];
                const imgCenterX = img.x + img.width / 2;
                const imgCenterY = img.y + img.height / 2;
                const distX = Math.abs(playerX - imgCenterX);
                const distY = Math.abs(playerY - imgCenterY);
                
                // If sword is over this icon, navigate to its section
                if (distX < img.width / 2 + 10 && distY < img.height / 2 + 10) {
                    const sectionId = state.sections[img.section].id;
                    window.navigateToSection(sectionId);
                    return; // Exit early once we find a match
                }
            }
        }
        
        // Escape or Backspace to return to portal
        if (e.key === 'Escape') {
            window.returnToPortal();
        }
        
        // Backspace to return to portal (only when on a content section)
        if (e.key === 'Backspace') {
            const contentSections = document.getElementById('content-sections');
            const portalGame = document.getElementById('portal-game');
            
            // Only return to portal if content sections are visible
            if (contentSections && contentSections.style.display !== 'none') {
                e.preventDefault(); // Prevent browser back navigation
                window.returnToPortal();
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        const keyMap = {
            'ArrowLeft': 'a',
            'ArrowRight': 'd',
            'a': 'a',
            'A': 'a',
            'd': 'd',
            'D': 'd'
        };
        
        if (keyMap[e.key]) {
            keys[keyMap[e.key]] = false;
        } else {
            keys[e.key.toLowerCase()] = false;
        }
    });
    
    // Handle mouse click and hover
    function setupCanvasClick() {
        if (!canvas) return;
        
        // Handle clicks (only in main scene)
        canvas.addEventListener('click', (e) => {
            // Don't allow icon interactions in edge scene
            if (state.currentScene !== 'main') {
                return;
            }
            
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Check if clicking on an icon - use for loop to properly break out
            let clickedIcon = null;
            for (let i = 0; i < state.images.length; i++) {
                const image = state.images[i];
                const iconCenterX = image.x + image.width / 2;
                const iconCenterY = image.y + image.height / 2;
                const distanceX = Math.abs(clickX - iconCenterX);
                const distanceY = Math.abs(clickY - iconCenterY);
                
                if (distanceX < image.width / 2 + 10 && distanceY < image.height / 2 + 10) {
                    // Clicked on icon - navigate to this specific section
                    clickedIcon = image;
                    break;
                }
            }
            
            // Navigate to clicked icon if found (prioritize click over sword position)
            if (clickedIcon) {
                window.navigateToSection(state.sections[clickedIcon.section].id);
                return;
            }
            
            // Only navigate if clicking on the preview modal itself (not just anywhere when preview is showing)
            const previewElement = document.getElementById('section-preview');
            if (previewElement && state.showPreview && state.currentSection >= 0) {
                const previewRect = previewElement.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();
                const previewX = previewRect.left - canvasRect.left;
                const previewY = previewRect.top - canvasRect.top;
                
                // Check if click is within preview modal bounds
                if (clickX >= previewX && clickX <= previewX + previewRect.width &&
                    clickY >= previewY && clickY <= previewY + previewRect.height) {
                    window.navigateToSection(state.sections[state.currentSection].id);
                }
            }
        });
        
        // Handle mouse move for hover (only check icons in main scene)
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            state.mouseX = e.clientX - rect.left;
            state.mouseY = e.clientY - rect.top;
            
            // Only check icon hover in main scene
            if (state.currentScene === 'main') {
                // Check which icon is hovered by mouse
                let hoveredIndex = -1;
                state.images.forEach((image, index) => {
                    const iconCenterX = image.x + image.width / 2;
                    const iconCenterY = image.y + image.height / 2;
                    const distanceX = Math.abs(state.mouseX - iconCenterX);
                    const distanceY = Math.abs(state.mouseY - iconCenterY);
                    
                    if (distanceX < image.width / 2 + 10 && distanceY < image.height / 2 + 10) {
                        hoveredIndex = index;
                    }
                });
                
                state.hoveredIconIndexByMouse = hoveredIndex;
                
                // Change cursor style (check if mouse OR sword is over an icon)
                if (hoveredIndex >= 0 || state.hoveredIconIndexBySword >= 0) {
                    canvas.style.cursor = 'pointer';
                } else {
                    canvas.style.cursor = 'default';
                }
            } else {
                // In edge scene, reset hover state and use default cursor
                state.hoveredIconIndexByMouse = -1;
                canvas.style.cursor = 'default';
            }
        });
        
        // Handle mouse leave
        canvas.addEventListener('mouseleave', () => {
            state.hoveredIconIndexByMouse = -1;
            // Only change cursor if sword is also not over an icon
            if (state.hoveredIconIndexBySword < 0) {
                canvas.style.cursor = 'default';
            }
        });
    }
    
    // Game loop
    function gameLoop() {
        if (!canvas || !ctx) {
            requestAnimationFrame(gameLoop);
            return;
        }
        
        // Handle movement (desktop only)
        state.player.velocityX = 0;
        
        // COMMENTED OUT - Mobile devices now show a message instead
        // if (!state.isMobile) {
        if (!state.isMobile) {
            if (keys['a']) {
                state.player.velocityX = -state.moveSpeed;
            }
            if (keys['d']) {
                state.player.velocityX = state.moveSpeed;
            }
        }
        
        // Update physics
        updatePhysics();
        
        // Update instructions visibility based on scene
        const instructionsEl = document.querySelector('.instructions');
        if (instructionsEl) {
            instructionsEl.style.display = state.currentScene === 'main' ? 'block' : 'none';
        }
        
        // Draw
        draw();
        
        requestAnimationFrame(gameLoop);
    }
    
    // Initialize when DOM is ready
    function initializeGame() {
        console.log('Initializing game...');
        
        // Get canvas elements
        if (!getCanvasElements()) {
            console.error('Canvas element or context not found!');
            setTimeout(initializeGame, 100);
            return;
        }
        
        // Check if mobile and show message overlay
        if (state.isMobile) {
            const mobileMessage = document.getElementById('mobile-message');
            if (mobileMessage) {
                mobileMessage.style.display = 'flex';
            }
            // Hide instructions on mobile
            const instructionsEl = document.querySelector('.instructions');
            if (instructionsEl) {
                instructionsEl.style.display = 'none';
            }
        }
        
        // Setup canvas click handler
        setupCanvasClick();
        
        // Resize canvas
        resizeCanvas();
        
        if (canvas.width > 0 && canvas.height > 0) {
            console.log('Initializing game with canvas size:', canvas.width, 'x', canvas.height);
            // Load all assets first, then initialize
            Promise.all([
                loadImages(),
                loadGlitchSprites(),
                loadAudio()
            ]).then(() => {
                initStorm();
                // Try to start background thunder audio
                playThunderAudio();
                
                // Only initialize images and game loop if not mobile
                if (!state.isMobile) {
                    initImages();
                    gameLoop();
                } else {
                    // On mobile, run a simplified game loop that only draws the storm background
                    function mobileGameLoop() {
                        if (!canvas || !ctx) {
                            requestAnimationFrame(mobileGameLoop);
                            return;
                        }
                        // Only draw the storm background
                        drawStorm();
                        requestAnimationFrame(mobileGameLoop);
                    }
                    mobileGameLoop();
                }
            });
        } else {
            console.log('Canvas not ready, retrying...');
            setTimeout(initializeGame, 50);
        }
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGame);
    } else {
        // DOM already loaded
        initializeGame();
    }
    
    window.addEventListener('resize', resizeCanvas);
    
    // Show treasure chest modal
    window.showTreasureChestModal = function() {
        const modal = document.getElementById('treasure-chest-modal');
        if (modal) {
            modal.style.display = 'flex';
            // Set up thunder control for troll audio
            setTimeout(() => {
                const audio = document.getElementById('troll-audio');
                if (audio) {
                    // TROLL AUDIO VOLUME (0.0 to 1.0)
                    audio.volume = 0.5; // Set to desired volume (0.5 = 50%)
                    if (typeof setupMediaThunderControl === 'function') {
                        setupMediaThunderControl(audio);
                    }
                }
            }, 100);
        }
    };
    
    // Close treasure chest modal
    window.closeTreasureChestModal = function() {
        const modal = document.getElementById('treasure-chest-modal');
        if (modal) {
            modal.style.display = 'none';
            const audio = document.getElementById('troll-audio');
            if (audio) {
                // Remove from active media set and pause
                activeMediaElements.delete(audio);
                audio.pause();
                audio.currentTime = 0;
                // Resume thunder if no other media is playing
                resumeThunderAudio();
            }
        }
    };
    
    // Navigate to section (global function)
    window.navigateToSection = function(sectionId) {
        // Save current player position
        state.savedPlayerPosition = {
            x: state.player.x,
            y: state.player.y
        };
        
        const portalGame = document.getElementById('portal-game');
        const contentSections = document.getElementById('content-sections');
        const returnBtn = document.getElementById('return-portal-btn');
        
        if (portalGame) portalGame.style.display = 'none';
        if (contentSections) contentSections.style.display = 'block';
        if (returnBtn) returnBtn.style.display = 'block';
        
        // Hide all sections and show only the target section
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            // Pause all videos and audios when leaving sections
            if (section.id !== sectionId) {
                const videos = section.querySelectorAll('video');
                const audios = section.querySelectorAll('audio');
                
                videos.forEach(video => {
                    if (!video.paused) {
                        video.pause();
                    }
                    activeMediaElements.delete(video);
                });
                
                audios.forEach(audio => {
                    if (!audio.paused) {
                        audio.pause();
                    }
                    activeMediaElements.delete(audio);
                });
            }
            
            section.style.display = 'none';
            section.style.transition = 'none';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        });
        
        // Show only the target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            // Reset scroll position of the section to top
            targetSection.scrollTop = 0;
            
            // Set up thunder control for any video/audio in the section
            setTimeout(() => {
                const videos = targetSection.querySelectorAll('video');
                const audios = targetSection.querySelectorAll('audio');
                
                videos.forEach(video => {
                    if (typeof setupMediaThunderControl === 'function') {
                        setupMediaThunderControl(video);
                    }
                });
                
                audios.forEach(audio => {
                    if (typeof setupMediaThunderControl === 'function') {
                        setupMediaThunderControl(audio);
                    }
                });
            }, 100);
            
            // Resume thunder audio when navigating away (if no media is playing)
            resumeThunderAudio();
        }
        
        // Lock scroll position of content-sections container
        if (contentSections) {
            contentSections.scrollTop = 0;
        }
        
        // Re-enable transitions after a short delay
        setTimeout(() => {
            sections.forEach(section => {
                section.style.transition = '';
            });
        }, 100);
    }
    
    // Return to portal function
    window.returnToPortal = function() {
        const portalGame = document.getElementById('portal-game');
        const contentSections = document.getElementById('content-sections');
        const returnBtn = document.getElementById('return-portal-btn');
        
        // Check if we're already on the portal (not coming from a content section)
        const isAlreadyOnPortal = portalGame && portalGame.style.display !== 'none' && 
                                   contentSections && contentSections.style.display === 'none';
        
        if (portalGame) portalGame.style.display = 'block';
        if (contentSections) {
            contentSections.style.display = 'none';
            // Hide all sections when returning to portal
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => {
                // Pause all videos and audios when leaving sections
                const videos = section.querySelectorAll('video');
                const audios = section.querySelectorAll('audio');
                
                videos.forEach(video => {
                    if (!video.paused) {
                        video.pause();
                    }
                    activeMediaElements.delete(video);
                });
                
                audios.forEach(audio => {
                    if (!audio.paused) {
                        audio.pause();
                    }
                    activeMediaElements.delete(audio);
                });
                
                section.style.display = 'none';
                section.scrollTop = 0; // Reset scroll position
            });
        }
        if (returnBtn) returnBtn.style.display = 'none';
        window.scrollTo(0, 0);
        
        // Resume thunder audio when returning to portal (if no media is playing)
        resumeThunderAudio();
        
        // Restore player position if saved, otherwise only reset if coming from a content section
        // Don't reset position if already on portal
        if (canvas) {
            if (state.savedPlayerPosition) {
                state.player.x = state.savedPlayerPosition.x;
                state.player.y = state.savedPlayerPosition.y;
                state.savedPlayerPosition = null; // Clear after restoring
            } else if (!isAlreadyOnPortal) {
                // Only reset to center if coming from a content section
                state.player.x = canvas.width / 2; // Spawn in the middle of the sidewalk
                state.player.y = state.floorLevel - state.player.height + 20; // Positioned on thicker sidewalk
            }
            // If already on portal, keep current position
            state.player.velocityX = 0;
            state.currentSection = -1;
            state.showPreview = false;
            state.hoveredIconIndexBySword = -1;
            state.hoveredIconIndexByMouse = -1;
            // Reset mouse position to prevent stale hover state
            state.mouseX = -1;
            state.mouseY = -1;
            state.images.forEach(img => {
                img.active = false;
                img.glitchActive = false;
            });
            state.glitchEffect.active = false;
            state.glitchEffect.intensity = 0;
            state.glitchEffect.flashes = [];
            state.glitchEffect.duration = 0;
            state.glitchEffect.cooldown = 0; // Reset cooldown when returning to portal
            state.glitchEffect.justReturned = true; // Set flag to prevent glitch on return
            // Stop any playing glitch sound
            if (state.glitchEffect.currentSound) {
                try {
                    state.glitchEffect.currentSound.pause();
                    state.glitchEffect.currentSound.currentTime = 0;
                    state.glitchEffect.currentSound = null;
                } catch (e) {
                    // Ignore errors when stopping sound
                }
            }
            
            // Clear the justReturned flag after a delay (enough time for collision check to run)
            setTimeout(() => {
                state.glitchEffect.justReturned = false;
            }, 100);
        }
    }
})();
