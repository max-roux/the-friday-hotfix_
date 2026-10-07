const TITLE = 'The Friday Hotfix';
const TITLE_STORAGE_KEY = 'fh-title-typed';

const TYPE_MS = 70;
const BACKSPACE_MS = 40;
const PAUSE_BEFORE_MS = 200;
const PAUSE_AFTER_TYPO_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getCursor(typed: HTMLElement): HTMLElement | null {
  return typed.parentElement?.querySelector<HTMLElement>('.cursor') ?? null;
}

function setCursorIdle(typed: HTMLElement, idle: boolean): void {
  const cursor = getCursor(typed);
  if (!cursor) return;
  cursor.classList.toggle('is-idle', idle);
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

  // Wrong start: Danish "Fredag" + stray "H", back to "The Fr", then finish (≈2.55s total, §5.1).
  await typeInto(el, 'The Fredag H');
  await sleep(PAUSE_AFTER_TYPO_MS);
  await backspace(el, 6); // "edag H" → "The Fr"
  await typeInto(el, 'iday Hotfix');

  el.dataset.typed = 'done';
  if (el.textContent !== TITLE) {
    el.textContent = TITLE;
  }
  setCursorIdle(el, true);
  document.documentElement.classList.remove('title-will-type');

  try {
    localStorage.setItem(TITLE_STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

function runTitleTyping(): void {
  const typed = document.querySelector<HTMLElement>('[data-title-typed]');
  if (!typed) return;

  // Decided before first paint by the inline script in BaseLayout.astro
  // (reduced motion, ?retype, localhost, already seen).
  if (!document.documentElement.classList.contains('title-will-type')) {
    typed.textContent = TITLE;
    typed.dataset.typed = 'done';
    setCursorIdle(typed, true);
    return;
  }

  void runTitleTypingSequence(typed);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runTitleTyping, { once: true });
} else {
  runTitleTyping();
}
