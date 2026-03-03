// ── Intersection Observer pour toutes les animations ──────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;

    // Révélations génériques
    if (el.classList.contains('anim-in')) {
      el.classList.add('visible');
    }

    // Barres de ratio (arg1)
    if (el.id === 'bar-hace' || el.id === 'bar-wind' || el.id === 'bar-solar') {
      const target = parseInt(el.dataset.target);
      el.style.width = target + '%';
      if (el.id === 'bar-hace') {
        const label = document.querySelector('.ratio-val-hace');
        if (label) label.textContent = '50–90%';
      }
    }

    // Scale bars (arg2)
    if (el.id === 'scale-steps') {
      el.querySelectorAll('.scale-bar').forEach((bar, i) => {
        setTimeout(() => {
          bar.style.height = bar.dataset.h + 'px';
        }, i * 150);
      });
    }

    // Usage stack (arg3)
    if (el.id === 'usage-stack') {
      el.querySelectorAll('.usage-row').forEach(row => {
        const delay = parseInt(row.dataset.delay || 0);
        setTimeout(() => row.classList.add('visible'), delay);
      });
      const total = document.getElementById('usage-total');
      if (total) setTimeout(() => total.classList.add('visible'), 900);
    }

    // Eco nodes (arg4)
    if (el.id === 'eco-nodes') {
      el.querySelectorAll('.eco-node').forEach(node => {
        const delay = parseInt(node.dataset.delay || 0);
        setTimeout(() => node.classList.add('visible'), delay);
      });
    }

    observer.unobserve(el);
  });
}, { threshold: 0.15 });

// Observer tout ce qui doit s'animer
document.querySelectorAll('.anim-in, #bar-hace, #bar-wind, #bar-solar, #scale-steps, #usage-stack, #eco-nodes').forEach(el => {
  observer.observe(el);
});
