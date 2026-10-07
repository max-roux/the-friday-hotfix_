import { subscribe } from '../lib/subscribe';

const TITLE = 'The Friday Hotfix';
const TITLE_STORAGE_KEY = 'fh-title-typed';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
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

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

/* —— bootstrap —— */
document.documentElement.classList.add('js');
if (prefersReducedMotion()) {
  document.documentElement.classList.add('reduced-motion');
}

initTitleTyping();
initEditions();
initOneline();
initGrep();
initCopySlack();
initSubscribe();
initShortcuts();
initKeyboardNav();
initGraph();
handleInitialHash();

/* —— 5.1 typing title —— */
function initTitleTyping(): void {
  const typed = document.querySelector<HTMLElement>('[data-title-typed]');
  if (!typed) return;

  const alreadyTyped = safeLocalStorageGet(TITLE_STORAGE_KEY) === '1';
  if (alreadyTyped || prefersReducedMotion()) {
    typed.textContent = TITLE;
    return;
  }

  typed.textContent = '';
  window.setTimeout(() => {
    let i = 0;
    const tick = () => {
      i += 1;
      typed.textContent = TITLE.slice(0, i);
      if (i < TITLE.length) {
        window.setTimeout(tick, 95);
      } else {
        safeLocalStorageSet(TITLE_STORAGE_KEY, '1');
      }
    };
    tick();
  }, 500);
}

/* —— 5.4 expandable editions —— */
function initEditions(): void {
  document.querySelectorAll<HTMLElement>('[data-edition]').forEach((edition) => {
    const toggle = edition.querySelector<HTMLButtonElement>('[data-edition-toggle]');
    const icon = edition.querySelector<HTMLElement>('[data-edition-icon]');
    if (!toggle || !icon) return;

    // No-JS: all expanded. With JS: only preferred (HEAD / focus) start open.
    const shouldStartExpanded = edition.dataset.preferExpanded === 'true';
    setExpanded(edition, shouldStartExpanded, icon, toggle);

    toggle.addEventListener('click', () => {
      const next = edition.dataset.expanded !== 'true';
      setExpanded(edition, next, icon, toggle);
      scheduleGraphUpdate();
    });
  });
}

function setExpanded(
  edition: HTMLElement,
  expanded: boolean,
  icon: HTMLElement,
  toggle: HTMLButtonElement,
): void {
  edition.dataset.expanded = expanded ? 'true' : 'false';
  toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  icon.textContent = expanded ? '[−]' : '[+]';
}

function expandEdition(edition: HTMLElement): void {
  const toggle = edition.querySelector<HTMLButtonElement>('[data-edition-toggle]');
  const icon = edition.querySelector<HTMLElement>('[data-edition-icon]');
  if (!toggle || !icon) return;
  setExpanded(edition, true, icon, toggle);
}

function handleInitialHash(): void {
  const hash = window.location.hash.slice(1);
  if (!hash) return;

  const target =
    document.getElementById(hash) ??
    document.querySelector<HTMLElement>(`[data-version="${CSS.escape(hash)}"]`);
  if (!target) return;

  const edition =
    target.closest<HTMLElement>('[data-edition]') ??
    (target.matches('[data-edition]') ? target : null);
  if (edition) expandEdition(edition);

  // Edition route may land without a hash; pages set data-focus-scroll.
  requestAnimationFrame(() => {
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
    scheduleGraphUpdate();
  });
}

// Focus edition from static route (/v2026.41)
const focusVersion = document.body.dataset.focusVersion;
if (focusVersion) {
  const edition = document.querySelector<HTMLElement>(
    `[data-edition][data-version="${CSS.escape(focusVersion)}"]`,
  );
  if (edition) {
    expandEdition(edition);
    requestAnimationFrame(() => {
      edition.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
      scheduleGraphUpdate();
    });
  }
}

