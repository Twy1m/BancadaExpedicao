/* ==========================================================================
   NAVEGAÇÃO EM FORMATO DE PORTAL DE NOTÍCIAS
   - Capa com manchetes gerada a partir das <section class="article">
   - Cada seção vira uma "matéria": só uma aparece por vez (rota por #id)
   - Busca em todas as matérias, índice interno, anterior/próxima, leia também
   Não altera o conteúdo nem os scripts existentes (menu, pirâmide, acordeão).
   ========================================================================== */
   (function () {
    'use strict';
  
    var main = document.querySelector('main');
    if (!main) return;
    var sections = [].slice.call(main.querySelectorAll('section.article'));
    if (!sections.length) return;
  
    var home = document.getElementById('capa');
    var bar = document.getElementById('news-bar');
    var foot = document.getElementById('news-foot');
    var hint = main.querySelector('.news-hint');
    var topics = document.getElementById('topics');
    var baseTitle = document.title;
    var firstRoute = true;
  
    /* ---------- utilidades ---------- */
    function txt(el) { return ((el && el.textContent) || '').replace(/\s+/g, ' ').trim(); }
    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function norm(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
    function clip(s, n) {
      if (s.length <= n) return s;
      var c = s.slice(0, n);
      return c.slice(0, c.lastIndexOf(' ') > 40 ? c.lastIndexOf(' ') : n).replace(/[,;:.\s]+$/, '') + '…';
    }
    function slug(s) { return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  
    /* ---------- herda cores e fontes do site (sem alterar styles.css) ---------- */
    function sampleTheme() {
      var root = document.documentElement;
      var cs = getComputedStyle(document.body);
      var bg = cs.backgroundColor;
      if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') bg = getComputedStyle(root).backgroundColor;
      if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') bg = '#ffffff';
      root.style.setProperty('--n-ink', cs.color);
      root.style.setProperty('--n-bg', bg);
      root.style.setProperty('--n-sans', cs.fontFamily);
      var link = main.querySelector('.acc__title') || main.querySelector('.pyramid__btn') || main.querySelector('.article a');
      if (link) root.style.setProperty('--n-accent', getComputedStyle(link).color);
    }
  
    /* ---------- dados de cada matéria (lidos do próprio HTML) ---------- */
    var data = sections.map(function (sec, i) {
      var eb = sec.querySelector('.eyebrow');
      var strong = eb && eb.querySelector('strong');
      var h = sec.querySelector('h1, h2');
      var leads = sec.querySelectorAll('.lead');
      var photo = sec.querySelector('.blocks__photo');
      var text = txt(sec);
      return {
        sec: sec,
        id: sec.id,
        i: i,
        num: strong ? txt(strong) : ('0' + (i + 1)).slice(-2),
        kicker: eb && eb.firstChild ? eb.firstChild.textContent.replace(/\s+/g, ' ').trim() : '',
        title: txt(h),
        font: h ? getComputedStyle(h).fontFamily : '',
        lead: txt(leads[0]),
        lead2: leads[1] ? txt(leads[1]) : '',
        img: photo ? photo.getAttribute('src') : '',
        blocks: [].map.call(sec.querySelectorAll('.blocks__item'), function (b) { return b.getAttribute('style') || ''; }),
        text: text,
        ntext: norm(text)
      };
    });
    var ids = data.map(function (d) { return d.id; });
    var byId = {};
    data.forEach(function (d) { byId[d.id] = d; });
  
    /* ---------- blocos de HTML reutilizáveis ---------- */
    function thumb(d) {
      var h = '<div class="news-thumb" aria-hidden="true">';
      d.blocks.forEach(function (st) { h += '<span style="' + esc(st) + '"></span>'; });
      h += '<span class="news-thumb__num">' + esc(d.num) + '</span>';
      if (d.img) h += '<img src="' + esc(d.img) + '" alt="" loading="lazy" onerror="this.remove()">';
      return h + '</div>';
    }
    function title(d, tag, extra) {
      return '<' + tag + ' class="story__title"' + (d.font ? ' style="font-family:' + esc(d.font) + '"' : '') + '>' +
        '<a href="#' + d.id + '">' + esc(d.title) + '</a></' + tag + '>';
    }
    function card(d) {
      return '<article class="story story--card"><div class="story__media">' + thumb(d) + '</div>' +
        '<p class="story__kicker">' + esc(d.kicker) + '</p>' + title(d, 'h3') +
        '<p class="story__dek">' + esc(clip(d.lead, 150)) + '</p></article>';
    }
    function rail(d) {
      return '<article class="story story--rail"><div><p class="story__kicker">' + esc(d.kicker) + '</p>' +
        title(d, 'h3') + '</div>' + thumb(d) + '</article>';
    }
    function hero(d) {
      return '<article class="story story--hero"><div class="story__media">' + thumb(d) + '</div>' +
        '<p class="story__kicker">' + esc(d.kicker) + '</p>' + title(d, 'h2') +
        '<p class="story__dek">' + esc(d.lead) + '</p>' +
        (d.lead2 ? '<p class="story__dek">' + esc(clip(d.lead2, 200)) + '</p>' : '') + '</article>';
    }
    function pick(list) { return list.map(function (id) { return byId[id]; }).filter(Boolean); }
  
    /* ---------- CAPA ---------- */
    function buildHome() {
      var date = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      date = date.charAt(0).toUpperCase() + date.slice(1);
  
      var h = '<div class="container">' +
        '<h1 class="sr-only">Capa — Indústria 4.0: Bancada de Automação e Expedição</h1>' +
        '<div class="news-strip"><span class="news-strip__date">' + esc(date) + '</span>' +
        '<span>Edição técnica · ' + data.length + ' matérias</span></div>' +
        '<form class="news-search" role="search" id="news-form">' +
        '<label class="sr-only" for="news-q">Buscar nas matérias</label>' +
        '<input id="news-q" type="search" autocomplete="off" placeholder="Buscar nas matérias: CLP, PROFINET, sensor indutivo, vácuo…"></form>' +
        '<div class="news-results" id="news-results" hidden aria-live="polite"></div>' +
        '<div id="news-stories">';
  
      var top = pick(['introducao', 'piramide', 'clp', 'ihm-scada']);
      h += '<div class="news-top">' + hero(top[0]) + '<aside class="news-rail" aria-label="Em destaque"><h2 class="news-h">Em destaque</h2>' +
        top.slice(1).map(rail).join('') + '</aside></div>';
  
      h += '<section class="news-block" aria-labelledby="h-campo"><h2 class="news-h" id="h-campo">Campo e equipamentos</h2><div class="news-grid">' +
        pick(['sensores', 'equipamentos', 'catalogo']).map(card).join('') + '</div></section>';
  
      h += '<section class="news-block" aria-labelledby="h-projeto"><h2 class="news-h" id="h-projeto">Projeto e fontes</h2><div class="news-grid">' +
        pick(['integracao', 'cad-simu', 'referencias']).map(card).join('') + '</div></section>';
  
      h += '</div></div>';
      home.innerHTML = h;
  
      var form = document.getElementById('news-form');
      var input = document.getElementById('news-q');
      form.addEventListener('submit', function (e) { e.preventDefault(); });
      input.addEventListener('input', function () { runSearch(input.value); });
    }
  
    /* ---------- BUSCA ---------- */
    function runSearch(q) {
      var box = document.getElementById('news-results');
      var stories = document.getElementById('news-stories');
      var tokens = norm(q).split(/\s+/).filter(function (t) { return t.length > 1; });
      if (!tokens.length) { box.hidden = true; box.innerHTML = ''; stories.hidden = false; return; }
  
      var res = [];
      data.forEach(function (d) {
        var score = 0, first = -1, ok = true;
        tokens.forEach(function (t) {
          var pos = d.ntext.indexOf(t), n = 0;
          if (pos < 0) { ok = false; return; }
          while (pos >= 0) { n++; pos = d.ntext.indexOf(t, pos + t.length); }
          score += n;
          var p = d.ntext.indexOf(t);
          if (first < 0 || p < first) first = p;
          if (norm(d.title).indexOf(t) >= 0) score += 8;
        });
        if (ok) res.push({ d: d, score: score, first: first });
      });
      res.sort(function (a, b) { return b.score - a.score; });
  
      var h;
      if (!res.length) {
        h = '<p class="news-results__count">Nenhuma matéria encontrada para “' + esc(q.trim()) + '”.</p>';
      } else {
        h = '<p class="news-results__count">' + res.length + (res.length === 1 ? ' matéria encontrada' : ' matérias encontradas') + '</p><ol>' +
          res.map(function (r) {
            return '<li class="result"><article class="story"><p class="story__kicker">' + esc(r.d.kicker) + '</p>' +
              title(r.d, 'h3') + '<p class="story__dek">' + snippet(r.d, r.first, tokens) + '</p>' +
              '<p class="story__meta"><span>' + r.score + ' ocorrências</span></p></article></li>';
          }).join('') + '</ol>';
      }
      box.innerHTML = h;
      box.hidden = false;
      stories.hidden = true;
    }
  
    function snippet(d, at, tokens) {
      var start = Math.max(0, at - 70), end = Math.min(d.text.length, at + 150);
      if (start > 0) { var sp = d.text.indexOf(' ', start); if (sp > -1 && sp < at) start = sp + 1; }
      if (end < d.text.length) { var ep = d.text.lastIndexOf(' ', end); if (ep > at) end = ep; }
      var s = d.text.slice(start, end), ns = d.ntext.slice(start, end), ranges = [];
      tokens.forEach(function (t) {
        var p = ns.indexOf(t);
        while (p >= 0) { ranges.push([p, p + t.length]); p = ns.indexOf(t, p + t.length); }
      });
      ranges.sort(function (a, b) { return a[0] - b[0]; });
      var out = '', cur = 0;
      ranges.forEach(function (r) {
        if (r[0] < cur) { if (r[1] > cur) { out += '<mark>' + esc(s.slice(cur, r[1])) + '</mark>'; cur = r[1]; } return; }
        out += esc(s.slice(cur, r[0])) + '<mark>' + esc(s.slice(r[0], r[1])) + '</mark>';
        cur = r[1];
      });
      out += esc(s.slice(cur));
      return (start > 0 ? '… ' : '') + out + (end < d.text.length ? ' …' : '');
    }
  
    /* ---------- BARRA E RODAPÉ DA MATÉRIA ---------- */
    function buildBar(d) {
      var heads = [].slice.call(d.sec.querySelectorAll('h3'));
      var chips = '';
      if (heads.length >= 3) {
        chips = '<div class="news-chips" role="navigation" aria-label="Nesta matéria"><span class="news-chips__label">Nesta matéria</span>' +
          heads.map(function (hd, k) {
            if (!hd.id) hd.id = d.id + '--' + (slug(txt(hd)) || k);
            return '<a href="#' + hd.id + '" data-jump="' + hd.id + '">' + esc(txt(hd)) + '</a>';
          }).join('') + '</div>';
      }
      buildToc(d, heads);
      bar.innerHTML = '<div class="container"><nav class="news-crumbs" aria-label="Trilha">' +
        '<a href="#capa">Capa</a><span aria-hidden="true">›</span><span>' + esc(d.kicker) + '</span>' +
        '<span aria-hidden="true">›</span><strong aria-current="page">' + esc(d.title) + '</strong></nav>' + chips + '</div>';
    }
  
    /* Índice lateral "Nesta matéria" (só aparece no computador, via css/desktop.css) */
    var spy = null;
    function buildToc(d, heads) {
      var box = d.sec.querySelector('.container');
      if (!box) return;
      var old = box.querySelector('.news-toc');
      if (old) old.remove();
      box.classList.remove('has-toc');
      if (spy) { spy.disconnect(); spy = null; }
      if (heads.length < 3) return;
      heads.forEach(function (hd, k) { if (!hd.id) hd.id = d.id + '--' + (slug(txt(hd)) || k); });

      var aside = document.createElement('aside');
      aside.className = 'news-toc';
      aside.setAttribute('aria-label', 'Nesta matéria');
      aside.innerHTML = '<div class="news-toc__inner"><p class="news-toc__label">Nesta matéria</p><ol class="news-toc__list">' +
        heads.map(function (hd) {
          return '<li><a href="#' + hd.id + '" data-jump="' + hd.id + '">' + esc(txt(hd)) + '</a></li>';
        }).join('') + '</ol></div>';
      box.insertBefore(aside, box.firstChild);
      box.classList.add('has-toc');

      // destaca no índice o tópico que está na tela
      if (!('IntersectionObserver' in window)) return;
      var links = [].slice.call(aside.querySelectorAll('a'));
      spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('data-jump') === en.target.id); });
        });
      }, { rootMargin: '0px 0px -70% 0px' });
      heads.forEach(function (hd) { spy.observe(hd); });
    }

    function buildFoot(d) {
      var prev = data[d.i - 1], next = data[d.i + 1];
      var more = [1, 2, 3].map(function (k) { return data[(d.i + k) % data.length]; })
        .filter(function (x) { return x !== d; });
      var h = '<div class="container"><nav class="news-pager" aria-label="Outras matérias">' +
        (prev ? '<a href="#' + prev.id + '" rel="prev"><span class="news-pager__d">← Matéria anterior</span><span class="news-pager__t">' + esc(prev.title) + '</span></a>' : '<span class="is-empty"></span>') +
        (next ? '<a href="#' + next.id + '" rel="next" class="news-pager__next"><span class="news-pager__d">Próxima matéria →</span><span class="news-pager__t">' + esc(next.title) + '</span></a>' : '<span class="is-empty"></span>') +
        '</nav><h2 class="news-h">Leia também</h2><div class="news-grid">' + more.map(card).join('') + '</div>' +
        '<a class="news-back" href="#capa">← Voltar à capa</a></div>';
      foot.innerHTML = h;
    }
  
    /* ---------- ROTAS ---------- */
    function currentId() {
      var h = location.hash.replace(/^#\/?/, '');
      try { h = decodeURIComponent(h); } catch (e) { /* mantém */ }
      return h;
    }
  
    function setActive(on) {
      home.classList.toggle('is-active', on === 'home');
      bar.classList.toggle('is-active', on === 'article');
      foot.classList.toggle('is-active', on === 'article');
      if (hint) hint.hidden = on !== 'article';
    }
  
    function markTopics(id) {
      if (!topics) return;
      var list = topics.querySelector('.topics__list');
      [].forEach.call(topics.querySelectorAll('a'), function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', on);
        if (on) {
          a.setAttribute('aria-current', 'page');
          // só rola quando a barra realmente tem rolagem (celular); valor limitado entre 0 e o máximo
          if (list && list.scrollWidth > list.clientWidth) {
            var left = a.offsetLeft - (list.clientWidth - a.offsetWidth) / 2;
            list.scrollLeft = Math.max(0, Math.min(left, list.scrollWidth - list.clientWidth));
          }
        } else a.removeAttribute('aria-current');
      });
    }
  
    function route() {
      var id = currentId();
      var d = byId[id];
      var toggle = document.querySelector('.menu-toggle');
      if (toggle && toggle.getAttribute('aria-expanded') === 'true') toggle.click();
  
      sections.forEach(function (s) { s.classList.toggle('is-active', !!d && s === d.sec); });
  
      var focusEl;
      if (d) {
        buildBar(d); buildFoot(d); setActive('article');
        document.title = d.title + ' — ' + baseTitle.split(' — ')[0];
        markTopics(d.id);
        focusEl = d.sec.querySelector('h1, h2');
      } else {
        setActive('home');
        document.title = baseTitle;
        markTopics('capa');
        focusEl = home.querySelector('h1');
      }
      window.scrollTo(0, 0);
      window.dispatchEvent(new Event('resize'));
      if (!firstRoute && focusEl) { focusEl.setAttribute('tabindex', '-1'); focusEl.focus({ preventScroll: true }); }
      firstRoute = false;
    }
  
    /* índice interno: rola suavemente sem mudar a rota */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-jump]');
      if (!a) return;
      var target = document.getElementById(a.getAttribute('data-jump'));
      if (!target) return;
      e.preventDefault();
      var smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  
    sampleTheme();
    buildHome();
    window.addEventListener('hashchange', route);
    route();
  })();
  
