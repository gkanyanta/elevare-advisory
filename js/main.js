/* ============================================
   THE ELEVARE ADVISORY - Main JavaScript
   ============================================ */

window.Elevare = window.Elevare || {};

/* ── Navbar scroll effect ── */
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
}

/* ── Mobile menu ── */
const hamburger = document.querySelector('.hamburger');
const navLinks  = document.querySelector('.nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ── Active nav link ── */
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

/* ── Slideshow ──
   Re-runnable so it can be re-initialised after content.js
   rebuilds the slides/dots from CMS data. */
function initSlideshow() {
  const slideshow = document.querySelector('.slideshow');
  const slides   = document.querySelectorAll('.slide');
  const dots     = document.querySelectorAll('.dot');
  const prevBtn  = document.querySelector('.slide-prev');
  const nextBtn  = document.querySelector('.slide-next');
  const bar      = document.querySelector('.slide-progress-bar');

  if (!slides.length) return;
  if (slideshow && slideshow._elevareCleanup) slideshow._elevareCleanup();

  let current  = 0;
  let timer    = null;
  const DURATION = 6000;

  function goTo(idx) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
    resetBar();
  }

  function resetBar() {
    if (!bar) return;
    bar.style.transition = 'none';
    bar.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.transition = `width ${DURATION}ms linear`;
        bar.style.width = '100%';
      });
    });
  }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), DURATION);
  }

  goTo(0);
  startAuto();

  const onPrev = () => { goTo(current - 1); startAuto(); };
  const onNext = () => { goTo(current + 1); startAuto(); };
  prevBtn?.addEventListener('click', onPrev);
  nextBtn?.addEventListener('click', onNext);
  dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); startAuto(); }));

  /* Pause on hover */
  const onEnter = () => clearInterval(timer);
  slideshow?.addEventListener('mouseenter', onEnter);
  slideshow?.addEventListener('mouseleave', startAuto);

  /* Keyboard */
  const onKeydown = (e) => {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); startAuto(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); startAuto(); }
  };
  document.addEventListener('keydown', onKeydown);

  /* Touch swipe */
  let touchStartX = 0;
  const onTouchStart = e => { touchStartX = e.touches[0].clientX; };
  const onTouchEnd = e => {
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) { goTo(delta > 0 ? current + 1 : current - 1); startAuto(); }
  };
  slideshow?.addEventListener('touchstart', onTouchStart, { passive: true });
  slideshow?.addEventListener('touchend', onTouchEnd);

  if (slideshow) {
    slideshow._elevareCleanup = () => {
      clearInterval(timer);
      document.removeEventListener('keydown', onKeydown);
    };
  }
}
initSlideshow();
window.Elevare.initSlideshow = initSlideshow;

/* ── Scroll reveal ──
   Re-runnable so newly-injected CMS content (cards, lists) also animates in. */
let _revealObserver = null;
function initReveal() {
  const els = document.querySelectorAll('.reveal:not(.visible), .reveal-left:not(.visible), .reveal-right:not(.visible)');
  if (_revealObserver) _revealObserver.disconnect();
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  _revealObserver = observer;
  els.forEach(el => observer.observe(el));
}
initReveal();
window.Elevare.initReveal = initReveal;

/* ── Contact form ── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('.form-submit');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Message Sent!';
      btn.style.background = '#2e7d52';
      contactForm.reset();
      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = '';
        btn.disabled = false;
      }, 4000);
    }, 1500);
  });
}

/* ── Smooth anchor scroll (for same-page links) ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ── Counter animation for stats ──
   Re-runnable so stats rebuilt from CMS data still animate. */
function animateCounter(el, target) {
  const duration = 1800;
  const start = performance.now();
  const update = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = (el.dataset.prefix || '') + Math.floor(eased * target) + (el.dataset.suffix || '');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

let _statsObserver = null;
function initStatsCounters() {
  if (_statsObserver) _statsObserver.disconnect();
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        animateCounter(el, target);
        statsObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  _statsObserver = statsObserver;
  document.querySelectorAll('.stat-number[data-target]').forEach(el => statsObserver.observe(el));
}
initStatsCounters();
window.Elevare.initStatsCounters = initStatsCounters;

/* ── FAQ accordion ──
   Re-runnable so an FAQ list rebuilt from CMS data still expands/collapses. */
function initFaqAccordion() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    if (btn._elevareBound) return;
    btn._elevareBound = true;
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const isOpen = btn.classList.contains('open');
      document.querySelectorAll('.faq-question').forEach(b => { b.classList.remove('open'); b.nextElementSibling.classList.remove('open'); });
      if (!isOpen) { btn.classList.add('open'); answer.classList.add('open'); }
    });
  });
}
initFaqAccordion();
window.Elevare.initFaqAccordion = initFaqAccordion;
