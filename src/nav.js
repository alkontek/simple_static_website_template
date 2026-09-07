/* SPDX-FileCopyrightText: 2026 ALKONTEK <git@alkontek.com>
 * SPDX-License-Identifier: BSD-2-Clause
 * -----------------------------------------------------------------------------
 * Navigation menu and theme toggle initialization.
 */

const WIDTH_ORDER = ['4xl', '6xl', 'full'];
const WIDTH_DEFAULT = '6xl';

const THEME_ICONS = {
    light: '◐',
    inverse: '◑',
};

const WIDTH_LABELS = {
    '4xl': '4XL',
    '6xl': '6XL',
    full: 'FUL',
};

function isInverse() {
    return document.documentElement.classList.contains('inverse');
}

function getSiteWidth() {
    const w = document.documentElement.getAttribute('data-site-width');
    return WIDTH_ORDER.includes(w) ? w : WIDTH_DEFAULT;
}

function nextSiteWidth(current) {
    const i = WIDTH_ORDER.indexOf(current);
    return WIDTH_ORDER[(i + 1) % WIDTH_ORDER.length];
}

function setInverse(on, animate = false) {
    const root = document.documentElement;
    if (animate) {
        root.classList.add('theme-animating');
    }
    root.classList.toggle('inverse', on);
    try {
        localStorage.setItem('theme', on ? 'inverse' : 'light');
    } catch (_) {}
    syncThemeToggleUi();
    if (animate) {
        window.setTimeout(() => {
            root.classList.remove('theme-animating');
        }, 250);
    }
}

function setSiteWidth(width) {
    const w = WIDTH_ORDER.includes(width) ? width : WIDTH_DEFAULT;
    document.documentElement.setAttribute('data-site-width', w);
    try {
        localStorage.setItem('siteWidth', w);
    } catch (_) {}
    syncWidthToggleUi();
}

function syncThemeToggleUi() {
    const btn = document.getElementById('theme_toggle');
    if (!btn) return;

    const inverse = isInverse();
    const icon = btn.querySelector('.theme-toggle-icon');

    btn.setAttribute('aria-pressed', inverse ? 'true' : 'false');
    if (icon) icon.textContent = inverse ? THEME_ICONS.inverse : THEME_ICONS.light;
    btn.title = inverse ? 'Switch to light theme' : 'Switch to inverse theme';
    btn.setAttribute('aria-label', 'Toggle inverse theme');
}

function syncWidthToggleUi() {
    const btn = document.getElementById('width_toggle');
    if (!btn) return;

    const width = getSiteWidth();
    const next = nextSiteWidth(width);
    const icon = btn.querySelector('.width-toggle-icon');

    if (icon) icon.textContent = WIDTH_LABELS[width] ?? WIDTH_LABELS[WIDTH_DEFAULT];
    btn.title = `Width ${width} — click for ${next}`;
    btn.setAttribute('aria-label', `Cycle site width (current ${width})`);
}

function initMenuToggle() {
    const toggleBtn = document.getElementById('nav_toggle');
    const menu = document.getElementById('nav_menu');

    if (!toggleBtn || !menu) return;

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        menu.classList.add('hidden');
    });
}

function initThemeToggle() {
    const btn = document.getElementById('theme_toggle');
    if (!btn) return;

    syncThemeToggleUi();

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setInverse(!isInverse(), true);
    });
}

function initWidthToggle() {
    const btn = document.getElementById('width_toggle');
    if (!btn) return;

    let savedWidth = WIDTH_DEFAULT;
    try {
        const stored = localStorage.getItem('siteWidth');
        if (WIDTH_ORDER.includes(stored)) savedWidth = stored;
    } catch (_) {}

    setSiteWidth(savedWidth);

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setSiteWidth(nextSiteWidth(getSiteWidth()));
    });
}

export function initNavigation() {
    initMenuToggle();
    initThemeToggle();
    initWidthToggle();
}
