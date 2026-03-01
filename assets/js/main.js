/* ============================================
   HACE WAVE ENERGY - SCRIPTS PRINCIPAUX
   Version modulaire optimisée avec commentaires FR
   ============================================ */

// ====================
// 1. NAVIGATION
// ====================

// Sélection des éléments du menu
const nav = document.getElementById('nav');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

// Effet scroll sur la navigation (ajoute une ombre)
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true }); // passive:true améliore les performances

// Menu mobile : ouvrir/fermer
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    menuToggle.classList.toggle('active');
    // Bloque le scroll du body quand le menu est ouvert
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });
}

// ====================
// 2. ANIMATIONS AU SCROLL
// ====================

// Observer pour détecter quand un élément entre dans le viewport
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      // Récupère le délai si défini dans data-delay
      const delay = entry.target.dataset.delay || 0;
      // Ajoute la classe 'visible' après le délai
      setTimeout(() => entry.target.classList.add('visible'), delay * 100);
      // Ne plus observer cet élément (optimisation)
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.08,        // Déclenche à 8% de visibilité
  rootMargin: '0px 0px -30px 0px'  // Déclenche 30px avant d'être visible
});

// Applique l'observer à tous les éléments .reveal
document.querySelectorAll('.reveal').forEach(el => {
  // Si l'élément fait partie d'un groupe, ajoute un délai progressif
  const parent = el.parentElement;
  const siblings = [...parent.querySelectorAll(':scope > .reveal')];
  const index = siblings.indexOf(el);
  if (index > 0) el.dataset.delay = index;
  
  revealObserver.observe(el);
});

// ====================
// 3. ANIMATION DES COMPTEURS (métriques)
// ====================

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateValue(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

// Applique aux éléments .metric-value
document.querySelectorAll('.metric-value').forEach(el => counterObserver.observe(el));

// Fonction pour animer un nombre de 0 à sa valeur finale
function animateValue(element) {
  const text = element.textContent;
  const match = text.match(/([\d,.]+)/);
  if (!match) return;
  
  const numStr = match[1];
  const num = parseFloat(numStr.replace(/[,\s]/g, '').replace(',', '.'));
  if (isNaN(num)) return;
  
  const prefix = text.slice(0, text.indexOf(numStr));
  const suffix = text.slice(text.indexOf(numStr) + numStr.length);
  const hasDecimal = numStr.includes(',') && !numStr.includes(' ');
  const duration = 800; // Durée de l'animation en ms
  const start = performance.now();
  
  function step(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3); // Courbe d'accélération
    
    let val = num * ease;
    
    // Formatage selon le type de nombre
    if (numStr.includes(' ')) {
      // Nombre avec espaces (ex: 29 500)
      val = Math.round(val).toLocaleString('fr-FR').replace(/\u202f/g, ' ');
    } else if (hasDecimal) {
      // Nombre décimal
      val = val.toFixed(1).replace('.', ',');
    } else {
      // Nombre entier
      val = Math.round(val);
    }
    
    element.textContent = prefix + val + suffix;
    
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      // Assure la valeur finale exacte
      element.textContent = text;
    }
  }
  
  requestAnimationFrame(step);
}

// ====================
// 4. ANIMATION WAVE STAGGER (grilles)
// ====================

const waveObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      waveObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.wave-stagger').forEach(el => waveObserver.observe(el));

// ====================
// 5. FAQ - ACCORDÉON
// ====================

document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const item = button.parentElement;
    const answer = item.querySelector('.faq-answer');
    const isOpen = item.classList.contains('open');
    
    // Ferme toutes les autres FAQs
    document.querySelectorAll('.faq-item').forEach(faq => {
      faq.classList.remove('open');
      faq.querySelector('.faq-answer').style.maxHeight = null;
    });
    
    // Ouvre celle cliquée si elle était fermée
    if (!isOpen) {
      item.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// ====================
// 6. SMOOTH SCROLL (défilement doux)
// ====================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    
    if (target) {
      const yOffset = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: yOffset, behavior: 'smooth' });
    }
    
    // Ferme le menu mobile si ouvert
    if (navLinks) navLinks.classList.remove('open');
    if (menuToggle) menuToggle.classList.remove('active');
    document.body.style.overflow = '';
  });
});

// ====================
// 7. VIDÉO YOUTUBE PAR LANGUE
// ====================

