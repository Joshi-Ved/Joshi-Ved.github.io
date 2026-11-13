/* world.js: the 3D island, the wolf and the controls (three.js, no model files).
   Where each place sits on the island is set in PLACES below.
   You normally never need to edit this file. */
window.World = (function () {
  var R = 62;                                   // island radius
  var PLACES = {                                // x, z on the island and how close counts as "arrived"
    start:   { x: 0,   z: 6,   r: 9 },
    story:   { x: -25, z: -13, r: 9 },
    path:    { x: 5,   z: -31, r: 10 },
    builds:  { x: 35,  z: -8,  r: 14 },
    toolkit: { x: 30,  z: 27,  r: 11 },
    beyond:  { x: -4,  z: 44,  r: 10 },
    contact: { x: -39, z: 19,  r: 9 }
  };
  var POP = ['#ff6b4a', '#f5a524', '#0fa3a3', '#7c5cff', '#ff4f9a', '#2f7df6', '#22b573', '#e5383b', '#ffd23f'];

  function init(canvas, S, ui) {
    var renderer;
    try {
      if (!window.THREE) throw new Error('three missing');
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xd8f0ff, 70, 190);
    var camera = new THREE.PerspectiveCamera(42, 1, 0.5, 500);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9bc48a, 0.66));
    var sun = new THREE.DirectionalLight(0xfff2d6, 0.6); sun.position.set(30, 50, 20); scene.add(sun);

    // ---------- helpers ----------
    var seed = 20261113;
    function rnd() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    var mats = {};
    function mat(color, extra) {
      var key = color + JSON.stringify(extra || {});
      if (!mats[key]) {
        var o = { color: color, roughness: 0.9, metalness: 0, flatShading: true };
        for (var k in (extra || {})) o[k] = extra[k];
        mats[key] = new THREE.MeshStandardMaterial(o);
      }
      return mats[key];
    }
    function mesh(parent, geom, material, x, y, z) {
      var m = new THREE.Mesh(geom, material); m.position.set(x || 0, y || 0, z || 0); parent.add(m); return m;
    }
    var colliders = [];
    function collide(x, z, r) { colliders.push({ x: x, z: z, r: r }); }
    var occ = [];                               // things that duck down when they would hide the wolf
    function duck(obj, wx, wz, halfWidth, height) { occ.push({ o: obj, x: wx, z: wz, hw: halfWidth, h: height, by: obj.position.y, sy: obj.scale.y, s: 1 }); }
    var animated = [];                          // functions called every frame with (t, dt)

    // ---------- island, sea, sky ----------
    mesh(scene, new THREE.CircleGeometry(520, 48), new THREE.MeshBasicMaterial({ color: 0x35b6c9 }), 0, -0.9, 0).rotation.x = -Math.PI / 2;
    mesh(scene, new THREE.CylinderGeometry(R + 7, R + 10, 1.2, 44), mat('#f4dca4'), 0, -0.85, 0);
    mesh(scene, new THREE.CylinderGeometry(R, R + 2.5, 1.4, 44), mat('#82cc6c'), 0, -0.7, 0);
    for (var i = 0; i < 16; i++) {              // darker and lighter grass patches
      var a = rnd() * Math.PI * 2, d = rnd() * (R - 12);
      var patch = mesh(scene, new THREE.CircleGeometry(4 + rnd() * 7, 9), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x6fbd60 : 0x97d97c }), Math.cos(a) * d, 0.02, Math.sin(a) * d);
      patch.rotation.x = -Math.PI / 2;
    }
    var clouds = [];
    for (i = 0; i < 9; i++) {
      var c = new THREE.Group();
      for (var j = 0; j < 3; j++) {
        var puff = mesh(c, new THREE.IcosahedronGeometry(3 + rnd() * 2.5, 0), mat('#ffffff', { roughness: 1 }), (j - 1) * 3.6, rnd() * 1.2, rnd() * 2);
        puff.scale.y = 0.6;
      }
      c.position.set((rnd() - 0.5) * 240, 26 + rnd() * 14, -30 - rnd() * 130); scene.add(c); clouds.push(c);
    }

    // ---------- places ----------
    var order = S.chapters.filter(function (c) { return PLACES[c.id]; });
    var gems = [], pillars = [];                // pillars: world positions of project monoliths
    function ring(g, color, r) {
      var disc = mesh(g, new THREE.CircleGeometry(r, 40), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.22 }), 0, 0.04, 0);
      disc.rotation.x = -Math.PI / 2;
      var edge = mesh(g, new THREE.RingGeometry(r - 0.28, r, 48), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.85 }), 0, 0.05, 0);
      edge.rotation.x = -Math.PI / 2;
      animated.push(function (t) { edge.scale.setScalar(1 + Math.sin(t * 2) * 0.03); });
    }
    function placeholderTexture(color) {
      var cv = document.createElement('canvas'); cv.width = 320; cv.height = 220;
      var x = cv.getContext('2d');
      x.fillStyle = '#fffaf0'; x.fillRect(0, 0, 320, 220);
      x.strokeStyle = color; x.lineWidth = 6; x.setLineDash([16, 12]); x.strokeRect(14, 14, 292, 192);
      x.fillStyle = color; x.font = '700 64px sans-serif'; x.textAlign = 'center'; x.fillText('+', 160, 112);
      x.font = '600 24px sans-serif'; x.fillText('your photo', 160, 160);
      return new THREE.CanvasTexture(cv);
    }
    function board(g, wx, wz, src, color, lx, lz, ry) {   // a photo board standing in the world
      if (!src) return;
      var b = new THREE.Group(); b.position.set(lx, 0, lz); b.rotation.y = ry || 0; g.add(b);
      mesh(b, new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6), mat('#8a5a3c'), -1.7, 1.1, 0);
      mesh(b, new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6), mat('#8a5a3c'), 1.7, 1.1, 0);
      mesh(b, new THREE.BoxGeometry(4.6, 3.3, 0.22), mat(color), 0, 3.4, 0);
      var pm = new THREE.MeshBasicMaterial({ map: placeholderTexture(color) });
      mesh(b, new THREE.PlaneGeometry(4.2, 2.9), pm, 0, 3.4, 0.13);
      b.visible = !!S.settings.showPhotoSlots;
      new THREE.TextureLoader().load(src, function (tex) { pm.map = tex; pm.needsUpdate = true; b.visible = true; }, undefined, function () {});
      collide(wx + lx, wz + lz, 2.1); duck(b, wx + lx, wz + lz, 2.6, 5);
    }
    var build = {
      start: function (g, c, p) {
        var t1 = mesh(g, new THREE.ConeGeometry(3.4, 4.2, 4), mat(c), -4, 2.1, -5); t1.rotation.y = Math.PI / 4; duck(t1, p.x - 4, p.z - 5, 3, 4.2);
        var t2 = mesh(g, new THREE.ConeGeometry(2.5, 3.1, 4), mat('#ffd23f'), 3.6, 1.55, -6); t2.rotation.y = Math.PI / 4; duck(t2, p.x + 3.6, p.z - 6, 2.3, 3.1);
        collide(p.x - 4, p.z - 5, 2.7); collide(p.x + 3.6, p.z - 6, 2.1);
        for (var k = 0; k < 3; k++) { var log = mesh(g, new THREE.CylinderGeometry(0.16, 0.16, 1.5, 5), mat('#7a4a2b'), 0, 0.16, -2.6); log.rotation.set(Math.PI / 2, 0, k * 1.05); }
        var f1 = mesh(g, new THREE.ConeGeometry(0.55, 1.5, 5), mat('#ff7a1a', { emissive: 0xff5a00, emissiveIntensity: 0.7 }), 0, 0.9, -2.6);
        var f2 = mesh(g, new THREE.ConeGeometry(0.3, 0.9, 5), mat('#ffd23f', { emissive: 0xffc400, emissiveIntensity: 0.9 }), 0.1, 0.75, -2.5);
        animated.push(function (t) { f1.scale.set(1 + Math.sin(t * 9) * 0.12, 1 + Math.sin(t * 13) * 0.2, 1); f2.scale.y = 1 + Math.sin(t * 17 + 1) * 0.3; });
        collide(p.x, p.z - 2.6, 1);
        board(g, p.x, p.z, S.profile.photo, c, 7.2, -2.2, -0.4);
      },
      story: function (g, c, p) {
        var rock = mesh(g, new THREE.IcosahedronGeometry(5, 0), mat('#a3acb8'), 0, 2.3, -8); rock.scale.set(1.35, 0.85, 1);
        var cave = mesh(g, new THREE.IcosahedronGeometry(2.3, 0), mat('#2b3342'), 0, 1.1, -4.1); cave.scale.set(1.1, 0.9, 0.5);
        collide(p.x, p.z - 8, 6); duck(rock, p.x, p.z - 8, 6.5, 6.5); duck(cave, p.x, p.z - 4.1, 2.6, 3);
        [-4.2, 4.2].forEach(function (x) {
          mesh(g, new THREE.CylinderGeometry(0.1, 0.1, 2.4, 5), mat('#7a4a2b'), x, 1.2, -2.6);
          var lamp = mesh(g, new THREE.OctahedronGeometry(0.45), mat(c, { emissive: c, emissiveIntensity: 0.8 }), x, 2.7, -2.6);
          animated.push(function (t) { lamp.rotation.y = t * 1.5; lamp.material.emissiveIntensity = 0.6 + Math.sin(t * 3 + x) * 0.3; });
        });
        board(g, p.x, p.z, S.story.photos && S.story.photos[0] && S.story.photos[0].src, c, 8.2, -1.5, -0.45);
      },
      path: function (g, c, p) {
        var n = S.path.items.length, shades = ['#0fa3a3', '#22b573', '#2f7df6', '#f5a524', '#ff6b4a'];
        for (var k = 0; k < n; k++) {
          var x = (k - (n - 1) / 2) * 3.1, h = 4.2 - k * 0.5, z = -4.5 - Math.abs(x) * 0.12;
          mesh(g, new THREE.CylinderGeometry(0.13, 0.13, h, 6), mat('#8a5a3c'), x, h / 2, z);
          var plank = mesh(g, new THREE.BoxGeometry(2.3, 0.75, 0.18), mat(shades[k % shades.length]), x + 0.25, h - 0.55, z + 0.05);
          plank.rotation.z = (k % 2 ? -1 : 1) * 0.06;
          collide(p.x + x, p.z + z, 0.6);
        }
        board(g, p.x, p.z, S.path.photos && S.path.photos[0] && S.path.photos[0].src, c, 0, -9.5, 0);
      },
      builds: function (g, c, p) {
        var n = S.builds.items.length;
        for (var k = 0; k < n; k++) {
          var a = Math.PI + 0.3 + (Math.PI - 0.6) * (n === 1 ? 0.5 : k / (n - 1));
          var x = Math.cos(a) * 9.5, z = Math.sin(a) * 9.5, h = 3 + (k * 7 % 3) * 0.9, col = POP[k % POP.length];
          var pm2 = mesh(g, new THREE.BoxGeometry(1.8, h, 1.8), mat(col), x, h / 2, z); pm2.rotation.y = a; duck(pm2, p.x + x, p.z + z, 1.3, h);
          mesh(g, new THREE.BoxGeometry(2.3, 0.3, 2.3), mat('#fffaf0'), x, 0.15, z).rotation.y = a;
          var gem = mesh(g, new THREE.OctahedronGeometry(0.55), mat('#ffffff', { emissive: col, emissiveIntensity: 0.9 }), x, h + 1.1, z);
          gem.userData.baseY = h + 1.1; gems.push(gem);
          pillars.push({ x: p.x + x, z: p.z + z, y: h + 2.2, name: S.builds.items[k].name });
          collide(p.x + x, p.z + z, 1.5);
        }
      },
      toolkit: function (g, c, p) {
        var n = S.toolkit.groups.length + 1, cols = ['#ff4f9a', '#7c5cff', '#35c9e0', '#ffd23f', '#22b573', '#ff6b4a'];
        for (var k = 0; k < n; k++) {
          var a = Math.PI + 0.25 + (Math.PI - 0.5) * (k / (n - 1)), x = Math.cos(a) * 7.5, z = Math.sin(a) * 7.5;
          for (var q = 0; q < 3; q++) {
            var cr = mesh(g, new THREE.OctahedronGeometry(0.8 - q * 0.18), mat(cols[k % cols.length], { emissive: cols[k % cols.length], emissiveIntensity: 0.35, roughness: 0.4 }), x + (q - 1) * 0.9, 1.5 - q * 0.3, z + (q % 2) * 0.6);
            cr.scale.y = 2.3 - q * 0.4; cr.rotation.z = (q - 1) * 0.25;
            (function (cr, off) { var by = cr.position.y; animated.push(function (t) { cr.position.y = by + Math.sin(t * 1.4 + off) * 0.12; }); })(cr, k + q);
          }
          collide(p.x + x, p.z + z, 1.5);
        }
      },
      beyond: function (g, c, p) {
        duck(mesh(g, new THREE.ConeGeometry(8.5, 9.5, 7), mat('#7289b3'), 0, 4.75, -13), p.x, p.z - 13, 8, 12);
        duck(mesh(g, new THREE.ConeGeometry(3.2, 3.6, 7), mat('#ffffff'), 0, 7.75, -13), p.x, p.z - 13, 8, 12);
        duck(mesh(g, new THREE.ConeGeometry(5, 5.5, 6), mat('#8ea2c6'), -8, 2.75, -11), p.x - 8, p.z - 11, 5, 7);
        collide(p.x, p.z - 13, 8.6); collide(p.x - 8, p.z - 11, 5);
        var n = S.beyond.items.length;
        for (var k = 0; k < n; k++) {
          var x = (k - (n - 1) / 2) * 2.6, z = -3.2 - Math.abs(x) * 0.1;
          mesh(g, new THREE.CylinderGeometry(0.08, 0.08, 3.4, 5), mat('#fffaf0'), x, 1.7, z);
          var fl = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.3, 3), mat(POP[(k + 5) % POP.length]));
          fl.rotation.z = -Math.PI / 2; fl.position.set(x + 0.7, 2.95, z); g.add(fl);
          (function (fl, off) { animated.push(function (t) { fl.rotation.x = Math.sin(t * 3 + off) * 0.35; }); })(fl, k);
          collide(p.x + x, p.z + z, 0.5);
        }
        board(g, p.x, p.z, S.beyond.photos && S.beyond.photos[0] && S.beyond.photos[0].src, c, 9, -1.5, -0.45);
      },
      contact: function (g, c, p) {
        var tower = new THREE.Group(); g.add(tower); duck(tower, p.x, p.z - 5.5, 2.4, 13); g = tower;
        for (var k = 0; k < 4; k++) mesh(g, new THREE.CylinderGeometry(1.75 - (k + 1) * 0.16, 1.75 - k * 0.16, 2, 10), mat(k % 2 ? '#ffffff' : c), 0, 1 + k * 2, -5.5);
        mesh(g, new THREE.CylinderGeometry(1.6, 1.6, 0.3, 10), mat('#2b3342'), 0, 8.15, -5.5);
        var lamp = mesh(g, new THREE.IcosahedronGeometry(0.85, 0), mat('#ffe066', { emissive: 0xffd23f, emissiveIntensity: 1 }), 0, 9.1, -5.5);
        mesh(g, new THREE.ConeGeometry(1.4, 1.3, 10), mat(c), 0, 10.5, -5.5);
        var beam = new THREE.Group(); beam.position.set(0, 9.1, -5.5); g.add(beam);
        var cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 16, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
        cone.rotation.z = Math.PI / 2; cone.position.x = 8; beam.add(cone);
        animated.push(function (t) { beam.rotation.y = t * 0.8; lamp.material.emissiveIntensity = 0.8 + Math.sin(t * 4) * 0.3; });
        collide(p.x, p.z - 5.5, 2.3);
      }
    };
    var labels = [];
    order.forEach(function (c) {
      var p = PLACES[c.id], g = new THREE.Group(); g.position.set(p.x, 0, p.z); scene.add(g);
      ring(g, c.color, 4.2);
      if (build[c.id]) build[c.id](g, c.color, p);
      var tag = document.createElement('button');
      tag.type = 'button'; tag.className = 'label'; tag.style.setProperty('--zone', c.color); tag.textContent = c.place;
      tag.addEventListener('click', function () { travel(c.id); });
      ui.labels.appendChild(tag);
      labels.push({ el: tag, pos: new THREE.Vector3(p.x, c.id === 'contact' ? 13 : c.id === 'beyond' ? 12 : 7.5, p.z - 4), id: c.id });
    });

    // ---------- stepping-stone path linking the places ----------
    var curve = new THREE.CatmullRomCurve3(order.concat([order[0]]).map(function (c) { return new THREE.Vector3(PLACES[c.id].x, 0, PLACES[c.id].z); }), false, 'catmullrom', 0.5);
    var stonePts = curve.getSpacedPoints(190).filter(function (pt) {
      return order.every(function (c) { var p = PLACES[c.id]; return Math.hypot(pt.x - p.x, pt.z - p.z) > 5; });
    });
    var stones = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.55, 0.62, 0.14, 6), mat('#fff6e0'), stonePts.length);
    var dummy = new THREE.Object3D();
    stonePts.forEach(function (pt, k) { dummy.position.set(pt.x + (rnd() - 0.5) * 0.5, 0.07, pt.z + (rnd() - 0.5) * 0.5); dummy.rotation.y = rnd() * 3; dummy.scale.setScalar(0.8 + rnd() * 0.5); dummy.updateMatrix(); stones.setMatrixAt(k, dummy.matrix); });
    scene.add(stones);

    // ---------- trees, rocks, flowers ----------
    function clear(x, z, pad) {
      if (Math.hypot(x, z) > R - 4) return false;
      for (var k = 0; k < order.length; k++) { var p = PLACES[order[k].id]; if (Math.hypot(x - p.x, z - p.z) < p.r + pad) return false; }
      for (k = 0; k < stonePts.length; k += 2) if (Math.hypot(x - stonePts[k].x, z - stonePts[k].z) < 2.2 + pad * 0.3) return false;
      return true;
    }
    var leaf = ['#2f9e6b', '#46b37a', '#3aa56a', '#2f9e6b', '#f08a4b', '#f5b942', '#f27aa5', '#5cc9a7'];
    var placed = 0, tries = 0;
    while (placed < 95 && tries++ < 2000) {
      var tx = (rnd() - 0.5) * 2 * R, tz = (rnd() - 0.5) * 2 * R;
      if (!clear(tx, tz, 3)) continue;
      var tg = new THREE.Group(), s = 0.8 + rnd() * 0.9, col = leaf[Math.floor(rnd() * leaf.length)];
      mesh(tg, new THREE.CylinderGeometry(0.22, 0.3, 1.4, 5), mat('#8a5a3c'), 0, 0.7, 0);
      if (rnd() < 0.6) { mesh(tg, new THREE.ConeGeometry(1.5, 2.6, 6), mat(col), 0, 2.5, 0); mesh(tg, new THREE.ConeGeometry(1.1, 2, 6), mat(col), 0, 3.9, 0); }
      else mesh(tg, new THREE.IcosahedronGeometry(1.7, 0), mat(col), 0, 2.9, 0);
      tg.position.set(tx, 0, tz); tg.scale.setScalar(s); tg.rotation.y = rnd() * 6; scene.add(tg);
      collide(tx, tz, 0.75 * s); duck(tg, tx, tz, 1.6 * s, 5.2 * s); placed++;
    }
    for (i = 0; i < 26; i++) {
      var rx = (rnd() - 0.5) * 2 * R, rz = (rnd() - 0.5) * 2 * R;
      if (!clear(rx, rz, 1)) continue;
      var rk = mesh(scene, new THREE.IcosahedronGeometry(0.5 + rnd() * 0.8, 0), mat('#b4bcc6'), rx, 0.3, rz); rk.scale.y = 0.7; rk.rotation.y = rnd() * 6;
    }
    var FL = 460, flowers = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshBasicMaterial({ color: 0xffffff }), FL), fc = new THREE.Color();
    for (i = 0; i < FL; i++) {
      var fa = rnd() * Math.PI * 2, fd = Math.sqrt(rnd()) * (R - 2);
      dummy.position.set(Math.cos(fa) * fd, 0.22, Math.sin(fa) * fd); dummy.rotation.set(0, rnd() * 3, 0); dummy.scale.setScalar(0.7 + rnd() * 0.8); dummy.updateMatrix();
      flowers.setMatrixAt(i, dummy.matrix); flowers.setColorAt(i, fc.set(POP[Math.floor(rnd() * POP.length)]));
    }
    scene.add(flowers);

    // ---------- the wolf ----------
    function loft(sections, sides, jitter, pivot) {
      var rings = [], P = sections.map(function (s) { return new THREE.Vector3(s[0], s[1], s[2]); }), side = new THREE.Vector3(0, 0, 1);
      for (var i = 0; i < sections.length; i++) {
        var a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], t = b.clone().sub(a).normalize();
        var up = new THREE.Vector3().crossVectors(side, t).normalize(), rg = [];
        for (var k = 0; k < sides; k++) {
          var ang = (k / sides) * Math.PI * 2 + Math.PI / sides, j = 1 + (rnd() - 0.5) * 2 * jitter;
          rg.push(P[i].clone().addScaledVector(side, Math.cos(ang) * sections[i][3] * j).addScaledVector(up, Math.sin(ang) * sections[i][4] * j));
        }
        rings.push(rg);
      }
      var pos = [];
      function tri(a, b, c) { pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); }
      for (i = 0; i < rings.length - 1; i++) for (k = 0; k < sides; k++) {
        var k2 = (k + 1) % sides, A = rings[i][k], B = rings[i][k2], C = rings[i + 1][k2], D = rings[i + 1][k];
        tri(A, D, B); tri(B, D, C);
      }
      var first = rings[0], last = rings[rings.length - 1];
      for (k = 0; k < sides; k++) { k2 = (k + 1) % sides; tri(P[0], first[k], first[k2]); tri(P[P.length - 1], last[k2], last[k]); }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      if (pivot) g.translate(-pivot[0], -pivot[1], -pivot[2]);
      g.computeVertexNormals();
      return g;
    }
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x2b3342, roughness: 0.6, metalness: 0.15, flatShading: true, side: THREE.DoubleSide, emissive: 0x000000 });
    var darkMat = new THREE.MeshStandardMaterial({ color: 0x1c222d, roughness: 0.65, metalness: 0.1, flatShading: true, side: THREE.DoubleSide });
    var edgeMat = new THREE.LineBasicMaterial({ color: 0xff6b4a, transparent: true, opacity: 0.9 });
    var eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var avatar = new THREE.Group(); scene.add(avatar);        // moves and turns
    var wolf = new THREE.Group(); wolf.scale.setScalar(0.85); avatar.add(wolf);
    function part(parent, geom, m) {
      var me = new THREE.Mesh(geom, m || bodyMat);
      me.add(new THREE.LineSegments(new THREE.EdgesGeometry(geom, 1), edgeMat));
      parent.add(me); return me;
    }
    var TP = [0, 1.12, 0], torso = new THREE.Group(); torso.position.set(0, 1.12, 0); wolf.add(torso);
    part(torso, loft([[-1.30, 1.18, 0, 0.16, 0.20], [-1.00, 1.20, 0, 0.36, 0.42], [-0.35, 1.12, 0, 0.35, 0.39], [0.35, 1.08, 0, 0.46, 0.57], [0.80, 1.20, 0, 0.40, 0.50], [1.02, 1.30, 0, 0.24, 0.32]], 7, 0.1, TP));
    var legs = [];
    function leg(sections, pivot) { var g = new THREE.Group(); g.position.set(pivot[0], pivot[1], pivot[2]); wolf.add(g); part(g, loft(sections, 5, 0.08, pivot), darkMat); legs.push(g); }
    [0.27, -0.27].forEach(function (z) {
      leg([[0.62, 1.05, z, 0.15, 0.20], [0.66, 0.60, z, 0.10, 0.11], [0.64, 0.13, z, 0.085, 0.085], [0.82, 0.05, z, 0.10, 0.055]], [0.62, 1.05, z]);
      leg([[-0.92, 1.15, z, 0.17, 0.30], [-0.78, 0.68, z, 0.12, 0.16], [-1.05, 0.40, z, 0.08, 0.09], [-0.98, 0.13, z, 0.075, 0.08], [-0.80, 0.05, z, 0.09, 0.055]], [-0.92, 1.15, z]);
    });
    var legPhase = [0, Math.PI, Math.PI, 0];
    var TLP = [-1.22, 1.2, 0], tail = new THREE.Group(); tail.position.set(-1.22, 1.2, 0); wolf.add(tail);
    part(tail, loft([[-1.18, 1.20, 0, 0.10, 0.10], [-1.60, 1.02, 0, 0.18, 0.18], [-1.96, 0.72, 0, 0.15, 0.15], [-2.22, 0.44, 0, 0.03, 0.03]], 5, 0.14, TLP));
    var HP = [0.78, 1.32, 0], head = new THREE.Group(); head.position.set(0.78, 1.32, 0); wolf.add(head);
    part(head, loft([[0.74, 1.28, 0, 0.32, 0.42], [1.05, 1.62, 0, 0.28, 0.34], [1.26, 1.86, 0, 0.24, 0.27]], 6, 0.1, HP));
    part(head, loft([[1.10, 1.88, 0, 0.22, 0.22], [1.38, 1.95, 0, 0.33, 0.30], [1.62, 1.91, 0, 0.25, 0.23], [1.82, 1.82, 0, 0.14, 0.13], [2.12, 1.77, 0, 0.10, 0.095], [2.21, 1.76, 0, 0.05, 0.055]], 6, 0.06, HP));
    [0.2, -0.2].forEach(function (z) {
      var eg = new THREE.ConeGeometry(0.13, 0.4, 4); eg.translate(0, 0.2, 0);
      var ear = part(head, eg); ear.position.set(1.3 - HP[0], 2.17 - HP[1], z); ear.rotation.set(z > 0 ? 0.22 : -0.22, Math.PI / 4, 0.18);
      var eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), eyeMat); eye.position.set(1.66 - HP[0], 1.99 - HP[1], z * 1.02); head.add(eye);
    });
    var hit = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 2.2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    hit.position.set(0, 1.3, 0); wolf.add(hit);
    var blob = mesh(scene, new THREE.CircleGeometry(2, 20), new THREE.MeshBasicMaterial({ color: 0x1b3a1f, transparent: true, opacity: 0.25, depthWrite: false }), 0, 0.06, 0);
    blob.rotation.x = -Math.PI / 2; blob.scale.y = 0.6;
    var marker = mesh(scene, new THREE.RingGeometry(0.5, 0.7, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }), 0, 0.08, 0);
    marker.rotation.x = -Math.PI / 2;

    // ---------- sizing ----------
    var W = 1, H = 1, portrait = false;
    function resize() {
      W = window.innerWidth; H = window.innerHeight; portrait = W < H;
      renderer.setSize(W, H, false);
      camera.aspect = W / H; camera.fov = portrait ? 52 : 42; camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize); resize();

    // ---------- controls: keys, click or hold on the ground, travel ----------
    var keys = {}, target = null, running = false, holding = false, enabled = false, moved = false, path = null;
    var slideSide = 1, stall = 0, hugT = 0, hugSide = 1, travelT = 0, anx = 0, anz = 1;
    var KEYMAP = { ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r' };
    window.addEventListener('keydown', function (e) {
      if (!enabled || !KEYMAP[e.code] || e.metaKey || e.ctrlKey || e.altKey) return;
      var el = document.activeElement;
      if (el && el !== document.body && el !== canvas && e.code.indexOf('Arrow') === 0 && ui.panel.contains(el)) return;
      keys[KEYMAP[e.code]] = true; target = null; hugT = 0; path = null; e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
    window.addEventListener('blur', function () { keys = {}; holding = false; });

    var raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), gp = new THREE.Vector3();
    var downX = 0, downY = 0, onWolf = false, react = -1;
    function cast(e) { ndc.set(e.clientX / W * 2 - 1, -(e.clientY / H) * 2 + 1); raycaster.setFromCamera(ndc, camera); }
    function aim(e) {
      cast(e);
      if (!raycaster.ray.intersectPlane(groundPlane, gp)) return;
      var d = Math.hypot(gp.x, gp.z), lim = R - 3;
      if (d > lim) { gp.x *= lim / d; gp.z *= lim / d; }
      target = { x: gp.x, z: gp.z }; running = false; marker.position.set(gp.x, 0.08, gp.z); marker.material.opacity = 0.9;
      travelT = 0; hugT = 0; path = null;
    }
    canvas.addEventListener('pointerdown', function (e) {
      if (!enabled) return;
      downX = e.clientX; downY = e.clientY; cast(e);
      onWolf = raycaster.intersectObject(hit, false).length > 0;
      if (!onWolf) { holding = true; aim(e); try { canvas.setPointerCapture(e.pointerId); } catch (err) {} }
    });
    canvas.addEventListener('pointermove', function (e) { if (holding) aim(e); });
    function up(e) {
      holding = false;
      if (onWolf && Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) < 10) { howl(); if (ui.onTap) ui.onTap(); }
      else if (target) routeTo(target.x, target.z);
      onWolf = false;
    }
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    function howl() { react = 0; }
    function travel(id) {
      var p = PLACES[id]; if (!p) return;
      target = { x: p.x, z: p.z + 1.5 }; running = true; marker.material.opacity = 0; travelT = 0; hugT = 0; stall = 0;
      routeTo(target.x, target.z);
    }

    // ---------- route finding: a coarse grid + A*, so travel walks around things instead of into them ----------
    var gridStep = 1.4, gridN = Math.ceil(R * 2 / gridStep), gridMask = null;
    function buildGrid() {
      gridMask = new Uint8Array(gridN * gridN);
      for (var j = 0; j < gridN; j++) for (var i = 0; i < gridN; i++) {
        var x = -R + (i + 0.5) * gridStep, z = -R + (j + 0.5) * gridStep, bad = Math.hypot(x, z) > R - 2.6 ? 1 : 0;
        for (var k = 0; k < colliders.length && !bad; k++) {
          var c = colliders[k];
          if (Math.hypot(x - c.x, z - c.z) < c.r + 1.25) bad = 1;
        }
        gridMask[j * gridN + i] = bad;
      }
    }
    function freeCell(c) {
      if (!gridMask[c.j * gridN + c.i]) return c;
      for (var ring = 1; ring < 9; ring++) for (var dj = -ring; dj <= ring; dj++) for (var di = -ring; di <= ring; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== ring) continue;
        var i = c.i + di, j = c.j + dj;
        if (i < 0 || j < 0 || i >= gridN || j >= gridN) continue;
        if (!gridMask[j * gridN + i]) return { i: i, j: j };
      }
      return null;
    }
    function findPath(sx, sz, tx, tz) {
      if (!gridMask) buildGrid();
      var clampCell = function (x, z) {
        return { i: Math.min(gridN - 1, Math.max(0, Math.floor((x + R) / gridStep))), j: Math.min(gridN - 1, Math.max(0, Math.floor((z + R) / gridStep))) };
      };
      var s = freeCell(clampCell(sx, sz)), g = freeCell(clampCell(tx, tz));
      if (!s || !g) return null;
      var n = gridN * gridN, startI = s.j * gridN + s.i, goalI = g.j * gridN + g.i;
      if (startI === goalI) return [{ x: clearSpot(tx, tz) ? tx : -R + (g.i + 0.5) * gridStep, z: clearSpot(tx, tz) ? tz : -R + (g.j + 0.5) * gridStep }];
      if (startI === goalI) return [{ x: tx, z: tz }];
      var came = new Int32Array(n).fill(-1), gCost = new Float32Array(n).fill(1e9), fCost = new Float32Array(n).fill(1e9);
      var closed = new Uint8Array(n), open = [startI];
      gCost[startI] = 0; fCost[startI] = Math.hypot(s.i - g.i, s.j - g.j);
      var hOf = function (idx) { var i = idx % gridN, j = (idx - i) / gridN; return Math.hypot(i - g.i, j - g.j); };
      while (open.length) {
        var bi = 0;
        for (var q = 1; q < open.length; q++) if (fCost[open[q]] < fCost[open[bi]]) bi = q;
        var cur = open.splice(bi, 1)[0];
        if (cur === goalI) break;
        if (closed[cur]) continue;
        closed[cur] = 1;
        var ci = cur % gridN, cj = (cur - ci) / gridN;
        for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          var ni = ci + di, nj = cj + dj;
          if (ni < 0 || nj < 0 || ni >= gridN || nj >= gridN) continue;
          var nIdx = nj * gridN + ni;
          if (gridMask[nIdx] || closed[nIdx]) continue;
          if (di && dj && (gridMask[cj * gridN + ni] || gridMask[nj * gridN + ci])) continue;   // no cutting corners
          var nc = gCost[cur] + (di && dj ? 1.414 : 1);
          if (nc < gCost[nIdx]) { gCost[nIdx] = nc; came[nIdx] = cur; fCost[nIdx] = nc + hOf(nIdx); open.push(nIdx); }
        }
      }
      if (came[goalI] < 0) return null;
      var path = [], at = goalI;
      while (at !== startI && at >= 0) { var pi = at % gridN, pj = (at - pi) / gridN; path.push({ x: -R + (pi + 0.5) * gridStep, z: -R + (pj + 0.5) * gridStep }); at = came[at]; }
      path.reverse();
      if (clearSpot(tx, tz)) path.push({ x: tx, z: tz });      // finish exactly on the spot that was clicked, if there is room there
      return path;
    }
    function clearSpot(x, z) {
      if (Math.hypot(x, z) > R - 2.6) return false;
      for (var k = 0; k < colliders.length; k++) { var c = colliders[k]; if (Math.hypot(x - c.x, z - c.z) < c.r + 1.15) return false; }
      return true;
    }
    function routeTo(x, z) {
      path = findPath(pos.x, pos.z, x, z);
      if (path && path.length && !clearSpot(target.x, target.z)) { var e = path[path.length - 1]; target = { x: e.x, z: e.z }; }
    }
    setTimeout(function () { if (!gridMask) buildGrid(); }, 800);   // have the map ready before the first click

    // ---------- loop ----------
    function openAhead(x, z, ux, uz, d) {          // is there room to walk this way for a few metres?
      for (var s = 0.6; s <= d; s += 0.6) {
        var px = x + ux * s, pz = z + uz * s;
        for (var i = 0; i < colliders.length; i++) {
          var c = colliders[i];
          if (Math.hypot(px - c.x, pz - c.z) < c.r + 1.05) return false;
        }
      }
      return true;
    }
    var pos = new THREE.Vector3(PLACES.start.x, 0, PLACES.start.z + 1.5), heading = -0.5, phase = 0, amp = 0;
    var camLook = new THREE.Vector3(pos.x, 0, pos.z), lookOff = new THREE.Vector3();
    var active = null, activePillar = -1, panelOpen = false, edgeTarget = new THREE.Color(order[0].color);
    var v3 = new THREE.Vector3(), clock = new THREE.Clock(), t = 0;
    function frame() {
      var dt = Math.min(clock.getDelta(), 0.1); t += dt;

      // move
      if (path) while (path.length && Math.hypot(path[0].x - pos.x, path[0].z - pos.z) < 1.0) path.shift();
      var goal = target && path && path.length ? path[0] : target;
      var dx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), dz = (keys.d ? 1 : 0) - (keys.u ? 1 : 0), speed = 0, dist = 1e9;
      if (dx || dz) { var len = Math.hypot(dx, dz); dx /= len; dz /= len; speed = 12; }
      else if (goal) {
        dx = goal.x - pos.x; dz = goal.z - pos.z; dist = Math.hypot(dx, dz);
        if (dist < 0.35) { if (goal === target) { target = null; path = null; } dx = dz = 0; }
        else { dx /= dist; dz /= dist; speed = Math.min(running ? 30 : 12, dist / dt); }
      }
      var travelled = 0;
      if (speed) {
        var gx0 = dx, gz0 = dz;                                   // straight line to the goal, before dodging anything
        // ease around obstacles before bumping into them, so the wolf curves past instead of grinding against them
        var steerX = 0, steerZ = 0, seenObs = 0;
        for (var q = 0; q < colliders.length; q++) {
          var oc = colliders[q], ox = oc.x - pos.x, oz = oc.z - pos.z;
          var ahead = ox * gx0 + oz * gz0, reach = oc.r + 3.3;
          if (ahead <= 0 || ahead > reach) continue;
          if (goal && ahead > dist - 0.6) continue;                // the thing we are walking to is not an obstacle to dodge
          var lat = -ox * gz0 + oz * gx0, half = oc.r + 2.3;
          if (Math.abs(lat) > half) continue;
          var push = (1 - ahead / reach) * (1 - Math.abs(lat) / half), sgn = lat > 0 ? -1 : (lat < 0 ? 1 : -slideSide);
          steerX -= gz0 * sgn * push; steerZ += gx0 * sgn * push; seenObs = 1;
        }
        var sl2 = Math.hypot(steerX, steerZ);
        if (seenObs && sl2 < 0.05) { steerX = -gz0 * slideSide; steerZ = gx0 * slideSide; sl2 = 1; }   // perfectly head-on: pick a side and commit
        if (sl2 > 1e-4) {
          var tx2 = gx0 + steerX / sl2 * 1.4, tz2 = gz0 + steerZ / sl2 * 1.4, tl = Math.hypot(tx2, tz2);
          dx = tx2 / tl; dz = tz2 / tl;
        }
        if (hugT > 0) {                                            // walking around something: keep circling until the goal is back in open view
          hugT -= dt;
          if (hugT <= 0 || openAhead(pos.x, pos.z, gx0, gz0, 3.5)) hugT = 0;
          else { dx = -gz0 * hugSide; dz = gx0 * hugSide; }
        } else if (goal && !path && stall > 0.18) {
          hugSide = gx0 * anz - gz0 * anx >= 0 ? -1 : 1;            // commit to the free side of whatever is in the way
          hugT = 9; dx = -gz0 * hugSide; dz = gx0 * hugSide;
        }
        var px0 = pos.x, pz0 = pos.z;
        var stepLen = speed * dt, subs = Math.min(12, Math.max(2, Math.ceil(stepLen / 0.2)));   // small steps, so a fast run can't jump through a rock
        var sx = dx * stepLen / subs, sz = dz * stepLen / subs, nx = 0, nz = 1;
        for (var st = 0; st < subs; st++) {
          pos.x += sx; pos.z += sz;
          var blocked = false, ax = 0, az = 0;
          for (var k = 0; k < colliders.length; k++) {
            var c = colliders[k], cx = pos.x - c.x, cz = pos.z - c.z, cd = Math.hypot(cx, cz), min = c.r + 1.1;
            if (cd < min) {
              if (cd < 0.001) { cx = 0; cz = 1; cd = 1; }
              nx = cx / cd; nz = cz / cd;
              pos.x = c.x + nx * min; pos.z = c.z + nz * min;                  // stand outside the obstacle
              ax += nx * (min - cd); az += nz * (min - cd);                    // combined push, for the wedge case
              var into = sx * nx + sz * nz;
              if (into < 0) { sx -= into * nx; sz -= into * nz; blocked = true; }  // keep only the part of the step that slides along it
            }
          }
          if (blocked && Math.hypot(sx, sz) < stepLen / subs * 0.35) {          // dead-on hit: nothing left to slide with, so lean and walk around
            var am = Math.hypot(ax, az);
            if (am > 1e-6) { ax /= am; az /= am; } else { ax = nx; az = nz; }
            var sideX = -az, sideZ = ax, along = gx0 * sideX + gz0 * sideZ;
            if (Math.abs(along) > 0.05) slideSide = along > 0 ? 1 : -1;
            sx = sideX * slideSide * stepLen / subs; sz = sideZ * slideSide * stepLen / subs;
          }
          if (blocked && (ax || az)) { var anm = Math.hypot(ax, az); if (anm > 1e-6) { anx = ax / anm; anz = az / anm; } }
        }
        var pd = Math.hypot(pos.x, pos.z); if (pd > R - 2.5) { pos.x *= (R - 2.5) / pd; pos.z *= (R - 2.5) / pd; }
        travelled = Math.hypot(pos.x - px0, pos.z - pz0);
        if (travelled > 1e-4) {
          var want = Math.atan2(-(pos.z - pz0), pos.x - px0), diff = Math.atan2(Math.sin(want - heading), Math.cos(want - heading));
          heading += diff * Math.min(1, dt * 10);                          // face where the wolf actually goes
          phase += travelled * 1.5;
          if (!moved) { moved = true; if (ui.onMove) ui.onMove(); }
        }
        stall = travelled < stepLen * 0.05 ? stall + dt : 0;
      }
      if (target) { travelT += dt; if (travelT > 20) { target = null; running = false; path = null; stall = 0; } } else travelT = 0;
      amp += (((speed && travelled > 0.002) ? 1 : 0) - amp) * Math.min(1, dt * 8);
      marker.material.opacity = Math.max(0, marker.material.opacity - dt * (target && !running ? 0.3 : 2));
      marker.scale.setScalar(1 + Math.sin(t * 6) * 0.12);

      // wolf pose
      var kk = 0, hop = 0;
      if (react >= 0) { react += dt / 1.5; if (react >= 1) react = -1; else { kk = Math.sin(Math.min(1, react * 1.15) * Math.PI); hop = react < 0.35 ? Math.sin(react / 0.35 * Math.PI) * 0.35 : 0; } }
      for (k = 0; k < 4; k++) legs[k].rotation.z = Math.sin(phase + legPhase[k]) * 0.55 * amp;
      var breath = Math.sin(t * 1.7);
      torso.scale.set(1, 1 + breath * 0.022, 1 + breath * 0.035);
      avatar.position.set(pos.x, Math.abs(Math.sin(phase)) * 0.09 * amp + hop, pos.z);
      avatar.rotation.y = heading;
      head.rotation.z = Math.sin(t * 0.8) * 0.035 + kk * 0.62 - amp * 0.08;
      head.rotation.y = Math.sin(t * 0.45) * 0.2 * (1 - kk) * (1 - amp);
      tail.rotation.y = Math.sin(t * (1.3 + kk * 9) + phase * 0.5) * (0.2 + kk * 0.25 + amp * 0.15);
      tail.rotation.z = Math.sin(t * 0.9) * 0.08 + kk * 0.5 + amp * 0.18;
      blob.position.set(pos.x, 0.06, pos.z);
      edgeMat.color.lerp(edgeTarget, Math.min(1, dt * 4));
      bodyMat.emissive.copy(edgeMat.color); bodyMat.emissiveIntensity = 0.05 + kk * 0.35;

      // which place are we in?
      var best = null, bestD = 1e9;
      for (k = 0; k < order.length; k++) { var p = PLACES[order[k].id], d2 = Math.hypot(pos.x - p.x, pos.z - p.z); if (d2 < p.r && d2 < bestD) { best = order[k]; bestD = d2; } }
      var id = best ? best.id : null;
      if (id !== active) { active = id; if (best) edgeTarget.set(best.color); if (ui.onPlace) ui.onPlace(id); }
      var near = -1, nd = 4.6;
      if (active === 'builds') for (k = 0; k < pillars.length; k++) { var pd2 = Math.hypot(pos.x - pillars[k].x, pos.z - pillars[k].z); if (pd2 < nd) { nd = pd2; near = k; } }
      if (near !== activePillar) { activePillar = near; if (ui.onProject) ui.onProject(near); }

      // anything standing between the camera and the wolf ducks out of the way
      for (k = 0; k < occ.length; k++) {
        var e = occ[k], ez = e.z - pos.z, hide = ez > 0.8 && ez < e.h * 1.5 + 1 && Math.abs(e.x - pos.x) < e.hw + ez * 0.12;
        e.s += ((hide ? 0.1 : 1) - e.s) * Math.min(1, dt * 9);
        e.o.scale.y = e.sy * e.s; e.o.position.y = e.by * e.s;
      }

      // world life
      for (k = 0; k < animated.length; k++) animated[k](t, dt);
      for (k = 0; k < gems.length; k++) { gems[k].rotation.y = t * 1.2 + k; gems[k].position.y = gems[k].userData.baseY + Math.sin(t * 2 + k) * 0.15 + (k === activePillar ? 0.5 : 0); gems[k].scale.setScalar(k === activePillar ? 1.5 : 1); }
      for (k = 0; k < clouds.length; k++) { clouds[k].position.x += dt * 0.8; if (clouds[k].position.x > 130) clouds[k].position.x = -130; }

      // camera follows; it leans aside when the info panel is open
      v3.set(panelOpen && !portrait ? 5.5 : 0, 0, panelOpen && portrait ? 7 : 0);
      lookOff.lerp(v3, Math.min(1, dt * 3));
      v3.set(pos.x, 0, pos.z); camLook.lerp(v3, Math.min(1, dt * 5));
      camera.position.set(camLook.x + lookOff.x, portrait ? 25 : 15.5, camLook.z + lookOff.z + (portrait ? 27 : 20));
      camera.lookAt(camLook.x + lookOff.x, 1.2, camLook.z + lookOff.z);

      renderer.render(scene, camera);

      // floating name tags and the wolf's speech bubble
      for (k = 0; k < labels.length; k++) {
        var L = labels[k]; v3.copy(L.pos).project(camera);
        var on = v3.z < 1 && Math.abs(v3.x) < 1.15 && v3.y < 1.1 && v3.y > -1.2;
        L.el.style.display = on ? '' : 'none';
        if (on) L.el.style.transform = 'translate(-50%,-50%) translate(' + ((v3.x * 0.5 + 0.5) * W).toFixed(1) + 'px,' + ((-v3.y * 0.5 + 0.5) * H).toFixed(1) + 'px)';
        L.el.classList.toggle('here', L.id === active);
      }
      v3.set(pos.x, 3.4, pos.z).project(camera);
      var bx = (v3.x * 0.5 + 0.5) * W, by = (-v3.y * 0.5 + 0.5) * H, bw = ui.bubble.offsetWidth, bh = ui.bubble.offsetHeight;
      ui.bubble.style.transform = 'translate(' + Math.max(10, Math.min(W - bw - 10, bx - bw / 2)).toFixed(1) + 'px,' + Math.max(70, by - bh - 14).toFixed(1) + 'px)';

      requestAnimationFrame(frame);
    }
    frame();

    return {
      travel: travel, howl: howl,
      setEnabled: function (v) { enabled = v; if (!v) { keys = {}; holding = false; } },
      setPanelOpen: function (v) { panelOpen = v; }
    };
  }
  return { init: init };
})();
