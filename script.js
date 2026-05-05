/**
 * ═══════════════════════════════════════════════════════════════
 *  ROMANTIC WEBSITE — script.js
 *  GitHub Pages compatible · No backend · Pure static JS
 * ═══════════════════════════════════════════════════════════════
 *
 *  EMAILJS CONFIG  ← replace these three values
 *  ─────────────────────────────────────────────────────────────
 *  Free tier: 200 emails/month, no credit card needed.
 *  Setup: https://www.emailjs.com/
 *
 *  Template variables to add in your EmailJS template:
 *    {{event_type}}  — "✅ Login" / "❌ Wrong password" / "💬 Message"
 *    {{message}}     — textarea content or wrong password text
 *    {{timestamp}}   — local date+time string
 *    {{device}}      — browser + screen size
 */

const EMAILJS_PUBLIC_KEY  = 'jBdsjw3-x3sfYDaEn';   // ← Account → API Keys
const EMAILJS_SERVICE_ID  = 'service_om9br64';   // ← Email Services → Service ID
const EMAILJS_TEMPLATE_ID = 'template_thf2g4o';  // ← Email Templates → Template ID

/** Exact password — case-sensitive */
const PASSWORD = 'Cutieee';

/* ─── EmailJS init ─────────────────────────────────────────── */
try { emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); }
catch (e) { console.warn('EmailJS init failed:', e); }

function getDevice() {
  return `${navigator.userAgent.slice(0, 100)} | ${window.innerWidth}×${window.innerHeight}`;
}

/**
 * Send an email notification.
 * @param {string} eventType  Short description of the event
 * @param {string} message    Detail / body text
 */
function notify(eventType, message) {
  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    event_type: eventType,
    message:    message || '—',
    timestamp:  new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    device:     getDevice(),
  }).catch(err => console.warn('EmailJS send error:', err));
}

/* ═══════════════════════════════════════════════════════════════
   AMBIENT CANVAS — low-count petals + glowing particles
   Single rAF loop, particle reuse pool, max-cap enforced.
   ═══════════════════════════════════════════════════════════════ */
const ambCanvas = document.getElementById('ambient-canvas');
const ambCtx    = ambCanvas.getContext('2d');

/** Particle pools */
const PETAL_MAX    = 22;   // ← max petals visible at once (was ~150+ before → 70-80% reduction)
const PARTICLE_MAX = 18;   // ← soft glow particles
let petalPool    = [];
let particlePool = [];
let showerMode   = false;
let showerTimer  = null;

function resizeAmbient() {
  ambCanvas.width  = window.innerWidth;
  ambCanvas.height = window.innerHeight;
}
resizeAmbient();
window.addEventListener('resize', resizeAmbient, { passive: true });

/** Create one petal object (reused from pool when possible) */
function makePetal(startY) {
  return {
    x:    Math.random() * ambCanvas.width,
    y:    startY ?? -20,
    vx:   (Math.random() - .5) * .9,
    vy:   .4 + Math.random() * .9,
    rot:  Math.random() * Math.PI * 2,
    rotV: (Math.random() - .5) * .035,
    w:    4  + Math.random() * 7,
    h:    6  + Math.random() * 12,
    a:    .25 + Math.random() * .4,
    hue:  328 + Math.random() * 30,
    sw:   Math.random() * Math.PI * 2,
    swS:  .008 + Math.random() * .014,
    alive: true,
  };
}

/** Create one glow particle */
function makeParticle() {
  return {
    x:    Math.random() * ambCanvas.width,
    y:    ambCanvas.height + 10,
    vx:   (Math.random() - .5) * .6,
    vy:   -(0.3 + Math.random() * .7),
    life: 1,
    decay:.004 + Math.random() * .005,
    r:    1.5 + Math.random() * 3,
    hue:  320 + Math.random() * 50,
    alive: true,
  };
}

/** Spawn rate control — only spawn if below cap */
let petalSpawnTick = 0;
let partSpawnTick  = 0;

