/* =========================================================
   BIRTHDAY WEBSITE — SCRIPT
   Handles: opening popup + confetti, floating hearts/stars,
   a shared celebration-effects canvas, balloon popping,
   interactive candles, sticky-note carousel (with swipe),
   a tappable ending heart, and the music toggle.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------------------------------------
     1. FLOATING BACKGROUND DECOR (hearts, stars, sparkles)
  ----------------------------------------------------- */
  const decorContainer = document.getElementById('floatingDecor');
  const decorSymbols = ['❤️', '💕', '✨', '⭐', '💫', '🌸'];
  const DECOR_COUNT = 22;

  for (let i = 0; i < DECOR_COUNT; i++) {
    const el = document.createElement('span');
    el.className = 'floaty';
    el.textContent = decorSymbols[Math.floor(Math.random() * decorSymbols.length)];

    const size = 0.9 + Math.random() * 1.4; // 0.9rem - 2.3rem
    const left = Math.random() * 100;
    const duration = 10 + Math.random() * 14; // 10s - 24s
    const delay = Math.random() * 18;
    const drift = (Math.random() * 120 - 60) + 'px';

    el.style.left = left + 'vw';
    el.style.fontSize = size + 'rem';
    el.style.animationDuration = duration + 's';
    el.style.animationDelay = delay + 's';
    el.style.setProperty('--drift', drift);

    decorContainer.appendChild(el);
  }

  /* -----------------------------------------------------
     2. OPENING POPUP + CONFETTI (its own dedicated canvas)
  ----------------------------------------------------- */
  const popupOverlay = document.getElementById('popupOverlay');
  const openSurpriseBtn = document.getElementById('openSurpriseBtn');
  const siteContent = document.getElementById('siteContent');
  const popupCanvas = document.getElementById('confettiCanvas');
  const popupCtx = popupCanvas.getContext('2d');

  let popupPieces = [];
  let popupAnimationId = null;

  function resizePopupCanvas() {
    popupCanvas.width = window.innerWidth;
    popupCanvas.height = window.innerHeight;
  }
  resizePopupCanvas();
  window.addEventListener('resize', resizePopupCanvas);

  const confettiColors = ['#ff9ebb', '#ffd6e8', '#c9b6ff', '#e5d9ff', '#ffd27a', '#ffffff'];

  function createFallingPieces(count, width, height) {
    const pieces = [];
    for (let i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * width,
        y: -20 - Math.random() * height * 0.5,
        size: 6 + Math.random() * 8,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        speedY: 2 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        shape: Math.random() > 0.5 ? 'circle' : 'rect'
      });
    }
    return pieces;
  }

  function drawFallingPieces(ctxRef, canvasRef, getPieces, setPieces, animIdSetter) {
    ctxRef.clearRect(0, 0, canvasRef.width, canvasRef.height);
    let pieces = getPieces();

    pieces.forEach(p => {
      ctxRef.save();
      ctxRef.translate(p.x, p.y);
      ctxRef.rotate((p.rotation * Math.PI) / 180);
      ctxRef.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctxRef.beginPath();
        ctxRef.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctxRef.fill();
      } else {
        ctxRef.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctxRef.restore();

      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;
    });

    pieces = pieces.filter(p => p.y < canvasRef.height + 30);
    setPieces(pieces);

    if (pieces.length > 0) {
      animIdSetter(requestAnimationFrame(() =>
        drawFallingPieces(ctxRef, canvasRef, getPieces, setPieces, animIdSetter)
      ));
    } else {
      ctxRef.clearRect(0, 0, canvasRef.width, canvasRef.height);
      animIdSetter(null);
    }
  }

  function launchPopupConfetti() {
    popupPieces = popupPieces.concat(createFallingPieces(140, popupCanvas.width, popupCanvas.height));
    if (!popupAnimationId) {
      drawFallingPieces(
        popupCtx, popupCanvas,
        () => popupPieces,
        (p) => { popupPieces = p; },
        (id) => { popupAnimationId = id; }
      );
    }
  }

  // Gentle ambient confetti trickle while popup is open
  launchPopupConfetti();
  const ambientInterval = setInterval(() => {
    if (popupOverlay.classList.contains('closing')) {
      clearInterval(ambientInterval);
      return;
    }
    popupPieces = popupPieces.concat(createFallingPieces(20, popupCanvas.width, popupCanvas.height));
    if (!popupAnimationId) launchPopupConfetti();
  }, 1400);

  openSurpriseBtn.addEventListener('click', () => {
    launchPopupConfetti();
    launchPopupConfetti();

    popupOverlay.classList.add('closing');
    siteContent.classList.remove('site-hidden');
    siteContent.classList.add('site-visible');

    setTimeout(() => {
      popupOverlay.style.display = 'none';
      clearInterval(ambientInterval);
    }, 700);
  });

  /* -----------------------------------------------------
     3. SHARED FX CANVAS — used by balloons, candles & the
        ending heart for little celebration bursts anywhere
        on the page, at any scroll position.
  ----------------------------------------------------- */
  const fxCanvas = document.getElementById('fxCanvas');
  const fxCtx = fxCanvas.getContext('2d');
  let fxParticles = [];
  let fxAnimId = null;

  function resizeFxCanvas() {
    fxCanvas.width = window.innerWidth;
    fxCanvas.height = window.innerHeight;
  }
  resizeFxCanvas();
  window.addEventListener('resize', resizeFxCanvas);

  // x, y are viewport (client) coordinates — matches a fixed-position canvas
  function burstAt(x, y, count = 26) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4.5;
      fxParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // slight upward bias
        gravity: 0.15,
        size: 5 + Math.random() * 6,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        life: 1,
        decay: 0.008 + Math.random() * 0.01,
        shape: Math.random() > 0.5 ? 'circle' : 'rect'
      });
    }
    if (!fxAnimId) runFx();
  }

  function runFx() {
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

    fxParticles.forEach(p => {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life -= p.decay;

      fxCtx.save();
      fxCtx.globalAlpha = Math.max(p.life, 0);
      fxCtx.translate(p.x, p.y);
      fxCtx.rotate((p.rotation * Math.PI) / 180);
      fxCtx.fillStyle = p.color;
      if (p.shape === 'circle') {
        fxCtx.beginPath();
        fxCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        fxCtx.fill();
      } else {
        fxCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      fxCtx.restore();
    });

    fxParticles = fxParticles.filter(p => p.life > 0);

    if (fxParticles.length > 0) {
      fxAnimId = requestAnimationFrame(runFx);
    } else {
      fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      fxAnimId = null;
    }
  }

  /* -----------------------------------------------------
     4. SPARKLES AROUND THE CAKE
  ----------------------------------------------------- */
  const sparkleField = document.getElementById('sparkleField');
  const sparkleSymbols = ['✨', '⭐', '💫'];
  const SPARKLE_COUNT = 10;

  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.textContent = sparkleSymbols[Math.floor(Math.random() * sparkleSymbols.length)];
    s.style.top = Math.random() * 100 + '%';
    s.style.left = Math.random() * 100 + '%';
    s.style.animationDelay = (Math.random() * 2) + 's';
    s.style.fontSize = (0.8 + Math.random() * 0.9) + 'rem';
    sparkleField.appendChild(s);
  }

  /* -----------------------------------------------------
     5. BALLOON POP-GAME
  ----------------------------------------------------- */
  const balloonsField = document.getElementById('balloonsField');
  const balloonsProgress = document.getElementById('balloonsProgress');
  const balloonColors = [
    ['#ff9ebb', '#ff7aa5'], // pink
    ['#c9b6ff', '#a98bff'], // lavender
    ['#ffd27a', '#ffb84d'], // gold
    ['#a8e6cf', '#7fd8b8'], // mint
    ['#9fd3ff', '#6fb8f5'], // sky blue
    ['#ffb3c6', '#ff8fab']  // rose
  ];
  const BALLOON_COUNT = 8;
  let poppedCount = 0;

  function layoutBalloons() {
    const fieldWidth = balloonsField.clientWidth;
    const slot = fieldWidth / BALLOON_COUNT;

    for (let i = 0; i < BALLOON_COUNT; i++) {
      const balloon = document.createElement('button');
      balloon.className = 'balloon';
      balloon.setAttribute('aria-label', 'Pop balloon');

      const [top, bottom] = balloonColors[i % balloonColors.length];
      balloon.style.background = `radial-gradient(circle at 35% 30%, ${top}, ${bottom})`;

      // spread balloons across the field with a little randomness per slot
      const left = slot * i + (slot - 62) / 2 + (Math.random() * 16 - 8);
      balloon.style.left = Math.max(4, left) + 'px';
      balloon.style.animationDelay = (Math.random() * 2) + 's';
      balloon.style.animationDuration = (3 + Math.random() * 1.6) + 's';

      balloon.addEventListener('click', () => popBalloon(balloon));
      balloonsField.appendChild(balloon);
    }
    updateBalloonProgress();
  }

  function popBalloon(balloon) {
    if (balloon.classList.contains('popped')) return;
    balloon.classList.add('popped');

    const rect = balloon.getBoundingClientRect();
    burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 22);

    poppedCount++;
    updateBalloonProgress();

    setTimeout(() => balloon.remove(), 400);
  }

  function updateBalloonProgress() {
    if (poppedCount >= BALLOON_COUNT) {
      balloonsProgress.textContent = 'You popped them all! 🎉';
    } else {
      balloonsProgress.textContent = `${poppedCount} / ${BALLOON_COUNT} popped`;
    }
  }

  layoutBalloons();

  /* -----------------------------------------------------
     6. INTERACTIVE CANDLES — tap to blow out, relight to redo
  ----------------------------------------------------- */
  const candleButtons = document.querySelectorAll('.candle');
  const cakeCaption = document.getElementById('cakeCaption');
  const relightBtn = document.getElementById('relightBtn');

  function blowCandle(candle) {
    if (candle.getAttribute('data-lit') === 'false') return;
    candle.setAttribute('data-lit', 'false');

    const allBlown = Array.from(candleButtons).every(c => c.getAttribute('data-lit') === 'false');
    if (allBlown) {
      cakeCaption.textContent = 'Your wish is on its way. Happy Birthday! 🎉';
      const rect = document.querySelector('.cake').getBoundingClientRect();
      burstAt(rect.left + rect.width / 2, rect.top, 60);
      relightBtn.classList.add('visible');
    }
  }

  candleButtons.forEach(candle => {
    candle.addEventListener('click', () => blowCandle(candle));
  });

  relightBtn.addEventListener('click', () => {
    candleButtons.forEach(c => c.setAttribute('data-lit', 'true'));
    cakeCaption.textContent = 'Tap each candle to blow it out, close your eyes, and wish for something wonderful.';
    relightBtn.classList.remove('visible');
  });

  /* -----------------------------------------------------
     7. STICKY NOTE / SCRAPBOOK CAROUSEL (tap, dots, swipe)
  ----------------------------------------------------- */
  const notesStack = document.getElementById('notesStack');
  const notes = document.querySelectorAll('.sticky-note');
  const nextBtn = document.getElementById('nextNoteBtn');
  const dotsContainer = document.getElementById('notesDots');
  let currentNote = 0;

  notes.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => {
      currentNote = i;
      showNote(currentNote);
    });
    dotsContainer.appendChild(dot);
  });
  const dots = document.querySelectorAll('.dot');

  function showNote(index) {
    notes.forEach((note, i) => {
      note.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    if (index === notes.length - 1) {
      nextBtn.textContent = 'The End ❤️';
      nextBtn.disabled = false;
      setTimeout(() => { nextBtn.disabled = true; }, 1200);
    } else {
      nextBtn.textContent = 'Next ➜';
      nextBtn.disabled = false;
    }
  }

  function goToNextNote() {
    if (currentNote < notes.length - 1) {
      currentNote++;
      showNote(currentNote);
    }
  }

  function goToPrevNote() {
    if (currentNote > 0) {
      currentNote--;
      showNote(currentNote);
    }
  }

  nextBtn.addEventListener('click', goToNextNote);

  // Swipe support for touch devices
  let touchStartX = 0;
  let touchStartY = 0;

  notesStack.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  notesStack.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    // only treat as a swipe if horizontal movement dominates
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        goToNextNote();
      } else {
        goToPrevNote();
      }
    }
  }, { passive: true });

  /* -----------------------------------------------------
     8. ENDING HEART — tap for one last burst of hearts
  ----------------------------------------------------- */
  const glowHeart = document.getElementById('glowHeart');

  glowHeart.addEventListener('click', () => {
    const rect = glowHeart.getBoundingClientRect();
    burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 50);
  });

  /* -----------------------------------------------------
     9. BACKGROUND MUSIC TOGGLE (no autoplay)
  ----------------------------------------------------- */
  const musicToggle = document.getElementById('musicToggle');
  const bgMusic = document.getElementById('bgMusic');
  let isPlaying = false;

  musicToggle.addEventListener('click', () => {
    if (isPlaying) {
      bgMusic.pause();
      musicToggle.textContent = '🎵';
      musicToggle.classList.remove('playing');
    } else {
      bgMusic.play().catch(() => {
        // Autoplay-policy or missing source fallback — fail silently
      });
      musicToggle.textContent = '🔇';
      musicToggle.classList.add('playing');
    }
    isPlaying = !isPlaying;
  });

});
