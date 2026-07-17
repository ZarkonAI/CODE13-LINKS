'use strict';

const CONFIG = Object.freeze({
    usernameHash: '9b66ecc0ad1f4e4148c3b41dec3ffd4b38ebf15e6a997ec98cd56e9de61cd7c3',
    passwordHash: 'f15a1e9b284cc8ad7b81a009ee5cc95246d4046c4db8c33381812083cf7c9a4a',
    sessionMinutes: 45,
    maxAttempts: 5,
    lockMinutes: 10,
});

const STORAGE_KEY = 'code13_access_grid_draft_v1';
const ATTEMPTS_KEY = 'code13_forge_attempts_v1';
const SESSION_KEY = 'code13_forge_session_v1';

const state = { links: [], editingId: null };

const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const usernameInput = document.getElementById('login-username');
const passwordInput = document.getElementById('login-password');

const panel = document.getElementById('forge-panel');
const trigger = document.getElementById('forge-trigger');
const closeButton = document.getElementById('panel-close');
const backdrop = document.getElementById('panel-backdrop');
const form = document.getElementById('link-form');
const resetButton = document.getElementById('form-reset');
const adminList = document.getElementById('admin-list');
const previewGrid = document.getElementById('preview-grid');
const itemsCount = document.getElementById('items-count');
const toast = document.getElementById('toast');
const titleInput = document.getElementById('link-title');
const urlInput = document.getElementById('link-url');
const enabledInput = document.getElementById('link-enabled');
const formTitle = document.getElementById('form-title');
const saveButtonText = document.getElementById('save-button-text');

function clonePublishedLinks() {
    const source = Array.isArray(window.CODE13_LINKS) ? window.CODE13_LINKS : [];
    return source.map((link, index) => normalizeLink(link, index));
}

function normalizeLink(link, index) {
    return {
        id: typeof link?.id === 'string' && link.id ? link.id : createId(),
        title: String(link?.title || '').trim().slice(0, 80),
        url: String(link?.url || '').trim(),
        enabled: link?.enabled !== false,
        position: index + 1,
    };
}

