/**
 * Mode 1: NEKO QUEENS — 3D Satin Cushion Tile Grid + Kawaii Royal Cat UI
 *
 * Combines:
 *  - The sleek Dark Frosted-Glass Board Tray (.queens-glass-tray) with 3D Rounded
 *    Satin Cushion Squircle Tiles (zero harsh black/brown borders!)
 *  - Collectible Kawaii Royal Cat SVGs (Mochi, Yuzu, Kuro, Sakura) inside the grid cells
 *    + Sparkle Particle Bursts + Recessed Vector Cross Pill Marker (MARK_X_SVG)
 *  - Safe Reset Button in the top bar with mandatory "Confirm Reset?" dialog.
 */

const QUEENS_CUSHION_PALETTE = [
  { top: '#A78BFA', bot: '#7C3AED', edge: '#DDD6FE', shadow: '#4C1D95', emoji: '🟪', name: 'Violet' },
  { top: '#FB923C', bot: '#EA580C', edge: '#FED7AA', shadow: '#9A3412', emoji: '🟧', name: 'Amber' },
  { top: '#38BDF8', bot: '#0284C7', edge: '#BAE6FD', shadow: '#075985', emoji: '🟦', name: 'Azure' },
  { top: '#34D399', bot: '#059669', edge: '#A7F3D0', shadow: '#065F46', emoji: '🟩', name: 'Emerald' },
  { top: '#FACC15', bot: '#CA8A04', edge: '#FEF08A', shadow: '#854D0E', emoji: '🟨', name: 'Gold' },
  { top: '#FB7185', bot: '#E11D48', edge: '#FECDD3', shadow: '#9F1239', emoji: '🟥', name: 'Rose' },
  { top: '#2DD4BF', bot: '#0D9488', edge: '#99F6E4', shadow: '#115E59', emoji: '🩵', name: 'Teal' },
  { top: '#E879F9', bot: '#C026D3', edge: '#F5D0FE', shadow: '#86198F', emoji: '🩷', name: 'Orchid' },
  { top: '#818CF8', bot: '#4F46E5', edge: '#C7D2FE', shadow: '#3730A3', emoji: '🔷', name: 'Indigo' }
];

const CAT_MASCOTS = {
  mochi: {
    id: 'mochi',
    name: 'Mochi',
    fur: '#FFFFFF',
    earInner: '#FDA4AF',
    stroke: '#1E1B4B',
    cheeks: '#FB7185'
  },
  yuzu: {
    id: 'yuzu',
    name: 'Yuzu',
    fur: '#FDBA74',
    earInner: '#FED7AA',
    stroke: '#431407',
    cheeks: '#F43F5E'
  },
  kuro: {
    id: 'kuro',
    name: 'Kuro',
    fur: '#1E293B',
    earInner: '#FDA4AF',
    stroke: '#F8FAFC',
    cheeks: '#FB7185'
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura',
    fur: '#FBCFE8',
    earInner: '#F472B6',
    stroke: '#500724',
    cheeks: '#EC4899'
  }
};