function ambientLoop() {
  ambCtx.clearRect(0, 0, ambCanvas.width, ambCanvas.height);

  /* ── Spawn petals ── */
  petalSpawnTick++;
  const spawnEvery = showerMode ? 6 : 28;   // frames between spawns
  const spawnCount = showerMode ? 3 : 1;
  if (petalSpawnTick >= spawnEvery && petalPool.length < PETAL_MAX) {
    petalSpawnTick = 0;
    for (let i = 0; i < spawnCount && petalPool.length < PETAL_MAX; i++) {
      petalPool.push(makePetal());
    }
  }

  /* ── Spawn glow particles (slow drift upward) ── */
  partSpawnTick++;
  if (partSpawnTick >= 40 && particlePool.length < PARTICLE_MAX) {
    partSpawnTick = 0;
    particlePool.push(makeParticle());
  }

  /* ── Draw + update petals ── */
  petalPool = petalPool.filter(p => {
    p.sw += p.swS;
    p.x  += p.vx + Math.sin(p.sw) * .5;
    p.y  += p.vy;
    p.rot += p.rotV;
    if (p.y > ambCanvas.height + 30) { p.alive = false; return false; }

    ambCtx.save();
    ambCtx.translate(p.x, p.y);
    ambCtx.rotate(p.rot);
    ambCtx.globalAlpha = p.a;
    ambCtx.fillStyle   = `hsl(${p.hue},72%,76%)`;
    ambCtx.shadowColor = ambCtx.fillStyle;
    ambCtx.shadowBlur  = 3;
    ambCtx.beginPath();
    ambCtx.ellipse(0, 0, p.w * .38, p.h * .5, 0, 0, Math.PI * 2);
    ambCtx.fill();
    ambCtx.restore();
    return true;
  });

  /* ── Draw + update glow particles ── */
  particlePool = particlePool.filter(p => {
    p.x += p.vx; p.y += p.vy; p.life -= p.decay;
    if (p.life <= 0) return false;

    ambCtx.save();
    ambCtx.globalAlpha = p.life * .45;
    ambCtx.fillStyle   = `hsl(${p.hue},80%,78%)`;
    ambCtx.shadowColor = ambCtx.fillStyle;
    ambCtx.shadowBlur  = 10;
    ambCtx.beginPath();
    ambCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ambCtx.fill();
    ambCtx.restore();
    return true;
  });

  requestAnimationFrame(ambientLoop);
}
requestAnimationFrame(ambientLoop);

/** Trigger a 4s petal shower */
function petalShower() {
  showerMode = true;
  if (showerTimer) clearTimeout(showerTimer);
  showerTimer = setTimeout(() => { showerMode = false; }, 4000);
}

/* ═══════════════════════════════════════════════════════════════
   OPENING MODAL SPARKLES  (dark bg canvas)
   ═══════════════════════════════════════════════════════════════ */
(function initModalSparks() {
  const c   = document.getElementById('modal-sparks');
  const ctx = c.getContext('2d');
  let pts   = [];

  function resize() { c.width = c.offsetWidth; c.height = c.offsetHeight; }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  setInterval(() => {
    if (pts.length > 80) return;
    for (let i = 0; i < 2; i++) {
      pts.push({
        x: Math.random() * c.width, y: Math.random() * c.height,
        vx: (Math.random() - .5) * .7, vy: -(1 + Math.random() * 1.3),
        life: 1, decay: .006 + Math.random() * .009,
        r: 1.5 + Math.random() * 2.5, hue: 320 + Math.random() * 40,
      });
    }
  }, 150);

  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    pts = pts.filter(p => {
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0) return false;
      ctx.save();
      ctx.globalAlpha = p.life * .65;
      ctx.fillStyle   = ctx.shadowColor = `hsl(${p.hue},80%,76%)`;
      ctx.shadowBlur  = 7;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill(); ctx.restore();
      return true;
    });
    requestAnimationFrame(draw);
  })();
})();

/* ═══════════════════════════════════════════════════════════════
   GATE PETALS  (lightweight DOM petals for password screen)
   ═══════════════════════════════════════════════════════════════ */
let gatePetalInterval = null;