// Configuration des vidéos par langue
const videoConfig = {
  fr: {
    videoId: 'pvssRtQQIFY',
    title: 'Turbine HACE en fonctionnement',
    thumbnail: 'assets/images/thumbnails/hace-video-fr.jpg'
  },
  en: {
    videoId: 'pvssRtQQIFY', // Remplacer par l'ID vidéo EN quand disponible
    title: 'HACE Turbine in Operation',
    thumbnail: 'assets/images/thumbnails/hace-video-en.jpg'
  },
  ja: {
    videoId: 'pvssRtQQIFY', // Remplacer par l'ID vidéo JA quand disponible
    title: 'HACE タービン稼働中',
    thumbnail: 'assets/images/thumbnails/hace-video-ja.jpg'
  },
  pt: {
    videoId: 'pvssRtQQIFY', // Remplacer par l'ID vidéo PT quand disponible
    title: 'Turbina HACE em Operação',
    thumbnail: 'assets/images/thumbnails/hace-video-pt.jpg'
  }
};

let currentVideoLang = 'fr';
let videoLoaded = false;

// Change la langue de la vidéo
function switchVideoLanguage(lang) {
  if (!videoConfig[lang]) return;
  
  currentVideoLang = lang;
  const container = document.getElementById('videoPlayer');
  if (!container) return;
  
  // Met à jour les onglets actifs
  document.querySelectorAll('.video-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.lang === lang);
  });
  
  // Si la vidéo n'est pas encore chargée, affiche le thumbnail
  if (!videoLoaded) {
    const config = videoConfig[lang];
    container.innerHTML = `
      <div class="video-thumbnail" onclick="loadVideo('${lang}')">
        <img src="${config.thumbnail}" alt="${config.title}" loading="lazy">
        <div class="video-play-btn"></div>
      </div>
    `;
  } else {
    // Recharge l'iframe avec la nouvelle langue
    loadVideo(lang);
  }
}

// Charge la vidéo YouTube dans un iframe
function loadVideo(lang) {
  const config = videoConfig[lang] || videoConfig.fr;
  const container = document.getElementById('videoPlayer');
  if (!container) return;
  
  videoLoaded = true;
  
  // Crée l'iframe YouTube
  container.innerHTML = `
    <iframe 
      src="https://www.youtube-nocookie.com/embed/${config.videoId}?autoplay=1&start=36&rel=0"
      title="${config.title}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"
    ></iframe>
  `;
}

// Initialise les onglets de langue vidéo
document.querySelectorAll('.video-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    switchVideoLanguage(tab.dataset.lang);
  });
});

// Initialise avec la vidéo française
document.addEventListener('DOMContentLoaded', () => {
  switchVideoLanguage('fr');
});

// ====================
// 8. SÉLECTEUR DE LANGUE (dropdown)
// ====================

// Ferme le dropdown si on clique à l'extérieur
document.addEventListener('click', (e) => {
  const langSelector = document.getElementById('langSelector');
  if (langSelector && !langSelector.contains(e.target)) {
    langSelector.classList.remove('open');
  }
});

// ====================
// 9. OPTIMISATION - LAZY LOADING
// ====================

// Le lazy loading des images est déjà géré par l'attribut loading="lazy" en HTML
// Mais voici un fallback pour les vieux navigateurs

if ('loading' in HTMLImageElement.prototype) {
  // Le navigateur supporte le lazy loading natif, rien à faire
} else {
  // Fallback pour vieux navigateurs
  const images = document.querySelectorAll('img[loading="lazy"]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}

// ====================
// 10. ANALYTICS (optionnel)
// ====================

// Fonction pour tracker les événements importants
function trackEvent(category, action, label) {
  // Si vous utilisez Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      'event_category': category,
      'event_label': label
    });
  }
  
  // Ou un autre système d'analytics
  console.log(`Event: ${category} - ${action} - ${label}`);
}

// Exemples d'utilisation :
// - Click sur "Recevoir le pitch deck"
document.querySelectorAll('a[href="#contact"]').forEach(link => {
  link.addEventListener('click', () => {
    trackEvent('CTA', 'click', 'Pitch Deck Request');
  });
});

// - Lecture de vidéo
// (déjà intégré dans loadVideo si vous ajoutez trackEvent)

console.log('✅ HACE Wave Energy - Scripts chargés avec succès');
