// Dirav Labs website interactions
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  // Select a package in the demo form
  function pickPackage(name) {
    const r = $$('#demoForm input[name="package"]').find((x) => x.value === name);
    if (r) r.checked = true;
  }

  // Footer year
  $('#year').textContent = new Date().getFullYear();

  // Sticky nav shadow + back-to-top button
  const nav = $('#nav');
  const toTop = $('#toTop');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 10);
    toTop.classList.toggle('show', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const toggle = $('#navToggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  $$('#navLinks a').forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  // Highlight the nav link of the section on screen
  const links = $$('#navLinks a');
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((l) => {
    const s = document.querySelector(l.getAttribute('href'));
    if (s) sectionObs.observe(s);
  });

  // Scroll reveal (staggered inside each parent)
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const siblings = $$('.reveal', e.target.parentElement);
      e.target.style.transitionDelay = Math.min(siblings.indexOf(e.target), 6) * 80 + 'ms';
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  $$('.reveal').forEach((el) => revealObs.observe(el));

  // Count-up numbers
  const fmt = (n) => n.toLocaleString('en-US');
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const to = +el.dataset.to;
      const dur = 1600;
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min((t - start) / dur, 1);
        el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObs.unobserve(el);
    });
  }, { threshold: 0.4 });
  $$('.count').forEach((el) => countObs.observe(el));

  // Hero dashboard: grow chart bars when visible
  const mock = $('.app');
  if (mock) new IntersectionObserver((entries, o) => {
    if (entries[0].isIntersecting) { mock.classList.add('in'); o.disconnect(); }
  }, { threshold: 0.3 }).observe(mock);

  // 3D tilt on the hero dashboard
  const tilt = $('#tilt');
  const visual = $('.hero-visual');
  if (window.matchMedia('(pointer: fine)').matches) {
    visual.addEventListener('mousemove', (e) => {
      const r = visual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    });
    visual.addEventListener('mouseleave', () => { tilt.style.transform = ''; });
  }

  // Rotating word in the hero headline
  const words = ['shop', 'restaurant', 'warehouse', 'online store', 'business'];
  const rot = $('#rotator');
  let wi = 0;
  setInterval(() => {
    rot.classList.add('out');
    setTimeout(() => {
      wi = (wi + 1) % words.length;
      rot.textContent = words[wi];
      rot.classList.remove('out');
    }, 350);
  }, 2400);

  // Hero background scenes: crossfade every 6s, or pick one from the pager
  const scenes = $$('.bg-scene');
  const pager = $$('.bg-pager button');
  let si = 0;
  const showScene = (i) => {
    si = i;
    scenes.forEach((sc, n) => sc.classList.toggle('active', n === i));
    pager.forEach((b, n) => b.classList.toggle('active', n === i));
  };
  let sceneTimer = scenes.length > 1 ? setInterval(() => showScene((si + 1) % scenes.length), 6000) : null;
  pager.forEach((b, n) => b.addEventListener('click', () => {
    clearInterval(sceneTimer);
    showScene(n);
    sceneTimer = setInterval(() => showScene((si + 1) % scenes.length), 6000);
  }));

  // 3D orbit of module chips around the POS stage
  const orbit = $('#orbit3d');
  if (orbit) {
    const chips = $$('.chip', orbit);
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let t0 = performance.now();
    const place = (now) => {
      const t = still ? 0 : (now - t0) / 1000;
      const w = orbit.clientWidth / 2, h = orbit.clientHeight / 2;
      chips.forEach((c, i) => {
        const a = t * 0.35 + (i / chips.length) * Math.PI * 2;
        const x = Math.cos(a) * w, y = Math.sin(a) * h;
        const depth = (Math.sin(a) + 1) / 2;            // 0 = back, 1 = front
        c.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${0.72 + depth * 0.38})`;
        c.style.opacity = 0.45 + depth * 0.55;
        c.style.zIndex = depth > 0.5 ? 6 : 1;            // pass behind / in front of the POS
        c.style.filter = depth < 0.35 ? 'blur(1.5px)' : 'none';
      });
      if (!still) requestAnimationFrame(place);
    };
    requestAnimationFrame(place);
  }

  // Live "payment received" toast in the hero
  const toasts = ['Card · LKR 12,450', 'Cash · LKR 3,280', 'QR · LKR 28,900', 'Card · LKR 7,615'];
  const toast = $('#toastText');
  let ti = 0;
  setInterval(() => {
    toast.style.opacity = 0;
    setTimeout(() => { ti = (ti + 1) % toasts.length; toast.textContent = toasts[ti]; toast.style.opacity = 1; }, 300);
  }, 3000);

  // Glow that follows the mouse on feature cards
  $$('.feature').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', e.clientX - r.left + 'px');
      card.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  });

  // Module builder: toggle modules, presets, live summary
  const mods = $$('.mod');
  if (mods.length) {
    const presets = {
      retail: ['pos', 'sales', 'customers', 'loyalty', 'webstore', 'orders', 'purchasing', 'accounts', 'roles'],
      restaurant: ['pos', 'restaurant', 'customers', 'orders', 'delivery', 'purchasing', 'employees', 'expenses'],
      wholesale: ['sales', 'customers', 'purchasing', 'orders', 'delivery', 'accounts', 'expenses', 'roles', 'logs'],
      service: ['sales', 'customers', 'service', 'employees', 'accounts', 'expenses'],
      all: mods.map((m) => m.dataset.mod)
    };
    const fg = $('#ringFg');
    const C = 2 * Math.PI * 52;
    const render = () => {
      const on = mods.filter((m) => m.classList.contains('on'));
      $('#modCount').textContent = on.length;
      fg.style.strokeDashoffset = C * (1 - on.length / mods.length);
      $('#setupChips').innerHTML = on.map((m) => `<span>${$('b', m).firstChild.textContent}</span>`).join('');
      const web = on.some((m) => m.dataset.mod === 'webstore');
      $('#setupPlan').textContent = on.length > 14 ? 'Enterprise' : web ? 'POS + Webstore' : 'POS';
      $$('.mod-group').forEach((g) => {
        const all = $$('.mod', g);
        $('.mg-count', g).textContent = `${all.filter((m) => m.classList.contains('on')).length} / ${all.length} on`;
      });
    };
    const set = (m, v) => {
      if (m.classList.contains('core')) return;
      if (m.classList.contains('on') !== v) { m.classList.remove('pop'); void m.offsetWidth; m.classList.add('pop'); }
      m.classList.toggle('on', v);
      m.setAttribute('aria-checked', v);
    };
    mods.forEach((m) => m.addEventListener('click', () => {
      set(m, !m.classList.contains('on'));
      $$('.preset').forEach((p) => p.classList.remove('active'));
      render();
    }));
    $$('.preset').forEach((p) => p.addEventListener('click', () => {
      const list = presets[p.dataset.preset];
      mods.forEach((m) => set(m, list.includes(m.dataset.mod)));
      $$('.preset').forEach((x) => x.classList.toggle('active', x === p));
      render();
    }));
    // Carry the chosen package into the demo form
    $('#setupCta').addEventListener('click', () => {
      pickPackage($('#setupPlan').textContent);
    });
    $('.preset[data-preset="retail"]').click();
  }

  // Industry tabs
  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      $$('.panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      $('#tab-' + tab.dataset.tab).classList.add('active');
      tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  });

  // Package buttons pick that package in the demo form
  $$('[data-plan]').forEach((a) => a.addEventListener('click', () => {
    pickPackage(a.dataset.plan);
  }));

  // FAQ: category filter, and keep one answer open at a time
  const fqs = $$('.fq');
  $$('.fc').forEach((b) => b.addEventListener('click', () => {
    $$('.fc').forEach((x) => x.classList.toggle('active', x === b));
    fqs.forEach((f) => { f.hidden = b.dataset.cat !== 'all' && f.dataset.cat !== b.dataset.cat; });
  }));
  fqs.forEach((f) => f.addEventListener('toggle', () => {
    if (f.open) fqs.forEach((o) => { if (o !== f) o.open = false; });
  }));

  // Monthly / yearly pricing toggle with a sliding pill
  const billing = $('.billing');
  const pill = $('.bill-pill');
  const movePill = () => {
    const b = $('.bill.active');
    if (!b || !pill) return;
    pill.style.setProperty('--pw', b.offsetWidth + 'px');
    pill.style.setProperty('--px', b.offsetLeft - 5 + 'px');
  };
  movePill();
  window.addEventListener('resize', movePill);
  $$('.bill').forEach((btn) => btn.addEventListener('click', () => {
    setTimeout(movePill);
    $('#pricing').classList.toggle('pricing-yearly', btn.dataset.bill === 'yearly');
  }));
  $$('.bill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.bill;
      $$('.bill').forEach((b) => b.classList.toggle('active', b === btn));
      $$('.plan').forEach((plan) => {
        const amt = $('.amt', plan);
        const per = $('.per', plan);
        amt.classList.add('flip');
        setTimeout(() => {
          amt.textContent = amt.dataset[mode];
          if (per.textContent) per.textContent = mode === 'yearly' ? '/ year' : '/ month';
          amt.classList.remove('flip');
        }, 200);
      });
    });
  });

  // Demo form: opens WhatsApp with the details (change the number below)
  const WHATSAPP_NUMBER = '94741112504';
  $('#demoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    const msg = `Hi Dirav Labs, I'd like a demo.\nName: ${d.get('name')}\nPhone: ${d.get('phone')}\nBusiness: ${d.get('type')}\nPackage: ${d.get('package')}\nModules: ${$$('.mod.on').map((m) => $('b', m).firstChild.textContent).join(', ')}`;
    $('#formNote').textContent = 'Thank you! Opening WhatsApp…';
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });
})();