function startGatePetals() {
  const host = document.getElementById('gate-petals');
  let count = 0;
  gatePetalInterval = setInterval(() => {
    if (count >= 18) return; // cap
    const el = document.createElement('div');
    el.className = 'gate-petal';
    const startX = 10 + Math.random() * 80;
    const dur    = 4 + Math.random() * 5;
    el.style.cssText = `
      left:${startX}%;
      top:${-(Math.random()*10)}%;
      --pr:${Math.random()*360}deg;
      --pd:${Math.round(80 + Math.random()*40)}vh;
      --px:${Math.round((Math.random()-.5)*120)}px;
      animation-duration:${dur}s;
      animation-delay:${Math.random()*2}s;
      width:${6+Math.random()*5}px;
      height:${10+Math.random()*8}px;
    `;
    host.appendChild(el);
    count++;
    el.addEventListener('animationend', () => { el.remove(); count--; }, { once: true });
  }, 280);
}

function stopGatePetals() {
  clearInterval(gatePetalInterval);
  document.getElementById('gate-petals').innerHTML = '';
}

/* ═══════════════════════════════════════════════════════════════
   FLOATING TAGS  — position + bob animation
   ═══════════════════════════════════════════════════════════════ */
(function initTags() {
  const DURS = [4.6,5.4,5.0,4.2,5.8,4.9,5.3,4.7,5.1,4.4,5.6,4.3,5.2];
  const DELS = [0,1.2,2.4,3.6,.8,2.0,3.2,1.6,.4,2.8,1.0,3.0,0.6];

  const tags = Array.from(document.querySelectorAll('.tag'));

  // Place tags after layout so we know real dimensions
  function placeTags() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const PAD = 8; // min px from viewport edge
    const placed = []; // [{x,y,w,h}]

    // Split viewport into left (0–30%) and right (70–100%) columns
    // to keep the centre clear for content
    const zones = ['left', 'right'];

    function overlaps(a) {
      const GAP = 10; // min gap between tags
      return placed.some(b =>
        a.x < b.x + b.w + GAP && a.x + a.w + GAP > b.x &&
        a.y < b.y + b.h + GAP && a.y + a.h + GAP > b.y
      );
    }

    function tryPlace(tag, zone) {
      const tw = tag.offsetWidth  || 120;
      const th = tag.offsetHeight || 36;
      const maxAttempts = 60;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let x, y;
        if (zone === 'left') {
          x = PAD + Math.random() * (vw * 0.26 - tw);
        } else {
          x = vw * 0.72 + Math.random() * (vw * 0.28 - tw - PAD);
        }
        // Avoid very top (header) and very bottom
        y = vh * 0.06 + Math.random() * (vh * 0.88 - th);
        x = Math.max(PAD, Math.min(vw - tw - PAD, x));
        y = Math.max(PAD, Math.min(vh - th - PAD, y));

        const candidate = { x, y, w: tw, h: th };
        if (!overlaps(candidate)) {
          placed.push(candidate);
          return { left: x + 'px', top: y + 'px' };
        }
      }
      // Fallback: just stack without overlap check (edge case)
      const fb = { x: zone === 'left' ? PAD : vw - (tag.offsetWidth||120) - PAD,
                   y: PAD + placed.length * 44, w: tag.offsetWidth||120, h: 36 };
      placed.push(fb);
      return { left: fb.x + 'px', top: fb.y + 'px' };
    }

    // Make tags visible but measure before animating
    tags.forEach(t => {
      t.style.visibility = 'hidden';
      t.style.position   = 'absolute';
      t.style.left = '0px';
      t.style.top  = '0px';
    });

    // Need a tick for browser to compute offsetWidth
    requestAnimationFrame(() => {
      tags.forEach((tag, i) => {
        const zone = zones[i % 2];
        const pos  = tryPlace(tag, zone);
        tag.style.left = pos.left;
        tag.style.top  = pos.top;
        // Clear any old right/bottom from previous runs
        tag.style.right  = 'auto';
        tag.style.bottom = 'auto';
        tag.style.animationDuration = `${DURS[i] || 5}s`;
        tag.style.animationDelay    = `${DELS[i] || 0}s`;
        tag.style.visibility = 'visible';
      });
    });
  }

  // Initial placement
  placeTags();

  // Re-place on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(placeTags, 200);
  });

  // Click pop effect
  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      tag.classList.remove('pop');
      void tag.offsetWidth;
      tag.classList.add('pop');
      petalShower();
      setTimeout(() => tag.classList.remove('pop'), 700);
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   CURSOR TRAIL  (throttled, lightweight emoji sparks)
   ═══════════════════════════════════════════════════════════════ */
