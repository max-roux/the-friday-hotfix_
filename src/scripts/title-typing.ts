const TITLE = 'The Friday Hotfix';
const TITLE_STORAGE_KEY = 'fh-title-typed';

const TYPE_MS = 70;
const BACKSPACE_MS = 40;
const PAUSE_BEFORE_MS = 200;
const PAUSE_AFTER_TYPO_MS = 500;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function getCursor(typed: HTMLElement): HTMLElement | null {
  return typed.parentElement?.querySelector<HTMLElement>('.cursor') ?? null;
}

function setCursorIdle(typed: HTMLElement, idle: boolean): void {
  const cursor = getCursor(typed);
  if (!cursor) return;
  cursor.classList.toggle('is-idle', idle);
}

function shouldSkipTyping(): boolean {
  if (prefersReducedMotion()) return true;

  const force = new URLSearchParams(window.location.search).has('retype');
  if (force) {
    try {
      localStorage.removeItem(TITLE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    document.documentElement.classList.add('title-will-type');
    return false;
  }

  // Prefer the head-script decision when present (set before first paint).
  if (document.documentElement.classList.contains('title-will-type')) {
    return false;
  }

  if (import.meta.env.DEV) return false;

  return safeLocalStorageGet(TITLE_STORAGE_KEY) === '1';
}

async function typeInto(el: HTMLElement, text: string, ms = TYPE_MS): Promise<void> {
  for (const char of text) {
    el.textContent += char;
    await sleep(ms);
  }
}

async function backspace(el: HTMLElement, count: number, ms = BACKSPACE_MS): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    const current = el.textContent ?? '';
    el.textContent = current.slice(0, -1);
    await sleep(ms);
  }
}

async function runTitleTypingSequence(el: HTMLElement): Promise<void> {
  el.textContent = '';
  el.dataset.typed = 'typing';
  setCursorIdle(el, false);

  await sleep(PAUSE_BEFORE_MS);

  // Wrong start: Danish "Fredag" + stray "H" → rewrite as "Friday Hotfix".
  await typeInto(el, 'The Fredag H');
  await sleep(PAUSE_AFTER_TYPO_MS);
  await backspace(el, 8); // "Fredag H" (incl. space before H)
  await typeInto(el, 'Friday Hotfix');

  el.dataset.typed = 'done';
  if (el.textContent !== TITLE) {
    el.textContent = TITLE;
  }
  setCursorIdle(el, true);
  document.documentElement.classList.remove('title-will-type');

  if (!import.meta.env.DEV) {
    safeLocalStorageSet(TITLE_STORAGE_KEY, '1');
  }
}

function runTitleTyping(): void {
  const typed = document.querySelector<HTMLElement>('[data-title-typed]');
  if (!typed) return;

  if (shouldSkipTyping()) {
    typed.textContent = TITLE;
    typed.dataset.typed = 'done';
    setCursorIdle(typed, true);
    document.documentElement.classList.remove('title-will-type');
    return;
  }

  void runTitleTypingSequence(typed);
}

function boot(): void {
  document.documentElement.classList.add('js');
  runTitleTyping();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