function renderKawaiiCatSVG(mascotId = 'mochi') {
  const m = CAT_MASCOTS[mascotId] || CAT_MASCOTS.mochi;
  const eyeColor = m.id === 'kuro' ? '#FDE047' : '#1E1B4B';
  return `
    <svg class="queens-crown-svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="24" cy="41" rx="13" ry="3.2" fill="rgba(9, 12, 24, 0.35)"/>
      <path d="M10 26C10 17 12 10 12 10L19 16.5C20.6 16.1 22.3 16 24 16C25.7 16 27.4 16.1 29 16.5L36 10C36 10 38 17 38 26C38 34.5 32.2 39 24 39C15.8 39 10 34.5 10 26Z"
            fill="${m.fur}" stroke="${m.stroke}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M13 13.5L17 17.5L12.5 20.5Z" fill="${m.earInner}"/>
      <path d="M35 13.5L31 17.5L35.5 20.5Z" fill="${m.earInner}"/>
      <!-- Royal Golden Crown on Cat Head -->
      <path d="M18 15.5L16.8 9L21.2 12.5L24 7L26.8 12.5L31.2 9L30 15.5H18Z"
            fill="#FACC15" stroke="#1E1B4B" stroke-width="1.6" stroke-linejoin="round"/>
      <circle cx="18.2" cy="26.5" r="2.3" fill="${eyeColor}"/>
      <circle cx="29.8" cy="26.5" r="2.3" fill="${eyeColor}"/>
      <circle cx="17.5" cy="25.7" r="0.8" fill="#FFFFFF"/>
      <circle cx="29.1" cy="25.7" r="0.8" fill="#FFFFFF"/>
      <ellipse cx="14.5" cy="29.2" rx="2.4" ry="1.4" fill="${m.cheeks}" opacity="0.7"/>
      <ellipse cx="33.5" cy="29.2" rx="2.4" ry="1.4" fill="${m.cheeks}" opacity="0.7"/>
      <path d="M21.5 28.5C22.2 29.8 23.5 29.8 24 28.6C24.5 29.8 25.8 29.8 26.5 28.5"
            stroke="${m.id === 'kuro' ? '#F8FAFC' : m.stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

const MARK_X_SVG = `
<div class="x-marker-pill">
  <svg class="x-marker-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 7.5L16.5 16.5M16.5 7.5L7.5 16.5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>
  </svg>
</div>
`;

class CrownGameEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.tier = 'easy';
    this.levelIndex = 0;
    this.levelData = null;
    this.size = 6;
    this.manualState = []; // 0 = empty, 1 = manual X, 2 = Cat Crown
    this.history = [];
    this.autoXEnabled = localStorage.getItem('nc_crown_autox') !== 'false';
    this.activeMascot = localStorage.getItem('nc_cat_mascot') || 'mochi';
    this.timerSec = 0;
    this.timerInterval = null;
    this.hintsUsed = 0;
    this.isSolved = false;
    this.isDailyMode = false;
    this.onDailyStageWin = null;
    this.isDraggingX = false;
    this.lastPlacedCrown = null;
    this.lastTapInfo = null; // Tracks { r, c, time } for fast double-tap Cat placement
  }

  loadLevel(tier = 'easy', index = 0, customLevelData = null, isDaily = false, onDailyWin = null) {
    clearTimeout(this.winTimeout);
    this.tier = tier;
    const list = (window.NEON_CROWN_LEVELS && window.NEON_CROWN_LEVELS.crown[tier]) || [];
    this.levelIndex = Math.max(0, index) % Math.max(1, list.length);
    this.isDailyMode = isDaily;
    this.onDailyStageWin = onDailyWin;

    if (customLevelData) {
      this.levelData = customLevelData;
    } else {
      this.levelData = list[this.levelIndex];
    }
    if (!this.levelData) {
      console.warn('No crown levels available for tier:', tier);
      return;
    }

    this.size = this.levelData.size;
    this.manualState = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.history = [];
    this.hintsUsed = 0;
    this.isSolved = false;
    this.lastPlacedCrown = null;
    this.lastTapInfo = null;
    this.startTimer();
    this.render();
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.timerSec = 0;
    this.resumeTimer();
  }

  resumeTimer() {
    clearInterval(this.timerInterval);
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      if (!this.isSolved) {
        this.timerSec += 1;
        this.updateTimerDisplay();
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
    clearTimeout(this.winTimeout);
  }

  updateTimerDisplay() {
    const el = document.getElementById('crown-timer');
    if (el) {
      const m = String(Math.floor(this.timerSec / 60)).padStart(2, '0');
      const s = String(this.timerSec % 60).padStart(2, '0');
      el.textContent = `${m}:${s}`;
    }
    const countEl = document.getElementById('crown-placed-count');
    if (countEl) {
      let crowns = 0;
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.manualState[r][c] === 2) crowns++;
        }
      }
      countEl.textContent = `${crowns}/${this.size} 🐱`;
    }
  }

  getEffectiveBoard() {
    // manualState values: 0 = empty, -1 = explicitly cleared empty, 1 = manual X, 2 = Cat Crown
    const eff = this.manualState.map(row => row.map(v => (v === -1 ? 0 : v)));
    if (!this.autoXEnabled) return eff;

    const crowns = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.manualState[r][c] === 2) {
          crowns.push([r, c, this.levelData.regions[r][c]]);
        }
      }
    }

    for (const [cr, cc, creg] of crowns) {
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.manualState[r][c] !== 0 || eff[r][c] !== 0) continue;
          if (
            r === cr ||
            c === cc ||
            this.levelData.regions[r][c] === creg ||
            (Math.abs(r - cr) <= 1 && Math.abs(c - cc) <= 1)
          ) {
            eff[r][c] = 3; // Dynamic Auto-X
          }
        }
      }
    }
    return eff;
  }

  pushHistory() {
    this.history.push(this.manualState.map(row => [...row]));
    if (this.history.length > 60) this.history.shift();
  }

  undo() {
    if (this.isSolved || this.history.length === 0) return;
    this.manualState = this.history.pop();
    this.lastPlacedCrown = null;
    this.lastTapInfo = null;
    window.audioEngine.playTap();
    this.refreshGridUI();
    this.checkWinCondition();
  }

  requestSafeReset() {
    if (this.isSolved) return;
    if (window.app) {
      window.app.confirmReset(
        'Reset Neko Queens?',
        'Do you really want to clear all Cats and marks on this board?',
        () => this.resetBoard()
      );
    } else {
      this.resetBoard();
    }
  }

  resetBoard() {
    if (this.isSolved) return;
    this.pushHistory();
    this.manualState = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.lastPlacedCrown = null;
    this.lastTapInfo = null;
    window.audioEngine.playTap();
    this.setHintBanner(`Board reset. 1 click toggles X, fast double-click places 🐱.`);
    this.refreshGridUI();
  }

  toggleAutoX() {
    this.autoXEnabled = !this.autoXEnabled;
    localStorage.setItem('nc_crown_autox', String(this.autoXEnabled));
    const btn = document.getElementById('crown-autox-btn');
    if (btn) {
      btn.classList.toggle('active-toggle', this.autoXEnabled);
      btn.innerHTML = `Auto-Mark: <strong>${this.autoXEnabled ? 'ON' : 'OFF'}</strong>`;
    }
    window.audioEngine.playTap();
    this.refreshGridUI();
  }

  cycleMascot() {
    const keys = Object.keys(CAT_MASCOTS);
    const nextIdx = (keys.indexOf(this.activeMascot) + 1) % keys.length;
    this.activeMascot = keys[nextIdx];
    localStorage.setItem('nc_cat_mascot', this.activeMascot);
    const btn = document.getElementById('crown-mascot-btn');
    if (btn) {
      btn.innerHTML = `🐱 Cat: <strong>${CAT_MASCOTS[this.activeMascot].name}</strong>`;
    }
    window.audioEngine.playCrownPlace();
    this.refreshGridUI();
  }

  handleCellTap(r, c, cellEl) {
    if (this.isSolved) return;
    const now = performance.now();
    const DOUBLE_TAP_WINDOW_MS = 360;

    // Fast double-click / double-tap on the same cell places the Cat Crown (2)
    // Note: Tap 1 already called this.pushHistory() with the pre-tap state before mutating the cell,
    // so we do NOT pushHistory() again here — that way 1 Undo reverts directly to the pre-double-tap state.
    if (
      this.lastTapInfo &&
      this.lastTapInfo.r === r &&
      this.lastTapInfo.c === c &&
      now - this.lastTapInfo.time <= DOUBLE_TAP_WINDOW_MS
    ) {
      this.isDraggingX = false;
      this.lastTapInfo = null;
      // Only clear -1 overrides that would be auto-X'd by the new crown (same row, col, 1-step diag, region)
      const regs = this.levelData.regions;
      const region = regs[r][c];
      for (let rr = 0; rr < this.size; rr++) {
        for (let cc = 0; cc < this.size; cc++) {
          if (this.manualState[rr][cc] === -1) {
            const sameRow = rr === r;
            const sameCol = cc === c;
            const adjTouch = Math.abs(rr - r) <= 1 && Math.abs(cc - c) <= 1;
            const sameRegion = regs[rr][cc] === region;
            if (sameRow || sameCol || adjTouch || sameRegion) {
              this.manualState[rr][cc] = 0;
            }
          }
        }
      }
      this.manualState[r][c] = 2;
      this.lastPlacedCrown = [r, c];
      window.audioEngine.playCrownPlace();
      this.refreshGridUI();
      if (cellEl) this.spawnSparkles(cellEl);
      this.checkWinCondition();
      return;
    }

    // Single click:
    //  - Empty (0) -> X (1)
    //  - X (1 or 3) -> Empty (0 or -1)
    //  - Cat Crown (2) -> Empty (0)
    this.pushHistory();
    const eff = this.getEffectiveBoard();
    const curEff = eff[r][c];
    this.lastPlacedCrown = null;

    if (curEff === 2) {
      // Clicking an existing Cat Crown clears it back to Empty
      this.manualState[r][c] = 0;
      this.isDraggingX = false;
      this.lastTapInfo = null;
      window.audioEngine.playTap();
    } else if (curEff === 0) {
      // 1st click on Empty -> X
      this.manualState[r][c] = 1;
      this.isDraggingX = true;
      this.lastTapInfo = { r, c, time: now };
      window.audioEngine.playMarkX();
    } else {
      // 2nd normal click on X (1 or 3) -> back to Empty!
      this.manualState[r][c] = curEff === 3 ? -1 : 0;
      this.isDraggingX = false;
      this.lastTapInfo = { r, c, time: now };
      window.audioEngine.playTap();
    }

    this.refreshGridUI();
    this.checkWinCondition();
  }

  spawnSparkles(cellEl) {
    const sparkles = ['✨', '🐾', '💛'];
    for (let i = 0; i < 4; i++) {
      const sp = document.createElement('span');
      sp.className = 'cat-sparkle-particle';
      sp.textContent = sparkles[i % sparkles.length];
      const angle = (i * 90 + 45) * (Math.PI / 180);
      sp.style.setProperty('--tx', `${Math.cos(angle) * 26}px`);
      sp.style.setProperty('--ty', `${Math.sin(angle) * 26}px`);
      cellEl.appendChild(sp);
      setTimeout(() => sp.remove(), 550);
    }
  }

  getConflictDetails() {
    const crownCells = new Set();
    const hazardCells = new Set();
    let message = '';

    const crowns = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.manualState[r][c] === 2) {
          crowns.push([r, c, this.levelData.regions[r][c]]);
        }
      }
    }

    for (let i = 0; i < crowns.length; i++) {
      for (let j = i + 1; j < crowns.length; j++) {
        const [r1, c1, reg1] = crowns[i];
        const [r2, c2, reg2] = crowns[j];

        const sameRow = r1 === r2;
        const sameCol = c1 === c2;
        const sameReg = reg1 === reg2;
        const touching = Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;

        if (sameRow || sameCol || sameReg || touching) {
          crownCells.add(`${r1},${c1}`);
          crownCells.add(`${r2},${c2}`);

          if (sameRow) {
            for (let cc = 0; cc < this.size; cc++) hazardCells.add(`${r1},${cc}`);
            message = `⚠️ Two Royal Cats in Row ${r1 + 1}! Only 1 allowed per row.`;
          }
          if (sameCol) {
            for (let rr = 0; rr < this.size; rr++) hazardCells.add(`${rr},${c1}`);
            message = `⚠️ Two Royal Cats in Column ${c1 + 1}! Only 1 allowed per column.`;
          }
          if (sameReg) {
            for (let rr = 0; rr < this.size; rr++) {
              for (let cc = 0; cc < this.size; cc++) {
                if (this.levelData.regions[rr][cc] === reg1) hazardCells.add(`${rr},${cc}`);
              }
            }
            const p = QUEENS_CUSHION_PALETTE[reg1 % QUEENS_CUSHION_PALETTE.length];
            message = `⚠️ Two Royal Cats in the ${p.name} region!`;
          }
          if (touching && !sameRow && !sameCol) {
            hazardCells.add(`${r1},${c1}`);
            hazardCells.add(`${r2},${c2}`);
            message = `⚠️ Aloof Cat Rule: Cats cannot touch—even diagonally!`;
          }
        }
      }
    }

    return { crownCells, hazardCells, message };
  }

  checkWinCondition(preserveBanner = false) {
    const { crownCells, message } = this.getConflictDetails();
    if (crownCells.size > 0) {
      window.audioEngine.playError();
      this.setHintBanner(message, true);
      return false;
    }

    let crownCount = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.manualState[r][c] === 2) crownCount++;
      }
    }

    const bannerEl = document.getElementById('crown-hint-banner');
    const hadError = bannerEl && bannerEl.classList.contains('banner-error');

    if ((this.lastPlacedCrown || hadError) && !preserveBanner) {
      if (crownCount === 0) {
        this.setHintBanner(`1 Click: Toggle ✕ (Mark/Clear) • Fast Double-Click: Place 🐱 • Drag: Paint ✕`);
      } else {
        this.setHintBanner(`Purr-fect! ${this.size - crownCount} Cat${this.size - crownCount === 1 ? '' : 's'} left to place.`);
      }
    }

    if (crownCount === this.size) {
      this.isSolved = true;
      this.stopTimer();
      window.audioEngine.playWinFanfare();
      this.setHintBanner(`🎉 Solved in ${document.getElementById('crown-timer')?.textContent || '00:00'}!`);
      this.playVictoryWaveAnimation();

      clearTimeout(this.winTimeout);
      this.winTimeout = setTimeout(() => {
        if (this.isDailyMode && this.onDailyStageWin) {
          this.onDailyStageWin({
            timeSec: this.timerSec,
            hintsUsed: this.hintsUsed
          });
        } else if (window.app) {
          window.app.onPuzzleSolved({
            mode: 'crown',
            tier: this.tier,
            levelNumber: this.levelIndex + 1,
            timeSec: this.timerSec,
            hintsUsed: this.hintsUsed,
            emojiGrid: this.buildColoredEmojiBoard()
          });
        }
      }, 950);
      return true;
    }
    return false;
  }

  playVictoryWaveAnimation() {
    const gridEl = document.getElementById('crown-grid-el');
    if (!gridEl) return;
    gridEl.classList.add('board-solved-glow');
    gridEl.querySelectorAll('.crown-cell').forEach(cell => {
      const r = parseInt(cell.dataset.r, 10);
      const c = parseInt(cell.dataset.c, 10);
      cell.style.setProperty('--wave-delay', `${(r + c) * 45}ms`);
      cell.classList.add('cell-victory-wave');
    });
  }

  buildColoredEmojiBoard() {
    const lines = [];
    for (let r = 0; r < this.size; r++) {
      let rowStr = '';
      for (let c = 0; c < this.size; c++) {
        if (this.manualState[r][c] === 2) {
          rowStr += '🐱';
        } else {
          const reg = this.levelData.regions[r][c];
          rowStr += QUEENS_CUSHION_PALETTE[reg % QUEENS_CUSHION_PALETTE.length].emoji;
        }
      }
      lines.push(rowStr);
    }
    return lines.join('\n');
  }

  useSmartHint() {
    if (this.isSolved) return;
    if (!window.app || !window.app.consumeHint()) return;

    this.hintsUsed += 1;
    this.lastTapInfo = null;
    this.pushHistory();
    const sol = this.levelData.solution;
    const regs = this.levelData.regions;
    const eff = this.getEffectiveBoard();

    // 1. Check if the player placed a Cat in the wrong spot
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.manualState[r][c] === 2 && sol[r] !== c) {
          this.manualState[r][c] = 1;
          const reg = regs[r][c];
          const p = QUEENS_CUSHION_PALETTE[reg % QUEENS_CUSHION_PALETTE.length];
          window.audioEngine.playHint();
          this.setHintBanner(
            `💡 Why (Mistake Fixed): A Cat at Row ${r + 1}, Col ${c + 1} (${p.name}) steals a required row/column from another color group. Replaced with ✕!`,
            false,
            true
          );
          this.refreshGridUI([`${r},${c}`]);
          return;
        }
      }
    }

    // Helper: get all currently open (unmarked) cells for each unplaced row, col, and region
    const unplacedRows = [];
    for (let r = 0; r < this.size; r++) {
      if (this.manualState[r][sol[r]] !== 2) unplacedRows.push(r);
    }

    // Gather candidate cells in each unplaced region
    const regionOpenCells = {};
    const regionTotalCells = {};
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const reg = regs[r][c];
        regionTotalCells[reg] = (regionTotalCells[reg] || 0) + 1;
        if (!regionOpenCells[reg]) regionOpenCells[reg] = [];
        if (eff[r][c] === 0) {
          regionOpenCells[reg].push([r, c]);
        }
      }
    }

    let chosenRow = -1;
    let reasoningText = '';
    let highlightCells = [];

    // 2. Priority A: Single-Tile Color Region (Only 1 open cell left in a color group)
    for (const r of unplacedRows) {
      const c = sol[r];
      const reg = regs[r][c];
      const openList = regionOpenCells[reg] || [];
      const p = QUEENS_CUSHION_PALETTE[reg % QUEENS_CUSHION_PALETTE.length];
      if (regionTotalCells[reg] === 1) {
        chosenRow = r;
        reasoningText = `💡 Why (1-Tile Color Group): The ${p.name} region has only 1 tile on the entire board (Row ${r + 1}, Col ${c + 1}), so the ${p.name} 🐱 must go there!`;
        highlightCells = [`${r},${c}`];
        break;
      } else if (openList.length === 1 && eff[r][c] === 0) {
        chosenRow = r;
        reasoningText = `💡 Why (Last Tile in Color): Every other tile in the ${p.name} region is already eliminated (✕), leaving Row ${r + 1}, Col ${c + 1} as the only spot for ${p.name}'s 🐱!`;
        highlightCells = [`${r},${c}`];
        break;
      }
    }

    // 3. Priority B: Single Open Tile in a Row or Column
    if (chosenRow === -1) {
      for (const r of unplacedRows) {
        const c = sol[r];
        if (eff[r][c] !== 0) continue;
        const reg = regs[r][c];
        const p = QUEENS_CUSHION_PALETTE[reg % QUEENS_CUSHION_PALETTE.length];

        let rowOpen = 0;
        for (let cc = 0; cc < this.size; cc++) {
          if (eff[r][cc] === 0) rowOpen++;
        }
        if (rowOpen === 1) {
          chosenRow = r;
          reasoningText = `💡 Why (Last Spot in Row ${r + 1}): All other columns in Row ${r + 1} are marked ✕, so Row ${r + 1}'s 🐱 is forced into Col ${c + 1} (${p.name})!`;
          highlightCells = [`${r},${c}`];
          break;
        }

        let colOpen = 0;
        for (let rr = 0; rr < this.size; rr++) {
          if (eff[rr][c] === 0) colOpen++;
        }
        if (colOpen === 1) {
          chosenRow = r;
          reasoningText = `💡 Why (Last Spot in Col ${c + 1}): All other rows in Column ${c + 1} are marked ✕, forcing Column ${c + 1}'s 🐱 into Row ${r + 1} (${p.name})!`;
          highlightCells = [`${r},${c}`];
          break;
        }
      }
    }

    // 4. Priority C: Region Confined to a Single Row or Column / Neighbor Elimination
    if (chosenRow === -1) {
      // Pick the unplaced row whose color region has the fewest open tiles
      let minOpen = 999;
      for (const r of unplacedRows) {
        const c = sol[r];
        const reg = regs[r][c];
        const count = (regionOpenCells[reg] || []).length || regionTotalCells[reg];
        if (count < minOpen) {
          minOpen = count;
          chosenRow = r;
        }
      }

      if (chosenRow !== -1) {
        const c = sol[chosenRow];
        const reg = regs[chosenRow][c];
        const p = QUEENS_CUSHION_PALETTE[reg % QUEENS_CUSHION_PALETTE.length];
        const openList = regionOpenCells[reg] || [[chosenRow, c]];
        const rowsSet = new Set(openList.map(([rr]) => rr + 1));
        const colsSet = new Set(openList.map(([, cc]) => cc + 1));

        // Check if another alternative cell in this region would wipe out a neighboring small region
        let blockedNeighborName = null;
        for (const [altR, altC] of openList) {
          if (altR === chosenRow && altC === c) continue;
          // Check if placing at (altR, altC) would eliminate all open cells of another unplaced region
          for (const otherR of unplacedRows) {
            if (otherR === chosenRow) continue;
            const otherReg = regs[otherR][sol[otherR]];
            const otherOpen = regionOpenCells[otherReg] || [];
            if (otherOpen.length > 0) {
              const allKilled = otherOpen.every(
                ([or, oc]) =>
                  or === altR ||
                  oc === altC ||
                  (Math.abs(or - altR) <= 1 && Math.abs(oc - altC) <= 1)
              );
              if (allKilled) {
                blockedNeighborName = QUEENS_CUSHION_PALETTE[otherReg % QUEENS_CUSHION_PALETTE.length].name;
                break;
              }
            }
          }
          if (blockedNeighborName) break;
        }

        if (blockedNeighborName) {
          reasoningText = `💡 Why (No-Touch Elimination): Placing a Cat elsewhere in ${p.name} would block every valid tile of the ${blockedNeighborName} region. Thus 🐱 must go at Row ${chosenRow + 1}, Col ${c + 1}!`;
        } else if (rowsSet.size === 1) {
          reasoningText = `💡 Why (Row Lock): The ${p.name} region (${openList.length} open tiles) lies entirely in Row ${chosenRow + 1}, locking Row ${chosenRow + 1} and forcing 🐱 at Col ${c + 1}!`;
        } else if (colsSet.size === 1) {
          reasoningText = `💡 Why (Column Lock): The ${p.name} region (${openList.length} open tiles) lies entirely in Column ${c + 1}, locking Col ${c + 1} and forcing 🐱 at Row ${chosenRow + 1}!`;
        } else {
          reasoningText = `💡 Why (Region & Line Intersection): The ${p.name} region has only ${openList.length} open tiles (Rows ${Array.from(rowsSet).join(',')}); row/column & diagonal constraints force 🐱 at Row ${chosenRow + 1}, Col ${c + 1}!`;
        }
        highlightCells = [`${chosenRow},${c}`];
      }
    }

    if (chosenRow !== -1) {
      const c = sol[chosenRow];
      // Only clear -1 overrides that would be auto-X'd by the hinted crown (same row, col, 1-step diag, region)
      const region = regs[chosenRow][c];
      for (let rr = 0; rr < this.size; rr++) {
        for (let cc = 0; cc < this.size; cc++) {
          if (this.manualState[rr][cc] === -1) {
            const sameRow = rr === chosenRow;
            const sameCol = cc === c;
            const adjTouch = Math.abs(rr - chosenRow) <= 1 && Math.abs(cc - c) <= 1;
            const sameRegion = regs[rr][cc] === region;
            if (sameRow || sameCol || adjTouch || sameRegion) {
              this.manualState[rr][cc] = 0;
            }
          }
        }
      }
      this.manualState[chosenRow][c] = 2;
      this.lastPlacedCrown = [chosenRow, c];
      window.audioEngine.playHint();
      this.setHintBanner(reasoningText, false, true);
      this.refreshGridUI(highlightCells);
      this.checkWinCondition(true);
    }
  }

  showRulesModal() {
    const overlay = document.createElement('div');
    overlay.className = 'sim-ad-overlay';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-sheet-header">
          <h3>🐱 How to Play Neko Queens</h3>
          <button class="modal-close-btn" id="rules-close">✕</button>
        </div>
        <div class="modal-sheet-body">
          <div class="rule-step-card">
            <span class="rule-step-num">1</span>
            <div>
              <h4>1 Royal Cat per Row, Column &amp; Color</h4>
              <p>Every horizontal row, vertical column, and colored tile group must contain <strong>exactly 1 Royal Cat (🐱)</strong>.</p>
            </div>
          </div>
          <div class="rule-step-card">
            <span class="rule-step-num">2</span>
            <div>
              <h4>Cats Cannot Touch—Even Diagonally!</h4>
              <p>Two Cats may never touch horizontally, vertically, or diagonally.</p>
            </div>
          </div>
          <div class="rule-step-card">
            <span class="rule-step-num">3</span>
            <div>
              <h4>Smooth Touch Controls</h4>
              <p>• <strong>Single Click / Tap:</strong> Toggles <code>✕</code> on or off (Empty ↔ ✕).<br/>• <strong>Fast Double-Click:</strong> Places your Royal Cat <code>🐱</code> (tap Cat once to remove).<br/>• <strong>Swipe/Drag:</strong> Paint multiple <code>✕</code> marks smoothly.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#rules-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  setHintBanner(text, isError = false, isHint = false) {
    const banner = document.getElementById('crown-hint-banner');
    if (banner) {
      banner.textContent = text;
      banner.classList.toggle('banner-error', isError);
      banner.classList.toggle('banner-hint-active', isHint);
    }
  }

  render() {
    if (!this.container) return;
    const tierLabels = { easy: '6×6 Easy', medium: '7×7 Med', hard: '8×8 Hard', master: '9×9 Pro' };
    const curMascot = CAT_MASCOTS[this.activeMascot] || CAT_MASCOTS.mochi;

    this.container.innerHTML = `
      <div class="queens-top-bar">
        <div class="tier-pills">
          ${['easy', 'medium', 'hard', 'master'].map(t => `
            <button class="tier-pill ${this.tier === t && !this.isDailyMode ? 'active' : ''}" data-tier="${t}" ${this.isDailyMode ? 'disabled' : ''}>
              ${tierLabels[t]}
            </button>
          `).join('')}
        </div>

        <div class="queens-status-strip">
          <div class="level-stepper">
            ${!this.isDailyMode ? `<button class="step-arrow" id="crown-prev-lvl" title="Previous Level">‹</button>` : ''}
            <span class="level-pill-title">${this.isDailyMode ? '🌍 Daily 1/3' : `Level #${this.levelIndex + 1}`}</span>
            ${!this.isDailyMode ? `<button class="step-arrow" id="crown-next-lvl" title="Next Level">›</button>` : ''}
          </div>
          <div class="queens-right-pills">
            <span class="meta-badge" id="crown-placed-count">0/${this.size} 🐱</span>
            <span class="meta-badge timer-badge" id="crown-timer">00:00</span>
            <button class="meta-util-btn" id="crown-reset-top-btn" title="Reset Board">↻</button>
            <button class="meta-help-btn" id="crown-rules-btn" title="How to Play">?</button>
          </div>
        </div>
      </div>

      <div class="hint-deduction-banner" id="crown-hint-banner">
        1 Click: Toggle ✕ (Mark/Clear) • Fast Double-Click: Place 🐱 • Drag: Paint ✕
      </div>

      <div class="board-stage">
        <div class="queens-glass-tray">
          <div class="crown-grid" id="crown-grid-el" style="--grid-size: ${this.size};"></div>
        </div>
      </div>

      <div class="game-controls-bar">
        <button class="ctrl-btn" id="crown-undo-btn">↩ Undo</button>
        <button class="ctrl-btn" id="crown-mascot-btn">
          🐱 Cat: <strong>${curMascot.name}</strong>
        </button>
        <button class="ctrl-btn ${this.autoXEnabled ? 'active-toggle' : ''}" id="crown-autox-btn">
          Auto-Mark: <strong>${this.autoXEnabled ? 'ON' : 'OFF'}</strong>
        </button>
        <button class="ctrl-btn hint-cta-btn" id="crown-hint-btn">
          💡 Hint (<span class="hint-count-inline">${window.app ? window.app.state.hints : 5}</span>)
        </button>
      </div>
    `;

    this.container.querySelectorAll('.tier-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isDailyMode) return;
        const newTier = btn.getAttribute('data-tier');
        const savedIdx = window.app ? window.app.getTierProgress('crown', newTier) : 0;
        this.loadLevel(newTier, savedIdx);
      });
    });

    this.container.querySelector('#crown-prev-lvl')?.addEventListener('click', () => {
      window.audioEngine.playTap();
      this.loadLevel(this.tier, Math.max(0, this.levelIndex - 1));
    });
    this.container.querySelector('#crown-next-lvl')?.addEventListener('click', () => {
      window.audioEngine.playTap();
      this.loadLevel(this.tier, this.levelIndex + 1);
    });

    this.container.querySelector('#crown-undo-btn').addEventListener('click', () => this.undo());
    this.container.querySelector('#crown-mascot-btn').addEventListener('click', () => this.cycleMascot());
    this.container.querySelector('#crown-autox-btn').addEventListener('click', () => this.toggleAutoX());
    this.container.querySelector('#crown-hint-btn').addEventListener('click', () => this.useSmartHint());
    this.container.querySelector('#crown-reset-top-btn').addEventListener('click', () => this.requestSafeReset());
    this.container.querySelector('#crown-rules-btn').addEventListener('click', () => this.showRulesModal());

    this.buildGridCells();
    this.refreshGridUI();
  }

  buildGridCells() {
    const gridEl = document.getElementById('crown-grid-el');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    // Remove any previously registered global listeners to prevent leaks
    if (this._pointerUpHandler) {
      window.removeEventListener('pointerup', this._pointerUpHandler);
      window.removeEventListener('pointercancel', this._pointerUpHandler);
    }
    this._pointerUpHandler = () => { this.isDraggingX = false; };

    const regs = this.levelData.regions;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = document.createElement('div');
        cell.className = 'crown-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;

        const regId = regs[r][c];
        const pal = QUEENS_CUSHION_PALETTE[regId % QUEENS_CUSHION_PALETTE.length];
        cell.style.setProperty('--tile-top', pal.top);
        cell.style.setProperty('--tile-bot', pal.bot);
        cell.style.setProperty('--tile-edge', pal.edge);
        cell.style.setProperty('--tile-shadow', pal.shadow);

        cell.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (this.isSolved) return;
          this.handleCellTap(r, c, cell);
        });

        cell.addEventListener('pointerenter', () => {
          if (this.isDraggingX) {
            this.lastTapInfo = null;
            const eff = this.getEffectiveBoard();
            if (eff[r][c] === 0) {
              this.manualState[r][c] = 1;
              window.audioEngine.playMarkX();
              this.refreshGridUI();
            }
          }
        });

        gridEl.appendChild(cell);
      }
    }

    gridEl.addEventListener('touchmove', (e) => {
      if (!this.isDraggingX) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rawTarget = document.elementFromPoint(touch.clientX, touch.clientY);
      const target = rawTarget && rawTarget.closest ? rawTarget.closest('.crown-cell') : null;
      if (target) {
        const rr = parseInt(target.dataset.r, 10);
        const cc = parseInt(target.dataset.c, 10);
        if (this.lastTapInfo && (this.lastTapInfo.r !== rr || this.lastTapInfo.c !== cc)) {
          this.lastTapInfo = null;
        }
        const eff = this.getEffectiveBoard();
        if (eff[rr][cc] === 0) {
          this.manualState[rr][cc] = 1;
          window.audioEngine.playMarkX();
          this.refreshGridUI();
        }
      }
    }, { passive: false });

    window.addEventListener('pointerup', this._pointerUpHandler);
    window.addEventListener('pointercancel', this._pointerUpHandler);
  }

  refreshGridUI(highlightedKeys = []) {
    const gridEl = document.getElementById('crown-grid-el');
    if (!gridEl) return;

    const eff = this.getEffectiveBoard();
    const { crownCells, hazardCells } = this.getConflictDetails();
    const highlightSet = new Set(highlightedKeys);
    const catSvgHtml = renderKawaiiCatSVG(this.activeMascot);

    const cells = gridEl.querySelectorAll('.crown-cell');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.r, 10);
      const c = parseInt(cell.dataset.c, 10);
      const val = eff[r][c]; // 0 = empty, 1 = manual X, 2 = Cat, 3 = Auto-X
      const key = `${r},${c}`;

      cell.classList.toggle('cell-x', val === 1 || val === 3);
      cell.classList.toggle('cell-auto-x', val === 3);
      cell.classList.toggle('cell-crown', val === 2);
      cell.classList.toggle('cell-hazard-stripe', hazardCells.has(key));
      cell.classList.toggle('cell-conflict-crown', crownCells.has(key));
      cell.classList.toggle('cell-hint-glow', highlightSet.has(key));

      if (this.lastPlacedCrown && val === 3) {
        const [cr, cc] = this.lastPlacedCrown;
        const dist = Math.abs(r - cr) + Math.abs(c - cc);
        cell.style.setProperty('--ripple-delay', `${dist * 22}ms`);
      } else {
        cell.style.setProperty('--ripple-delay', '0ms');
      }

      const renderSig = val === 2 ? `2:${this.activeMascot}` : (val === 1 || val === 3) ? 'x' : '0';
      if (cell.dataset.renderSig !== renderSig) {
        cell.dataset.renderSig = renderSig;
        if (val === 2) {
          cell.innerHTML = `<div class="crown-badge-wrap">${catSvgHtml}</div>`;
        } else if (val === 1 || val === 3) {
          cell.innerHTML = MARK_X_SVG;
        } else {
          cell.innerHTML = '';
        }
      }
    });

    this.updateTimerDisplay();
    if (window.app) window.app.refreshHeaderWallet();
  }
}

window.CrownGameEngine = CrownGameEngine;