/* —— 5.2 --oneline —— */
function initOneline(): void {
  const btn = document.querySelector<HTMLButtonElement>('[data-oneline]');
  if (!btn) return;

  const apply = (on: boolean) => {
    document.body.classList.toggle('oneline', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  };

  btn.addEventListener('click', () => {
    apply(document.body.classList.contains('oneline') === false);
  });

  (window as unknown as { __toggleOneline: () => void }).__toggleOneline = () => {
    apply(document.body.classList.contains('oneline') === false);
  };
}

/* —— 5.3 topic filters —— */
function initGrep(): void {
  const chips = [
    ...document.querySelectorAll<HTMLButtonElement>('[data-grep]'),
  ];
  if (chips.length === 0) return;

  const params = new URLSearchParams(window.location.search);
  const initial = params.get('grep') ?? '*';
  const valid = new Set(chips.map((c) => c.dataset.grep ?? ''));
  const start = valid.has(initial) ? initial : '*';

  const apply = (topic: string, syncUrl: boolean) => {
    chips.forEach((chip) => {
      chip.setAttribute(
        'aria-pressed',
        chip.dataset.grep === topic ? 'true' : 'false',
      );
    });

    document.querySelectorAll<HTMLElement>('[data-edition]').forEach((edition) => {
      const items = [...edition.querySelectorAll<HTMLElement>('[data-item]')];
      let visible = 0;
      items.forEach((item) => {
        const match = topic === '*' || item.dataset.topic === topic;
        item.classList.toggle('is-filtered-out', !match);
        if (match) visible += 1;
      });

      const empty = edition.querySelector<HTMLElement>('[data-empty-row]');
      const emptyTopic = edition.querySelector<HTMLElement>('[data-empty-topic]');
      if (empty && emptyTopic) {
        emptyTopic.textContent = topic;
        empty.classList.toggle('is-visible', visible === 0);
      }
    });

    if (syncUrl) {
      const url = new URL(window.location.href);
      if (topic === '*') url.searchParams.delete('grep');
      else url.searchParams.set('grep', topic);
      history.replaceState(null, '', url.toString());
    }

    resetKeyboardSelection();
    scheduleGraphUpdate();
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      apply(chip.dataset.grep ?? '*', true);
    });
  });

  apply(start, false);
}

/* —— 5.5 copy for slack —— */
function initCopySlack(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-copy-slack]').forEach((btn) => {
    const edition = btn.closest<HTMLElement>('[data-edition]');
    if (!edition) return;
    const text = edition.dataset.slack ?? '';
    const fallbackHost = edition.querySelector<HTMLElement>('[data-copy-fallback]');
    const original = btn.textContent ?? 'copy for slack';

    btn.addEventListener('click', async () => {
      const ok = await copyText(text);
      if (ok) {
        btn.textContent = '✓ copied. paste it in slack';
        window.setTimeout(() => {
          btn.textContent = original;
        }, 2500);
        if (fallbackHost) {
          fallbackHost.hidden = true;
          fallbackHost.replaceChildren();
        }
        return;
      }

      if (!fallbackHost) return;
      fallbackHost.hidden = false;
      fallbackHost.replaceChildren();
      const label = document.createElement('label');
      label.className = 'copy-fallback__label';
      const id = `copy-fallback-${edition.dataset.version}`;
      label.htmlFor = id;
      label.textContent =
        'copying is blocked here. select the text and copy it yourself:';
      const ta = document.createElement('textarea');
      ta.id = id;
      ta.className = 'copy-fallback__textarea';
      ta.rows = 12;
      ta.value = text;
      ta.readOnly = true;
      fallbackHost.append(label, ta);
      ta.focus();
      ta.select();
    });
  });
}

async function copyText(text: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/* —— 5.7 subscribe —— */
function initSubscribe(): void {
  const form = document.querySelector<HTMLFormElement>('[data-subscribe-form]');
  const input = document.querySelector<HTMLInputElement>('[data-subscribe-input]');
  const submit = document.querySelector<HTMLButtonElement>('[data-subscribe-submit]');
  const status = document.querySelector<HTMLElement>('[data-subscribe-status]');
  if (!form || !input || !submit || !status) return;

  const setStatus = (
    message: string,
    kind: 'error' | 'ok' | 'muted' | '',
  ) => {
    status.textContent = message;
    status.classList.remove('is-error', 'is-ok', 'is-muted');
    if (kind === 'error') status.classList.add('is-error');
    if (kind === 'ok') status.classList.add('is-ok');
    if (kind === 'muted') status.classList.add('is-muted');
  };

  input.addEventListener('input', () => setStatus('', ''));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = input.value.trim();

    if (!value) {
      setStatus('fatal: nothing to push. add an email first.', 'error');
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setStatus(
        `fatal: '${value}' does not appear to be a valid email`,
        'error',
      );
      return;
    }

    setStatus('pushing…', 'muted');
    submit.disabled = true;
    try {
      await subscribe(value);
      setStatus(
        '✓ pushed to origin/inbox. first hotfix lands friday.',
        'ok',
      );
      input.value = '';
    } catch {
      setStatus(
        'fatal: unable to reach origin. try again in a minute.',
        'error',
      );
    } finally {
      submit.disabled = false;
    }
  });
}

/* —— 5.6 keyboard shortcuts —— */
let selectedIndex = -1;
let shortcutsTrigger: HTMLElement | null = null;

function visibleItems(): HTMLElement[] {
  const items: HTMLElement[] = [];
  document.querySelectorAll<HTMLElement>('[data-edition]').forEach((edition) => {
    if (edition.dataset.expanded !== 'true') return;
    edition.querySelectorAll<HTMLElement>('[data-item]').forEach((item) => {
      if (!item.classList.contains('is-filtered-out')) items.push(item);
    });
  });
  return items;
}

function resetKeyboardSelection(): void {
  document
    .querySelectorAll<HTMLElement>('.item.is-selected')
    .forEach((el) => el.classList.remove('is-selected'));
  selectedIndex = -1;
}

