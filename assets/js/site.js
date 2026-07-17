'use strict';

const LOCAL_STORAGE_KEY = 'code13_access_grid_draft_v1';

function getPublishedLinks() {
    return Array.isArray(window.CODE13_LINKS) ? window.CODE13_LINKS : [];
}

function getLinksForCurrentBrowser() {
    try {
        const draft = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || 'null');
        if (Array.isArray(draft)) return draft;
    } catch (_) {
        // Используем опубликованные данные, если черновик повреждён.
    }
    return getPublishedLinks();
}

function hostFromUrl(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch (_) {
        return url;
    }
}

function createCard(link, index) {
    const card = document.createElement('a');
    card.className = 'access-card';
    card.href = link.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.dataset.reveal = '';

    const scan = document.createElement('span');
    scan.className = 'access-card__scan';
    scan.setAttribute('aria-hidden', 'true');

    const top = document.createElement('div');
    top.className = 'access-card__top';

    const number = document.createElement('span');
    number.className = 'access-card__index';
    number.textContent = String(index + 1).padStart(2, '0');

    const status = document.createElement('span');
    status.className = 'access-card__status';
    const statusDot = document.createElement('i');
    status.append(statusDot, document.createTextNode(' VERIFIED'));
    top.append(number, status);

    const body = document.createElement('div');
    body.className = 'access-card__body';

    const heading = document.createElement('h3');
    heading.textContent = link.title;

    const arrow = document.createElement('span');
    arrow.className = 'access-card__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    body.append(heading, arrow);

    const bottom = document.createElement('div');
    bottom.className = 'access-card__bottom';

    const host = document.createElement('span');
    host.className = 'access-card__host';
    host.textContent = hostFromUrl(link.url);

    const open = document.createElement('span');
    open.className = 'access-card__open';
    open.textContent = 'OPEN CONNECTION';
    bottom.append(host, open);

    card.append(scan, top, body, bottom);

    card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });

    return card;
}

function startRevealObserver() {
    const revealNodes = document.querySelectorAll('[data-reveal]:not(.is-visible)');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });
        revealNodes.forEach((node) => observer.observe(node));
    } else {
        revealNodes.forEach((node) => node.classList.add('is-visible'));
    }
}

function renderLinks() {
    const grid = document.getElementById('links-grid');
    const empty = document.getElementById('empty-state');
    const counter = document.getElementById('active-links-count');

    const links = getLinksForCurrentBrowser()
        .filter((link) => link && link.enabled !== false && typeof link.title === 'string' && typeof link.url === 'string')
        .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));

    grid.replaceChildren(...links.map(createCard));
    empty.hidden = links.length > 0;
    counter.textContent = `${links.length} ACTIVE ${links.length === 1 ? 'LINK' : 'LINKS'}`;
    startRevealObserver();
}

const yearNode = document.querySelector('[data-current-year]');
if (yearNode) yearNode.textContent = String(new Date().getFullYear());

renderLinks();

window.addEventListener('storage', (event) => {
    if (event.key === LOCAL_STORAGE_KEY) renderLinks();
});
