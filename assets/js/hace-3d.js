/* HACE-3D v4 */
(function(){
/*
  HACE module = longue barge rectangulaire plate
  Ratio ~21:1 (220m x 10.5m)
  Flancs type container acier, dessus plat
  Câbles d'amarrage noirs, bouées jaunes
*/
var C = {
  hull:   0x1a3060,   // flancs bleu navy container
  top:    0x1e3d72,   // dessus légèrement plus clair
  deck:   0x243d6a,   // bande deck
  stripe: 0x53BA8F,   // trait cyan waterline
  cable:  0x1a1a1a,   // câbles noirs
  buoy:   0xf5c800,   // bouées jaunes
  ribH:   0x243870,   // renforts horizontaux flancs
  ribV:   0x1d2e5a,   // séparateurs verticaux flancs
  ocean:  0x09304d,
  deep:   0x051020
};

/* ── MODULE : barge plate allongée ── */
function makeModule(){
  var g = new THREE.Group();
  var L=11, W=0.52, H=0.38;

  // Coque principale (hull)
  var hull = new THREE.Mesh(
    new THREE.BoxGeometry(L, H, W),
    new THREE.MeshStandardMaterial({color:C.hull, roughness:0.55, metalness:0.72})
  );
  g.add(hull);

  // Dessus plat (deck)
  var deck = new THREE.Mesh(
    new THREE.BoxGeometry(L+0.02, 0.035, W+0.02),
    new THREE.MeshStandardMaterial({color:C.top, roughness:0.4, metalness:0.65})
  );
  deck.position.y = H/2+0.01; g.add(deck);

  // Waterline cyan (ligne sur toute la longueur, mi-hauteur flancs)
  var lmat = new THREE.MeshStandardMaterial({color:C.stripe, emissive:C.stripe, emissiveIntensity:0.55});
  [-W/2, W/2].forEach(function(z){
    var wl = new THREE.Mesh(new THREE.BoxGeometry(L+0.02, 0.025, 0.018), lmat);
    wl.position.set(0, 0.04, z); g.add(wl);
  });

  // Séparateurs verticaux sur les flancs (style container, 4 segments)
  var vmat = new THREE.MeshStandardMaterial({color:C.ribV, roughness:0.6, metalness:0.75});
  [-3.7, -1.2, 1.2, 3.7].forEach(function(x){
    [-W/2, W/2].forEach(function(z){
      var sep = new THREE.Mesh(new THREE.BoxGeometry(0.035, H+0.01, 0.02), vmat);
      sep.position.set(x, 0, z); g.add(sep);
    });
  });

  // Renforts horizontaux flancs (2 lignes)
  var hmat = new THREE.MeshStandardMaterial({color:C.ribH, roughness:0.55, metalness:0.7});
  [-0.08, 0.1].forEach(function(y){
    [-W/2, W/2].forEach(function(z){
      var rib = new THREE.Mesh(new THREE.BoxGeometry(L+0.02, 0.02, 0.015), hmat);
      rib.position.set(0, y, z); g.add(rib);
    });
  });

  // Caps extrémités
  var cmat = new THREE.MeshStandardMaterial({color:C.stripe, emissive:C.stripe, emissiveIntensity:0.3, roughness:0.4});
  [-L/2, L/2].forEach(function(x){
    var cap = new THREE.Mesh(new THREE.BoxGeometry(0.055, H+0.04, W+0.02), cmat);
    cap.position.x = x; g.add(cap);
  });

  // Boîtier turbine central (discret sur le deck)
  var tbmat = new THREE.MeshStandardMaterial({color:0x2a4a80, roughness:0.35, metalness:0.85});
  var tb = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 0.38), tbmat);
  tb.position.set(0, H/2+0.13, 0); g.add(tb);
  // Cheminée turbine
  var ch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.18, 8),
    new THREE.MeshStandardMaterial({color:C.stripe, emissive:C.stripe, emissiveIntensity:0.4}));
  ch.position.set(0, H/2+0.32, 0); g.add(ch);

  // Partie immergée (plus sombre)
  var sub = new THREE.Mesh(
    new THREE.BoxGeometry(L-0.1, 0.22, W-0.04),
    new THREE.MeshStandardMaterial({color:0x0c1e3a, roughness:0.9})
  );
  sub.position.y = -H/2-0.08; g.add(sub);

  return g;
}

/* ── CÂBLE entre deux Vector3 ── */
function makeCable(p1, p2){
  var mid = new THREE.Vector3().addVectors(p1,p2).multiplyScalar(0.5);
  mid.y -= 0.35;
  var curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
  var pts = curve.getPoints(14);
  var geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({color:C.cable, transparent:true, opacity:0.8}));
}

/* ── BOUÉE flottante ── */
function makeBuoy(x, z){
  var m = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 10, 8),
    new THREE.MeshStandardMaterial({color:C.buoy, emissive:C.buoy, emissiveIntensity:0.45})
  );
  m.position.set(x, -0.05, z);
  return m;
}

/* ── OCEAN ── */
function makeOcean(sz, sg){
  var geo = new THREE.PlaneGeometry(sz, sz, sg, sg);
  var m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color:C.ocean, roughness:0.05, metalness:0.28, transparent:true, opacity:0.92
  }));
  m.rotation.x = -Math.PI/2;
  var p = geo.attributes.position, oy = new Float32Array(p.count);
  for(var i=0;i<p.count;i++) oy[i]=p.getY(i);
  m._oy = oy; return m;
}

