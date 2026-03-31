// Nav scroll shadow
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 12);
  });
}

// Scroll reveal
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Animated counters
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;
    el.textContent = prefix + (Number.isInteger(target) ? Math.round(value) : value.toFixed(1)) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target);
      counterObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

// Pipeline funnel bar animations
const funnelWrap = document.querySelector('.funnel-chart-wrap');
if (funnelWrap) {
  const funnelObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.funnel-bar').forEach((bar, i) => {
          setTimeout(() => bar.classList.add('animated'), i * 160);
        });
        funnelObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  funnelObserver.observe(funnelWrap);
}

// Integrations accordion (multi-open)
document.querySelectorAll('.int-acc-trigger').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.int-acc-item').classList.toggle('open');
  });
});

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// Contact form
const submitBtn = document.getElementById('submit-btn');
if (submitBtn) {
  submitBtn.closest('form').addEventListener('submit', e => {
    e.preventDefault();
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Message sent!';
    submitBtn.style.background = '#16a34a';
    submitBtn.disabled = true;
  });
}

// Mouse parallax on hero orbs
const heroOrbs = document.querySelectorAll('.hero-orb');
if (heroOrbs.length) {
  document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth - 0.5) * 24;
    const y = (e.clientY / window.innerHeight - 0.5) * 18;
    heroOrbs.forEach((orb, i) => {
      const depth = (i + 1) * 0.4;
      orb.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
    });
  });
}

// Card 3D tilt on mouse move
document.querySelectorAll('.tier-card, .case-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// Typewriter effect on hero headline spans marked .typewriter-word
const typewriterEl = document.querySelector('.typewriter-cycle');
if (typewriterEl) {
  const words = JSON.parse(typewriterEl.dataset.words || '[]');
  let idx = 0;
  let charIdx = 0;
  let deleting = false;

  function typeStep() {
    const word = words[idx];
    if (!deleting) {
      typewriterEl.textContent = word.substring(0, charIdx + 1);
      charIdx++;
      if (charIdx === word.length) {
        deleting = true;
        setTimeout(typeStep, 2200);
        return;
      }
    } else {
      typewriterEl.textContent = word.substring(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        idx = (idx + 1) % words.length;
      }
    }
    setTimeout(typeStep, deleting ? 45 : 85);
  }

  if (words.length) typeStep();
}
