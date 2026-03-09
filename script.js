/* =============================================
   SHIP STUDIO — Animations & Interactions
   Full-page network + compass + glassmorphism
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // --- Network Canvas Animation (FULL PAGE) ---
  const canvas = document.getElementById('networkCanvas');
  const ctx = canvas.getContext('2d');
  let canvasW, canvasH;
  let networkMouse = { x: -9999, y: -9999 };
  let scrollY = 0;

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

      // Wrap around edges
      if (this.x < -50) this.x = canvasW + 50;
      if (this.x > canvasW + 50) this.x = -50;
      if (this.y < -50) this.y = canvasH + 50;
      if (this.y > canvasH + 50) this.y = -50;

      // Mouse repulsion
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

      // Glow for particles near mouse
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

    // Lines from mouse to nearby particles
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

  // Track mouse position (viewport coords since canvas is fixed)
  document.addEventListener('mousemove', (e) => {
    networkMouse.x = e.clientX;
    networkMouse.y = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    networkMouse.x = -9999;
    networkMouse.y = -9999;
  });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  }, { passive: true });

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

  // --- Navbar scroll ---
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
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

  // --- Animated Counters ---
  const statNums = document.querySelectorAll('.stat-num');
  let countersAnimated = false;

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countersAnimated) {
        countersAnimated = true;
        animateCounters();
      }
    });
  }, { threshold: 0.5 });

  if (statNums.length) {
    counterObserver.observe(statNums[0].parentElement);
  }

  function animateCounters() {
    statNums.forEach(num => {
      const target = parseInt(num.dataset.count);
      const duration = 1500;
      const startTime = performance.now();

      function updateCount(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        num.textContent = current;
        if (progress < 1) {
          requestAnimationFrame(updateCount);
        }
      }
      requestAnimationFrame(updateCount);
    });
  }

  // --- Testimonial Carousel ---
  const testimonials = document.querySelectorAll('.testimonial-card');
  const dots = document.querySelectorAll('.dot');
  let currentTestimonial = 0;
  let autoplayInterval;

  function showTestimonial(index) {
    testimonials.forEach(t => t.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    testimonials[index].classList.add('active');
    dots[index].classList.add('active');
    currentTestimonial = index;
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      showTestimonial(parseInt(dot.dataset.index));
      resetAutoplay();
    });
  });

  function nextTestimonial() {
    const next = (currentTestimonial + 1) % testimonials.length;
    showTestimonial(next);
  }

  function resetAutoplay() {
    clearInterval(autoplayInterval);
    autoplayInterval = setInterval(nextTestimonial, 5000);
  }

  resetAutoplay();

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

  // --- Magnetic Buttons ---
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  // --- Parallax on Hero Elements ---
  const heroTitle = document.querySelector('.hero-title');
  const heroBadge = document.querySelector('.hero-badge');
  const heroStats = document.querySelector('.hero-stats');
  const compassWrapper = document.querySelector('.compass-wrapper');

  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    if (sy < window.innerHeight) {
      const factor = sy / window.innerHeight;
      if (heroTitle) heroTitle.style.transform = `translateY(${sy * 0.15}px)`;
      if (heroBadge) heroBadge.style.opacity = 1 - factor * 1.5;
      if (heroStats) heroStats.style.transform = `translateY(${sy * 0.08}px)`;
      if (compassWrapper) compassWrapper.style.transform = `translate(-50%, -50%) scale(${1 + factor * 0.2})`;
      if (compassWrapper) compassWrapper.style.opacity = 1 - factor * 1.2;
    }
  }, { passive: true });

  // --- Timeline line animation on scroll ---
  const timelineLine = document.querySelector('.timeline-line');
  if (timelineLine) {
    const timelineSection = document.querySelector('.timeline');

    window.addEventListener('scroll', () => {
      const rect = timelineSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top < windowHeight && rect.bottom > 0) {
        const progress = Math.min(1, (windowHeight - rect.top) / (windowHeight + rect.height));
        timelineLine.style.background = `linear-gradient(to bottom, var(--gold) ${progress * 100}%, var(--border) ${progress * 100}%, transparent)`;
      }
    }, { passive: true });
  }

  // --- Card tilt effect ---
  document.querySelectorAll('.about-card, .founder-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-4px) perspective(800px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // --- Text split animation for hero ---
  const titleLines = document.querySelectorAll('.title-line');
  titleLines.forEach((line, i) => {
    line.style.transitionDelay = `${0.3 + i * 0.15}s`;
  });

});
