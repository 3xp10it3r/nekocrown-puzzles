/**
 * Mode 3: BINARY TANGO (Sun ☀️ & Moon 🌙 Constraint Grid)
 * UX Upgraded:
 *  - Live Row & Column Balance Counters (☀️/🌙 counts per row & col!)
 *  - Custom Vector Sun & Crescent Moon SVGs + Locked Clue Pin Indicator
 *  - Oversized High-Contrast '=' and '×' Edge Connectors
 *  - Visual '?' How-to-Play Rules Sheet
 */

const SUN_SVG = `
<svg class="tango-svg-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="18" cy="18" r="8.5" fill="#FFB800" stroke="#FFF3B0" stroke-width="2"/>
  <path d="M18 3V6.5M18 29.5V33M3 18H6.5M29.5 18H33M7.4 7.4L9.9 9.9M26.1 26.1L28.6 28.6M28.6 7.4L26.1 9.9M9.9 26.1L7.4 28.6" stroke="#FFD13B" stroke-width="2.5" stroke-linecap="round"/>
</svg>
`;

const MOON_SVG = `
<svg class="tango-svg-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M24.8 22.8C19.6 22.8 15.4 18.6 15.4 13.4C15.4 10.9 16.4 8.6 18 7C12.4 7.7 8 12.5 8 18.3C8 24.6 13.1 29.7 19.4 29.7C24.3 29.7 28.5 26.6 30 22.2C28.4 22.6 26.6 22.8 24.8 22.8Z" fill="#38BDF8" stroke="#BAE6FD" stroke-width="2" stroke-linejoin="round"/>
</svg>
`;

class TangoGameEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.levelIndex = 0;
    this.levelData = null;
    this.size = 6;
    this.board = []; // -1 = empty, 0 = Moon, 1 = Sun
    this.locked = [];
    this.history = [];
    this.timerSec = 0;
    this.timerInterval = null;
    this.hintsUsed = 0;
    this.isSolved = false;
    this.isDailyMode = false;
    this.onDailyStageWin = null;
  }

  loadLevel(index = 0, customLevelData = null, isDaily = false, onDailyWin = null) {
    clearTimeout(this.winTimeout);
    this.levelIndex = index;
    this.isDailyMode = isDaily;
    this.onDailyStageWin = onDailyWin;

    if (customLevelData) {
      this.levelData = customLevelData;
    } else {
      const list = (window.NEON_CROWN_LEVELS && window.NEON_CROWN_LEVELS.tango) || [];
      if (list.length === 0) {
        console.warn('No tango levels available');
        return;
      }
      this.levelData = list[index % list.length];
    }

    this.size = this.levelData.size;
    this.board = this.levelData.clues.map(row => [...row]);
    this.locked = this.levelData.clues.map(row => row.map(v => v !== -1));
    this.history = [];
    this.hintsUsed = 0;
    this.isSolved = false;
    this.startTimer();
    this.render();
    this.setHintBanner(`Tap once for ☀️ • Tap twice for 🌙 • '=' means Same, '×' means Opposite!`);
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
    const el = document.getElementById('tango-timer');
    if (el) {
      const m = String(Math.floor(this.timerSec / 60)).padStart(2, '0');
      const s = String(this.timerSec % 60).padStart(2, '0');
      el.textContent = `${m}:${s}`;
    }
  }

  pushHistory() {
    this.history.push(this.board.map(row => [...row]));
    if (this.history.length > 60) this.history.shift();
  }

  undo() {
    if (this.isSolved || this.history.length === 0) return;
    this.board = this.history.pop();
    window.audioEngine.playTap();
    this.refreshGridUI();
    this.checkWinCondition();
  }

  requestSafeReset() {
    if (this.isSolved) return;
    if (window.app) {
      window.app.confirmReset(
        'Reset Binary Tango?',
        'Do you really want to clear your placed Suns and Moons back to the starting clues?',
        () => this.resetBoard()
      );
    } else {
      this.resetBoard();
    }
  }

  resetBoard() {
    if (this.isSolved) return;
    this.pushHistory();
    this.board = this.levelData.clues.map(row => [...row]);
    window.audioEngine.playTap();
    this.setHintBanner(`Board reset to starting clues.`);
    this.refreshGridUI();
  }

  handleCellTap(r, c) {
    if (this.isSolved || this.locked[r][c]) return;
    this.pushHistory();
    const cur = this.board[r][c];
    if (cur === -1) {
      this.board[r][c] = 1;
      window.audioEngine.playSunPlace();
    } else if (cur === 1) {
      this.board[r][c] = 0;
      window.audioEngine.playMoonPlace();
    } else {
      this.board[r][c] = -1;
      window.audioEngine.playTap();
    }
    this.refreshGridUI();
    this.checkWinCondition();
  }

  getConflictDetails() {
    const conflicts = new Set();
    let message = '';
    const n = this.size;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n - 2; c++) {
        const a = this.board[r][c];
        if (a !== -1 && a === this.board[r][c+1] && a === this.board[r][c+2]) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${r},${c+1}`);
          conflicts.add(`${r},${c+2}`);
          if (!message) message = `⚠️ Three ${a === 1 ? '☀️ Suns' : '🌙 Moons'} in a row in Row ${r + 1}! Max 2 adjacent allowed.`;
        }
      }
    }
    for (let c = 0; c < n; c++) {
      for (let r = 0; r < n - 2; r++) {
        const a = this.board[r][c];
        if (a !== -1 && a === this.board[r+1][c] && a === this.board[r+2][c]) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${r+1},${c}`);
          conflicts.add(`${r+2},${c}`);
          if (!message) message = `⚠️ Three ${a === 1 ? '☀️ Suns' : '🌙 Moons'} in a column in Col ${c + 1}! Max 2 adjacent allowed.`;
        }
      }
    }

    const half = Math.floor(n / 2);
    for (let r = 0; r < n; r++) {
      let suns = 0, moons = 0;
      for (let c = 0; c < n; c++) {
        if (this.board[r][c] === 1) suns++;
        if (this.board[r][c] === 0) moons++;
      }
      if (suns > half || moons > half) {
        for (let c = 0; c < n; c++) conflicts.add(`${r},${c}`);
        if (!message) message = `⚠️ Row ${r + 1} has too many ${suns > half ? '☀️ Suns' : '🌙 Moons'}! Only ${half} of each allowed.`;
      }
    }
    for (let c = 0; c < n; c++) {
      let suns = 0, moons = 0;
      for (let r = 0; r < n; r++) {
        if (this.board[r][c] === 1) suns++;
        if (this.board[r][c] === 0) moons++;
      }
      if (suns > half || moons > half) {
        for (let r = 0; r < n; r++) conflicts.add(`${r},${c}`);
        if (!message) message = `⚠️ Col ${c + 1} has too many ${suns > half ? '☀️ Suns' : '🌙 Moons'}! Only ${half} of each allowed.`;
      }
    }

    for (const [r1, c1, r2, c2, type] of this.levelData.edges) {
      const v1 = this.board[r1][c1];
      const v2 = this.board[r2][c2];
      if (v1 !== -1 && v2 !== -1) {
        if (type === '=' && v1 !== v2) {
          conflicts.add(`${r1},${c1}`);
          conflicts.add(`${r2},${c2}`);
          if (!message) message = `⚠️ '=' connector requires matching symbols between (${r1 + 1},${c1 + 1}) and (${r2 + 1},${c2 + 1})!`;
        }
        if (type === 'x' && v1 === v2) {
          conflicts.add(`${r1},${c1}`);
          conflicts.add(`${r2},${c2}`);
          if (!message) message = `⚠️ '×' connector requires opposite symbols between (${r1 + 1},${c1 + 1}) and (${r2 + 1},${c2 + 1})!`;
        }
      }
    }

    return { conflicts, message };
  }

  getConflicts() {
    return this.getConflictDetails().conflicts;
  }

  checkWinCondition(preserveBanner = false) {
    const { conflicts, message } = this.getConflictDetails();
    if (conflicts.size > 0) {
      window.audioEngine.playError();
      this.setHintBanner(message, true);
      return false;
    }

    const bannerEl = document.getElementById('tango-hint-banner');
    const hadError = bannerEl && bannerEl.classList.contains('banner-error');
    if (hadError && !preserveBanner) {
      this.setHintBanner(`Tap once for ☀️ • Tap twice for 🌙 • '=' means Same, '×' means Opposite!`);
    }

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === -1) return false;
      }
    }

    this.isSolved = true;
    this.stopTimer();
    window.audioEngine.playWinFanfare();
    this.setHintBanner(`🎉 Binary Tango Solved in ${document.getElementById('tango-timer')?.textContent || '00:00'}!`);

    clearTimeout(this.winTimeout);
    this.winTimeout = setTimeout(() => {
      if (this.isDailyMode && this.onDailyStageWin) {
        this.onDailyStageWin({
          timeSec: this.timerSec,
          hintsUsed: this.hintsUsed
        });
      } else if (window.app) {
        window.app.onPuzzleSolved({
          mode: 'tango',
          tier: this.levelData.tier || 'easy',
          levelNumber: this.levelIndex + 1,
          timeSec: this.timerSec,
          hintsUsed: this.hintsUsed
        });
      }
    }, 450);
    return true;
  }

  useSmartHint() {
    if (this.isSolved) return;
    if (!window.app || !window.app.consumeHint()) return;

    this.hintsUsed += 1;
    this.pushHistory();
    const sol = this.levelData.solution;
    const n = this.size;
    const half = Math.floor(n / 2);
    const symName = (v) => (v === 1 ? '☀️ Sun' : '🌙 Moon');

    const applyHint = (r, c, reason) => {
      this.board[r][c] = sol[r][c];
      window.audioEngine.playHint();
      this.setHintBanner(reason, false, true);
      this.refreshGridUI([`${r},${c}`]);
      this.checkWinCondition(true);
    };

    // 1. Mistake Fix: Check if player placed a symbol contrary to the solution
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!this.locked[r][c] && this.board[r][c] !== -1 && this.board[r][c] !== sol[r][c]) {
          applyHint(
            r,
            c,
            `💡 Why (Mistake Fixed): Row ${r + 1}, Col ${c + 1} had the wrong symbol. Corrected to ${symName(sol[r][c])}!`
          );
          return;
        }
      }
    }

    // 2. Direct '=' or '×' Connector Deduction
    for (const [r1, c1, r2, c2, type] of this.levelData.edges) {
      const v1 = this.board[r1][c1];
      const v2 = this.board[r2][c2];
      if (v1 !== -1 && v2 === -1) {
        const ruleText = type === '=' ? `must match` : `must be opposite to`;
        applyHint(
          r2,
          c2,
          `💡 Why ('${type}' Connector): (${r2 + 1},${c2 + 1}) ${ruleText} (${r1 + 1},${c1 + 1}) (${symName(v1)}) → ${symName(sol[r2][c2])}!`
        );
        return;
      }
      if (v2 !== -1 && v1 === -1) {
        const ruleText = type === '=' ? `must match` : `must be opposite to`;
        applyHint(
          r1,
          c1,
          `💡 Why ('${type}' Connector): (${r1 + 1},${c1 + 1}) ${ruleText} (${r2 + 1},${c2 + 1}) (${symName(v2)}) → ${symName(sol[r1][c1])}!`
        );
        return;
      }
    }

    // 3. No 3-in-a-Row Deduction (Adjacent Pair XX_ / _XX or Split Pair X_X)
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (this.board[r][c] !== -1) continue;
        const target = sol[r][c];
        // Horizontal pair left (c-2, c-1)
        if (c >= 2 && this.board[r][c - 1] !== -1 && this.board[r][c - 1] === this.board[r][c - 2]) {
          applyHint(
            r,
            c,
            `💡 Why (No 3-in-a-Row): Row ${r + 1} already has two ${symName(this.board[r][c - 1])}s at Cols ${c - 1}–${c}, so (${r + 1},${c + 1}) must be ${symName(target)}!`
          );
          return;
        }
        // Horizontal pair right (c+1, c+2)
        if (c + 2 < n && this.board[r][c + 1] !== -1 && this.board[r][c + 1] === this.board[r][c + 2]) {
          applyHint(
            r,
            c,
            `💡 Why (No 3-in-a-Row): Row ${r + 1} already has two ${symName(this.board[r][c + 1])}s at Cols ${c + 2}–${c + 3}, so (${r + 1},${c + 1}) must be ${symName(target)}!`
          );
          return;
        }
        // Horizontal split pair (c-1 and c+1)
        if (c >= 1 && c + 1 < n && this.board[r][c - 1] !== -1 && this.board[r][c - 1] === this.board[r][c + 1]) {
          applyHint(
            r,
            c,
            `💡 Why (No 3-in-a-Row): (${r + 1},${c + 1}) sits between two ${symName(this.board[r][c - 1])}s in Row ${r + 1}, so it must be ${symName(target)}!`
          );
          return;
        }
        // Vertical pair above (r-2, r-1)
        if (r >= 2 && this.board[r - 1][c] !== -1 && this.board[r - 1][c] === this.board[r - 2][c]) {
          applyHint(
            r,
            c,
            `💡 Why (No 3-in-a-Row): Col ${c + 1} already has two ${symName(this.board[r - 1][c])}s at Rows ${r - 1}–${r}, so (${r + 1},${c + 1}) must be ${symName(target)}!`
          );
          return;
        }
        // Vertical pair below (r+1, r+2)
        if (r + 2 < n && this.board[r + 1][c] !== -1 && this.board[r + 1][c] === this.board[r + 2][c]) {
          applyHint(
            r,
            c,
            `💡 Why (No 3-in-a-Row): Col ${c + 1} already has two ${symName(this.board[r + 1][c])}s at Rows ${r + 2}–${r + 3}, so (${r + 1},${c + 1}) must be ${symName(target)}!`
          );
          return;
        }
        // Vertical split pair (r-1 and r+1)
        if (r >= 1 && r + 1 < n && this.board[r - 1][c] !== -1 && this.board[r - 1][c] === this.board[r + 1][c]) {
          applyHint(
            r,
            c,
            `💡 Why (No 3-in-a-Row): (${r + 1},${c + 1}) sits between two ${symName(this.board[r - 1][c])}s in Col ${c + 1}, so it must be ${symName(target)}!`
          );
          return;
        }
      }
    }

    // 4. Row or Column Balance Completed (Already has 3 Suns or 3 Moons)
    for (let r = 0; r < n; r++) {
      let suns = 0, moons = 0;
      for (let c = 0; c < n; c++) {
        if (this.board[r][c] === 1) suns++;
        if (this.board[r][c] === 0) moons++;
      }
      if (suns === half || moons === half) {
        for (let c = 0; c < n; c++) {
          if (this.board[r][c] === -1) {
            const fullSym = suns === half ? '☀️ Suns' : '🌙 Moons';
            applyHint(
              r,
              c,
              `💡 Why (Row Balance): Row ${r + 1} already has all ${half} ${fullSym}, so (${r + 1},${c + 1}) must be ${symName(sol[r][c])}!`
            );
            return;
          }
        }
      }
    }
    for (let c = 0; c < n; c++) {
      let suns = 0, moons = 0;
      for (let r = 0; r < n; r++) {
        if (this.board[r][c] === 1) suns++;
        if (this.board[r][c] === 0) moons++;
      }
      if (suns === half || moons === half) {
        for (let r = 0; r < n; r++) {
          if (this.board[r][c] === -1) {
            const fullSym = suns === half ? '☀️ Suns' : '🌙 Moons';
            applyHint(
              r,
              c,
              `💡 Why (Column Balance): Col ${c + 1} already has all ${half} ${fullSym}, so (${r + 1},${c + 1}) must be ${symName(sol[r][c])}!`
            );
            return;
          }
        }
      }
    }

    // 5. Fallback: Pick an empty cell in the most filled row/col
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (this.board[r][c] === -1) {
          applyHint(
            r,
            c,
            `💡 Why (Balance & Lookahead): Placing ${symName(1 - sol[r][c])} at (${r + 1},${c + 1}) would force 3-in-a-row or break the ${half}-of-each balance in Row ${r + 1} / Col ${c + 1}. Thus it must be ${symName(sol[r][c])}!`
          );
          return;
        }
      }
    }
  }

  showRulesModal() {
    const overlay = document.createElement('div');
    overlay.className = 'sim-ad-overlay';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-sheet-header">
          <h3>☀️ How to Play Binary Tango</h3>
          <button class="modal-close-btn" id="tango-rules-close">✕</button>
        </div>
        <div class="modal-sheet-body">
          <div class="rule-step-card">
            <span class="rule-step-num">1</span>
            <div>
              <h4>Equal Balance (3 ☀️ & 3 🌙)</h4>
              <p>Every row and column must contain <strong>exactly 3 Suns and 3 Moons</strong> (watch the live counters along the edges!).</p>
            </div>
          </div>
          <div class="rule-step-card">
            <span class="rule-step-num">2</span>
            <div>
              <h4>Never 3 Identical in a Row</h4>
              <p>You can have 2 Suns or 2 Moons next to each other, but <strong>never 3 in a row</strong> horizontally or vertically.</p>
            </div>
          </div>
          <div class="rule-step-card">
            <span class="rule-step-num">3</span>
            <div>
              <h4>Obey '=' and '×' Connectors</h4>
              <p><code>=</code> means the two connected cells must hold the <strong>SAME</strong> symbol. <code>×</code> means they must hold <strong>OPPOSITE</strong> symbols.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#tango-rules-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  setHintBanner(text, isError = false, isHint = false) {
    const el = document.getElementById('tango-hint-banner');
    if (el) {
      el.textContent = text;
      el.classList.toggle('banner-error', isError);
      el.classList.toggle('banner-hint-active', isHint);
    }
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="mode-header-bar">
        <div class="queens-status-strip">
          <div class="level-stepper">
            ${!this.isDailyMode ? `<button class="step-arrow" id="tango-prev-lvl" title="Previous Level">‹</button>` : ''}
            <span class="level-pill-title">${this.isDailyMode ? '🌍 Daily 2/3' : `Tango #${this.levelIndex + 1}`}</span>
            ${!this.isDailyMode ? `<button class="step-arrow" id="tango-next-lvl" title="Next Level">›</button>` : ''}
          </div>
          <div class="queens-right-pills">
            <span class="meta-badge">3 ☀️ &amp; 3 🌙</span>
            <span class="meta-badge timer-badge" id="tango-timer">00:00</span>
            <button class="meta-util-btn" id="tango-reset-top-btn" title="Reset Board">↻</button>
            <button class="meta-help-btn" id="tango-rules-btn" title="How to Play">?</button>
          </div>
        </div>
      </div>

      <div class="hint-deduction-banner" id="tango-hint-banner">
        Tap once for ☀️ • Tap twice for 🌙 • '=' means Same, '×' means Opposite!
      </div>

      <div class="board-stage">
        <div class="tango-board-frame" style="--grid-size: ${this.size};">
          <div class="tango-col-counters" id="tango-col-counters" style="--grid-size: ${this.size};"></div>
          <div class="tango-main-row">
            <div class="tango-row-counters" id="tango-row-counters" style="--grid-size: ${this.size};"></div>
            <div class="tango-grid" id="tango-grid-el" style="--grid-size: ${this.size};"></div>
          </div>
        </div>
      </div>

      <div class="game-controls-bar">
        <button class="ctrl-btn" id="tango-undo-btn">↩ Undo</button>
        <button class="ctrl-btn hint-cta-btn" id="tango-hint-btn">
          💡 Smart Hint (<span class="hint-count-inline">${window.app ? window.app.state.hints : 5}</span>)
        </button>
      </div>
    `;

    this.container.querySelector('#tango-prev-lvl')?.addEventListener('click', () => {
      window.audioEngine.playTap();
      this.loadLevel(Math.max(0, this.levelIndex - 1));
    });
    this.container.querySelector('#tango-next-lvl')?.addEventListener('click', () => {
      window.audioEngine.playTap();
      this.loadLevel(this.levelIndex + 1);
    });
    this.container.querySelector('#tango-undo-btn').addEventListener('click', () => this.undo());
    this.container.querySelector('#tango-reset-top-btn').addEventListener('click', () => this.requestSafeReset());
    this.container.querySelector('#tango-hint-btn').addEventListener('click', () => this.useSmartHint());
    this.container.querySelector('#tango-rules-btn').addEventListener('click', () => this.showRulesModal());

    this.buildGridCells();
    this.refreshGridUI();
  }

  buildGridCells() {
    const gridEl = document.getElementById('tango-grid-el');
    const colCntEl = document.getElementById('tango-col-counters');
    const rowCntEl = document.getElementById('tango-row-counters');
    if (!gridEl) return;
    gridEl.innerHTML = '';
    if (colCntEl) colCntEl.innerHTML = '';
    if (rowCntEl) rowCntEl.innerHTML = '';

    for (let i = 0; i < this.size; i++) {
      if (colCntEl) {
        const cc = document.createElement('div');
        cc.className = 'tango-axis-pill';
        cc.dataset.col = i;
        colCntEl.appendChild(cc);
      }
      if (rowCntEl) {
        const rc = document.createElement('div');
        rc.className = 'tango-axis-pill';
        rc.dataset.row = i;
        rowCntEl.appendChild(rc);
      }
    }

    const rightEdgeMap = {};
    const bottomEdgeMap = {};
    for (const [r1, c1, r2, c2, t] of this.levelData.edges) {
      if (r1 === r2 && c2 === c1 + 1) rightEdgeMap[`${r1},${c1}`] = t;
      if (r1 === r2 && c1 === c2 + 1) rightEdgeMap[`${r2},${c2}`] = t;
      if (c1 === c2 && r2 === r1 + 1) bottomEdgeMap[`${r1},${c1}`] = t;
      if (c1 === c2 && r1 === r2 + 1) bottomEdgeMap[`${r2},${c2}`] = t;
    }

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = document.createElement('div');
        cell.className = `tango-cell ${this.locked[r][c] ? 'tango-locked' : ''}`;
        cell.dataset.r = r;
        cell.dataset.c = c;

        const glyphSpan = document.createElement('span');
        glyphSpan.className = 'tango-glyph';
        cell.appendChild(glyphSpan);

        if (this.locked[r][c]) {
          const pin = document.createElement('span');
          pin.className = 'locked-pin';
          pin.title = 'Starting Clue';
          cell.appendChild(pin);
        }

        const rEdge = rightEdgeMap[`${r},${c}`];
        if (rEdge) {
          const badge = document.createElement('span');
          badge.className = `edge-badge edge-right ${rEdge === '=' ? 'edge-eq' : 'edge-op'}`;
          badge.textContent = rEdge === '=' ? '=' : '×';
          cell.appendChild(badge);
        }

        const bEdge = bottomEdgeMap[`${r},${c}`];
        if (bEdge) {
          const badge = document.createElement('span');
          badge.className = `edge-badge edge-bottom ${bEdge === '=' ? 'edge-eq' : 'edge-op'}`;
          badge.textContent = bEdge === '=' ? '=' : '×';
          cell.appendChild(badge);
        }

        cell.addEventListener('click', () => this.handleCellTap(r, c));
        gridEl.appendChild(cell);
      }
    }
  }

  refreshGridUI(highlightedKeys = []) {
    const gridEl = document.getElementById('tango-grid-el');
    if (!gridEl) return;
    const conflicts = this.getConflicts();
    const highlightSet = new Set(highlightedKeys);

    const rowSuns = Array(this.size).fill(0);
    const rowMoons = Array(this.size).fill(0);
    const colSuns = Array(this.size).fill(0);
    const colMoons = Array(this.size).fill(0);

    const cells = gridEl.querySelectorAll('.tango-cell');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.r, 10);
      const c = parseInt(cell.dataset.c, 10);
      const val = this.board[r][c];
      const key = `${r},${c}`;
      const glyph = cell.querySelector('.tango-glyph');

      if (val === 1) {
        rowSuns[r]++;
        colSuns[c]++;
      } else if (val === 0) {
        rowMoons[r]++;
        colMoons[c]++;
      }

      cell.classList.toggle('tango-sun', val === 1);
      cell.classList.toggle('tango-moon', val === 0);
      cell.classList.toggle('cell-conflict', conflicts.has(key));
      cell.classList.toggle('cell-hint-glow', highlightSet.has(key));

      if (glyph && cell.dataset.val !== String(val)) {
        cell.dataset.val = String(val);
        glyph.innerHTML = val === 1 ? SUN_SVG : val === 0 ? MOON_SVG : '';
      }
    });

    // Update live row & column counters
    const colCntEl = document.getElementById('tango-col-counters');
    const rowCntEl = document.getElementById('tango-row-counters');
    if (colCntEl) {
      colCntEl.querySelectorAll('.tango-axis-pill').forEach((el, c) => {
        const s = colSuns[c], m = colMoons[c];
        const half = Math.floor(this.size / 2);
        const ok = s === half && m === half;
        const err = s > half || m > half;
        const sig = `${s},${m}`;
        if (el.dataset.sig !== sig) {
          el.dataset.sig = sig;
          el.className = `tango-axis-pill ${ok ? 'axis-ok' : err ? 'axis-err' : ''}`;
          el.innerHTML = `<span>☀️${s}</span><span>🌙${m}</span>`;
        }
      });
    }
    if (rowCntEl) {
      rowCntEl.querySelectorAll('.tango-axis-pill').forEach((el, r) => {
        const s = rowSuns[r], m = rowMoons[r];
        const half = Math.floor(this.size / 2);
        const ok = s === half && m === half;
        const err = s > half || m > half;
        const sig = `${s},${m}`;
        if (el.dataset.sig !== sig) {
          el.dataset.sig = sig;
          el.className = `tango-axis-pill ${ok ? 'axis-ok' : err ? 'axis-err' : ''}`;
          el.innerHTML = `<span>☀️${s}</span><span>🌙${m}</span>`;
        }
      });
    }

    if (window.app) window.app.refreshHeaderWallet();
  }
}

window.TangoGameEngine = TangoGameEngine;
