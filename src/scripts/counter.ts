import type { CounterState, CounterEntry } from '../types/counter';

/**
 * Offline Web Audio Synthesizer
 * Uses Web Audio API oscillator nodes - 100% offline, zero external MP3/WAV dependencies
 */
class AudioFeedback {
  private ctx: AudioContext | null = null;

  private init(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playPop(freq = 440, duration = 0.05): void {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public playCelebration(): void {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 fanfare
      notes.forEach((freq, idx) => {
        setTimeout(() => this.playPop(freq, 0.16), idx * 85);
      });
    } catch {
      // Ignore audio errors
    }
  }
}

function triggerHaptic(type: 'light' | 'heavy' | 'success' = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    if (type === 'heavy') {
      navigator.vibrate([30, 40, 30]);
    } else if (type === 'success') {
      navigator.vibrate([25, 30, 50, 30, 80]);
    } else {
      navigator.vibrate(15);
    }
  }
}

const STORAGE_KEY = 'sonnenraum_party_counter_v1';

const defaultState: CounterState = {
  count: 0,
  target: 300,
  stationName: 'Tür 1',
  recipientEmail: '',
  history: [],
  startTime: new Date().toISOString()
};

export function setupCounterApp(): void {
  const sound = new AudioFeedback();

  function loadState(): CounterState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultState, ...parsed };
      }
    } catch (err) {
      console.error('Error loading stored counter state:', err);
    }
    return { ...defaultState };
  }

  let state: CounterState = loadState();

  function saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }

  // DOM elements
  const counterVal = document.getElementById('counterVal');
  const progressBar = document.getElementById('progressBar');
  const targetStatusText = document.getElementById('targetStatusText');
  const stationNameDisplay = document.getElementById('stationNameDisplay');
  const lastActionToast = document.getElementById('lastActionToast');
  const logCountLabel = document.getElementById('logCountLabel');
  const toastMessage = document.getElementById('toastMessage');

  // Modals
  const logModal = document.getElementById('logModal');
  const logListContainer = document.getElementById('logListContainer');
  const settingsModal = document.getElementById('settingsModal');

  // Settings inputs
  const stationInput = document.getElementById('stationInput') as HTMLInputElement | null;
  const recipientEmailInput = document.getElementById('recipientEmailInput') as HTMLInputElement | null;
  const targetInput = document.getElementById('targetInput') as HTMLInputElement | null;
  const resetBtn = document.getElementById('resetCounterBtn');

  // Controls
  const addOneBtn = document.getElementById('addOneBtn');
  const addTenBtn = document.getElementById('addTenBtn');
  const subOneBtn = document.getElementById('subOneBtn');
  const undoBtn = document.getElementById('undoBtn');
  const viewLogBtn = document.getElementById('viewLogBtn');
  const closeLogBtn = document.getElementById('closeLogBtn');
  const closeLogModalBottomBtn = document.getElementById('closeLogModalBottomBtn');
  const stationBadgeBtn = document.getElementById('stationBadgeBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const sendMailBtn = document.getElementById('sendMailBtn');
  const customGroupInput = document.getElementById('customGroupInput') as HTMLInputElement | null;
  const addCustomGroupBtn = document.getElementById('addCustomGroupBtn');

  let toastTimeout: ReturnType<typeof setTimeout> | null = null;
  let confirmResetVisible = false;
  let resetTimeout: ReturnType<typeof setTimeout> | null = null;

  function showToast(text: string): void {
    if (!toastMessage) return;
    toastMessage.textContent = text;
    toastMessage.classList.remove('opacity-0', 'pointer-events-none');
    toastMessage.classList.add('opacity-100');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastMessage.classList.remove('opacity-100');
      toastMessage.classList.add('opacity-0', 'pointer-events-none');
    }, 2400);
  }

  function setActionMessage(msg: string): void {
    if (lastActionToast) {
      lastActionToast.textContent = msg;
    }
  }

  function renderUI(): void {
    const target = state.target || 300;

    // Counter display
    if (counterVal) {
      counterVal.textContent = state.count.toString();
    }

    // Station badge
    if (stationNameDisplay) {
      stationNameDisplay.textContent = state.stationName || 'Tür 1';
    }

    // Log count button label
    if (logCountLabel) {
      logCountLabel.textContent = `Verlauf (${state.history.length})`;
    }

    // Progress bar
    const pct = Math.min(Math.round((state.count / target) * 100), 100);
    if (progressBar) {
      progressBar.style.width = `${pct}%`;
    }

    // Target status text and celebration
    const remaining = target - state.count;
    if (targetStatusText) {
      if (remaining > 0) {
        targetStatusText.textContent = `Noch ${remaining} bis Ziel`;
        targetStatusText.className = 'text-brand-amber font-bold';
        counterVal?.classList.remove('goal-achieved');
      } else {
        const surplus = state.count - target;
        targetStatusText.textContent = surplus === 0 ? `🎯 Ziel erreicht (${target})!` : `🎉 Ziel übertroffen (+${surplus})`;
        targetStatusText.className = 'text-emerald-400 font-bold';
        counterVal?.classList.add('goal-achieved');
      }
    }
  }

  function applyDelta(delta: number, label = ''): void {
    if (state.count + delta < 0) {
      showToast('Zähler kann nicht unter 0 fallen');
      triggerHaptic('heavy');
      return;
    }

    const previousCount = state.count;
    state.count += delta;

    const actionItem: CounterEntry = {
      id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      iso: new Date().toISOString(),
      delta,
      resultingTotal: state.count,
      label: label || (delta > 0 ? `+${delta}` : `${delta}`)
    };

    state.history.unshift(actionItem);
    // Keep reasonable history size
    if (state.history.length > 500) {
      state.history.pop();
    }

    saveState();
    renderUI();

    // Sound and haptic feedback
    if (delta > 0) {
      sound.playPop(delta === 10 ? 560 : 440);
      triggerHaptic('light');
      setActionMessage(`${actionItem.label} erfasst (${actionItem.time})`);
    } else {
      sound.playPop(280);
      triggerHaptic('heavy');
      setActionMessage(`Korrektur: ${actionItem.label} (${actionItem.time})`);
    }

    // Target milestone crossed
    if (previousCount < state.target && state.count >= state.target) {
      sound.playCelebration();
      triggerHaptic('success');
      showToast(`🔥 Mindestziel von ${state.target} Gästen erreicht!`);
    }
  }

  function undoLast(): void {
    if (state.history.length === 0) {
      showToast('Keine Aktionen im Verlauf');
      return;
    }

    const last = state.history.shift()!;
    state.count = Math.max(0, state.count - last.delta);
    saveState();
    renderUI();
    sound.playPop(300);
    triggerHaptic('heavy');
    setActionMessage(`Rückgängig: ${last.label} widerrufen`);
    showToast(`Rückgängig: ${last.label}`);
  }

  function renderLogList(): void {
    if (!logListContainer) return;
    logListContainer.innerHTML = '';

    if (state.history.length === 0) {
      logListContainer.innerHTML = '<div class="text-zinc-500 text-center py-8 font-sans">Noch keine Zählungen vorgenommen</div>';
      return;
    }

    state.history.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'flex justify-between items-center bg-black/50 border border-zinc-800/80 px-3.5 py-2.5 rounded-xl transition hover:border-zinc-700';
      const isPos = item.delta > 0;
      row.innerHTML = `
        <div class="flex items-center gap-2.5">
          <span class="${isPos ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50' : 'text-red-400 bg-red-950/60 border border-red-800/50'} text-xs font-mono font-bold px-2 py-0.5 rounded-md">
            ${isPos ? '+' + item.delta : item.delta}
          </span>
          <span class="text-zinc-200 font-sans text-sm">${item.label}</span>
        </div>
        <div class="text-right">
          <div class="text-white font-mono font-bold text-sm tabular-nums">${item.resultingTotal}</div>
          <div class="text-[10px] text-zinc-500 font-mono">${item.time}</div>
        </div>
      `;
      logListContainer.appendChild(row);
    });
  }

  function openLog(): void {
    renderLogList();
    logModal?.classList.remove('hidden');
  }

  function closeLog(): void {
    logModal?.classList.add('hidden');
  }

  function openSettings(): void {
    if (stationInput) stationInput.value = state.stationName || 'Tür 1';
    if (recipientEmailInput) recipientEmailInput.value = state.recipientEmail || '';
    if (targetInput) targetInput.value = (state.target || 300).toString();
    settingsModal?.classList.remove('hidden');
  }

  function closeSettings(): void {
    settingsModal?.classList.add('hidden');
    confirmResetVisible = false;
    if (resetBtn) resetBtn.textContent = 'Zähler auf 0 Zurücksetzen';
    if (resetTimeout) clearTimeout(resetTimeout);
  }

  function handleCustomAdd(): void {
    if (!customGroupInput) return;
    const val = parseInt(customGroupInput.value, 10);
    if (isNaN(val) || val <= 0) {
      showToast('Bitte eine gültige Personenzahl eingeben');
      return;
    }
    applyDelta(val, `+${val} Gruppe`);
    customGroupInput.value = '';
    customGroupInput.blur();
  }

  function sendMailReport(): void {
    const dateStr = new Date().toLocaleDateString('de-DE');
    const timeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const target = state.target || 300;
    const targetMet = state.count >= target ? 'JA' : 'NEIN';
    const pct = Math.round((state.count / target) * 100);

    const subject = encodeURIComponent(
      `Einlassbericht [${state.stationName || 'Tür 1'}]: ${state.count} Gäste — The Point Of No Return (${dateStr})`
    );

    // Hourly aggregation
    const hourlySummary: Record<string, number> = {};
    state.history.forEach((item) => {
      if (item.delta > 0) {
        const hourKey = item.time.split(':')[0] + ':00';
        hourlySummary[hourKey] = (hourlySummary[hourKey] || 0) + item.delta;
      }
    });

    let breakdownText = '';
    const sortedHours = Object.keys(hourlySummary).sort();
    sortedHours.forEach((hour) => {
      breakdownText += `  • ${hour} Uhr: +${hourlySummary[hour]} Personen\n`;
    });

    if (!breakdownText) {
      breakdownText = '  (Noch keine stündlichen Daten vorhanden)\n';
    }

    const recentEntries = state.history.slice(0, 8);
    const recentText = recentEntries.length > 0
      ? recentEntries.map((h) => `[${h.time}] ${h.label} -> Gesamt: ${h.resultingTotal}`).join('\n')
      : '  (Keine Einträge)';

    const bodyText = 
`==============================================
EINLASS-BERICHT: THE POINT OF NO RETURN
Location: Sonnenraum, Eichenstraße 4A, 12435 Berlin
Datum/Uhrzeit: ${dateStr} um ${timeStr}
Station / Zähler: ${state.stationName || 'Unbenannt'}
==============================================

GESAMTZAHL GÄSTE: ${state.count}
Mindestziel (${target}): ${targetMet} (${pct}% erreicht)
Eintrittspreis: 10 € at the door
Theoretischer Kassenstand (Einlass): ~${state.count * 10} €

STÜNDLICHE ÜBERSICHT:
${breakdownText}
----------------------------------------------
Zuletzt erfasste Einträge:
${recentText}

Generiert mit der Sonnenraum Einlass App.
Offline-First mit LocalStorage.`;

    const body = encodeURIComponent(bodyText);
    const recipient = encodeURIComponent(state.recipientEmail || '');

    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    showToast('E-Mail-Entwurf wird geöffnet...');
  }

  // Event Listeners
  addOneBtn?.addEventListener('click', () => applyDelta(1, '+1 Gast'));
  addTenBtn?.addEventListener('click', () => applyDelta(10, '+10 Gruppe'));
  subOneBtn?.addEventListener('click', () => applyDelta(-1, '-1 Korrektur'));
  undoBtn?.addEventListener('click', () => undoLast());

  addCustomGroupBtn?.addEventListener('click', handleCustomAdd);
  customGroupInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleCustomAdd();
  });

  viewLogBtn?.addEventListener('click', openLog);
  closeLogBtn?.addEventListener('click', closeLog);
  closeLogModalBottomBtn?.addEventListener('click', closeLog);

  stationBadgeBtn?.addEventListener('click', openSettings);
  optionsBtn?.addEventListener('click', openSettings);
  closeSettingsBtn?.addEventListener('click', closeSettings);

  saveSettingsBtn?.addEventListener('click', () => {
    state.stationName = stationInput?.value.trim() || 'Tür 1';
    state.recipientEmail = recipientEmailInput?.value.trim() || '';
    state.target = parseInt(targetInput?.value || '300', 10) || 300;
    saveState();
    renderUI();
    closeSettings();
    showToast('Einstellungen gespeichert');
  });

  resetBtn?.addEventListener('click', () => {
    if (confirmResetVisible) {
      state.count = 0;
      state.history = [];
      saveState();
      renderUI();
      closeSettings();
      confirmResetVisible = false;
      if (resetBtn) resetBtn.textContent = 'Zähler auf 0 Zurücksetzen';
      showToast('Zähler wurde auf 0 zurückgesetzt');
      triggerHaptic('heavy');
    } else {
      confirmResetVisible = true;
      if (resetBtn) resetBtn.textContent = 'Wirklich zurücksetzen? (Erneut tippen)';
      if (resetTimeout) clearTimeout(resetTimeout);
      resetTimeout = setTimeout(() => {
        confirmResetVisible = false;
        if (resetBtn) resetBtn.textContent = 'Zähler auf 0 Zurücksetzen';
      }, 4000);
    }
  });

  sendMailBtn?.addEventListener('click', sendMailReport);

  // Close modals on escape key or clicking backdrop
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLog();
      closeSettings();
    }
  });

  [logModal, settingsModal].forEach((modal) => {
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeLog();
        closeSettings();
      }
    });
  });

  // Initial render
  renderUI();
}