function createId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return `link-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sha256(value) {
    const constants = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    const initial = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const bytes = Array.from(new TextEncoder().encode(value));
    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i -= 1) bytes.push(Math.floor(bitLength / (2 ** (i * 8))) & 0xff);

    const hash = initial.slice();
    const rotateRight = (number, amount) => (number >>> amount) | (number << (32 - amount));

    for (let offset = 0; offset < bytes.length; offset += 64) {
        const words = new Array(64);
        for (let i = 0; i < 16; i += 1) {
            const start = offset + i * 4;
            words[i] = ((bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | bytes[start + 3]) >>> 0;
        }
        for (let i = 16; i < 64; i += 1) {
            const s0 = rotateRight(words[i - 15], 7) ^ rotateRight(words[i - 15], 18) ^ (words[i - 15] >>> 3);
            const s1 = rotateRight(words[i - 2], 17) ^ rotateRight(words[i - 2], 19) ^ (words[i - 2] >>> 10);
            words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
        }

        let [a, b, c, d, e, f, g, h] = hash;
        for (let i = 0; i < 64; i += 1) {
            const sigma1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
            const choice = (e & f) ^ (~e & g);
            const temp1 = (h + sigma1 + choice + constants[i] + words[i]) >>> 0;
            const sigma0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
            const majority = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (sigma0 + majority) >>> 0;
            h = g;
            g = f;
            f = e;
            e = (d + temp1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) >>> 0;
        }

        hash[0] = (hash[0] + a) >>> 0;
        hash[1] = (hash[1] + b) >>> 0;
        hash[2] = (hash[2] + c) >>> 0;
        hash[3] = (hash[3] + d) >>> 0;
        hash[4] = (hash[4] + e) >>> 0;
        hash[5] = (hash[5] + f) >>> 0;
        hash[6] = (hash[6] + g) >>> 0;
        hash[7] = (hash[7] + h) >>> 0;
    }

    return hash.map((word) => word.toString(16).padStart(8, '0')).join('');
}

function getAttemptState() {
    try {
        return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{}');
    } catch (_) {
        return {};
    }
}

function lockRemainingMs() {
    const attempts = getAttemptState();
    return Math.max(0, Number(attempts.lockUntil || 0) - Date.now());
}

function registerFailedAttempt() {
    const current = getAttemptState();
    const count = Number(current.count || 0) + 1;
    const next = { count };
    if (count >= CONFIG.maxAttempts) {
        next.count = 0;
        next.lockUntil = Date.now() + CONFIG.lockMinutes * 60_000;
    }
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(next));
}

function clearAttempts() {
    localStorage.removeItem(ATTEMPTS_KEY);
}

function createSession() {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ expiresAt: Date.now() + CONFIG.sessionMinutes * 60_000 }));
}

function hasValidSession() {
    try {
        const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
        return Number(session.expiresAt || 0) > Date.now();
    } catch (_) {
        return false;
    }
}

function destroySession() {
    sessionStorage.removeItem(SESSION_KEY);
}

function showLoginError(message) {
    loginError.textContent = message;
    loginError.hidden = false;
}

function openPanel() {
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
}

function closePanel() {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    backdrop.hidden = true;
    document.body.style.overflow = '';
}

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.toggle('is-error', isError);
    toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

function hostFromUrl(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch (_) {
        return url;
    }
}

function isValidHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch (_) {
        return false;
    }
}

function createPreviewCard(link, index) {
    const card = document.createElement('a');
    card.className = `access-card${link.enabled ? '' : ' preview-disabled'}`;
    card.href = link.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';

    const scan = document.createElement('span');
    scan.className = 'access-card__scan';

    const top = document.createElement('div');
    top.className = 'access-card__top';
    const number = document.createElement('span');
    number.className = 'access-card__index';
    number.textContent = String(index + 1).padStart(2, '0');
    const status = document.createElement('span');
    status.className = 'access-card__status';
    const dot = document.createElement('i');
    status.append(dot, document.createTextNode(link.enabled ? ' VERIFIED' : ' HIDDEN'));
    top.append(number, status);

    const body = document.createElement('div');
    body.className = 'access-card__body';
    const heading = document.createElement('h3');
    heading.textContent = link.title;
    const arrow = document.createElement('span');
    arrow.className = 'access-card__arrow';
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
    return card;
}

function createAdminItem(link, index) {
    const item = document.createElement('article');
    item.className = 'admin-item';
    item.dataset.id = link.id;

    const main = document.createElement('div');
    main.className = 'admin-item__main';
    const number = document.createElement('span');
    number.className = 'admin-item__index';
    number.textContent = String(index + 1).padStart(2, '0');
    const text = document.createElement('div');
    text.className = 'admin-item__text';
    const name = document.createElement('b');
    name.textContent = link.title;
    const url = document.createElement('span');
    url.textContent = hostFromUrl(link.url);
    text.append(name, url);
    const badge = document.createElement('span');
    badge.className = `admin-item__badge${link.enabled ? '' : ' is-hidden'}`;
    badge.textContent = link.enabled ? 'LIVE' : 'HIDDEN';
    main.append(number, text, badge);

    const actions = document.createElement('div');
    actions.className = 'admin-item__actions';
    const buttons = [
        ['up', '↑', 'Move up'],
        ['down', '↓', 'Move down'],
        ['edit', 'EDIT', 'Edit'],
        ['toggle', link.enabled ? 'HIDE' : 'SHOW', link.enabled ? 'Hide' : 'Show'],
        ['delete', 'DEL', 'Delete'],
    ];
    buttons.forEach(([action, label, title]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.action = action;
        button.title = title;
        button.textContent = label;
        actions.append(button);
    });

    item.append(main, actions);
    return item;
}

function persistDraft() {
    state.links = state.links.map((link, index) => ({ ...link, position: index + 1 }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.links));
}

function loadDraft() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        state.links = Array.isArray(parsed)
            ? parsed.map((link, index) => normalizeLink(link, index))
            : clonePublishedLinks();
    } catch (_) {
        state.links = clonePublishedLinks();
    }
}

function render() {
    previewGrid.replaceChildren();
    adminList.replaceChildren();
    state.links.forEach((link, index) => {
        previewGrid.append(createPreviewCard(link, index));
        adminList.append(createAdminItem(link, index));
    });
    itemsCount.textContent = String(state.links.length);
    if (!state.links.length) {
        const empty = document.createElement('div');
        empty.className = 'admin-list__empty';
        empty.textContent = 'No access points added yet.';
        adminList.append(empty);
    }
}

function resetForm() {
    state.editingId = null;
    form.reset();
    enabledInput.checked = true;
    formTitle.textContent = 'NEW ACCESS POINT';
    saveButtonText.textContent = 'ADD ACCESS POINT';
    resetButton.hidden = true;
}

function startEdit(link) {
    state.editingId = link.id;
    titleInput.value = link.title;
    urlInput.value = link.url;
    enabledInput.checked = Boolean(link.enabled);
    formTitle.textContent = 'EDIT ACCESS POINT';
    saveButtonText.textContent = 'SAVE CHANGES';
    resetButton.hidden = false;
    titleInput.focus();
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

function linksJsContent() {
    const published = state.links.map((link, index) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        enabled: Boolean(link.enabled),
        position: index + 1,
    }));
    return `/* Generated with CODE13 FORGE */\nwindow.CODE13_LINKS = ${JSON.stringify(published, null, 2)};\n`;
}

function enterAdmin() {
    loginView.hidden = true;
    adminView.hidden = false;
    loadDraft();
    render();
    setTimeout(openPanel, 180);
}

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginError.hidden = true;

    const remaining = lockRemainingMs();
    if (remaining > 0) {
        showLoginError(`Too many attempts. Try again in ${Math.ceil(remaining / 60_000)} min.`);
        return;
    }

    try {
        const [usernameHash, passwordHash] = await Promise.all([
            sha256(usernameInput.value),
            sha256(passwordInput.value),
        ]);

        if (usernameHash === CONFIG.usernameHash && passwordHash === CONFIG.passwordHash) {
            clearAttempts();
            createSession();
            passwordInput.value = '';
            enterAdmin();
        } else {
            registerFailedAttempt();
            const nowLocked = lockRemainingMs();
            showLoginError(nowLocked > 0
                ? `Access locked for ${CONFIG.lockMinutes} minutes.`
                : 'Invalid login or password.');
        }
    } catch (_) {
        showLoginError('This browser does not support the required encryption function.');
    }
});

trigger.addEventListener('click', openPanel);
closeButton.addEventListener('click', closePanel);
backdrop.addEventListener('click', closePanel);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closePanel(); });
resetButton.addEventListener('click', resetForm);

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();

    if (!title) {
        showToast('Enter a title.', true);
        return;
    }
    if (!isValidHttpUrl(url)) {
        showToast('Enter a valid http:// or https:// URL.', true);
        return;
    }

    if (state.editingId) {
        const index = state.links.findIndex((link) => link.id === state.editingId);
        if (index >= 0) {
            state.links[index] = { ...state.links[index], title, url, enabled: enabledInput.checked };
        }
        showToast('Changes saved to the local draft.');
    } else {
        state.links.push({ id: createId(), title, url, enabled: enabledInput.checked, position: state.links.length + 1 });
        showToast('Access point added to the local draft.');
    }

    persistDraft();
    render();
    resetForm();
});

adminList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    const item = event.target.closest('.admin-item');
    if (!button || !item) return;

    const index = state.links.findIndex((link) => link.id === item.dataset.id);
    if (index < 0) return;
    const link = state.links[index];
    const action = button.dataset.action;

    if (action === 'edit') {
        startEdit(link);
        return;
    }
    if (action === 'toggle') {
        link.enabled = !link.enabled;
        showToast(link.enabled ? 'Access point is now visible.' : 'Access point is now hidden.');
    } else if (action === 'delete') {
        if (!window.confirm(`Delete “${link.title}”?`)) return;
        state.links.splice(index, 1);
        if (state.editingId === link.id) resetForm();
        showToast('Access point deleted.');
    } else if (action === 'up' && index > 0) {
        [state.links[index - 1], state.links[index]] = [state.links[index], state.links[index - 1]];
    } else if (action === 'down' && index < state.links.length - 1) {
        [state.links[index + 1], state.links[index]] = [state.links[index], state.links[index + 1]];
    }

    persistDraft();
    render();
});

document.getElementById('export-js').addEventListener('click', () => {
    downloadFile('links.js', linksJsContent(), 'text/javascript;charset=utf-8');
    showToast('links.js downloaded.');
});

document.getElementById('export-json').addEventListener('click', () => {
    downloadFile('code13-links-backup.json', JSON.stringify(state.links, null, 2), 'application/json;charset=utf-8');
    showToast('JSON backup downloaded.');
});

document.getElementById('import-json').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
        const parsed = JSON.parse(await file.text());
        if (!Array.isArray(parsed)) throw new Error('The file must contain an array of links.');
        const normalized = parsed.map((link, index) => normalizeLink(link, index));
        if (normalized.some((link) => !link.title || !isValidHttpUrl(link.url))) {
            throw new Error('The file contains an invalid title or URL.');
        }
        state.links = normalized;
        persistDraft();
        render();
        resetForm();
        showToast('Data imported.');
    } catch (error) {
        showToast(error.message || 'Could not import the file.', true);
    } finally {
        event.target.value = '';
    }
});

document.getElementById('reset-published').addEventListener('click', () => {
    if (!window.confirm('Delete the local draft and restore the published links?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state.links = clonePublishedLinks();
    render();
    resetForm();
    showToast('Draft reset.');
});

document.getElementById('logout-button').addEventListener('click', () => {
    destroySession();
    window.location.reload();
});

if (hasValidSession()) enterAdmin();