/* ── HELPER : module + câbles/bouées ── */
function addModule(sc, mods, buoys, x, z, ry){
  var m = makeModule();
  m.position.set(x, 0.1, z);
  if(ry) m.rotation.y = ry;
  sc.add(m); mods.push(m);

  // Câbles d'amarrage depuis 5 points le long du module
  var cos = Math.cos(ry||0), sin = Math.sin(ry||0);
  [-4.5,-1.8,0,1.8,4.5].forEach(function(o, idx){
    var ax = x + o*cos, az = z + o*sin;
    [1.9, -1.9].forEach(function(side){
      var bx = ax + side*sin, bz = az - side*cos;
      var b = makeBuoy(bx, bz); sc.add(b); buoys.push(b);
      sc.add(makeCable(new THREE.Vector3(ax,-0.04,az), new THREE.Vector3(bx,-0.05,bz)));
    });
  });
}

/* ── SCÈNE ── */
function makeScene(type){
  var sc = new THREE.Scene();
  sc.background = new THREE.Color(C.deep);
  sc.fog = new THREE.FogExp2(C.deep, 0.02);

  sc.add(new THREE.AmbientLight(0xb0ccee, 0.75));
  var sun = new THREE.DirectionalLight(0xd8eeff, 2.4);
  sun.position.set(10,22,12); sc.add(sun);
  var fill = new THREE.DirectionalLight(0x3366aa, 0.45);
  fill.position.set(-10,6,-8); sc.add(fill);
  var rim = new THREE.DirectionalLight(0x53BA8F, 0.35);
  rim.position.set(0,3,-16); sc.add(rim);

  var sz = type==='quinconce'?90:55;
  var oc = makeOcean(sz, type==='quinconce'?40:30);
  oc.position.y = -0.15; sc.add(oc);

  var mods=[], buoys=[];

  if(type==='solo'){
    addModule(sc, mods, buoys, 0, 0, 0);

  } else if(type==='ligne'){
    // 3 modules en ligne (même axe, espacés)
    addModule(sc, mods, buoys, -8, 0, 0);
    addModule(sc, mods, buoys,  0, 0, 0);
    addModule(sc, mods, buoys,  8, 0, 0);

  } else if(type==='quinconce'){
    // Grille décalée — 3 rangées alternées
    var rows=[
      {z:-9,  xs:[-11,-3, 5, 13]},
      {z: 0,  xs:[ -7, 1, 9]},
      {z:  9, xs:[-11,-3, 5, 13]},
    ];
    rows.forEach(function(row){
      row.xs.forEach(function(x){ addModule(sc, mods, buoys, x, row.z, 0); });
    });
  }

  return {sc:sc, oc:oc, mods:mods, buoys:buoys};
}

/* ── CAMÉRA ── */
function makeCamera(type, asp){
  var c = new THREE.PerspectiveCamera(40, asp, 0.1, 600);
  if(type==='solo'){
    c.position.set(12, 5, 8); c.lookAt(0,0,0);
  } else if(type==='ligne'){
    c.position.set(0, 22, 18); c.lookAt(0,0,0);
  } else {
    c.position.set(4, 46, 34); c.lookAt(0,-1,-2);
  }
  return c;
}

/* ── INIT ── */
function initCanvas(canvas){
  var type = canvas.dataset.haceScene;
  if(!type||canvas._hi) return; canvas._hi=true;
  var W=canvas.clientWidth||220, H=Math.round(W*0.67);
  canvas.width=W; canvas.height=H;
  var rdr=new THREE.WebGLRenderer({canvas:canvas,antialias:true});
  rdr.setSize(W,H); rdr.setPixelRatio(Math.min(window.devicePixelRatio,1.5));

  var d=makeScene(type), cam=makeCamera(type,W/H);
  var t=0, aid=null, run=false;
  var pa=d.oc.geometry.attributes.position, oy=d.oc._oy;

  function tick(){
    if(!run) return; aid=requestAnimationFrame(tick); t+=0.013;
    for(var i=0;i<pa.count;i++){
      var x=pa.getX(i),z=pa.getZ(i);
      pa.setY(i, oy[i]+Math.sin(x*0.28+t*0.85)*0.26+Math.cos(z*0.22+t*0.62)*0.15+Math.sin((x-z)*0.18+t*1.1)*0.06);
    }
    pa.needsUpdate=true; d.oc.geometry.computeVertexNormals();
    d.mods.forEach(function(m,i){ m.position.y=0.1+Math.sin(t*0.65+i*2.3)*0.042; m.rotation.z=Math.sin(t*0.5+i*1.9)*0.007; });
    d.buoys.forEach(function(b,i){ b.position.y=-0.05+Math.sin(t*0.7+i*1.3)*0.032; });
    if(type==='solo'){ cam.position.x=Math.sin(t*0.08)*14; cam.position.z=Math.cos(t*0.08)*10+3; }
    else { cam.position.x=Math.sin(t*0.05)*5; }
    cam.lookAt(0, type==='quinconce'?-1:0, type==='quinconce'?-2:0);
    rdr.render(d.sc,cam);
  }
  function go(){ if(!run){run=true;tick();} }
  function stop(){ run=false; if(aid)cancelAnimationFrame(aid); }
  new IntersectionObserver(function(e){e[0].isIntersecting?go():stop();},{threshold:0.05}).observe(canvas);
}

function boot(){ document.querySelectorAll('.hace-3d-canvas').forEach(function(c){initCanvas(c);}); }
var trig=document.querySelector('.hace-3d-canvas'); if(!trig)return;
new IntersectionObserver(function(e){
  if(!e[0].isIntersecting)return;
  if(window.THREE){boot();return;}
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s.onload=boot; document.head.appendChild(s);
},{rootMargin:'300px'}).observe(trig.closest('.tech-modular')||trig);
})();