const TRAIL_CHARS = ['🌸','✿','❀','✦','💮','⭐','💕'];
const trailHost   = document.getElementById('cursor-trail');
let lastTrailTime = 0;

document.addEventListener('mousemove', e => {
  const now = Date.now();
  if (now - lastTrailTime < 70) return; // ~14fps throttle
  lastTrailTime = now;

  const el = document.createElement('span');
  el.className   = 'trail-spark';
  el.textContent = TRAIL_CHARS[Math.random() * TRAIL_CHARS.length | 0];
  el.style.left  = `${e.clientX - 8}px`;
  el.style.top   = `${e.clientY - 8}px`;
  trailHost.appendChild(el);
  setTimeout(() => el.remove(), 780);
}, { passive: true });

/* ═══════════════════════════════════════════════════════════════
   CLICK BURST
   ═══════════════════════════════════════════════════════════════ */
const BURST_CHARS = ['❤️','💕','🌸','✨','💖','💫','🌍'];
document.addEventListener('click', e => {
  if (e.target.closest('button, input, textarea, a, .popup')) return;
  const count = 5 + (Math.random() * 4 | 0);
  for (let i = 0; i < count; i++) {
    const el  = document.createElement('span');
    el.className   = 'burst-particle';
    el.textContent = BURST_CHARS[Math.random() * BURST_CHARS.length | 0];
    const angle = Math.random() * Math.PI * 2;
    const dist  = 28 + Math.random() * 44;
    el.style.left  = `${e.clientX}px`;
    el.style.top   = `${e.clientY}px`;
    el.style.fontSize = `${.65 + Math.random() * .8}rem`;
    el.style.animationDelay = `${i * 22}ms`;
    el.style.setProperty('--bx', `${Math.cos(angle) * dist}px`);
    el.style.setProperty('--by', `${Math.sin(angle) * dist}px`);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 750);
  }
});

/* ═══════════════════════════════════════════════════════════════
   EASTER EGG — type "budhuuu" anywhere
   ═══════════════════════════════════════════════════════════════ */
let keyBuffer = '';
let bannerHideTimer = null;
const easterBanner = document.getElementById('easter-banner');

document.addEventListener('keydown', e => {
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
  if (e.key.length !== 1) return;
  keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-9);
  if (!keyBuffer.includes('budhuuu')) return;
  keyBuffer = '';
  petalShower();
  if (bannerHideTimer) clearTimeout(bannerHideTimer);
  easterBanner.classList.add('show');
  bannerHideTimer = setTimeout(() => {
    easterBanner.classList.remove('show');
  }, 3200);
});

/* ═══════════════════════════════════════════════════════════════
   SCREEN FLOW
   ═══════════════════════════════════════════════════════════════ */
const openingModal  = document.getElementById('opening-modal');
const openingBtn    = document.getElementById('opening-btn');
const passwordGate  = document.getElementById('password-gate');
const mainEl        = document.getElementById('main');

/** Transition: opening modal → password gate */
openingBtn.addEventListener('click', () => {
  openingModal.classList.add('out');
  setTimeout(() => {
    openingModal.classList.add('hidden');
    passwordGate.classList.remove('hidden');
    startGatePetals();
    setTimeout(() => gateAns.focus(), 350);
  }, 850);
});

/* ═══════════════════════════════════════════════════════════════
   PASSWORD GATE LOGIC
   ═══════════════════════════════════════════════════════════════ */
const gateAns    = document.getElementById('gate-ans');
const gateErr    = document.getElementById('gate-err');
const gateUnlock = document.getElementById('gate-unlock');
const gateToggle = document.getElementById('gate-toggle');

let passVisible = false;
gateToggle.addEventListener('click', () => {
  passVisible    = !passVisible;
  gateAns.type   = passVisible ? 'text' : 'password';
  /* swap SVG eye path to show "slashed" state */
  const icon = document.getElementById('eye-icon');
  icon.style.opacity = passVisible ? '.5' : '1';
});

gateUnlock.addEventListener('click', tryUnlock);
gateAns.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });

