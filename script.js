// DOM Elements
const settingsBtn = document.getElementById('settings-btn');
const menuBtn = document.getElementById('menu-btn');
const closeSettingsBtn = document.getElementById('close-settings');
const settingsPanel = document.getElementById('settings-panel');
const modeBtns = document.querySelectorAll('.mode-btn');
const colorBtns = document.querySelectorAll('.color-btn');
const canvas = document.getElementById('env-canvas');
const ctx = canvas.getContext('2d');

// State
let currentMode = 'sun';
let particles = [];
let animationId;
let width, height;
let rainAudio = null;
let rainVolume = parseFloat(localStorage.getItem('env_rain_volume')) || 0.25;

// Settings Panel Toggle
function toggleSettings() {
    settingsPanel.classList.toggle('open');
}

settingsBtn.addEventListener('click', toggleSettings);
if (menuBtn) menuBtn.addEventListener('click', toggleSettings);
closeSettingsBtn.addEventListener('click', toggleSettings);

// Theme Color Change
colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        colorBtns.forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');

        const color = btn.dataset.color;
        document.documentElement.style.setProperty('--primary-color', color);

        // Update hero button shadow
        const primaryBtn = document.querySelector('.btn.primary');
        if (primaryBtn) {
            primaryBtn.style.boxShadow = `0 4px 15px ${color}66`;
        }
    });
});

// Rain volume control (settings panel)
const rainVolumeInput = document.getElementById('rain-volume');
const testRainBtn = document.getElementById('test-rain');
if (rainVolumeInput) {
    rainVolumeInput.value = rainVolume;
    rainVolumeInput.addEventListener('input', (e) => {
        rainVolume = parseFloat(e.target.value);
        localStorage.setItem('env_rain_volume', rainVolume);
        if (rainAudio) rainAudio.volume = rainVolume;
    });
}
if (testRainBtn) {
    testRainBtn.addEventListener('click', () => {
        // Play a short sample of the rain sound so user can preview
        playRainSound(true);
    });
}

// Environment Modes
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setMode(btn.dataset.mode);
    });
});

function setMode(mode) {
    currentMode = mode;
    cancelAnimationFrame(animationId);
    particles = [];

    // Reset Canvas
    ctx.clearRect(0, 0, width, height);

    // Set Background Gradients based on mode
    const body = document.body;

    switch (mode) {
        case 'sun':
            body.style.background = 'linear-gradient(to bottom, #2c3e50, #fd746c)';
            initSunMode();
            break;
        case 'rain':
            body.style.background = '#0f2027'; // Dark blue/black
            initRainMode();
            // Start rain ambience (user gesture required; click events like selecting mode count)
            playRainSound();
            break;
        case 'snow':
            body.style.background = '#1b2735'; // Dark blue
            initSnowMode();
            break;
        case 'night':
            body.style.background = '#000000';
            initNightMode();
            break;
        case 'off':
            body.style.background = '#1a1a2e';
            break;
    }

    // Stop rain sound when not in rain mode
    if (mode !== 'rain') stopRainSound();

    if (mode !== 'off') {
        animate();
    }
}

// --- Rain Audio Controls ---
function playRainSound(tempOnly = false) {
    // Use a gentle rain sound from a permissive source. If you prefer a local file, replace the URL.
    const url = 'https://www.soundjay.com/nature/sounds/rain-01.mp3';

    try {
        if (!rainAudio) {
            rainAudio = new Audio(url);
            rainAudio.loop = true;
            rainAudio.volume = rainVolume;
        }

        // If tempOnly is true, play short sample then stop
        const playPromise = rainAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                if (tempOnly) {
                    setTimeout(() => {
                        rainAudio.pause();
                        rainAudio.currentTime = 0;
                    }, 3500);
                }
            }).catch((e) => {
                // Autoplay blocked or other issue — user needs to interact first
                console.warn('Unable to play rain audio automatically:', e);
            });
        }
    } catch (e) {
        console.warn('Rain audio error', e);
    }
}

function stopRainSound() {
    if (rainAudio) {
        try {
            rainAudio.pause();
            rainAudio.currentTime = 0;
        } catch (e) {
            console.warn('Error stopping rain audio', e);
        }
    }
}

// Canvas Resize
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    if (currentMode !== 'off') {
        // Re-init current mode to adjust particle count/positions
        setMode(currentMode);
    }
}

window.addEventListener('resize', resize);

// Animation Loop
function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    animationId = requestAnimationFrame(animate);
}

// --- Mode Implementations ---

// Sun Mode (Sunset particles/warmth)
function initSunMode() {
    // Create some floating warm particles
    for (let i = 0; i < 50; i++) {
        particles.push(new SunParticle());
    }
}

