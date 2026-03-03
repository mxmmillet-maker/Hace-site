/* NAV */
const nav=document.getElementById('nav'),menuToggle=document.getElementById('menuToggle'),navLinks=document.getElementById('navLinks');
// Garantir body déverrouillé au chargement
document.body.style.cssText='';
window.addEventListener('scroll',()=>{if(nav)nav.classList.toggle('scrolled',window.scrollY>50)},{passive:true});
// iOS-safe body lock
let _lockY=0;
function lockBody(){_lockY=window.scrollY;document.body.style.cssText='position:fixed;top:-'+_lockY+'px;width:100%;overflow-y:scroll';}
function unlockBody(){document.body.style.cssText='';window.scrollTo(0,_lockY);}
if(menuToggle&&navLinks){
  menuToggle.addEventListener('click',()=>{
    const open=navLinks.classList.toggle('open');
    menuToggle.classList.toggle('active',open);
    open?lockBody():unlockBody();
  });
  // Fermer le menu si on clique sur un lien ancre
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(a=>{a.addEventListener('click',()=>{navLinks.classList.remove('open');menuToggle.classList.remove('active');unlockBody();});});
}

/* NAV-INNER (second nav) */
(function(){
  var toggle2=document.getElementById('menuToggle2'),links2=document.getElementById('navLinks2');
  if(!toggle2||!links2) return;
  toggle2.addEventListener('click',function(){
    var open=links2.classList.toggle('open');
    toggle2.classList.toggle('active',open);
    open?lockBody():unlockBody();
  });
  links2.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(){links2.classList.remove('open');toggle2.classList.remove('active');unlockBody();});});
  links2.querySelectorAll('a:not([href^="#"])').forEach(function(a){a.addEventListener('click',function(){links2.classList.remove('open');toggle2.classList.remove('active');unlockBody();});});
})();


/* LAZY VIDEO — load only when clicked */
function loadYT(el){if(el.classList.contains('playing'))return;el.classList.add('playing');const iframe=document.createElement('iframe');iframe.src='https://www.youtube-nocookie.com/embed/pvssRtQQIFY?autoplay=1&rel=0';iframe.title='Turbine HACE en fonctionnement';iframe.allow='accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture';iframe.allowFullscreen=true;iframe.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;border:0';el.appendChild(iframe)}


/* REVEAL on scroll */
(function(){
  var els = document.querySelectorAll('.reveal');
  if(!els.length) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  },{threshold:0.08});
  els.forEach(function(el){ io.observe(el); });

  /* wave-stagger children */
  document.querySelectorAll('.wave-stagger').forEach(function(parent){
    var io2 = new IntersectionObserver(function(entries){
      if(!entries[0].isIntersecting) return;
      Array.from(parent.children).forEach(function(child,i){
        setTimeout(function(){ child.style.opacity='1'; child.style.transform='none'; }, i*80);
      });
      io2.unobserve(parent);
    },{threshold:0.1});
    io2.observe(parent);
  });
})();

/* FAQ TOGGLE */
document.querySelectorAll('.faq-question').forEach(function(btn){
  btn.addEventListener('click',function(){
    var item=btn.parentElement;
    var answer=item.querySelector('.faq-answer');
    var isOpen=item.classList.contains('open');
    // Close all
    document.querySelectorAll('.faq-item.open').forEach(function(el){
      el.classList.remove('open');
      el.querySelector('.faq-answer').style.maxHeight=null;
    });
    // Toggle current
    if(!isOpen){
      item.classList.add('open');
      answer.style.maxHeight=answer.scrollHeight+'px';
    }
  });
});

/* LANG SELECTOR — close on outside click */
document.addEventListener('click',e=>{document.querySelectorAll('.lang-selector').forEach(ls=>{if(!ls.contains(e.target))ls.classList.remove('open')})});

/* MOBILE VIDEO AUTOPLAY FALLBACK */
(function(){
  var videos=document.querySelectorAll('.hero-bg video');
  if(!videos.length)return;
  // Try to play immediately
  videos.forEach(function(v){
    var p=v.play();
    if(p&&p.catch)p.catch(function(){});
  });
  // Fallback: play on first user interaction
  function forcePlay(){
    videos.forEach(function(v){
      if(v.paused){var p=v.play();if(p&&p.catch)p.catch(function(){});}
    });
    document.removeEventListener('touchstart',forcePlay);
    document.removeEventListener('click',forcePlay);
  }
  document.addEventListener('touchstart',forcePlay,{once:true,passive:true});
  document.addEventListener('click',forcePlay,{once:true});
})();
