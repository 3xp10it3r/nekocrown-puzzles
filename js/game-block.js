/**
 * Mode 2: NEON BLOCK BLAST (8x8 Polyomino Combo Grid)
 * UX Upgraded:
 *  - 3D Beveled Jewel Blocks with Specular Highlights
 *  - Floating Animated Score & Combo Popups over the Board
 *  - Larger 21px Tactile Polyomino Tray + Live Combo Streak Badge
 */

const POLYOMINO_SHAPES = [
  { cells: [[0,0]], color: '#00F5D4' },
  { cells: [[0,0],[0,1]], color: '#00BBF9' },
  { cells: [[0,0],[1,0]], color: '#00BBF9' },
  { cells: [[0,0],[0,1],[0,2]], color: '#9B5DE5' },
  { cells: [[0,0],[1,0],[2,0]], color: '#9B5DE5' },
  { cells: [[0,0],[0,1],[1,0]], color: '#F15BB5' },
  { cells: [[0,0],[0,1],[1,1]], color: '#F15BB5' },
  { cells: [[0,0],[1,0],[1,1]], color: '#F15BB5' },
  { cells: [[0,1],[1,0],[1,1]], color: '#F15BB5' },
  { cells: [[0,0],[0,1],[1,0],[1,1]], color: '#FFB800' },
  { cells: [[0,0],[0,1],[0,2],[0,3]], color: '#00F5D4' },
  { cells: [[0,0],[1,0],[2,0],[3,0]], color: '#00F5D4' },
  { cells: [[0,0],[0,1],[0,2],[1,1]], color: '#FF5D8F' },
  { cells: [[0,1],[1,0],[1,1],[1,2]], color: '#FF5D8F' },
  { cells: [[0,0],[1,0],[2,0],[2,1]], color: '#FF8552' },
  { cells: [[0,1],[1,1],[2,0],[2,1]], color: '#FF8552' },
  { cells: [[0,0],[0,1],[0,2],[1,0]], color: '#FF8552' },
  { cells: [[0,0],[0,1],[1,1],[1,2]], color: '#10B981' },
  { cells: [[0,1],[0,2],[1,0],[1,1]], color: '#10B981' },
  { cells: [[0,0],[0,1],[0,2],[0,3],[0,4]], color: '#3B82F6' },
  { cells: [[0,0],[1,0],[2,0],[3,0],[4,0]], color: '#3B82F6' },
  { cells: [[0,0],[0,1],[0,2],[1,0],[2,0]], color: '#F59E0B' },
  { cells: [[0,0],[0,1],[0,2],[1,2],[2,2]], color: '#F59E0B' },
  { cells: [[0,0],[1,0],[2,0],[2,1],[2,2]], color: '#F59E0B' },
  { cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]], color: '#EC4899' }
];

class BlockBlastEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.size = 8;
    this.grid = [];
    this.tray = [null, null, null];
    this.selectedTrayIdx = null;
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('nc_block_best') || '0', 10);
    this.comboStreak = 0;
    this.revivesUsed = 0;
    this.isDailyMode = false;
    this.dailyTargetScore = 350;
    this.onDailyStageWin = null;
    this.dailyWon = false;

    this.draggingIdx = null;
    this.floatingEl = null;
    this.hoverCoord = null;
    this.restoreSavedRun();
  }

  saveRunState() {
    if (this.isDailyMode || !this.grid || this.grid.length === 0) return;
    try {
      localStorage.setItem('nc_block_run', JSON.stringify({
        grid: this.grid,
        score: this.score,
        comboStreak: this.comboStreak,
        tray: this.tray
      }));
    } catch (_) {}
  }

  restoreSavedRun() {
    try {
      const raw = localStorage.getItem('nc_block_run');
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (
        saved &&
        Array.isArray(saved.grid) &&
        saved.grid.length === this.size &&
        Array.isArray(saved.tray) &&
        saved.tray.length === 3
      ) {
        this.grid = saved.grid;
        this.score = saved.score || 0;
        this.comboStreak = saved.comboStreak || 0;
        this.tray = saved.tray;
        if (!this.hasAnyValidMove()) {
          this.grid = [];
          return false;
        }
        return true;
      }
    } catch (_) {}
    return false;
  }

  startNewGame(isDaily = false, targetScore = 350, onDailyWin = null) {
    clearTimeout(this.winTimeout);
    clearTimeout(this.outOfMovesTimeout);
    if (this.floatingEl) {
      this.floatingEl.remove();
      this.floatingEl = null;
    }
    this.draggingIdx = null;
    this.hoverCoord = null;
    this.isDailyMode = isDaily;
    this.dailyTargetScore = targetScore;
    this.onDailyStageWin = onDailyWin;
    this.dailyWon = false;
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(null));
    this.score = 0;
    this.comboStreak = 0;
    this.revivesUsed = 0;
    this.selectedTrayIdx = null;
    this.spawnTray();
    this.saveRunState();
    this.render();
  }

  spawnTray(forceEasy = false) {
    for (let i = 0; i < 3; i++) {
      if (forceEasy) {
        this.tray[i] = { ...POLYOMINO_SHAPES[0], color: '#FFD13B' };
      } else {
        const idx = Math.floor(Math.random() * POLYOMINO_SHAPES.length);
        this.tray[i] = JSON.parse(JSON.stringify(POLYOMINO_SHAPES[idx]));
      }
    }
    this.selectedTrayIdx = null;
  }

  canPlaceShape(shape, baseR, baseC) {
    if (!shape) return false;
    for (const [dr, dc] of shape.cells) {
      const r = baseR + dr;
      const c = baseC + dc;
      if (r < 0 || r >= this.size || c < 0 || c >= this.size) return false;
      if (this.grid[r][c] !== null) return false;
    }
    return true;
  }

  hasAnyValidMove() {
    for (let i = 0; i < 3; i++) {
      const shape = this.tray[i];
      if (!shape) continue;
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.canPlaceShape(shape, r, c)) return true;
        }
      }
    }
    return false;
  }

  placeShapeFromTray(trayIdx, baseR, baseC) {
    const shape = this.tray[trayIdx];
    if (!this.canPlaceShape(shape, baseR, baseC)) {
      window.audioEngine.playError();
      return false;
    }

    for (const [dr, dc] of shape.cells) {
      this.grid[baseR + dr][baseC + dc] = shape.color;
    }
    this.tray[trayIdx] = null;
    this.selectedTrayIdx = null;
    this.hoverCoord = null;

    let ptsEarned = shape.cells.length * 10;

    const fullRows = [];
    const fullCols = [];

    for (let r = 0; r < this.size; r++) {
      if (this.grid[r].every(cell => cell !== null)) fullRows.push(r);
    }
    for (let c = 0; c < this.size; c++) {
      let colFull = true;
      for (let r = 0; r < this.size; r++) {
        if (this.grid[r][c] === null) {
          colFull = false;
          break;
        }
      }
      if (colFull) fullCols.push(c);
    }

    const totalLines = fullRows.length + fullCols.length;
    if (totalLines > 0) {
      this.comboStreak += 1;
      const clearedCells = new Set();
      fullRows.forEach(r => {
        for (let c = 0; c < this.size; c++) {
          clearedCells.add(`${r},${c}`);
          this.grid[r][c] = null;
        }
      });
      fullCols.forEach(c => {
        for (let r = 0; r < this.size; r++) {
          clearedCells.add(`${r},${c}`);
          this.grid[r][c] = null;
        }
      });

      const lineBonus = totalLines * 100 * totalLines * Math.max(1, this.comboStreak);
      ptsEarned += lineBonus;

      const isBoardEmpty = this.grid.every(row => row.every(cell => cell === null));
      if (isBoardEmpty) {
        ptsEarned += 300;
        this.showComboToast(`🌟 PERFECT ALL-CLEAR! +300 PTS`);
        this.spawnFloatingPopup(`ALL CLEAR! +${ptsEarned}`);
      } else if (totalLines >= 2 || this.comboStreak >= 2) {
        this.showComboToast(`🔥 ${totalLines}x LINE CLEAR • COMBO x${this.comboStreak}! (+${ptsEarned})`);
        this.spawnFloatingPopup(`COMBO x${this.comboStreak}! +${ptsEarned}`);
      } else {
        this.showComboToast(`✨ LINE CLEAR! +${ptsEarned}`);
        this.spawnFloatingPopup(`+${ptsEarned}`);
      }

      window.audioEngine.playLineClear(this.comboStreak + totalLines - 1);
      this.animateClearedCells(clearedCells);
    } else {
      this.comboStreak = 0;
      window.audioEngine.playBlockDrop();
    }

    this.score += ptsEarned;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('nc_block_best', String(this.bestScore));
    }

    if (this.tray.every(s => s === null)) {
      this.spawnTray();
    }

    this.refreshUI();

    if (this.isDailyMode && !this.dailyWon && this.score >= this.dailyTargetScore) {
      this.dailyWon = true;
      window.audioEngine.playWinFanfare();
      clearTimeout(this.winTimeout);
      this.winTimeout = setTimeout(() => {
        if (this.onDailyStageWin) {
          this.onDailyStageWin({ score: this.score });
        }
      }, 450);
      return true;
    }

    if (!this.hasAnyValidMove()) {
      clearTimeout(this.outOfMovesTimeout);
      this.outOfMovesTimeout = setTimeout(() => this.showOutOfMovesModal(), 350);
    }
    return true;
  }

  spawnFloatingPopup(text) {
    const stage = this.container.querySelector('.board-stage');
    if (!stage) return;
    const pop = document.createElement('div');
    pop.className = 'floating-score-popup';
    pop.textContent = text;
    stage.appendChild(pop);
    setTimeout(() => pop.remove(), 950);
  }

  animateClearedCells(_clearedSet) {
    // Cleared rows/columns disappear immediately without flashing a white row
  }

  showComboToast(text) {
    const banner = document.getElementById('block-status-banner');
    if (!banner) return;
    banner.textContent = text;
  }

  useBombBooster() {
    if (!window.app || !window.app.consumeHint()) return;
    const cleared = new Set();
    for (let r = 2; r <= 5; r++) {
      for (let c = 2; c <= 5; c++) {
        if (this.grid[r][c] !== null) {
          this.grid[r][c] = null;
          cleared.add(`${r},${c}`);
        }
      }
    }
    window.audioEngine.playLineClear(4);
    this.animateClearedCells(cleared);
    this.spawnFloatingPopup(`💣 4×4 BLAST!`);
    this.showComboToast(`💣 CENTER 4×4 BLASTED CLEAR!`);
    this.refreshUI();
  }

  rerollTray() {
    if (window.app && window.app.state.coins >= 40) {
      window.app.addCoins(-40);
      this.spawnTray();
      window.audioEngine.playTap();
      this.showComboToast(`🔄 Tray Rerolled! (-40 Coins)`);
      this.refreshUI();
    } else if (window.app) {
      window.monetization.showRewardedAd('Free Tray Reroll + 3 Golden Singles', () => {
        this.spawnTray(true);
        this.refreshUI();
      });
    }
  }

  showOutOfMovesModal() {
    window.audioEngine.playError();
    const modal = document.createElement('div');
    modal.className = 'sim-ad-overlay';
    modal.innerHTML = `
      <div class="sim-ad-card">
        <div class="sim-ad-top">
          <span class="sim-ad-badge">NO MOVES LEFT!</span>
          <span class="sim-ad-timer">Score: ${this.score}</span>
        </div>
        <div class="sim-ad-stage">
          <div class="sim-ad-pulse">💣</div>
          <h3>Out of Grid Space!</h3>
          <p>Watch a short Rewarded Ad to <strong>Blast the Center 4×4 Area</strong> and receive <strong>3 Golden Single Blocks</strong> to keep your high-score run alive!</p>
        </div>
        <div class="sim-ad-actions">
          <button class="btn-secondary" id="block-gameover-restart">End Run (+${Math.max(10, Math.floor(this.score / 40))} 🪙)</button>
          <button class="btn-primary" id="block-gameover-revive">🎬 Revive + Blast 4×4</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#block-gameover-restart').addEventListener('click', () => {
      modal.remove();
      const coinReward = Math.max(10, Math.floor(this.score / 40));
      if (window.app) {
        window.app.addCoins(coinReward);
        window.app.showToast(`Run Finished! Earned +${coinReward} Coins 🪙`);
      }
      window.monetization.maybeShowInterstitialAfterLevel(() => {
        this.startNewGame(this.isDailyMode, this.dailyTargetScore, this.onDailyStageWin);
      });
    });

    modal.querySelector('#block-gameover-revive').addEventListener('click', () => {
      modal.remove();
      window.monetization.showRewardedAd('Revive + Blast 4×4', () => {
        this.revivesUsed += 1;
        for (let r = 2; r <= 5; r++) {
          for (let c = 2; c <= 5; c++) {
            this.grid[r][c] = null;
          }
        }
        this.spawnTray(true);
        this.spawnFloatingPopup(`⚡ REVIVED!`);
        this.showComboToast(`⚡ REVIVED! Center 4×4 Cleared + Golden Blocks!`);
        this.refreshUI();
      });
    });
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="mode-header-bar">
        <div class="score-scoreboard">
          <div class="score-box">
            <span class="score-label">${this.isDailyMode ? '🌍 DAILY TARGET' : 'CURRENT SCORE'}</span>
            <span class="score-val" id="block-score-val">${this.score}${this.isDailyMode ? ` / ${this.dailyTargetScore}` : ''}</span>
          </div>
          <div class="score-box best-box">
            <span class="score-label">ALL-TIME BEST</span>
            <span class="score-val" id="block-best-val">🏆 ${this.bestScore}</span>
          </div>
          <div class="score-box combo-box">
            <span class="score-label">STREAK</span>
            <span class="score-val" id="block-combo-val">🔥 x${Math.max(1, this.comboStreak)}</span>
          </div>
          <button class="block-restart-top-btn" id="block-new-btn" title="Restart Run">↻</button>
        </div>
      </div>

      <div class="hint-deduction-banner" id="block-status-banner">
        Drag a glowing piece onto the 8×8 grid — clear rows &amp; columns for multi-combos!
      </div>

      <div class="board-stage">
        <div class="block-grid" id="block-grid-el"></div>
      </div>

      <div class="block-tray-bar" id="block-tray-el"></div>

      <div class="game-controls-bar">
        <button class="ctrl-btn" id="block-reroll-btn">🔄 Reroll (40 🪙)</button>
        <button class="ctrl-btn hint-cta-btn" id="block-bomb-btn">
          💣 Blast 4×4 (<span class="hint-count-inline">${window.app ? window.app.state.hints : 5}</span> 💡)
        </button>
      </div>
    `;

    this.container.querySelector('#block-reroll-btn').addEventListener('click', () => this.rerollTray());
    this.container.querySelector('#block-bomb-btn').addEventListener('click', () => this.useBombBooster());
    this.container.querySelector('#block-new-btn').addEventListener('click', () => {
      if (window.app) {
        window.app.confirmReset(
          'Restart Block Blast Run?',
          'Are you sure you want to clear your current 8×8 grid and start a fresh run?',
          () => this.startNewGame(this.isDailyMode, this.dailyTargetScore, this.onDailyStageWin)
        );
      } else {
        this.startNewGame(this.isDailyMode, this.dailyTargetScore, this.onDailyStageWin);
      }
    });

    this.buildBoardCells();
    this.refreshUI();
  }

  buildBoardCells() {
    const gridEl = document.getElementById('block-grid-el');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = document.createElement('div');
        cell.className = 'block-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;

        cell.addEventListener('pointerenter', () => {
          if (this.selectedTrayIdx !== null && this.draggingIdx === null) {
            this.hoverCoord = [r, c];
            this.refreshBoardPreview();
          }
        });

        cell.addEventListener('click', () => {
          if (this.selectedTrayIdx !== null) {
            this.placeShapeFromTray(this.selectedTrayIdx, r, c);
          }
        });

        gridEl.appendChild(cell);
      }
    }
  }

  refreshUI() {
    const scoreEl = document.getElementById('block-score-val');
    if (scoreEl) {
      scoreEl.textContent = this.isDailyMode ? `${this.score} / ${this.dailyTargetScore}` : String(this.score);
    }
    const bestEl = document.getElementById('block-best-val');
    if (bestEl) {
      bestEl.textContent = `🏆 ${this.bestScore}`;
    }
    const comboEl = document.getElementById('block-combo-val');
    if (comboEl) {
      comboEl.textContent = `🔥 x${Math.max(1, this.comboStreak)}`;
    }

    this.refreshBoardPreview();
    this.renderTray();
    this.saveRunState();
    if (window.app) window.app.refreshHeaderWallet();
  }

  refreshBoardPreview() {
    const gridEl = document.getElementById('block-grid-el');
    if (!gridEl) return;

    const activeIdx = this.draggingIdx !== null ? this.draggingIdx : this.selectedTrayIdx;
    const activeShape = activeIdx !== null ? this.tray[activeIdx] : null;
    const ghostCells = new Set();
    const clearPreviewCells = new Set();

    if (activeShape && this.hoverCoord) {
      const [hr, hc] = this.hoverCoord;
      if (this.canPlaceShape(activeShape, hr, hc)) {
        activeShape.cells.forEach(([dr, dc]) => {
          ghostCells.add(`${hr + dr},${hc + dc}`);
        });

        for (let r = 0; r < this.size; r++) {
          let full = true;
          for (let c = 0; c < this.size; c++) {
            if (this.grid[r][c] === null && !ghostCells.has(`${r},${c}`)) {
              full = false;
              break;
            }
          }
          if (full) {
            for (let c = 0; c < this.size; c++) clearPreviewCells.add(`${r},${c}`);
          }
        }
        for (let c = 0; c < this.size; c++) {
          let full = true;
          for (let r = 0; r < this.size; r++) {
            if (this.grid[r][c] === null && !ghostCells.has(`${r},${c}`)) {
              full = false;
              break;
            }
          }
          if (full) {
            for (let r = 0; r < this.size; r++) clearPreviewCells.add(`${r},${c}`);
          }
        }
      }
    }

    const cells = gridEl.querySelectorAll('.block-cell');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.r, 10);
      const c = parseInt(cell.dataset.c, 10);
      const key = `${r},${c}`;
      const filledColor = this.grid[r][c];

      cell.classList.toggle('block-filled', filledColor !== null);
      cell.classList.toggle('block-ghost', ghostCells.has(key));
      cell.classList.toggle('block-will-clear', clearPreviewCells.has(key));

      if (filledColor !== null) {
        cell.style.setProperty('--tile-color', filledColor);
      } else if (ghostCells.has(key) && activeShape) {
        cell.style.setProperty('--tile-color', activeShape.color);
      } else {
        cell.style.removeProperty('--tile-color');
      }
    });
  }

  renderTray() {
    const trayEl = document.getElementById('block-tray-el');
    if (!trayEl) return;
    trayEl.innerHTML = '';

    this.tray.forEach((shape, idx) => {
      const slot = document.createElement('div');
      slot.className = `tray-slot ${this.selectedTrayIdx === idx ? 'selected-slot' : ''}`;

      if (shape) {
        const maxR = Math.max(...shape.cells.map(p => p[0])) + 1;
        const maxC = Math.max(...shape.cells.map(p => p[1])) + 1;
        const cellPx = Math.max(maxR, maxC) >= 4 ? 17 : 21;
        const miniGrid = document.createElement('div');
        miniGrid.className = 'mini-polyomino';
        miniGrid.style.gridTemplateColumns = `repeat(${maxC}, ${cellPx}px)`;
        miniGrid.style.gridTemplateRows = `repeat(${maxR}, ${cellPx}px)`;

        const cellSet = new Set(shape.cells.map(([r, c]) => `${r},${c}`));
        for (let r = 0; r < maxR; r++) {
          for (let c = 0; c < maxC; c++) {
            const mc = document.createElement('div');
            if (cellSet.has(`${r},${c}`)) {
              mc.className = 'mini-cell filled';
              mc.style.backgroundColor = shape.color;
            } else {
              mc.className = 'mini-cell';
            }
            miniGrid.appendChild(mc);
          }
        }

        let fitsSomewhere = false;
        for (let r = 0; r < this.size && !fitsSomewhere; r++) {
          for (let c = 0; c < this.size; c++) {
            if (this.canPlaceShape(shape, r, c)) {
              fitsSomewhere = true;
              break;
            }
          }
        }
        if (!fitsSomewhere) {
          slot.classList.add('unplayable-slot');
        }

        slot.appendChild(miniGrid);

        slot.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          window.audioEngine.playBlockPickup();
          this.selectedTrayIdx = idx;
          this.startPointerDrag(e, idx, shape);
          this.renderTray();
        });
      }

      trayEl.appendChild(slot);
    });
  }

  startPointerDrag(startEvent, idx, shape) {
    if (this.floatingEl) {
      this.floatingEl.remove();
      this.floatingEl = null;
    }
    if (this._activeDragCleanup) {
      this._activeDragCleanup();
    }
    this.draggingIdx = idx;
    const startX = startEvent.clientX;
    const startY = startEvent.clientY;
    let hasDragged = false;

    const floating = document.createElement('div');
    floating.className = 'floating-drag-piece';
    const maxR = Math.max(...shape.cells.map(p => p[0])) + 1;
    const maxC = Math.max(...shape.cells.map(p => p[1])) + 1;
    floating.style.gridTemplateColumns = `repeat(${maxC}, 34px)`;
    floating.style.gridTemplateRows = `repeat(${maxR}, 34px)`;

    const cellSet = new Set(shape.cells.map(([r, c]) => `${r},${c}`));
    for (let r = 0; r < maxR; r++) {
      for (let c = 0; c < maxC; c++) {
        const fc = document.createElement('div');
        if (cellSet.has(`${r},${c}`)) {
          fc.className = 'mini-cell filled';
          fc.style.backgroundColor = shape.color;
        } else {
          fc.className = 'mini-cell';
        }
        floating.appendChild(fc);
      }
    }
    document.body.appendChild(floating);
    this.floatingEl = floating;

    const updateFloatingPosition = (clientX, clientY) => {
      const offsetY = 74;
      floating.style.left = `${clientX}px`;
      floating.style.top = `${clientY - offsetY}px`;

      const gridEl = document.getElementById('block-grid-el');
      if (!gridEl) return;
      const rect = gridEl.getBoundingClientRect();
      const cellSize = rect.width / this.size;

      const shapeWidthPx = maxC * cellSize;
      const shapeHeightPx = maxR * cellSize;
      const topLeftX = clientX - shapeWidthPx / 2 + cellSize / 2;
      const topLeftY = (clientY - offsetY) - shapeHeightPx / 2 + cellSize / 2;

      const c = Math.round((topLeftX - rect.left) / cellSize);
      const r = Math.round((topLeftY - rect.top) / cellSize);

      if (r >= -1 && r <= this.size && c >= -1 && c <= this.size) {
        const clampedR = Math.max(0, Math.min(this.size - maxR, r));
        const clampedC = Math.max(0, Math.min(this.size - maxC, c));
        this.hoverCoord = [clampedR, clampedC];
      } else {
        this.hoverCoord = null;
      }
      this.refreshBoardPreview();
    };

    updateFloatingPosition(startEvent.clientX, startEvent.clientY);

    const onMove = (ev) => {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) >= 8) {
        hasDragged = true;
      }
      updateFloatingPosition(ev.clientX, ev.clientY);
    };

    const cleanupListeners = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      this._activeDragCleanup = null;
    };
    this._activeDragCleanup = cleanupListeners;

    const onUp = () => {
      cleanupListeners();
      if (this.floatingEl) {
        this.floatingEl.remove();
        this.floatingEl = null;
      }
      this.draggingIdx = null;
      if (this.hoverCoord && this.canPlaceShape(shape, this.hoverCoord[0], this.hoverCoord[1])) {
        this.placeShapeFromTray(idx, this.hoverCoord[0], this.hoverCoord[1]);
      } else {
        this.hoverCoord = null;
        if (hasDragged) {
          this.selectedTrayIdx = null;
          this.renderTray();
        }
        this.refreshBoardPreview();
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }
}

window.BlockBlastEngine = BlockBlastEngine;
