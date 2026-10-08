(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width: 1024px)');
  const PHONE = '41787297992';
  const EMAIL = 'alenkagehri@gmail.com';

  /* ---------- Header + sticky dock ---------- */
  const header = $('.site-header');
  const dock = $('[data-dock]');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 8);
    dock.classList.toggle('is-visible', y > window.innerHeight * 0.55);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // highlight the section in the nav
  const navLinks = $$('.main-nav a');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach((a) => { const s = $(a.getAttribute('href')); if (s) io.observe(s); });
  }

  /* ---------- Mobile menu ---------- */
  const toggle = $('.menu-toggle');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* ---------- Opening status (Europe/Zurich) ---------- */
  const now = (() => {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      const get = (t) => parts.find((p) => p.type === t).value;
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      return { day, mins: +get('hour') * 60 + +get('minute') };
    } catch (_) {
      const d = new Date();
      return { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() };
    }
  })();
  const weekday = now.day >= 1 && now.day <= 5;
  const open = weekday && now.mins >= 540 && now.mins < 1140;
  let status;
  if (open) status = 'Ouvert maintenant · jusqu’à 19h';
  else if (weekday && now.mins < 540) status = 'Ouvre aujourd’hui à 9h · réservation en ligne 24h/24';
  else if (now.day >= 1 && now.day <= 4) status = 'Fermé · réouvre demain à 9h · réservation en ligne 24h/24';
  else if (now.day === 6) status = 'Samedi sur demande · réservation en ligne 24h/24';
  else status = 'Fermé · réouvre lundi à 9h · réservation en ligne 24h/24';
  const statusEl = $('[data-status]');
  if (statusEl) {
    statusEl.textContent = status;
    statusEl.parentElement.classList.toggle('is-open', open);
  }
  const today = $(`[data-hours] [data-day="${now.day}"]`);
  if (today) today.classList.add('is-today');

  /* ---------- Soins: sticky picture follows the list ---------- */
  const soins = $$('.soin');
  const frames = $$('.soins-frame > *');
  const soinCaption = $('[data-soin-caption]');
  let currentSoin = 0;
  const setSoin = (i) => {
    if (i === currentSoin) return;
    currentSoin = i;
    frames.forEach((f, k) => f.classList.toggle('is-active', k === i));
    soins.forEach((s, k) => s.classList.toggle('is-active', k === i));
    if (soinCaption) soinCaption.textContent = $('h3', soins[i]).textContent;
  };
  soins[0] && soins[0].classList.add('is-active');
  soins.forEach((s, i) => {
    s.addEventListener('mouseenter', () => desktop.matches && setSoin(i));
    s.addEventListener('focusin', () => setSoin(i));
  });

  /* ---------- Price tabs ---------- */
  const tabBtns = $$('[data-tab-btn]');
  const selectTab = (name, focus) => {
    tabBtns.forEach((b) => {
      const on = b.dataset.tabBtn === name;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
      if (on && b.scrollIntoView && b.parentElement.scrollWidth > b.parentElement.clientWidth) {
        b.parentElement.scrollTo({ left: b.offsetLeft - 16, behavior: 'smooth' });
      }
    });
    $$('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== name; });
  };
  tabBtns.forEach((b, i) => {
    b.addEventListener('click', () => selectTab(b.dataset.tabBtn));
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = tabBtns[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabBtns.length) % tabBtns.length];
      selectTab(n.dataset.tabBtn, true);
    });
  });
  $$('[data-tab]').forEach((a) => a.addEventListener('click', () => selectTab(a.dataset.tab)));

  /* ---------- Gallery rail ---------- */
  const rail = $('[data-rail]');
  const bar = $('[data-rail-bar]');
  const prev = $('[data-rail-prev]');
  const next = $('[data-rail-next]');
  if (rail) {
    const step = () => {
      const w = $('li', rail).getBoundingClientRect().width + 18;
      return w * Math.max(1, Math.floor(rail.clientWidth / w) - 1);
    };
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const p = max > 0 ? rail.scrollLeft / max : 1;
      const view = rail.clientWidth / rail.scrollWidth;
      bar.style.transform = `scaleX(${Math.min(1, view + (1 - view) * p)})`;
      prev.disabled = rail.scrollLeft < 4;
      next.disabled = rail.scrollLeft > max - 4;
    };
    prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
    rail.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();

    // mouse drag (touch keeps native scrolling)
    let down = false, moved = false, startX = 0, startLeft = 0;
    rail.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = rail.scrollLeft;
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) { moved = true; rail.classList.add('is-dragging'); }
      if (moved) rail.scrollLeft = startLeft - dx;
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (moved) {
        rail.classList.remove('is-dragging');
        const li = $('li', rail);
        const w = li.getBoundingClientRect().width + 18;
        rail.scrollTo({ left: Math.round(rail.scrollLeft / w) * w, behavior: 'smooth' });
      }
    });
    rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  }

  /* ---------- Lightbox ---------- */
  const lb = $('[data-lightbox]');
  const shots = $$('.shot');
  let lbIndex = 0;
  const lbImg = $('[data-lb-img]');
  const lbCap = $('[data-lb-cap]');
  const showShot = (i) => {
    lbIndex = (i + shots.length) % shots.length;
    const s = shots[lbIndex];
    const img = $('img', s);
    lbImg.src = s.dataset.full;
    lbImg.alt = img.alt;
    lbCap.textContent = s.nextElementSibling ? s.nextElementSibling.firstChild.textContent.trim() : '';
  };
  if (lb && typeof lb.showModal === 'function') {
    shots.forEach((s, i) => s.addEventListener('click', () => { showShot(i); lb.showModal(); }));
    $('[data-lb-close]').addEventListener('click', () => lb.close());
    $('[data-lb-prev]').addEventListener('click', () => showShot(lbIndex - 1));
    $('[data-lb-next]').addEventListener('click', () => showShot(lbIndex + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.tagName === 'FIGURE') lb.close(); });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') showShot(lbIndex + 1);
      if (e.key === 'ArrowLeft') showShot(lbIndex - 1);
    });
    let tx = null;
    lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) showShot(lbIndex + (dx < 0 ? 1 : -1));
      tx = null;
    });
  } else {
    shots.forEach((s) => s.addEventListener('click', () => window.open(s.dataset.full, '_blank')));
  }

  /* ---------- Videos: play only while visible ---------- */
  const videos = $$('video');
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting && !reduce) {
          if (v.preload === 'none') v.preload = 'auto';
          const p = v.play();
          if (p && p.catch) p.catch(() => {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.3 });
    videos.forEach((v) => vio.observe(v));
  }

  /* ---------- Reviews carousel (seamless loop) ---------- */
  const track = $('[data-marquee-track]');
  if (track && !reduce) {
    const originals = [...track.children];
    const build = () => {
      $$('[data-clone]', track).forEach((c) => c.remove());
      const gap = 22;
      const setW = originals.reduce((w, el) => w + el.getBoundingClientRect().width + gap, 0);
      const copies = Math.max(1, Math.ceil(window.innerWidth / setW));
      const addSet = () => originals.forEach((el) => {
        const c = el.cloneNode(true);
        c.setAttribute('data-clone', '');
        c.setAttribute('aria-hidden', 'true');
        $$('a', c).concat(c.tagName === 'A' ? [c] : []).forEach((a) => a.setAttribute('tabindex', '-1'));
        track.appendChild(c);
      });
      // one unit = originals + (copies-1) clones; then the unit again for the loop
      for (let i = 1; i < copies; i++) addSet();
      for (let i = 0; i < copies; i++) addSet();
      const unit = setW * copies;
      track.style.setProperty('--marquee-shift', `-${unit}px`);
      track.style.setProperty('--marquee-dur', `${Math.round(unit / 42)}s`);
    };
    build();
    let rw = window.innerWidth;
    addEventListener('resize', () => { if (Math.abs(window.innerWidth - rw) > 80) { rw = window.innerWidth; build(); } });
  }

  /* ---------- Floating Google review toast ---------- */
  const toast = $('[data-toast]');
  const reviews = [
    { t: '«\u00a0Magnifique travail de pro, les ongles ne cassent jamais et grand choix de vernis et de motifs.\u00a0»', n: 'Sarah C.' },
    { t: '«\u00a0Toujours au top, travail de pro et consciencieuse.\u00a0»', n: 'Maude S.' },
    { t: '«\u00a0Très professionnel, un travail de qualité.\u00a0»', n: 'Jean-Pierre S.' },
  ];
  let dismissed = false;
  try { dismissed = sessionStorage.getItem('ab-toast') === '1'; } catch (_) {}
  const phone = matchMedia('(max-width: 760px)').matches;
  if (toast && !dismissed && !phone) {
    const tText = $('[data-toast-text]');
    const tName = $('[data-toast-name]');
    let k = 0, timer = null, suppressed = false, started = false;
    const fill = () => { tText.textContent = reviews[k].t; tName.textContent = reviews[k].n + ' · Avis Google'; };
    const show = () => { if (suppressed) return; toast.hidden = false; requestAnimationFrame(() => toast.classList.add('is-in')); };
    const hide = () => toast.classList.remove('is-in');
    const cycle = () => {
      hide();
      setTimeout(() => { k = (k + 1) % reviews.length; fill(); show(); }, 550);
    };
    const start = () => {
      if (started) return;
      started = true;
      fill();
      setTimeout(() => { show(); timer = setInterval(cycle, 8000); }, 600);
    };
    // appear once the visitor starts exploring, never on top of the reviews or the form
    addEventListener('scroll', function once() {
      if (window.scrollY > window.innerHeight * 0.6) { setTimeout(start, 1200); removeEventListener('scroll', once); }
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      const zones = new Set();
      const tio = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? zones.add(e.target) : zones.delete(e.target)));
        suppressed = zones.size > 0;
        if (suppressed) hide(); else if (started) show();
      }, { threshold: 0.15 });
      ['.hero', '#avis', '#contact', '.site-footer'].forEach((s) => { const el = $(s); if (el) tio.observe(el); });
    }
    $('[data-toast-close]').addEventListener('click', () => {
      clearInterval(timer);
      hide();
      setTimeout(() => { toast.hidden = true; }, 500);
      try { sessionStorage.setItem('ab-toast', '1'); } catch (_) {}
    });
  }

  /* ---------- Booking form → WhatsApp / e-mail ---------- */
  const form = $('[data-form]');
  if (form) {
    const err = $('[data-form-error]');
    const ok = $('[data-form-ok]');
    const date = form.elements.date;
    try {
      const d = new Date();
      date.min = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    } catch (_) {}
    const fail = (msg, field) => {
      err.textContent = msg;
      err.hidden = false;
      if (field) { field.closest('.field').classList.add('is-invalid'); field.focus(); }
    };
    $$('input, select, textarea', form).forEach((f) => f.addEventListener('input', () => {
      const wrap = f.closest('.field');
      if (wrap) wrap.classList.remove('is-invalid');
      err.hidden = true;
    }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const via = (e.submitter && e.submitter.value) || 'wa';
      const f = form.elements;
      $$('.is-invalid', form).forEach((x) => x.classList.remove('is-invalid'));
      ok.hidden = true;
      const nom = f.nom.value.trim();
      const tel = f.tel.value.trim();
      const soin = f.soin.value;
      if (nom.length < 2) return fail('Merci d’indiquer votre prénom et votre nom.', f.nom);
      if (tel.replace(/\D/g, '').length < 9) return fail('Merci d’indiquer un numéro de téléphone valide.', f.tel);
      if (!soin) return fail('Quel soin souhaitez-vous réserver ?', f.soin);
      err.hidden = true;

      const lines = ['Bonjour Alena,', '', 'Je souhaiterais prendre rendez-vous.', '', `• Soin : ${soin}`];
      if (f.date.value) {
        const d = new Date(f.date.value + 'T12:00:00');
        lines.push(`• Date souhaitée : ${d.toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' })}`);
      }
      const moment = form.querySelector('input[name="moment"]:checked');
      if (moment) lines.push(`• Moment : ${moment.value}`);
      if (f.premiere.checked) lines.push('• C’est ma première visite');
      if (f.message.value.trim()) lines.push('', f.message.value.trim());
      lines.push('', `${nom}`, `${tel}`);
      const text = lines.join('\n');

      if (via === 'mail') {
        window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Demande de rendez-vous · ' + soin)}&body=${encodeURIComponent(text)}`;
      } else {
        const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
        const w = window.open(url, '_blank', 'noopener');
        if (!w) window.location.href = url;
      }
      ok.hidden = false;
    });
  }

  /* ---------- Year ---------- */
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Motion ---------- */
  const late = performance.now() > 2300;
  const hasGsap = window.gsap && window.ScrollTrigger;

  // fallback for the soins picture when GSAP is missing
  const soinsObserver = () => {
    if (!('IntersectionObserver' in window)) return;
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting && desktop.matches) setSoin(soins.indexOf(e.target)); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    soins.forEach((s) => sio.observe(s));
  };

  if (!hasGsap || reduce) {
    root.classList.remove('pre-intro');
    soinsObserver();
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  if (!late) {
    gsap.set('[data-hero-title] .line > span', { yPercent: 108 });
    gsap.set('[data-hero]', { opacity: 0, y: 22 });
    gsap.set('[data-hero-media]', { opacity: 0, y: 40 });
    root.classList.remove('pre-intro');
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to('[data-hero-title] .line > span', { yPercent: 0, duration: 1.15, stagger: 0.12 })
      .to('[data-hero]', { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, clearProps: 'transform' }, 0.35)
      .to('[data-hero-media]', { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, clearProps: 'transform' }, 0.2);
  } else {
    root.classList.remove('pre-intro');
  }

  // scroll reveals: only elements below the fold get hidden
  const items = $$('[data-reveal]').filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.92);
  gsap.set(items, { opacity: 0, y: 34 });
  const reveal = (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, overwrite: true, clearProps: 'transform' });
  ScrollTrigger.batch(items, { start: 'top 94%', onEnter: reveal, onEnterBack: reveal, onLeave: reveal });

  // soins picture follows the scroll on desktop
  gsap.matchMedia().add('(min-width: 1024px)', () => {
    soins.forEach((s, i) => ScrollTrigger.create({
      trigger: s, start: 'top 58%', end: 'bottom 58%',
      onToggle: (self) => { if (self.isActive) setSoin(i); },
    }));
  });

  // gentle drift on the illustrations
  gsap.fromTo('.manifeste-art', { y: 40 }, { y: -40, ease: 'none', scrollTrigger: { trigger: '.manifeste', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.alena-small', { y: 50 }, { y: -30, ease: 'none', scrollTrigger: { trigger: '.alena', start: 'top bottom', end: 'bottom top', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
