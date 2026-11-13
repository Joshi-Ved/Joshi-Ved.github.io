/* app.js: builds every card from content.js and connects it to the world.
   You normally never need to edit this file. */
(function () {
  var S = window.SITE;
  var POP = ['#ff6b4a', '#f5a524', '#0fa3a3', '#7c5cff', '#ff4f9a', '#2f7df6', '#22b573', '#e5383b', '#ffd23f'];
  var $ = function (id) { return document.getElementById(id); };

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function tagList(items) { return el('ul', { class: 'tags' }, items.map(function (i) { return el('li', { text: i }); })); }
  function linkBtn(l, primary) { return el('a', { class: 'btn' + (primary ? ' primary' : ''), href: l.url, target: '_blank', rel: 'noopener', text: l.label + ' ↗' }); }

  // A photo slot: shows the image if the file exists, otherwise an "Add a photo" box (or nothing).
  function photo(p, cls) {
    if (!p || !p.src) return null;
    var fig = el('figure', { class: 'photo' + (cls ? ' ' + cls : '') }), img = new Image();
    img.alt = p.caption || ''; img.loading = 'lazy';
    img.onerror = function () {
      if (!S.settings.showPhotoSlots) { fig.remove(); return; }
      fig.textContent = ''; fig.classList.add('empty');
      fig.appendChild(el('span', { text: '+ Add a photo' }));
      fig.appendChild(el('code', { text: p.src }));
      if (p.caption) fig.appendChild(el('figcaption', { text: p.caption }));
    };
    img.src = p.src; fig.appendChild(img);
    if (p.caption) fig.appendChild(el('figcaption', { text: p.caption }));
    return fig;
  }
  function gallery(list) { return list && list.length ? el('div', { class: 'photos' }, list.map(function (p) { return photo(p); })) : null; }

  // ---------- one renderer per place; used by the panel and by the page view ----------
  var projectRows = [];           // rows of the Workshop list currently on screen
  var render = {
    start: function (big) {
      var p = S.profile;
      return [
        photo({ src: p.photo, caption: p.name }, 'portrait'),
        el('p', { class: 'eyebrow', text: p.eyebrow }),
        el(big ? 'h1' : 'h2', { text: p.name }),
        el('p', { class: 'motto', text: p.motto }),
        el('p', { text: p.intro }),
        el('div', { class: 'links' }, p.links.map(function (l) { return linkBtn(l); }))
      ];
    },
    story: function () {
      return [el('h2', { text: S.story.title })]
        .concat(S.story.paragraphs.map(function (t) { return el('p', { text: t }); }))
        .concat([el('div', { class: 'stats' }, S.story.stats.map(function (s) { return el('div', {}, [el('strong', { text: s.value }), el('span', { text: s.label })]); })), gallery(S.story.photos)]);
    },
    path: function () {
      return [el('h2', { text: S.path.title }), el('ol', { class: 'timeline' }, S.path.items.map(function (i) {
        var h = el('h3', { text: i.role + ' ' }); h.appendChild(el('span', { text: '· ' + i.where }));
        return el('li', {}, [el('time', { text: i.when }), h, el('p', { text: i.note })]);
      })), gallery(S.path.photos)];
    },
    builds: function (big, inPanel) {
      var B = S.builds, tags = ['All'], rows = [];
      B.items.forEach(function (i) { i.tags.forEach(function (t) { if (tags.indexOf(t) < 0) tags.push(t); }); });
      var list = el('ul', { class: 'builds' }, B.items.map(function (item, idx) {
        var name = el('span', { class: 'name', text: item.name });
        if (item.status) name.appendChild(el('em', { text: item.status }));
        var head = el('button', { class: 'build-head', type: 'button', 'aria-expanded': 'false' }, [name, el('span', { class: 'plus', 'aria-hidden': 'true', text: '+' }), el('span', { class: 'line', text: item.line })]);
        var body = el('div', { class: 'build-body', hidden: '' }, [
          photo(item.image ? { src: item.image, caption: '' } : null, 'wide'),
          el('p', { text: item.detail }), tagList(item.stack),
          item.url ? el('a', { href: item.url, target: '_blank', rel: 'noopener', text: 'View the code on GitHub ↗' }) : null
        ]);
        var li = el('li', {}, [head, body]); li.style.setProperty('--c', POP[idx % POP.length]);
        var row = { li: li, tags: item.tags, open: function (on, scroll) {
          if (on) rows.forEach(function (r) { if (r !== row) r.open(false); });
          head.setAttribute('aria-expanded', on ? 'true' : 'false'); body.hidden = !on; li.classList.toggle('open', on);
          if (on && scroll) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } };
        head.addEventListener('click', function () { row.open(head.getAttribute('aria-expanded') !== 'true'); });
        rows.push(row); return li;
      }));
      var chips = el('div', { class: 'chips', role: 'group', 'aria-label': 'Filter projects' }, tags.map(function (t, i) {
        var b = el('button', { class: 'chip', type: 'button', 'aria-pressed': i === 0 ? 'true' : 'false', text: t });
        b.addEventListener('click', function () {
          chips.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
          rows.forEach(function (r) { r.li.hidden = !(t === 'All' || r.tags.indexOf(t) >= 0); });
        });
        return b;
      }));
      if (inPanel) projectRows = rows;
      return [el('h2', { text: B.title }), el('p', { class: 'dim', text: inPanel ? B.hint : 'Filter by theme, then open a project.' }), chips, list];
    },
    toolkit: function () {
      var T = S.toolkit;
      var groups = T.groups.map(function (g, i) { var d = el('div', { class: 'group' }, [el('h3', { text: g.name }), tagList(g.items)]); d.style.setProperty('--c', POP[(i + 3) % POP.length]); return d; });
      groups.push(el('div', { class: 'group learning' }, [el('h3', { text: 'Learning now' }), tagList(T.learning)]));
      return [el('h2', { text: T.title })].concat(groups);
    },
    beyond: function () {
      var B = S.beyond;
      return [
        el('h2', { text: B.title }),
        el('ul', { class: 'plain' }, B.items.map(function (i, k) { var li = el('li', {}, [el('strong', { text: i.name }), el('span', { text: i.note })]); li.style.setProperty('--c', POP[(k + 5) % POP.length]); return li; })),
        gallery(B.photos),
        el('p', { class: 'eyebrow', text: 'Off the clock' }), tagList(B.interests)
      ];
    },
    contact: function () {
      return [el('h2', { text: S.contact.title }), el('p', { text: S.contact.text }),
        el('div', { class: 'links' }, S.profile.links.map(function (l, i) { return linkBtn(l, i === S.profile.links.length - 1); }))];
    }
  };
  var chapters = S.chapters.filter(function (c) { return render[c.id]; });
  function chapterOf(id) { return chapters.filter(function (c) { return c.id === id; })[0]; }

  document.title = S.profile.name;
  $('brand').textContent = S.profile.name;

  // ---------- wolf speech bubble ----------
  var bubble = $('bubble'), bubbleTimer;
  function say(text, label, color) {
    $('bubbleText').textContent = text; $('bubbleLabel').textContent = label || 'The wolf';
    if (color) bubble.style.setProperty('--zone', color);
    bubble.classList.add('show'); clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.classList.remove('show'); }, 6500);
  }

  // ---------- place panel ----------
  var panel = $('panel'), panelBody = $('panelBody'), current = null, dismissed = null, listing = false;
  function openPanel(c) {
    panel.style.setProperty('--zone', c.color); $('panelPlace').textContent = c.place;
    panelBody.textContent = ''; projectRows = [];
    render[c.id](false, true).forEach(function (n) { if (n) panelBody.appendChild(n); });
    panel.hidden = true; void panel.offsetWidth; panel.hidden = false;       // replay the slide-in
    panelBody.scrollTop = 0;
    document.body.classList.add('panel-open'); if (world) world.setPanelOpen(true);
  }
  function closePanel() { panel.hidden = true; document.body.classList.remove('panel-open'); if (world) world.setPanelOpen(false); }
  $('panelClose').addEventListener('click', function () { dismissed = current; closePanel(); });

  // ---------- top chips, progress ----------
  var visited = {}, stopBtns = {};
  chapters.forEach(function (c) {
    var b = el('button', { type: 'button', class: 'stop', text: c.label, 'aria-label': 'Travel to ' + c.place });
    b.style.setProperty('--zone', c.color);
    b.addEventListener('click', function () { if (listing) toggleList(false); enter(); if (world) world.travel(c.id); });
    $('stops').appendChild(el('li', {}, [b])); stopBtns[c.id] = b;
  });
  function updateFound() {
    var n = Object.keys(visited).length;
    $('found').textContent = n ? 'Found ' + n + ' / ' + chapters.length : '';
    if (n === chapters.length && !updateFound.done) { updateFound.done = true; setTimeout(function () { say('You found every place on the island. That deserves a howl.', 'Explorer'); if (world) world.howl(); }, 2500); }
  }

  // ---------- the world ----------
  var factIndex = -1;
  var world = window.World && window.World.init($('world'), S, {
    labels: $('labels'), bubble: bubble, panel: panel,
    onPlace: function (id) {
      current = id;
      chapters.forEach(function (c) { stopBtns[c.id].setAttribute('aria-current', c.id === id ? 'true' : 'false'); });
      if (!id) { dismissed = null; closePanel(); return; }
      var c = chapterOf(id);
      if (!started) return;
      visited[id] = true; stopBtns[id].classList.add('visited'); updateFound();
      say(c.wolf, c.place, c.color);
      if (dismissed !== id && !listing) openPanel(c);
    },
    onProject: function (idx) {
      if (idx < 0 || !projectRows[idx] || panel.hidden) return;
      projectRows[idx].open(true, true);
      say('This pillar is ' + S.builds.items[idx].name + '. ' + S.builds.items[idx].line, 'The wolf dug up', POP[idx % POP.length]);
    },
    onTap: function () {
      factIndex = (factIndex + 1) % S.facts.length;
      say(S.facts[factIndex], 'Fact ' + (factIndex + 1) + ' of ' + S.facts.length);
    },
    onMove: function () { $('hintText').textContent = 'Tap the wolf for a fact'; }
  });

  // ---------- intro card ----------
  var intro = $('intro'), started = false;
  var enterBtn = el('button', { class: 'btn primary', type: 'button', text: world ? 'Enter the island →' : 'Read my story →' });
  var card = el('div', { class: 'intro-card' }, render.start(true));
  card.style.setProperty('--zone', chapters[0].color);
  var actions = card.querySelector('.links');
  actions.insertBefore(enterBtn, actions.firstChild);
  if (world) {
    var readBtn = el('button', { class: 'btn', type: 'button', text: 'Read as a page' });
    readBtn.addEventListener('click', function () { enter(); toggleList(true); });
    actions.insertBefore(readBtn, enterBtn.nextSibling);
    card.appendChild(el('p', { class: 'keys', text: 'You are the wolf. Move with WASD or arrow keys, or click / hold on the ground. On a phone, touch where you want to go.' }));
  }
  intro.appendChild(card);
  function enter() {
    if (started) return;
    started = true; intro.hidden = true;
    if (!world) { toggleList(true); return; }
    world.setEnabled(true);
    dismissed = 'start'; visited.start = true; stopBtns.start.classList.add('visited'); updateFound();
    $('hintText').textContent = 'WASD / arrows, or click the ground';
    say(chapters[0].wolf, chapters[0].place, chapters[0].color);
  }
  enterBtn.addEventListener('click', enter);
  $('brand').addEventListener('click', function (e) { e.preventDefault(); if (listing) toggleList(false); if (world && started) world.travel('start'); });

  // ---------- page view: the same content as one scrolling page ----------
  var list = $('list'), listBtn = $('listBtn'), listBuilt = false;
  function toggleList(on) {
    listing = on;
    if (on && !listBuilt) {
      listBuilt = true;
      chapters.forEach(function (c, i) {
        var sec = el('section', {}, [el('p', { class: 'eyebrow', text: String(i).padStart(2, '0') + ' / ' + c.place })].concat(render[c.id](i === 0, false)));
        sec.style.setProperty('--zone', c.color); list.appendChild(sec);
      });
    }
    list.hidden = !on; document.body.classList.toggle('listing', on);
    listBtn.textContent = on ? 'Back to the island' : 'Read as a page';
    if (on) { closePanel(); list.scrollTop = 0; }
    if (world) world.setEnabled(!on && started);
    if (!on && current && dismissed !== current) openPanel(chapterOf(current));
  }
  listBtn.addEventListener('click', function () { enter(); toggleList(!listing); });
  if (!world) { document.body.classList.add('no-world'); }
})();