function tryUnlock() {
  const entered = gateAns.value.trim();

  if (entered === PASSWORD) {
    /* ── Correct ── */
    gateErr.classList.remove('visible');
    notify('💝 Someone Unlocked Your Heart!', `She's in! The correct password was entered 🌸`);
    unlockSite();

  } else {
    /* ── Wrong ── */
    notify('⚠️ Wrong Password Attempt', `Entered: "${entered}"`);
    gateErr.classList.add('visible');
    gateAns.classList.add('shake');
    gateAns.addEventListener('animationend', () => gateAns.classList.remove('shake'), { once: true });
    gateAns.value = '';
    setTimeout(() => gateAns.focus(), 50);
  }
}

function unlockSite() {
  stopGatePetals();
  passwordGate.classList.add('out');
  setTimeout(() => {
    passwordGate.classList.add('hidden');
    mainEl.classList.remove('hidden');
    /* rAF double-tick forces browser to apply display:block before opacity transition */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      mainEl.classList.add('show');
      /* Now that #main is visible, sync flip card height correctly */
      syncFlipHeight();
    }));
    /* Seed a gentle petal shower on entry */
    petalShower();
  }, 850);
}

/* ═══════════════════════════════════════════════════════════════
   FLIP CARD
   ═══════════════════════════════════════════════════════════════ */
const flipInner   = document.getElementById('flipInner');
const revealBtn   = document.getElementById('revealBtn');
const flipBackBtn = document.getElementById('flipBackBtn');

function syncFlipHeight() {
  const front = document.querySelector('.flip-front');
  const back  = document.querySelector('.flip-back');
  if (flipInner.classList.contains('flipped')) {
    flipInner.style.height = back.scrollHeight + 'px';
  } else {
    flipInner.style.height = front.offsetHeight + 'px';
  }
}

revealBtn.addEventListener('click', () => {
  flipInner.classList.add('flipped');
  syncFlipHeight();
  petalShower();
});
flipBackBtn.addEventListener('click', () => {
  flipInner.classList.remove('flipped');
  syncFlipHeight();
});

// Set initial height on load (fallback)
window.addEventListener('load', () => {
  if (!flipInner.classList.contains('flipped')) syncFlipHeight();
});
window.addEventListener('resize', syncFlipHeight);

/* ═══════════════════════════════════════════════════════════════
   MESSAGE POPUP
   ═══════════════════════════════════════════════════════════════ */
const replyBtn      = document.getElementById('reply-btn');
const msgOverlay    = document.getElementById('msg-overlay');
const popupCancel   = document.getElementById('popup-cancel');
const popupCancelX  = document.getElementById('popup-cancel-x');
const popupDone     = document.getElementById('popup-done');
const msgTextarea   = document.getElementById('msg-textarea');
const doneLabel     = document.getElementById('done-label');
const doneLoading   = document.getElementById('done-loading');
const popupCompose  = document.getElementById('popup-compose');
const popupSuccess  = document.getElementById('popup-success');
const ringCanvas    = document.getElementById('ring-canvas');
const toast         = document.getElementById('toast');

function openPopup() {
  /* Reset to compose state */
  popupCompose.classList.remove('hidden');
  popupSuccess.classList.add('hidden');
  msgTextarea.value = '';
  doneLabel.classList.remove('hidden');
  doneLoading.classList.add('hidden');
  popupDone.disabled = false;
  msgOverlay.classList.add('open');
  setTimeout(() => msgTextarea.focus(), 300);
}

function closePopup() {
  msgOverlay.classList.remove('open');
}

replyBtn.addEventListener('click', openPopup);
popupCancel.addEventListener('click', closePopupWithAnimation);
popupCancelX.addEventListener('click', closePopupWithAnimation);
msgOverlay.addEventListener('click', e => { if (e.target === msgOverlay) closePopupWithAnimation(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && msgOverlay.classList.contains('open')) closePopupWithAnimation(); });

/** Cancel: blur-dissolve fade out */
function closePopupWithAnimation() {
  const popup = document.getElementById('msg-popup');
  popup.style.transition = 'transform .35s ease, opacity .35s ease';
  popup.style.transform  = 'scale(.94) translateY(10px)';
  popup.style.opacity    = '0';
  msgOverlay.style.transition = 'opacity .4s ease';
  msgOverlay.style.opacity    = '0';
  setTimeout(() => {
    msgOverlay.classList.remove('open');
    popup.style.transform  = '';
    popup.style.opacity    = '';
    msgOverlay.style.opacity = '';
    msgOverlay.style.transition = '';
  }, 420);
}

