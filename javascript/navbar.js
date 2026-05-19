const SECTION_LABELS = {
    config: 'Config',
    resultados: 'Resultados',
    binario: 'Binario',
    rango: 'Rango',
    division: 'División',
    referencia: 'Referencia',
    base: 'Red Base',
    reqs: 'Requerimientos',
    'vlsm-res': 'Resultados',
};

document.addEventListener('DOMContentLoaded', () => {
    const placeholder = document.getElementById('nav-placeholder');
    if (!placeholder) return;

    const currentPath = location.pathname;
    const isInsideHtmlFolder = currentPath.includes('/html/');

    const navPath = isInsideHtmlFolder ? 'nav.html' : 'html/nav.html';

    fetch(navPath)
        .then(r => r.text())
        .then(html => {
            placeholder.innerHTML = html;
            initNavbar();
        })
        .catch(() => {
            placeholder.innerHTML = buildFallbackNav(isInsideHtmlFolder);
            initNavbar();
        });
});

function buildFallbackNav(isInsideHtmlFolder = false) {
    const indexPath = isInsideHtmlFolder ? '../index.html' : 'index.html';
    const vlsmPath = isInsideHtmlFolder ? 'vlsm.html' : 'html/vlsm.html';

    return `
  <nav class="navbar" id="mainNav">
    <a class="nav-brand" href="${indexPath}">
      <div class="nav-logo">∑</div>
      <span>Subnet<strong>Lab</strong></span>
    </a>

    <div class="nav-center" id="navCenter">
      <ul class="nav-links" id="navLinks">
        <li><a href="${indexPath}" data-page="index">Calculadora</a></li>
        <li><a href="${vlsmPath}" data-page="vlsm">VLSM</a></li>
      </ul>
      <div class="nav-slider" id="navSlider"></div>
    </div>

    <div class="nav-sections" id="navSections"></div>

    <button class="nav-toggle" id="navToggle" aria-label="Menú">
      <span></span><span></span><span></span>
    </button>
  </nav>

  <div class="nav-mobile-menu" id="navMobileMenu">
    <ul class="nav-mobile-links" id="navMobileLinks"></ul>
  </div>`;
}

function initNavbar() {
    fixNavLinks();
    markActiveLink();
    initSlider();
    initScrollSpy();
    initHamburger();
    initScrollShrink();
    buildMobileMenu();
}

function fixNavLinks() {
    const isInsideHtmlFolder = location.pathname.includes('/html/');

    document.querySelectorAll('.nav-links a, .nav-brand').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        if (href.includes('index.html')) {
            link.setAttribute('href', isInsideHtmlFolder ? '../index.html' : 'index.html');
        }

        if (href.includes('vlsm.html')) {
            link.setAttribute('href', isInsideHtmlFolder ? 'vlsm.html' : 'html/vlsm.html');
        }
    });
}

function markActiveLink() {
    const page = location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('.nav-links a').forEach(a => {
        const href = a.getAttribute('href');

        if (
            (page === 'index.html' && href.includes('index.html')) ||
            (page === 'vlsm.html' && href.includes('vlsm.html'))
        ) {
            a.classList.add('active');
        }
    });
}

let sliderTimeout = null;

function initSlider() {
    requestAnimationFrame(() => moveSliderToActive());

    document.querySelectorAll('.nav-links a').forEach(a => {
        a.addEventListener('mouseenter', () => {
            clearTimeout(sliderTimeout);
            moveSliderTo(a);
        });
    });

    const center = document.getElementById('navCenter');

    if (center) {
        center.addEventListener('mouseleave', () => {
            sliderTimeout = setTimeout(() => moveSliderToActive(), 150);
        });
    }

    window.addEventListener('resize', debounce(() => moveSliderToActive(), 100));
}

function moveSliderToActive() {
    const active = document.querySelector('.nav-links a.active');
    if (active) moveSliderTo(active);
}

function moveSliderTo(anchor) {
    const slider = document.getElementById('navSlider');
    const center = document.getElementById('navCenter');

    if (!slider || !center || !anchor) return;

    const centerRect = center.getBoundingClientRect();
    const linkRect = anchor.getBoundingClientRect();

    slider.style.width = `${linkRect.width}px`;
    slider.style.left = `${linkRect.left - centerRect.left}px`;
    slider.style.opacity = '1';
}

let sections = [];
let spyItems = [];
let activeSpy = null;

function initScrollSpy() {
    sections = [...document.querySelectorAll('[data-section]')];
    if (sections.length === 0) return;

    buildSpyDots();
    observeSections();
}

function buildSpyDots() {
    const container = document.getElementById('navSections');
    if (!container) return;

    container.innerHTML = '';
    spyItems = [];

    sections.forEach(sec => {
        const id = sec.dataset.section;
        const label = SECTION_LABELS[id] || id;

        const dot = document.createElement('button');
        dot.className = 'spy-dot';
        dot.dataset.target = id;
        dot.title = label;
        dot.setAttribute('aria-label', label);
        dot.innerHTML = `<span class="spy-label">${label}</span><span class="spy-pip"></span>`;

        dot.addEventListener('click', () => {
            sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        container.appendChild(dot);
        spyItems.push({ id, dot, sec });
    });
}

function observeSections() {
    const NAV_HEIGHT = 56;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const id = entry.target.dataset.section;
            const item = spyItems.find(s => s.id === id);

            if (!item) return;

            if (entry.isIntersecting) {
                item.dot.dataset.visible = 'true';
            } else {
                delete item.dot.dataset.visible;
            }
        });

        const firstVisible = spyItems.find(s => s.dot.dataset.visible === 'true');

        if (firstVisible && firstVisible.id !== activeSpy) {
            activeSpy = firstVisible.id;
            updateSpyActive(activeSpy);
        }
    }, {
        rootMargin: `-${NAV_HEIGHT}px 0px -55% 0px`,
        threshold: 0,
    });

    sections.forEach(sec => observer.observe(sec));
}

function updateSpyActive(id) {
    spyItems.forEach(({ dot }) => dot.classList.remove('active'));

    const item = spyItems.find(s => s.id === id);
    if (item) item.dot.classList.add('active');
}

function initHamburger() {
    const btn = document.getElementById('navToggle');
    const menu = document.getElementById('navMobileMenu');

    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        btn.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open);
    });

    menu.addEventListener('click', e => {
        if (e.target.tagName === 'A') closeMenu();
    });

    document.addEventListener('click', e => {
        if (!btn.contains(e.target) && !menu.contains(e.target)) closeMenu();
    });

    function closeMenu() {
        menu.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
    }
}

function initScrollShrink() {
    const nav = document.getElementById('mainNav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
}

function buildMobileMenu() {
    const mobileList = document.getElementById('navMobileLinks');
    const desktopLinks = document.querySelectorAll('.nav-links a');

    if (!mobileList) return;

    mobileList.innerHTML = '';

    desktopLinks.forEach(a => {
        const li = document.createElement('li');
        const clone = a.cloneNode(true);
        li.appendChild(clone);
        mobileList.appendChild(li);
    });
}

function debounce(fn, ms) {
    let t;

    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}