class SunParticle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 3;
        this.speedY = Math.random() * 0.5 + 0.1;
        this.color = `rgba(255, 200, 100, ${Math.random() * 0.5})`;
    }

    update() {
        this.y -= this.speedY;
        if (this.y < 0) this.y = height;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Rain Mode
function initRainMode() {
    for (let i = 0; i < 100; i++) {
        particles.push(new RainDrop());
    }
}

class RainDrop {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.length = Math.random() * 20 + 10;
        this.speedY = Math.random() * 10 + 5;
        this.color = 'rgba(174, 194, 224, 0.5)';
    }

    update() {
        this.y += this.speedY;
        if (this.y > height) {
            this.y = -this.length;
            this.x = Math.random() * width;
        }
    }

    draw() {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
    }
}

// Snow Mode
function initSnowMode() {
    for (let i = 0; i < 80; i++) {
        particles.push(new SnowFlake());
    }
}

class SnowFlake {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 3 + 1;
        this.speedY = Math.random() * 1 + 0.5;
        this.speedX = Math.random() * 1 - 0.5;
        this.color = 'rgba(255, 255, 255, 0.8)';
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;

        if (this.y > height) {
            this.y = -5;
            this.x = Math.random() * width;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Night Mode (Stars + Clouds)
function initNightMode() {
    for (let i = 0; i < 150; i++) {
        particles.push(new Star());
    }
    // Add a few clouds
    for (let i = 0; i < 5; i++) {
        particles.push(new Cloud());
    }
}

class Star {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2;
        this.blinkSpeed = Math.random() * 0.05;
        this.alpha = Math.random();
        this.direction = Math.random() > 0.5 ? 1 : -1;
    }

    update() {
        this.alpha += this.blinkSpeed * this.direction;
        if (this.alpha >= 1 || this.alpha <= 0) {
            this.direction *= -1;
        }
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Cloud {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * (height / 2); // Top half
        this.width = Math.random() * 200 + 100;
        this.height = this.width * 0.6;
        this.speedX = Math.random() * 0.2 + 0.1;
        this.opacity = Math.random() * 0.2 + 0.1;
    }

    update() {
        this.x += this.speedX;
        if (this.x > width + this.width) {
            this.x = -this.width;
        }
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Vanilla Tilt Effect (Simple implementation)
document.addEventListener('mousemove', (e) => {
    const tiltElements = document.querySelectorAll('[data-tilt]');

    tiltElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg
        const rotateY = ((x - centerX) / centerX) * 10;

        // Only apply if mouse is near/over element (optional optimization)
        if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
        ) {
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        } else {
            el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        }
    });
});

// Initialize
resize();
setMode('sun'); // Default mode

// --- Scroll reveal & skill animation ---
function setupRevealObserver() {
    const reveals = document.querySelectorAll('.reveal');
    const options = { threshold: 0.15 };
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');

                // animate skill bars when skills section comes into view
                if (entry.target.id === 'skills' || entry.target.querySelectorAll) {
                    const bars = entry.target.querySelectorAll('.skill-bar');
                    bars.forEach(bar => {
                        const fill = bar.querySelector('.fill');
                        const pct = parseInt(bar.dataset.percent || '0', 10);
                        if (fill) {
                            // small timeout for stagger
                            setTimeout(() => { fill.style.width = pct + '%'; }, 200);
                        }
                    });
                }
            }
        });
    }, options);

    reveals.forEach(r => obs.observe(r));
}

// Run setup after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setupRevealObserver();

    // Ambience button toggles rain audio (user gesture required)
    const ambBtn = document.getElementById('ambience-btn');
    if (ambBtn) {
        ambBtn.addEventListener('click', () => {
            const pressed = ambBtn.getAttribute('aria-pressed') === 'true';
            if (pressed) {
                // stop ambience
                stopRainSound();
                ambBtn.setAttribute('aria-pressed', 'false');
                ambBtn.textContent = '🔊 Ambience';
            } else {
                // start ambience (rain by default)
                // ensure Rain mode visual is active too
                setMode('rain');
                playRainSound();
                ambBtn.setAttribute('aria-pressed', 'true');
                ambBtn.textContent = '🔈 Stop';
            }
        });
    }

    // Newsletter form handler (simple local behaviour)
    const newsletterForm = document.getElementById('newsletter-form');
    const newsletterMsg = document.getElementById('newsletter-msg');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletter-email').value;
            // Simple validation
            if (!email || !email.includes('@')) {
                newsletterMsg.textContent = 'Please enter a valid email address.';
                return;
            }
            newsletterMsg.textContent = 'Thanks! You are subscribed.';
            newsletterForm.reset();
        });
    }
});