/** Done: send + ring animation + success state */
popupDone.addEventListener('click', handleDone);

async function handleDone() {
  const text = msgTextarea.value.trim();
  if (!text) {
    msgTextarea.style.borderColor = 'var(--c-rose)';
    msgTextarea.focus();
    setTimeout(() => { msgTextarea.style.borderColor = ''; }, 1400);
    return;
  }

  /* Loading state */
  doneLabel.classList.add('hidden');
  doneLoading.classList.remove('hidden');
  popupDone.disabled = true;

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      event_type: '💬 New Message from Reply button',
      message:    text,
      timestamp:  new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      device:     getDevice(),
    });

    /* 1. Trigger ring particle animation */
    playRingAnimation(() => {
      /* 2. Show success state */
      popupCompose.classList.add('hidden');
      popupSuccess.classList.remove('hidden');
      /* 3. Auto-close after 3s */
      setTimeout(closePopup, 3000);
    });

  } catch (err) {
    /* Error state */
    doneLabel.classList.remove('hidden');
    doneLoading.classList.add('hidden');
    popupDone.disabled = false;
    showToast('Oops! Something went wrong. Try again 🥺', true);
    console.warn('EmailJS error:', err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   RING PARTICLE ANIMATION
   Particles burst in a circular ring + smoke + dust
   ═══════════════════════════════════════════════════════════════ */
function playRingAnimation(onComplete) {
  const canvas = ringCanvas;
  const ctx    = canvas.getContext('2d');
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;
  let particles = [];

  /* Ring burst: 48 particles evenly spaced */
  const RING_COUNT = 48;
  for (let i = 0; i < RING_COUNT; i++) {
    const angle = (i / RING_COUNT) * Math.PI * 2;
    const speed = 2.5 + Math.random() * 2;
    particles.push({
      type: 'ring',
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1, decay: .022 + Math.random() * .01,
      r: 2.5 + Math.random() * 3,
      hue: 310 + Math.random() * 60,
    });
  }

  /* Smoke swirls: 20 particles */
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      type: 'smoke',
      x: cx + (Math.random() - .5) * 60,
      y: cy + (Math.random() - .5) * 60,
      vx: Math.cos(angle) * .5,
      vy: Math.sin(angle) * .5 - 1,
      life: 1, decay: .008 + Math.random() * .007,
      r: 14 + Math.random() * 22,
      hue: 330 + Math.random() * 40,
    });
  }

  /* Glowing dust: 30 tiny sparks */
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = .5 + Math.random() * 3;
    particles.push({
      type: 'dust',
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - .5,
      life: 1, decay: .012 + Math.random() * .015,
      r: 1 + Math.random() * 2,
      hue: 350 + Math.random() * 40,
    });
  }

  const startTime = performance.now();
  const DURATION  = 1400; // ms

  (function draw(now) {
    const elapsed = now - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles = particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0) return false;

      ctx.save();

      if (p.type === 'ring') {
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = ctx.shadowColor = `hsl(${p.hue},85%,70%)`;
        ctx.shadowBlur  = 12;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'smoke') {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        gradient.addColorStop(0, `hsla(${p.hue},60%,82%,${p.life * .18})`);
        gradient.addColorStop(1, `hsla(${p.hue},60%,82%,0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else { /* dust */
        ctx.globalAlpha = p.life * .85;
        ctx.fillStyle   = ctx.shadowColor = `hsl(${p.hue},90%,80%)`;
        ctx.shadowBlur  = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      return true;
    });

    if (elapsed < DURATION && particles.length > 0) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (onComplete) onComplete();
    }
  })(performance.now());
}

/* ═══════════════════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════════════════ */
let toastTimer = null;

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ═══════════════════════════════════════════════════════════════
   INITIALISE
   ═══════════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
  /* Seed a couple of petals immediately so background doesn't look empty */
  for (let i = 0; i < 5; i++) petalPool.push(makePetal(Math.random() * window.innerHeight));
});
