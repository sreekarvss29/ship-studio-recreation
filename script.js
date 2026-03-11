/* =============================================
   SHIP STUDIO — Animations & Interactions
   Faithful recreation of ship-studio.co
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // --- Network Canvas Animation (FULL PAGE) ---
  const canvas = document.getElementById('networkCanvas');
  const ctx = canvas.getContext('2d');
  let canvasW, canvasH;
  let networkMouse = { x: -9999, y: -9999 };

  const NET_CONFIG = {
    particleCount: 160,
    connectionDistance: 180,
    mouseRadius: 250,
    particleSize: { min: 1, max: 2.8 },
    speed: { min: 0.08, max: 0.35 },
    baseAlpha: 0.4,
    lineAlpha: 0.12,
    mouseLineAlpha: 0.35,
    pulseSpeed: 0.001,
    colors: {
      particle: [212, 168, 83],
      particleDim: [100, 100, 100],
      line: [212, 168, 83],
      mouseLine: [232, 201, 122],
    }
  };

  let particles = [];

  function resizeCanvas() {
    canvasW = canvas.width = window.innerWidth;
    canvasH = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvasW;
      this.y = Math.random() * canvasH;
      this.size = NET_CONFIG.particleSize.min + Math.random() * (NET_CONFIG.particleSize.max - NET_CONFIG.particleSize.min);
      this.speedX = (Math.random() - 0.5) * 2 * NET_CONFIG.speed.max;
      this.speedY = (Math.random() - 0.5) * 2 * NET_CONFIG.speed.max;
      const speed = Math.sqrt(this.speedX ** 2 + this.speedY ** 2);
      if (speed < NET_CONFIG.speed.min) {
        const scale = NET_CONFIG.speed.min / speed;
        this.speedX *= scale;
        this.speedY *= scale;
      }
      this.pulseOffset = Math.random() * Math.PI * 2;
    }

    update(time) {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.x < -50) this.x = canvasW + 50;
      if (this.x > canvasW + 50) this.x = -50;
      if (this.y < -50) this.y = canvasH + 50;
      if (this.y > canvasH + 50) this.y = -50;

      const dx = this.x - networkMouse.x;
      const dy = this.y - networkMouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < NET_CONFIG.mouseRadius && dist > 0) {
        const force = (NET_CONFIG.mouseRadius - dist) / NET_CONFIG.mouseRadius * 0.6;
        this.x += (dx / dist) * force;
        this.y += (dy / dist) * force;
      }

      this.alpha = NET_CONFIG.baseAlpha + Math.sin(time * NET_CONFIG.pulseSpeed + this.pulseOffset) * 0.12;
    }

    draw() {
      const distToMouse = Math.sqrt(
        (this.x - networkMouse.x) ** 2 + (this.y - networkMouse.y) ** 2
      );
      const mouseInfluence = Math.max(0, 1 - distToMouse / NET_CONFIG.mouseRadius);

      const c = NET_CONFIG.colors.particle;
      const cd = NET_CONFIG.colors.particleDim;
      const r = cd[0] + (c[0] - cd[0]) * (0.3 + mouseInfluence * 0.7);
      const g = cd[1] + (c[1] - cd[1]) * (0.3 + mouseInfluence * 0.7);
      const b = cd[2] + (c[2] - cd[2]) * (0.3 + mouseInfluence * 0.7);

      const alpha = this.alpha + mouseInfluence * 0.5;
      const size = this.size + mouseInfluence * 1.8;

      if (mouseInfluence > 0.2) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${mouseInfluence * 0.06})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < NET_CONFIG.particleCount; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < NET_CONFIG.connectionDistance) {
          const alpha = (1 - dist / NET_CONFIG.connectionDistance);
          const midX = (particles[i].x + particles[j].x) / 2;
          const midY = (particles[i].y + particles[j].y) / 2;
          const mouseDistToLine = Math.sqrt(
            (midX - networkMouse.x) ** 2 + (midY - networkMouse.y) ** 2
          );
          const mouseInfluence = Math.max(0, 1 - mouseDistToLine / (NET_CONFIG.mouseRadius * 1.5));

          const c = NET_CONFIG.colors.line;
          const cm = NET_CONFIG.colors.mouseLine;
          const r = c[0] + (cm[0] - c[0]) * mouseInfluence;
          const g = c[1] + (cm[1] - c[1]) * mouseInfluence;
          const b = c[2] + (cm[2] - c[2]) * mouseInfluence;

          const lineAlpha = alpha * (NET_CONFIG.lineAlpha + mouseInfluence * NET_CONFIG.mouseLineAlpha);

          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineAlpha})`;
          ctx.lineWidth = 0.5 + mouseInfluence * 1;
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const dx = particles[i].x - networkMouse.x;
      const dy = particles[i].y - networkMouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < NET_CONFIG.mouseRadius) {
        const alpha = (1 - dist / NET_CONFIG.mouseRadius) * 0.25;
        const c = NET_CONFIG.colors.mouseLine;
        ctx.beginPath();
        ctx.moveTo(networkMouse.x, networkMouse.y);
        ctx.lineTo(particles[i].x, particles[i].y);
        ctx.strokeStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  function animateNetwork(time) {
    ctx.clearRect(0, 0, canvasW, canvasH);
    particles.forEach(p => p.update(time));
    drawConnections();
    particles.forEach(p => p.draw());
    requestAnimationFrame(animateNetwork);
  }

  document.addEventListener('mousemove', (e) => {
    networkMouse.x = e.clientX;
    networkMouse.y = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    networkMouse.x = -9999;
    networkMouse.y = -9999;
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
    if (canvasW < 768) {
      NET_CONFIG.particleCount = 60;
      NET_CONFIG.connectionDistance = 130;
    } else {
      NET_CONFIG.particleCount = 160;
      NET_CONFIG.connectionDistance = 180;
    }
    initParticles();
  });

  resizeCanvas();
  if (canvasW < 768) {
    NET_CONFIG.particleCount = 60;
    NET_CONFIG.connectionDistance = 130;
  }
  initParticles();
  requestAnimationFrame(animateNetwork);

  // --- Cursor Glow ---
  const glow = document.getElementById('cursorGlow');
  let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateGlow() {
    glowX += (mouseX - glowX) * 0.06;
    glowY += (mouseY - glowY) * 0.06;
    glow.style.left = glowX + 'px';
    glow.style.top = glowY + 'px';
    requestAnimationFrame(animateGlow);
  }
  animateGlow();

  // --- Navbar scroll + active section ---
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  const navSeason = document.querySelector('.nav-season');
  const sections = document.querySelectorAll('[id]');

  window.addEventListener('scroll', () => {
    // Scrolled state
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    // Active section highlighting
    let currentSection = '';
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 200 && rect.bottom > 200) {
        currentSection = section.id;
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.dataset.section === currentSection) {
        link.classList.add('active');
      }
    });

    // Gold season text when scrolled past hero
    if (window.scrollY > window.innerHeight * 0.5) {
      navSeason.classList.add('active');
    } else {
      navSeason.classList.remove('active');
    }
  }, { passive: true });

  // --- Mobile Menu ---
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });

  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // --- Scroll Reveal ---
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // --- Gold connecting line: canvas draws between the 4 illustrations on scroll ---
  const lineCanvas = document.getElementById('manifestoLineCanvas');
  const manifestoSec = document.querySelector('.manifesto-section');
  const illustrations = document.querySelectorAll('.ms-illustration');

  if (lineCanvas && manifestoSec && illustrations.length >= 2) {
    const lineCtx = lineCanvas.getContext('2d');
    let cachedCenters = [];

    function setupLineCanvas() {
      // Set canvas to cover the full manifesto section
      lineCanvas.width = manifestoSec.scrollWidth;
      lineCanvas.height = manifestoSec.scrollHeight;

      // Compute illustration centers relative to the manifesto section
      cachedCenters = [];
      const secTop = manifestoSec.getBoundingClientRect().top + window.scrollY;
      const secLeft = manifestoSec.getBoundingClientRect().left;

      illustrations.forEach(ill => {
        const r = ill.getBoundingClientRect();
        cachedCenters.push({
          x: r.left - secLeft + r.width / 2,
          y: (r.top + window.scrollY) - secTop + r.height / 2
        });
      });
    }

    function drawGoldLine() {
      if (cachedCenters.length < 2) return;

      const wh = window.innerHeight;
      const secTop = manifestoSec.getBoundingClientRect().top + window.scrollY;

      // Progress: 0 when first illustration enters viewport, 1 when last illustration is centered
      const firstIllY = secTop + cachedCenters[0].y;
      const lastIllY = secTop + cachedCenters[cachedCenters.length - 1].y;

      // Start when first illustration is near center of viewport
      const startScroll = firstIllY - wh * 0.7;
      // End when last illustration reaches center of viewport
      const endScroll = lastIllY - wh * 0.4;

      const currentScroll = window.scrollY;
      const progress = Math.max(0, Math.min(1, (currentScroll - startScroll) / (endScroll - startScroll)));

      // Segment lengths between consecutive illustration centers
      let totalLen = 0;
      const segs = [];
      for (let i = 0; i < cachedCenters.length - 1; i++) {
        const dx = cachedCenters[i + 1].x - cachedCenters[i].x;
        const dy = cachedCenters[i + 1].y - cachedCenters[i].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        segs.push(len);
        totalLen += len;
      }

      const drawLen = progress * totalLen;

      // Clear
      lineCtx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
      if (drawLen <= 0) return;

      // Draw progressive line
      lineCtx.save();
      lineCtx.beginPath();
      lineCtx.moveTo(cachedCenters[0].x, cachedCenters[0].y);

      let drawn = 0;
      for (let i = 0; i < segs.length; i++) {
        const remaining = drawLen - drawn;
        if (remaining <= 0) break;

        if (remaining >= segs[i]) {
          lineCtx.lineTo(cachedCenters[i + 1].x, cachedCenters[i + 1].y);
          drawn += segs[i];
        } else {
          const t = remaining / segs[i];
          lineCtx.lineTo(
            cachedCenters[i].x + (cachedCenters[i + 1].x - cachedCenters[i].x) * t,
            cachedCenters[i].y + (cachedCenters[i + 1].y - cachedCenters[i].y) * t
          );
          break;
        }
      }

      // Main gold stroke
      lineCtx.strokeStyle = 'rgba(212, 168, 83, 0.85)';
      lineCtx.lineWidth = 2.5;
      lineCtx.lineCap = 'round';
      lineCtx.lineJoin = 'round';
      lineCtx.shadowColor = 'rgba(212, 168, 83, 0.5)';
      lineCtx.shadowBlur = 20;
      lineCtx.stroke();

      // Brighter core
      lineCtx.strokeStyle = 'rgba(232, 201, 122, 0.6)';
      lineCtx.lineWidth = 1;
      lineCtx.shadowBlur = 0;
      lineCtx.stroke();
      lineCtx.restore();

      // Glowing dots at reached illustration centers
      let distSoFar = 0;
      for (let i = 0; i < cachedCenters.length; i++) {
        if (drawLen >= distSoFar) {
          const glow = Math.min(1, (drawLen - distSoFar) / 80);
          // Outer glow
          lineCtx.beginPath();
          lineCtx.arc(cachedCenters[i].x, cachedCenters[i].y, 18, 0, Math.PI * 2);
          lineCtx.fillStyle = `rgba(212, 168, 83, ${0.2 * glow})`;
          lineCtx.fill();
          // Dot
          lineCtx.beginPath();
          lineCtx.arc(cachedCenters[i].x, cachedCenters[i].y, 4, 0, Math.PI * 2);
          lineCtx.fillStyle = `rgba(232, 201, 122, ${0.9 * glow})`;
          lineCtx.fill();
        }
        if (i < segs.length) distSoFar += segs[i];
      }
    }

    // Initial setup after layout settles
    setTimeout(() => {
      setupLineCanvas();
      drawGoldLine();
    }, 200);

    window.addEventListener('resize', () => {
      setupLineCanvas();
      drawGoldLine();
    });

    window.addEventListener('scroll', drawGoldLine, { passive: true });
  }

  // --- Smooth Scroll for Nav Links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // --- Parallax on Hero compass ---
  const compassWrapper = document.getElementById('compassWrapper');

  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    if (sy < window.innerHeight) {
      const factor = sy / window.innerHeight;
      if (compassWrapper) {
        compassWrapper.style.transform = `translate(-50%, -50%) scale(${1 + factor * 0.12})`;
        compassWrapper.style.opacity = 1 - factor * 1.1;
      }
    }
  }, { passive: true });

  // --- Program timeline line animation ---
  const ptLine = document.querySelector('.pt-line');
  if (ptLine) {
    const programSection = document.querySelector('.program-timeline');
    window.addEventListener('scroll', () => {
      const rect = programSection.getBoundingClientRect();
      const wh = window.innerHeight;
      if (rect.top < wh && rect.bottom > 0) {
        const progress = Math.min(1, (wh - rect.top) / (wh + rect.height));
        ptLine.style.background = `linear-gradient(to bottom, var(--gold) ${progress * 100}%, rgba(212, 168, 83, 0.15) ${progress * 100}%, transparent)`;
      }
    }, { passive: true });
  }

  // --- Card hover effects ---
  document.querySelectorAll('.mentor-card, .faq-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // --- Manifesto illustrations glow on scroll ---
  const manifestoIllustrations = document.querySelectorAll('.ms-illustration');
  const illustrationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('glowing');
      } else {
        entry.target.classList.remove('glowing');
      }
    });
  }, { threshold: 0.5 });

  manifestoIllustrations.forEach(el => illustrationObserver.observe(el));

});