function selectItem(index: number): void {
  const items = visibleItems();
  if (items.length === 0) {
    resetKeyboardSelection();
    return;
  }
  const next = clamp(index, 0, items.length - 1);
  items.forEach((item, i) => {
    item.classList.toggle('is-selected', i === next);
  });
  selectedIndex = next;
  const selected = items[next];
  selected.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'center',
  });
  const link = selected.querySelector<HTMLAnchorElement>('[data-item-link]');
  link?.focus({ preventScroll: true });
}

function initShortcuts(): void {
  const dialog = document.querySelector<HTMLElement>('[data-shortcuts]');
  const openBtn = document.querySelector<HTMLButtonElement>('[data-shortcuts-open]');
  const closeBtn = document.querySelector<HTMLButtonElement>('[data-shortcuts-close]');
  if (!dialog || !openBtn || !closeBtn) return;

  const setOpen = (open: boolean) => {
    dialog.dataset.open = open ? 'true' : 'false';
    dialog.hidden = !open;
    if (open) {
      shortcutsTrigger = openBtn;
      closeBtn.focus();
    } else if (shortcutsTrigger) {
      shortcutsTrigger.focus();
      shortcutsTrigger = null;
    }
  };

  openBtn.addEventListener('click', () => {
    setOpen(dialog.dataset.open !== 'true');
  });
  closeBtn.addEventListener('click', () => setOpen(false));

  (window as unknown as { __toggleShortcuts: () => void }).__toggleShortcuts =
    () => {
      setOpen(dialog.dataset.open !== 'true');
    };
  (window as unknown as { __closeShortcuts: () => void }).__closeShortcuts =
    () => {
      setOpen(false);
    };
}

function initKeyboardNav(): void {
  document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isEditableTarget(event.target)) return;

    const key = event.key;

    if (key === '?' || (key === '/' && event.shiftKey)) {
      event.preventDefault();
      (
        window as unknown as { __toggleShortcuts?: () => void }
      ).__toggleShortcuts?.();
      return;
    }

    if (key === 'Escape') {
      (
        window as unknown as { __closeShortcuts?: () => void }
      ).__closeShortcuts?.();
      return;
    }

    if (key === 'o' || key === 'O') {
      event.preventDefault();
      (window as unknown as { __toggleOneline?: () => void }).__toggleOneline?.();
      return;
    }

    if (key === 'j' || key === 'J') {
      event.preventDefault();
      const items = visibleItems();
      if (items.length === 0) return;
      selectItem(selectedIndex < 0 ? 0 : selectedIndex + 1);
      return;
    }

    if (key === 'k' || key === 'K') {
      event.preventDefault();
      const items = visibleItems();
      if (items.length === 0) return;
      selectItem(selectedIndex < 0 ? items.length - 1 : selectedIndex - 1);
    }
  });
}

/* —— 5.8 commit graph —— */
let graphRaf = 0;
let lastFill = -1;

function scheduleGraphUpdate(): void {
  if (graphRaf) return;
  graphRaf = requestAnimationFrame(() => {
    graphRaf = 0;
    updateGraph();
  });
}

function updateGraph(): void {
  const graph = document.querySelector<HTMLElement>('[data-graph]');
  const fillEl = document.querySelector<HTMLElement>('[data-graph-fill]');
  if (!graph || !fillEl) return;

  const r = graph.getBoundingClientRect();
  const lineTop = 10;
  const lineH = Math.max(0, r.height - 20);
  const mid = window.innerHeight * 0.5;
  const fill = prefersReducedMotion()
    ? lineH
    : clamp(Math.round(mid - (r.top + lineTop)), 0, lineH);

  if (fill !== lastFill) {
    fillEl.style.height = `${fill}px`;
    lastFill = fill;
  }

  const passed = (el: HTMLElement, centerOffset: number) =>
    fill >= lineH - 1 || el.offsetTop + centerOffset - lineTop <= fill;

  graph.querySelectorAll<HTMLElement>('[data-graph-dot]').forEach((dot) => {
    if (dot.classList.contains('is-head')) return;
    const on = passed(dot.parentElement as HTMLElement, 6);
    if (dot.classList.contains('is-passed') !== on) {
      dot.classList.toggle('is-passed', on);
    }
  });

  const rootDot = graph.querySelector<HTMLElement>('[data-graph-root-dot]');
  const root = graph.querySelector<HTMLElement>('[data-graph-root]');
  if (rootDot && root) {
    const on = passed(root, 7);
    if (rootDot.classList.contains('is-passed') !== on) {
      rootDot.classList.toggle('is-passed', on);
    }
  }
}

function initGraph(): void {
  scheduleGraphUpdate();
  window.addEventListener('scroll', scheduleGraphUpdate, {
    capture: true,
    passive: true,
  });
  window.addEventListener('resize', scheduleGraphUpdate);
}
