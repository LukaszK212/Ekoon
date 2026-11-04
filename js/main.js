/* ekoON – skrypty strony */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
  var fmt1 = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  /* ------------------------------------------------------------------
     Zdjęcia: każdy .photo[data-src] próbuje wczytać plik .webp, a potem .jpg.
     Wystarczy wrzucić plik o podanej nazwie do folderu img/ – bez edycji HTML.
     ------------------------------------------------------------------ */
  function loadPhoto(el) {
    if (el.querySelector('img')) { el.classList.add('has-img'); return; }
    var base = el.getAttribute('data-src');
    if (!base) return;
    var exts = /\.(webp|jpe?g|png|avif)$/i.test(base) ? [''] : ['.webp', '.jpg'];
    var i = 0;
    var img = new Image();
    img.alt = el.getAttribute('data-alt') || '';
    img.decoding = 'async';
    if (el.hasAttribute('data-eager')) img.fetchPriority = 'high';
    img.onload = function () { el.classList.add('has-img'); };
    img.onerror = function () {
      i += 1;
      if (i < exts.length) { img.src = base + exts[i]; } else { img.style.display = 'none'; }
    };
    el.appendChild(img);
    img.src = base + exts[0];
  }
  // Zdjęcia poza ekranem ładujemy, gdy zbliżają się do widoku (własny mechanizm
  // zamiast loading="lazy", który w części przeglądarek mobilnych bywał zawodny).
  var photos = $$('.photo[data-src]');
  var later = [];
  photos.forEach(function (el) { if (el.hasAttribute('data-eager')) { loadPhoto(el); } else { later.push(el); } });
  if ('IntersectionObserver' in window) {
    var pObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { pObs.unobserve(en.target); loadPhoto(en.target); }
      });
    }, { rootMargin: '600px 0px' });
    later.forEach(function (el) { pObs.observe(el); });
  } else {
    later.forEach(loadPhoto);
  }

  /* ---------- Rok w stopce ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Header ---------- */
  var header = $('[data-header]');
  var callbar = $('[data-callbar]');
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 20);
    if (callbar) {
      var nearForm = false;
      var form = $('[data-contact-form]');
      if (form) {
        var r = form.getBoundingClientRect();
        nearForm = r.top < window.innerHeight && r.bottom > 0;
      }
      callbar.classList.toggle('is-hidden', y < 300 || nearForm);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobilne ---------- */
  var burger = $('[data-burger]');
  var nav = $('[data-nav]');
  function setMenu(open) {
    if (!nav || !burger) return;
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
    burger.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- Aktywny link w nawigacji ---------- */
  var navLinks = $$('.nav__list a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          navLinks.forEach(function (a) { a.classList.remove('is-active'); });
          map[en.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) secObs.observe(s); });
  }

  /* ---------- Animacje przy przewijaniu ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    // delikatne opóźnienie dla elementów w tej samej siatce
    reveals.forEach(function (el) {
      var sibs = el.parentElement ? $$(':scope > .reveal', el.parentElement) : [];
      var idx = sibs.indexOf(el);
      if (idx > 0 && sibs.length > 2) el.style.setProperty('--d', (idx % 4) * 0.08 + 's');
    });
    var rObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); rObs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { rObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Liczniki ---------- */
  function animateNumber(el, to, opts) {
    opts = opts || {};
    var dec = opts.decimals || 0;
    var suffix = opts.suffix || '';
    var from = opts.from || 0;
    var dur = reduceMotion ? 0 : (opts.duration || 1400);
    var start = null;
    var f = dec ? fmt1 : fmt;
    function step(ts) {
      if (start === null) start = ts;
      var p = dur ? Math.min((ts - start) / dur, 1) : 1;
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = f.format(from + (to - from) * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        animateNumber(el, parseFloat(el.dataset.count), { decimals: +el.dataset.decimals || 0, suffix: el.dataset.suffix || '' });
        cObs.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cObs.observe(el); });
  }

  /* ---------- Temperatura w hero (drobny efekt) ---------- */
  var tempEl = $('[data-temp]');
  if (tempEl && !reduceMotion) {
    var t = 26.5;
    var tick = setInterval(function () {
      t = Math.max(22, t - 0.5);
      tempEl.textContent = fmt1.format(t) + '°C';
      if (t <= 22) clearInterval(tick);
    }, 260);
    tempEl.textContent = fmt1.format(t) + '°C';
  }

  /* ---------- Godziny otwarcia ---------- */
  var badge = $('[data-open-badge]');
  if (badge) {
    var HOURS = { 1: [510, 1020], 2: [420, 900], 3: [420, 900], 4: [420, 900], 5: [420, 900] };
    var parts = {};
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
        .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    } catch (e) { /* stara przeglądarka */ }
    var days = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
    var day = days[parts.weekday] !== undefined ? days[parts.weekday] : new Date().getDay();
    var mins = parts.hour ? (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10) : new Date().getHours() * 60 + new Date().getMinutes();
    var h = HOURS[day];
    var toTime = function (m) { return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
    if (h && mins >= h[0] && mins < h[1]) {
      badge.textContent = 'Teraz otwarte · do ' + toTime(h[1]);
      badge.classList.add('is-open');
    } else {
      var next = '';
      if (h && mins < h[0]) { next = 'dziś od ' + toTime(h[0]); } else {
        var d = (day + 1) % 7, n = 0;
        while (!HOURS[d] && n < 7) { d = (d + 1) % 7; n++; }
        next = (d === (day + 1) % 7 ? 'jutro' : ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'][d]) + ' od ' + toTime(HOURS[d][0]);
      }
      badge.textContent = 'Zamknięte · ' + next;
      badge.classList.add('is-closed');
    }
    var row = $('[data-hours] [data-day="' + (day === 0 ? 6 : day) + '"]');
    if (row) row.classList.add('is-today');
  }

  /* ---------- Galeria + lightbox ---------- */
  var gallery = $('[data-gallery]');
  var lb = $('[data-lightbox]');
  if (gallery) {
    var items = $$('.gitem', gallery);
    $$('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.dataset.filter;
        $$('[data-filter]').forEach(function (b) { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
        applyFilter(f);
      });
    });
    // Na start pokazujemy 12 zdjęć, resztę po kliknięciu „Pokaż więcej”
    var LIMIT = 12, expanded = false, curFilter = 'all';
    var galMore = $('[data-gallery-more]');
    function applyFilter(f) {
      curFilter = f;
      items.forEach(function (it, i) {
        var hide = (f !== 'all' && it.dataset.cat !== f) || (f === 'all' && !expanded && i >= LIMIT);
        it.classList.toggle('is-hidden', hide);
      });
      if (galMore) galMore.parentNode.hidden = expanded || f !== 'all' || items.length <= LIMIT;
    }
    if (galMore) galMore.addEventListener('click', function () { expanded = true; applyFilter(curFilter); });
    applyFilter('all');

    if (lb && typeof lb.showModal === 'function') {
      var stage = $('[data-lb-stage]', lb);
      var cap = $('[data-lb-cap]', lb);
      var cur = 0;
      var visible = function () { return items.filter(function (it) { return !it.classList.contains('is-hidden'); }); };
      var show = function (idx) {
        var list = visible();
        if (!list.length) return;
        cur = (idx + list.length) % list.length;
        var it = list[cur];
        var clone = $('.photo', it).cloneNode(true);
        stage.innerHTML = '';
        stage.appendChild(clone);
        var img = $('img', clone);
        if (img) { img.removeAttribute('loading'); }
        cap.textContent = $('figcaption', it).textContent;
      };
      items.forEach(function (it) {
        $('.gitem__btn', it).setAttribute('aria-label', 'Powiększ zdjęcie: ' + $('figcaption', it).textContent);
        $('.gitem__btn', it).addEventListener('click', function () {
          show(visible().indexOf(it));
          lb.showModal();
        });
      });
      $('[data-lb-close]', lb).addEventListener('click', function () { lb.close(); });
      $('[data-lb-prev]', lb).addEventListener('click', function () { show(cur - 1); });
      $('[data-lb-next]', lb).addEventListener('click', function () { show(cur + 1); });
      lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
      lb.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') show(cur - 1);
        if (e.key === 'ArrowRight') show(cur + 1);
      });
    }
  }

  /* ---------- Karuzela opinii ---------- */
  $$('[data-carousel]').forEach(function (c) {
    var track = $('[data-track]', c);
    var prev = $('[data-prev]', c);
    var next = $('[data-next]', c);
    var bar = $('[data-bar]', c);
    var stepSize = function () {
      var card = track.firstElementChild;
      return card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 20) : 300;
    };
    var update = function () {
      var max = track.scrollWidth - track.clientWidth;
      var ratio = track.clientWidth / track.scrollWidth;
      var p = max > 0 ? track.scrollLeft / max : 0;
      bar.style.width = (ratio * 100) + '%';
      bar.style.transform = 'translateX(' + (p * (1 / ratio - 1) * 100) + '%)';
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft >= max - 4;
    };
    prev.addEventListener('click', function () { track.scrollBy({ left: -stepSize(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: stepSize(), behavior: 'smooth' }); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ==================================================================
     KALKULATOR WYCENY
     Wszystkie ceny poniżej są ORIENTACYJNE (brutto, zł) – do ustalenia
     z klientem. Wystarczy zmienić liczby w obiekcie PRICES.
     ================================================================== */
  var PRICES = {
    montaz: {
      sizes: [2.5, 3.5, 5.0, 7.0],               // typowe moce klimatyzatorów [kW]
      device: {                                  // cena urządzenia [min, max] dla klasy i mocy
        eco: { 2.5: [2300, 2800], 3.5: [2700, 3300], 5: [3900, 4700], 7: [5400, 6400] },
        std: { 2.5: [3100, 3800], 3.5: [3600, 4400], 5: [5200, 6300], 7: [7200, 8600] },
        pre: { 2.5: [4600, 5800], 3.5: [5300, 6600], 5: [7600, 9200], 7: [10200, 12400] }
      },
      install: [1300, 1700],                     // montaż standardowy 1 szt. (do 3 m instalacji)
      nextUnitDiscount: 0.1,                     // rabat na montaż kolejnych sztuk
      includedPipe: 3,                           // metry instalacji w cenie
      pipePerM: [120, 160],                      // każdy kolejny metr
      addons: {
        pump:   { label: 'Pompka skroplin', price: [350, 500], per: 'unit' },
        trim:   { label: 'Listwy maskujące', price: [150, 300], per: 'unit' },
        roof:   { label: 'Wspornik dachowy / stelaż', price: [300, 500], per: 'unit' },
        height: { label: 'Praca na wysokości', price: [400, 900], per: 'once' }
      },
      roomFactor: { sypialnia: 0.95, salon: 1, biuro: 1.15, poddasze: 1.25 },
      sunFactor: { low: 0.9, mid: 1, high: 1.2 },
      wattsPerM2: 100
    },
    serwis: {
      scope: {
        przeglad:    { label: 'Przegląd okresowy', price: [200, 260] },
        czyszczenie: { label: 'Przegląd + czyszczenie i odgrzybianie', price: [280, 360] },
        gruntowne:   { label: 'Gruntowne czyszczenie', price: [420, 560] },
        diagnoza:    { label: 'Diagnostyka usterki', price: [200, 300] }
      },
      typeFactor: { scienna: 1, podlogowa: 1.1, kaseton: 1.4 },
      typeLabel: { scienna: 'ścienna', podlogowa: 'przypodłogowa', kaseton: 'kasetonowa / kanałowa' },
      qtyDiscount: [[10, 0.2], [4, 0.15], [2, 0.1]], // [od sztuk, rabat]
      contractDiscount: 0.1
    },
    pompa: {
      wattsPerM2: { nowy: 40, ocieplony: 55, stary: 75 },
      cwuPerPerson: 0.25,                        // kW na osobę dla CWU
      sizes: [5, 7, 10, 12, 16],
      unit: { 5: [27000, 34000], 7: [30000, 38000], 10: [35000, 45000], 12: [39000, 50000], 16: [46000, 60000] },
      cwuTank: [3500, 5500],
      radiators: [2000, 4000]                    // bufor i osprzęt przy grzejnikach
    }
  };

  window.ekoonPrices = PRICES; // używane przez asystenta czatu (js/chat.js)

  var calc = $('[data-calc]');
  if (calc) {
    var form = $('[data-calc-form]', calc);
    var tabs = $$('[data-mode]', calc);
    var out = function (k) { return $('[data-out="' + k + '"]', calc); };
    var mode = 'montaz';
    var shown = { min: 0, max: 0 };
    var summary = '';

    var val = function (name) { var el = form.querySelector('[name="' + name + '"]:checked') || form.querySelector('[name="' + name + '"]'); return el ? el.value : null; };
    var num = function (name) { return parseFloat(val(name)) || 0; };
    var checked = function (name) { return $$('[name="' + name + '"]:checked', form).map(function (i) { return i.value; }); };
    var labelOf = function (name) { var el = form.querySelector('[name="' + name + '"]:checked'); if (!el) return ''; var b = el.parentNode.querySelector('b') || el.parentNode.querySelector('span'); return b ? b.textContent.trim() : el.value; };
    var round = function (v, to) { return Math.round(v / to) * to; };
    var zl = function (a, b) { return a === b ? fmt.format(a) + ' zł' : fmt.format(a) + ' – ' + fmt.format(b) + ' zł'; };
    var kw = function (v) { return (v % 1 ? fmt1.format(v) : fmt.format(v)) + ' kW'; };

    function calcMontaz() {
      var P = PRICES.montaz;
      var area = num('m_area');
      var units = Math.min(6, Math.max(1, num('m_units')));
      var room = val('m_room');
      var sun = val('m_sun');
      var cls = val('m_class');
      var pipe = num('m_pipe');
      var adds = checked('m_add');

      var need = area * P.wattsPerM2 * P.roomFactor[room] * P.sunFactor[sun] / 1000;
      var size = P.sizes.filter(function (s) { return s >= need * 0.95; })[0];
      var over = !size;
      if (over) size = P.sizes[P.sizes.length - 1];

      var dev = P.device[cls][size];
      var lines = [];
      var min = 0, max = 0;
      var add = function (label, a, b, cls2) { min += a; max += b; lines.push([label, a, b, cls2]); };

      add(units + '× klimatyzator ' + kw(size) + ' (' + labelOf('m_class') + ')', dev[0] * units, dev[1] * units);
      var instMul = 1 + (units - 1) * (1 - P.nextUnitDiscount);
      add('Montaż standardowy' + (units > 1 ? ' ×' + units : '') + ' (do ' + P.includedPipe + ' m)', P.install[0] * instMul, P.install[1] * instMul);
      var extra = Math.max(0, pipe - P.includedPipe);
      if (extra) add('Dodatkowa instalacja ' + extra + ' m' + (units > 1 ? ' ×' + units : ''), P.pipePerM[0] * extra * units, P.pipePerM[1] * extra * units);
      adds.forEach(function (k) {
        var a = P.addons[k];
        var m = a.per === 'unit' ? units : 1;
        add(a.label + (m > 1 ? ' ×' + m : ''), a.price[0] * m, a.price[1] * m);
      });

      var notice = over ? 'Pomieszczenie wymaga ok. ' + fmt1.format(need) + ' kW – lepiej sprawdzi się dwie jednostki lub system multi-split. Doradzimy przy oględzinach.' : '';
      var powerTxt = 'Zalecana moc: <b>' + kw(size) + '</b>' + (units > 1 ? ' na pomieszczenie' : '') + ' <span style="opacity:.6">(zapotrzebowanie ~' + fmt1.format(need) + ' kW)</span>';
      summary = 'Montaż klimatyzacji: ' + units + '× ' + kw(size) + ', klasa ' + labelOf('m_class') + ', ' + labelOf('m_room').toLowerCase() + ' ' + area + ' m², nasłonecznienie ' + labelOf('m_sun').toLowerCase() + ', instalacja ' + pipe + ' m' + (adds.length ? ', dodatki: ' + adds.map(function (k) { return P.addons[k].label.toLowerCase(); }).join(', ') : '');
      return { title: 'Montaż klimatyzacji', min: min, max: max, lines: lines, power: powerTxt, notice: notice, service: 'Montaż klimatyzacji' };
    }

    function calcSerwis() {
      var P = PRICES.serwis;
      var scope = val('s_scope');
      var type = val('s_type');
      var units = Math.max(1, num('s_units'));
      var contract = checked('s_contract').length > 0;
      var s = P.scope[scope];
      var f = P.typeFactor[type];
      var unitMin = s.price[0] * f, unitMax = s.price[1] * f;
      var baseMin = unitMin * units, baseMax = unitMax * units;
      var lines = [[units + '× ' + s.label.toLowerCase() + ' (' + P.typeLabel[type] + ')', baseMin, baseMax]];
      var disc = 0;
      for (var i = 0; i < P.qtyDiscount.length; i++) { if (units >= P.qtyDiscount[i][0]) { disc = P.qtyDiscount[i][1]; break; } }
      var min = baseMin, max = baseMax;
      if (disc) { lines.push(['Rabat ilościowy −' + disc * 100 + '%', -baseMin * disc, -baseMax * disc, 'is-discount']); min -= baseMin * disc; max -= baseMax * disc; }
      if (contract) { var cMin = min * P.contractDiscount, cMax = max * P.contractDiscount; lines.push(['Umowa serwisowa −' + P.contractDiscount * 100 + '%', -cMin, -cMax, 'is-discount']); min -= cMin; max -= cMax; }
      var per = 'Cena za urządzenie: <b>' + zl(round(min / units, 10), round(max / units, 10)) + '</b>';
      var notice = scope === 'diagnoza' ? 'Koszt naprawy i części podajemy po diagnozie – zawsze przed wykonaniem prac.' : (units >= 10 ? 'Przy tylu urządzeniach przygotujemy indywidualną ofertę i harmonogram przeglądów.' : '');
      summary = 'Serwis: ' + units + '× ' + s.label.toLowerCase() + ', jednostki ' + P.typeLabel[type] + (contract ? ', zainteresowanie umową serwisową' : '');
      return { title: 'Serwis i czyszczenie', min: min, max: max, lines: lines, power: per, notice: notice, service: units >= 4 || contract ? 'Umowa serwisowa dla firmy' : (scope === 'diagnoza' ? 'Naprawa klimatyzacji' : 'Serwis / czyszczenie klimatyzacji') };
    }

    function calcPompa() {
      var P = PRICES.pompa;
      var area = num('p_area');
      var build = val('p_build');
      var heat = val('p_heat');
      var cwu = checked('p_cwu').length > 0;
      var people = Math.max(1, num('p_people'));
      var need = area * P.wattsPerM2[build] / 1000 + (cwu ? people * P.cwuPerPerson : 0);
      var size = P.sizes.filter(function (s) { return s >= need * 0.95; })[0];
      var over = !size;
      if (over) size = P.sizes[P.sizes.length - 1];
      var u = P.unit[size];
      var lines = [['Pompa ciepła ' + kw(size) + ' z montażem', u[0], u[1]]];
      var min = u[0], max = u[1];
      if (cwu) { lines.push(['Zasobnik ciepłej wody (CWU)', P.cwuTank[0], P.cwuTank[1]]); min += P.cwuTank[0]; max += P.cwuTank[1]; }
      if (heat !== 'podloga') { lines.push(['Bufor i osprzęt dla grzejników', P.radiators[0], P.radiators[1]]); min += P.radiators[0]; max += P.radiators[1]; }
      var power = 'Zalecana moc: <b>' + kw(size) + '</b> <span style="opacity:.6">(zapotrzebowanie ~' + fmt1.format(need) + ' kW)</span>';
      var notice = over ? 'Duże zapotrzebowanie (~' + fmt1.format(need) + ' kW) – dobierzemy rozwiązanie indywidualnie, np. kaskadę pomp.' : (heat === 'grzejniki' ? 'Przy grzejnikach sprawdzimy, czy wystarczą niższe temperatury zasilania – to klucz do niskich rachunków.' : 'Pomożemy sprawdzić aktualne programy dofinansowania.');
      summary = 'Pompa ciepła: ' + area + ' m², budynek ' + labelOf('p_build').toLowerCase() + ', instalacja: ' + labelOf('p_heat').toLowerCase() + (cwu ? ', CWU dla ' + people + ' os.' : '') + ', moc ok. ' + kw(size);
      return { title: 'Pompa ciepła', min: min, max: max, lines: lines, power: power, notice: notice, service: 'Pompa ciepła' };
    }

    var result = null;
    function render() {
      result = mode === 'montaz' ? calcMontaz() : mode === 'serwis' ? calcSerwis() : calcPompa();
      var step = result.max > 20000 ? 500 : 50;
      var min = round(result.min, step), max = round(result.max, step);
      out('title').textContent = result.title;
      out('power').innerHTML = result.power;
      out('breakdown').innerHTML = result.lines.map(function (l) {
        var a = round(l[1], 10), b = round(l[2], 10);
        var txt = a < 0 ? '−' + zl(-a, -b) : zl(a, b);
        return '<li class="' + (l[3] || '') + '"><span>' + l[0] + '</span><span>' + txt + '</span></li>';
      }).join('');
      var n = out('notice');
      n.hidden = !result.notice;
      n.textContent = result.notice;
      animateNumber(out('min'), min, { from: shown.min, duration: 450 });
      animateNumber(out('max'), max, { from: shown.max, duration: 450 });
      shown.min = min; shown.max = max;
      result.text = 'Kalkulator – ' + summary + '. Szacunek: ' + zl(min, max) + ' brutto.';
      result.short = result.title + ': ' + zl(min, max);
    }

    // Zakładki
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { selectTab(tab); });
      tab.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        var t = tabs[(i + d + tabs.length) % tabs.length];
        t.focus(); selectTab(t);
      });
    });
    function selectTab(tab) {
      mode = tab.dataset.mode;
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      $$('[data-panel]', calc).forEach(function (p) { p.hidden = p.dataset.panel !== mode; });
      render();
    }

    // Strzałka „przewiń” przy zakładkach na wąskich ekranach
    var tabsWrap = $('[data-tabs-wrap]', calc);
    if (tabsWrap) {
      var tabsEl = $('.calc__tabs', tabsWrap);
      var moreBtn = $('[data-tabs-more]', tabsWrap);
      var syncMore = function () {
        var left = tabsEl.scrollWidth - tabsEl.clientWidth - tabsEl.scrollLeft;
        tabsWrap.classList.toggle('has-more', left > 8);
      };
      tabsEl.addEventListener('scroll', syncMore, { passive: true });
      window.addEventListener('resize', syncMore);
      moreBtn.addEventListener('click', function () { tabsEl.scrollTo({ left: tabsEl.scrollWidth, behavior: 'smooth' }); });
      tabs.forEach(function (t) { t.addEventListener('click', function () { t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }); });
      syncMore();
    }

    // Suwaki: wypełnienie toru + wartość
    function syncRange(r) {
      var p = (r.value - r.min) / (r.max - r.min) * 100;
      r.style.setProperty('--p', p + '%');
      var o = form.querySelector('output[for="' + r.id + '"]');
      if (o) o.textContent = r.value + (o.dataset.unit || '');
    }
    $$('.range', form).forEach(function (r) { syncRange(r); r.addEventListener('input', function () { syncRange(r); }); });

    // Steppery
    $$('[data-stepper]', form).forEach(function (s) {
      var input = $('input', s);
      var clamp = function () { var v = Math.round(+input.value || +input.min); input.value = Math.min(+input.max, Math.max(+input.min, v)); };
      $$('[data-step]', s).forEach(function (b) {
        b.addEventListener('click', function () { input.value = (+input.value || 0) + (+b.dataset.step); clamp(); render(); });
      });
      input.addEventListener('change', function () { clamp(); render(); });
    });

    form.addEventListener('input', render);
    form.addEventListener('change', render);
    render();

    // Dołączanie wyceny do formularza kontaktowego
    var sendBtn = $('[data-calc-send]', calc);
    var attached = $('[data-attached]');
    var calcField = $('[data-calc-field]');
    var serviceSelect = $('[data-service-select]');
    if (sendBtn && attached) {
      sendBtn.addEventListener('click', function () {
        calcField.value = result.text;
        $('[data-attached-text]', attached).textContent = result.short;
        attached.hidden = false;
        if (serviceSelect && result.service) serviceSelect.value = result.service;
        setTimeout(function () { var f = document.getElementById('f-name'); if (f) f.focus({ preventScroll: true }); }, 700);
      });
      $('[data-attached-remove]', attached).addEventListener('click', function () {
        calcField.value = '';
        attached.hidden = true;
      });
    }
  }

  /* ---------- Przyciski ustawiające rodzaj usługi w formularzu ---------- */
  $$('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      var s = $('[data-service-select]');
      if (s) s.value = a.dataset.service;
    });
  });
})();
