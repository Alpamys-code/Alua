/**
 * Heart & Soul Interactive Visual Experience
 * Fully responsive on mobile & desktop with multi-mode navigation
 */

(() => {
  // DOM Elements
  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas.getContext('2d');
  const progressBar = document.getElementById('progress-bar');
  const progressSlider = document.getElementById('progress-slider');
  const bpmCounter = document.getElementById('bpm-counter');
  
  const introCard = document.getElementById('intro-card');
  const heartWrapper = document.getElementById('heart-wrapper');
  const heartInnerPortal = document.querySelector('.heart-inner-portal');
  const coreGlow = document.getElementById('core-glow');
  
  const photoStage = document.getElementById('photo-stage');
  const photoCard = document.getElementById('photo-card');
  const revealContent = document.getElementById('reveal-content');
  
  const btnSound = document.getElementById('btn-sound');
  const iconSoundOff = document.getElementById('icon-sound-off');
  const iconSoundOn = document.getElementById('icon-sound-on');
  const soundStatusText = document.getElementById('sound-status-text');
  
  const btnAutoplay = document.getElementById('btn-autoplay');
  const btnRestart = document.getElementById('btn-restart');
  const btnEdit = document.getElementById('btn-edit');
  const btnScrubTop = document.getElementById('btn-scrub-top');
  const btnScrubEnd = document.getElementById('btn-scrub-end');
  
  // Modal Elements
  const editModal = document.getElementById('edit-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  const btnSaveModal = document.getElementById('btn-save-modal');
  const inputTitle = document.getElementById('input-title');
  const inputText = document.getElementById('input-text');
  const customTitle = document.getElementById('custom-title');
  const customText = document.getElementById('custom-text');

  // Animation & Scroll State
  let targetProgress = 0;
  let smoothedProgress = 0;
  let isAutoplaying = false;
  let autoplayAnimationId = null;
  let isDraggingSlider = false;

  // --- LOCAL STORAGE RESTORE ---
  try {
    const savedTitle = localStorage.getItem('heart_site_title');
    const savedText = localStorage.getItem('heart_site_text');
    if (savedTitle) {
      customTitle.textContent = savedTitle;
      inputTitle.value = savedTitle;
    }
    if (savedText) {
      customText.textContent = savedText;
      inputText.value = savedText;
    }
  } catch (e) {
    // Storage access fallback
  }

  // --- AMBIENT PARTICLES SYSTEM ---
  let particles = [];
  const PARTICLE_COUNT = 55;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor() {
      this.reset(true);
    }
    reset(init = false) {
      this.x = Math.random() * canvas.width;
      this.y = init ? Math.random() * canvas.height : canvas.height + 15;
      this.size = Math.random() * 2.5 + 0.8;
      this.speedY = Math.random() * 0.6 + 0.25;
      this.speedX = (Math.random() - 0.5) * 0.35;
      this.alpha = Math.random() * 0.55 + 0.2;
      this.pulseSpeed = Math.random() * 0.03 + 0.01;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }
    update() {
      this.y -= this.speedY;
      this.x += this.speedX;
      this.pulsePhase += this.pulseSpeed;
      if (this.y < -20 || this.x < -20 || this.x > canvas.width + 20) {
        this.reset();
      }
    }
    draw() {
      const currentAlpha = Math.max(0.1, this.alpha + Math.sin(this.pulsePhase) * 0.2);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 35, 75, ${currentAlpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(255, 30, 70, 0.6)';
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function renderParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
  }

  // --- WEB AUDIO API HEARTBEAT SYNTHESIZER ---
  let audioCtx = null;
  let isSoundEnabled = false;
  let heartbeatTimer = null;
  let baseBpm = 72;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playHeartThump(time, frequency, decay, volume) {
    if (!audioCtx || !isSoundEnabled) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, time);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, time);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.45, time + decay);

      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(time);
      osc.stop(time + decay);
    } catch (e) {
      // Audio handle
    }
  }

  function scheduleHeartbeat() {
    if (!isSoundEnabled || !audioCtx) return;
    const now = audioCtx.currentTime;
    
    // First beat: Lub (deeper, S1)
    playHeartThump(now, 66, 0.16, 0.85);

    // Second beat: Dub (higher, S2 ~0.25s later)
    playHeartThump(now + 0.25, 80, 0.13, 0.65);

    // Calculate next beat interval based on current BPM
    const currentBpm = Math.round(baseBpm + smoothedProgress * 30);
    bpmCounter.textContent = currentBpm;
    const intervalMs = (60 / currentBpm) * 1000;

    clearTimeout(heartbeatTimer);
    heartbeatTimer = setTimeout(scheduleHeartbeat, intervalMs);
  }

  function toggleSound() {
    initAudio();
    isSoundEnabled = !isSoundEnabled;
    if (isSoundEnabled) {
      iconSoundOff.classList.add('hidden');
      iconSoundOn.classList.remove('hidden');
      soundStatusText.textContent = 'Звук: Вкл';
      scheduleHeartbeat();
    } else {
      iconSoundOff.classList.remove('hidden');
      iconSoundOn.classList.add('hidden');
      soundStatusText.textContent = 'Звук: Выкл';
      clearTimeout(heartbeatTimer);
    }
  }

  btnSound.addEventListener('click', toggleSound);

  // --- DUAL-INPUT SCROLL & TOUCH SYNCHRONIZATION ---
  function getScrollMax() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function onWindowScroll() {
    if (!isDraggingSlider && !isAutoplaying) {
      const maxScroll = getScrollMax();
      targetProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    }
  }
  window.addEventListener('scroll', onWindowScroll, { passive: true });

  // Touch Swipe on mobile anywhere on screen
  let touchStartY = 0;
  let touchStartProgress = 0;
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
      touchStartProgress = targetProgress;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    // If not touching slider or buttons
    if (e.target.closest('.bottom-scrubber-bar') || e.target.closest('.modal-dialog') || e.target.closest('.hud-header')) {
      return;
    }
    if (e.touches.length === 1) {
      const deltaY = touchStartY - e.touches[0].clientY;
      const progressDelta = deltaY / (window.innerHeight * 1.8);
      targetProgress = Math.min(1, Math.max(0, touchStartProgress + progressDelta));
      const maxScroll = getScrollMax();
      window.scrollTo(0, targetProgress * maxScroll);
    }
  }, { passive: true });

  // Scrubber Slider interaction
  progressSlider.addEventListener('input', () => {
    isDraggingSlider = true;
    targetProgress = progressSlider.value / 1000;
    const maxScroll = getScrollMax();
    window.scrollTo(0, targetProgress * maxScroll);
  });

  progressSlider.addEventListener('change', () => {
    isDraggingSlider = false;
  });

  btnScrubTop.addEventListener('click', () => {
    smoothScrollToProgress(0);
  });

  btnScrubEnd.addEventListener('click', () => {
    smoothScrollToProgress(1);
  });

  function smoothScrollToProgress(val) {
    targetProgress = val;
    const maxScroll = getScrollMax();
    window.scrollTo({ top: val * maxScroll, behavior: 'smooth' });
  }

  // --- SMOOTH RENDER LOOP ---
  function updateVisuals() {
    // Smooth lerp
    smoothedProgress += (targetProgress - smoothedProgress) * 0.14;
    const p = smoothedProgress;

    // Sync UI indicators
    progressBar.style.width = `${(p * 100).toFixed(1)}%`;
    if (!isDraggingSlider) {
      progressSlider.value = Math.round(p * 1000);
    }

    const currentBpm = Math.round(baseBpm + p * 30);
    bpmCounter.textContent = currentBpm;

    // 1. Intro Title Overlay (p: 0 -> 0.16)
    if (p < 0.20) {
      const introFade = Math.max(0, 1 - (p / 0.16));
      introCard.style.opacity = introFade.toFixed(3);
      introCard.style.transform = `translate(-50%, calc(-50% - ${p * 50}px)) scale(${1 - p * 0.15})`;
      introCard.style.pointerEvents = introFade > 0.5 ? 'auto' : 'none';
    } else {
      introCard.style.opacity = 0;
      introCard.style.pointerEvents = 'none';
    }

    // 2. Heart Zoom and Dissolve
    if (p <= 0.01) {
      if (!heartWrapper.classList.contains('idle-beat')) {
        heartWrapper.classList.add('idle-beat');
      }
      heartWrapper.style.transform = '';
      heartWrapper.style.opacity = '1';
      heartWrapper.style.filter = '';
      heartInnerPortal.style.opacity = '0';
      heartInnerPortal.style.transform = 'translate(-50%, -50%) scale(0)';
    } else {
      heartWrapper.classList.remove('idle-beat');

      // Exponential cinematic zoom: scale up to ~20x
      const zoomFactor = Math.pow(p, 2.0) * 20;
      const currentScale = 1 + zoomFactor;

      // Opacity fades out after p = 0.38
      let heartOpacity = 1;
      if (p > 0.38) {
        heartOpacity = Math.max(0, 1 - ((p - 0.38) / 0.34));
      }

      const blurAmount = Math.max(0, (p - 0.30) * 20);

      heartWrapper.style.transform = `scale(${currentScale.toFixed(3)}) translateZ(0)`;
      heartWrapper.style.opacity = heartOpacity.toFixed(3);
      heartWrapper.style.filter = blurAmount > 0 ? `blur(${blurAmount.toFixed(1)}px)` : '';

      // Portal glow inside heart chamber
      if (p > 0.12 && p < 0.85) {
        const portalP = (p - 0.12) / 0.55;
        const portalScale = Math.min(5, Math.pow(portalP, 1.6) * 5.2);
        const portalOpacity = Math.min(0.9, portalP * 1.5) * (p > 0.60 ? Math.max(0, 1 - (p - 0.60) / 0.25) : 1);
        heartInnerPortal.style.transform = `translate(-50%, -50%) scale(${portalScale.toFixed(2)})`;
        heartInnerPortal.style.opacity = portalOpacity.toFixed(2);
      } else {
        heartInnerPortal.style.opacity = '0';
      }
    }

    // 3. Core background glow
    const glowScale = 1 + p * 1.6;
    const glowOpacity = 0.38 + p * 0.45;
    coreGlow.style.transform = `translate(-50%, -50%) scale(${glowScale.toFixed(2)})`;
    coreGlow.style.opacity = glowOpacity.toFixed(2);

    // 4. Photo Stage Reveal
    // Emerges from depth of heart starting at p = 0.28, reaching full clarity by p = 0.75
    if (p < 0.26) {
      photoStage.style.opacity = '0';
      photoStage.style.transform = 'translate(-50%, -50%) scale(0.2) translateZ(-250px)';
      photoStage.style.filter = 'blur(16px)';
      photoStage.style.pointerEvents = 'none';
    } else {
      const photoNorm = Math.min(1, Math.max(0, (p - 0.26) / 0.50));
      // Ease out cubic curve
      const easePhoto = 1 - Math.pow(1 - photoNorm, 3);
      const photoScale = 0.25 + easePhoto * 0.75;
      const photoOpacity = Math.min(1, photoNorm * 1.65);
      const photoBlur = Math.max(0, (1 - photoNorm) * 14);
      const photoZ = (1 - easePhoto) * -180;

      photoStage.style.opacity = photoOpacity.toFixed(3);
      photoStage.style.transform = `translate(-50%, -50%) scale(${photoScale.toFixed(3)}) translateZ(${photoZ.toFixed(1)}px)`;
      photoStage.style.filter = photoBlur > 0.2 ? `blur(${photoBlur.toFixed(1)}px)` : '';

      if (p >= 0.72) {
        photoStage.style.pointerEvents = 'auto';
        revealContent.style.opacity = Math.min(1, (p - 0.72) / 0.20).toFixed(2);
      } else {
        photoStage.style.pointerEvents = 'none';
        revealContent.style.opacity = '0';
      }
    }

    // Render particles
    renderParticles();

    requestAnimationFrame(updateVisuals);
  }

  requestAnimationFrame(updateVisuals);

  // --- 3D TILT EFFECT ON PHOTO CARD ---
  let mouseX = 0;
  let mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    if (smoothedProgress < 0.65) return;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    mouseX = (e.clientX - centerX) / centerX;
    mouseY = (e.clientY - centerY) / centerY;
    const rotateY = mouseX * 7;
    const rotateX = -mouseY * 7;
    photoCard.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
  });

  window.addEventListener('mouseleave', () => {
    photoCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  });

  // --- AUTOPLAY ANIMATION ---
  function stopAutoplay() {
    isAutoplaying = false;
    if (autoplayAnimationId) {
      cancelAnimationFrame(autoplayAnimationId);
      autoplayAnimationId = null;
    }
    btnAutoplay.classList.remove('active');
    btnAutoplay.querySelector('.btn-text').textContent = 'Автоплей';
  }

  function startAutoplay() {
    isAutoplaying = true;
    btnAutoplay.classList.add('active');
    btnAutoplay.querySelector('.btn-text').textContent = 'Пауза';

    initAudio();
    if (!isSoundEnabled) {
      toggleSound();
    }

    const startP = targetProgress >= 0.95 ? 0 : targetProgress;
    const duration = 6500; // 6.5s smooth journey
    const startTime = performance.now();

    function stepAutoplay(now) {
      if (!isAutoplaying) return;
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);

      // Smooth ease in-out
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      targetProgress = startP + (1 - startP) * ease;
      const maxScroll = getScrollMax();
      window.scrollTo(0, targetProgress * maxScroll);

      if (t < 1) {
        autoplayAnimationId = requestAnimationFrame(stepAutoplay);
      } else {
        stopAutoplay();
      }
    }

    autoplayAnimationId = requestAnimationFrame(stepAutoplay);
  }

  btnAutoplay.addEventListener('click', () => {
    if (isAutoplaying) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  // Stop autoplay on manual interaction
  window.addEventListener('wheel', () => {
    if (isAutoplaying) stopAutoplay();
  }, { passive: true });

  // --- RESTART BUTTON ---
  btnRestart.addEventListener('click', () => {
    smoothScrollToProgress(0);
  });

  // --- MODAL DIALOG (EDIT MESSAGE) ---
  function openModal() {
    inputTitle.value = customTitle.textContent;
    inputText.value = customText.textContent;
    editModal.classList.remove('hidden');
    inputTitle.focus();
  }

  function closeModal() {
    editModal.classList.add('hidden');
  }

  btnEdit.addEventListener('click', openModal);
  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);

  btnSaveModal.addEventListener('click', () => {
    const newTitle = inputTitle.value.trim() || 'Ты — в самом моём сердце';
    const newText = inputText.value.trim() || 'Каждый его удар принадлежит только тебе.';
    customTitle.textContent = newTitle;
    customText.textContent = newText;
    
    try {
      localStorage.setItem('heart_site_title', newTitle);
      localStorage.setItem('heart_site_text', newText);
    } catch (e) {
      // Storage save
    }

    closeModal();
  });

  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      closeModal();
    }
  });

  // Unlock audio on first touch/click
  const unlockAudioOnce = () => {
    initAudio();
    window.removeEventListener('click', unlockAudioOnce);
    window.removeEventListener('touchstart', unlockAudioOnce);
  };
  window.addEventListener('click', unlockAudioOnce);
  window.addEventListener('touchstart', unlockAudioOnce);

})();
