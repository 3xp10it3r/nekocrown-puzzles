/**
 * Main Application Controller: Navigation, Daily Seeded Medley,
 * Economy (Coins/Hints/Streaks), Regional Store (₹ INR default),
 * Theme Shop, Daily Quests, and Viral Emoji Share.
 */

const THEMES = {
  cyber: { id: 'cyber', name: 'Cyber Indigo (Default)', price: 0, preview: 'linear-gradient(135deg, #070A14, #00F5D4)' },
  amoled: { id: 'amoled', name: 'Midnight AMOLED', price: 0, preview: 'linear-gradient(135deg, #000000, #38BDF8)' },
  matcha: { id: 'matcha', name: 'Matcha Zen', price: 300, preview: 'linear-gradient(135deg, #0A1914, #34D399)' },
  gold: { id: 'gold', name: 'Royal Gold', price: 500, preview: 'linear-gradient(135deg, #161108, #FBBF24)' },
  sakura: { id: 'sakura', name: 'Sakura Neon', price: 650, preview: 'linear-gradient(135deg, #1A0B18, #F472B6)' }
};

class NeonCrownApp {
  constructor() {
    const savedTheme = localStorage.getItem('nc_theme') || 'cyber';
    this.state = {
      coins: parseInt(localStorage.getItem('nc_coins') || '250', 10),
      hints: parseInt(localStorage.getItem('nc_hints') || '5', 10),
      streak: parseInt(localStorage.getItem('nc_streak') || '1', 10),
      lastDailyDate: localStorage.getItem('nc_last_daily_date') || '',
      theme: savedTheme,
      unlockedThemes: (() => { try { return JSON.parse(localStorage.getItem('nc_unlocked_themes') || '["cyber","amoled"]'); } catch { return ['cyber', 'amoled']; } })(),
      progress: (() => { try { return JSON.parse(localStorage.getItem('nc_progress') || '{"crown":{"easy":0,"medium":0,"hard":0,"master":0},"tango":0}'); } catch { return { crown: { easy: 0, medium: 0, hard: 0, master: 0 }, tango: 0 }; } })(),
      quests: (() => { try { return JSON.parse(localStorage.getItem('nc_quests') || '{"crownSolved":0,"tangoSolved":0,"blockPlayed":0,"claimed":[false,false,false]}'); } catch { return { crownSolved: 0, tangoSolved: 0, blockPlayed: 0, claimed: [false, false, false] }; } })(),
      dailyRecord: (() => { try { return JSON.parse(localStorage.getItem('nc_daily_record') || '{}'); } catch { return {}; } })()
    };

    this.todayStr = new Date().toISOString().slice(0, 10);
    if (!this.state.quests || this.state.quests.date !== this.todayStr) {
      this.state.quests = {
        date: this.todayStr,
        crownSolved: 0,
        tangoSolved: 0,
        blockPlayed: 0,
        claimed: [false, false, false]
      };
      localStorage.setItem('nc_quests', JSON.stringify(this.state.quests));
    }
    this.crownEngine = null;
    this.blockEngine = null;
    this.tangoEngine = null;
    this.activeScreen = 'home';
  }

  init() {
    this.applyTheme(this.state.theme);
    this.crownEngine = new window.CrownGameEngine('screen-crown');
    this.blockEngine = new window.BlockBlastEngine('screen-block');
    this.tangoEngine = new window.TangoGameEngine('screen-tango');

    this.bindNavigation();
    this.refreshHeaderWallet();
    window.i18n.applyTranslations();
    this.updateHomeDashboard();
    window.monetization.initialize();
  }

  saveState() {
    localStorage.setItem('nc_coins', String(this.state.coins));
    localStorage.setItem('nc_hints', String(this.state.hints));
    localStorage.setItem('nc_streak', String(this.state.streak));
    localStorage.setItem('nc_last_daily_date', this.state.lastDailyDate);
    localStorage.setItem('nc_theme', this.state.theme);
    localStorage.setItem('nc_unlocked_themes', JSON.stringify(this.state.unlockedThemes));
    localStorage.setItem('nc_progress', JSON.stringify(this.state.progress));
    localStorage.setItem('nc_quests', JSON.stringify(this.state.quests));
    localStorage.setItem('nc_daily_record', JSON.stringify(this.state.dailyRecord));
  }

  addCoins(amount) {
    this.state.coins = Math.max(0, this.state.coins + amount);
    this.saveState();
    this.refreshHeaderWallet();
  }

  addHints(amount) {
    this.state.hints = Math.max(0, this.state.hints + amount);
    this.saveState();
    this.refreshHeaderWallet();
  }

  consumeHint() {
    if (this.state.hints > 0) {
      this.addHints(-1);
      return true;
    }
    this.showOutOfHintsModal();
    return false;
  }

  /**
   * Safe Reset Confirmation Dialog — prevents accidental progress loss
   */
  confirmReset(title = 'Reset This Puzzle?', message = 'Are you sure you want to clear your current moves and start this board fresh?', onConfirm) {
    window.audioEngine.playTap();
    const overlay = document.createElement('div');
    overlay.className = 'sim-ad-overlay';
    overlay.innerHTML = `
      <div class="sim-ad-card">
        <div class="sim-ad-top">
          <span class="sim-ad-badge">CONFIRM RESET</span>
          <button class="modal-close-btn" id="reset-modal-x">✕</button>
        </div>
        <div class="sim-ad-stage">
          <div class="sim-ad-pulse">↻</div>
          <h3>${title}</h3>
          <p>${message}</p>
        </div>
        <div class="sim-ad-actions">
          <button class="btn-secondary" id="reset-cancel-btn">Keep Playing</button>
          <button class="btn-primary btn-danger-confirm" id="reset-confirm-btn">Yes, Reset Board</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#reset-modal-x').addEventListener('click', close);
    overlay.querySelector('#reset-cancel-btn').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    overlay.querySelector('#reset-confirm-btn').addEventListener('click', () => {
      close();
      if (onConfirm) onConfirm();
    });
  }

  showOutOfHintsModal() {
    const hintPackPrice = window.monetization.getPrice('hint_pack_20');
    const overlay = document.createElement('div');
    overlay.className = 'sim-ad-overlay';
    overlay.innerHTML = `
      <div class="sim-ad-card">
        <div class="sim-ad-top">
          <span class="sim-ad-badge">SMART DEDUCTION HINTS</span>
          <span class="sim-ad-timer">${this.state.hints} 💡 Left</span>
        </div>
        <div class="sim-ad-stage">
          <div class="sim-ad-pulse">💡</div>
          <h3>Need a Logical Hint?</h3>
          <p>Watch a 3-second Rewarded Video for <strong>+2 Free Hints</strong>, spend <strong>80 Coins</strong>, or grab the <strong>20-Hint Impulse Pack (${hintPackPrice})</strong>!</p>
        </div>
        <div class="sim-ad-actions">
          <button class="btn-secondary" id="hint-modal-coins" ${this.state.coins < 80 ? 'disabled' : ''}>
            +2 Hints (80 🪙)
          </button>
          <button class="btn-primary" id="hint-modal-ad">🎬 Watch Ad (+2 💡)</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    overlay.querySelector('#hint-modal-coins').addEventListener('click', () => {
      if (this.state.coins >= 80) {
        this.addCoins(-80);
        this.addHints(2);
        window.audioEngine.playCoin();
        this.showToast('+2 Smart Hints Unlocked! 💡');
        overlay.remove();
      }
    });

    overlay.querySelector('#hint-modal-ad').addEventListener('click', () => {
      overlay.remove();
      window.monetization.showRewardedAd('+2 Smart Hints', () => {
        this.addHints(2);
        this.showToast('+2 Free Smart Hints Added! 💡');
      });
    });
  }

  getTierProgress(mode, tier) {
    if (mode === 'crown') {
      return (this.state.progress.crown && this.state.progress.crown[tier]) || 0;
    }
    return this.state.progress.tango || 0;
  }

  refreshHeaderWallet() {
    const coinEl = document.getElementById('wallet-coins');
    const hintEl = document.getElementById('wallet-hints');
    const streakEl = document.getElementById('wallet-streak');
    if (coinEl) coinEl.textContent = String(this.state.coins);
    if (hintEl) hintEl.textContent = String(this.state.hints);
    if (streakEl) streakEl.textContent = String(this.state.streak);

    document.querySelectorAll('.hint-count-inline').forEach(el => {
      el.textContent = String(this.state.hints);
    });
  }

  bindNavigation() {
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-nav');
        window.audioEngine.playTap();
        this.navigateTo(target);
      });
    });

    document.getElementById('btn-open-shop')?.addEventListener('click', () => {
      window.audioEngine.playTap();
      this.openShopModal();
    });

    document.getElementById('btn-open-quests')?.addEventListener('click', () => {
      window.audioEngine.playTap();
      this.openQuestsModal();
    });

    document.getElementById('btn-open-settings')?.addEventListener('click', () => {
      window.audioEngine.playTap();
      this.openSettingsModal();
    });

    document.getElementById('btn-free-coins-ad')?.addEventListener('click', () => {
      window.monetization.showRewardedAd('+150 Neon Coins', () => {
        this.addCoins(150);
        this.showToast('+150 Bonus Coins Claimed! 🪙');
      });
    });

    document.getElementById('btn-start-daily')?.addEventListener('click', () => {
      window.audioEngine.playTap();
      this.startDailyMedley();
    });

    document.getElementById('btn-share-daily')?.addEventListener('click', () => {
      window.audioEngine.playTap();
      this.shareDailyScorecard();
    });
  }

  updateHeaderContext(screenName) {
    const brandHome = document.getElementById('header-brand-home');
    const backBar = document.getElementById('header-back-bar');
    const modeTitle = document.getElementById('header-mode-title');
    if (!brandHome || !backBar) return;

    if (screenName === 'home') {
      brandHome.classList.remove('hidden');
      backBar.classList.add('hidden');
    } else {
      brandHome.classList.add('hidden');
      backBar.classList.remove('hidden');
      const titles = {
        crown: '🐾 Queens',
        block: '🟦 Blocks',
        tango: '☀️ Tango'
      };
      if (modeTitle) modeTitle.textContent = titles[screenName] || 'NekoCrown';
    }
  }

  navigateTo(screenName) {
    if (this.activeScreen === screenName && screenName !== 'home') {
      return;
    }
    if (this.blockEngine && this.blockEngine.floatingEl) {
      this.blockEngine.floatingEl.remove();
      this.blockEngine.floatingEl = null;
    }
    if (this.blockEngine && this.blockEngine._activeDragCleanup) {
      this.blockEngine._activeDragCleanup();
    }
    this.activeScreen = screenName;
    this.updateHeaderContext(screenName);

    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active-screen'));
    document.querySelectorAll('.bottom-nav-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-nav') === screenName);
    });

    const targetEl = document.getElementById(`screen-${screenName}`);
    if (targetEl) targetEl.classList.add('active-screen');

    if (screenName === 'home') {
      if (this.crownEngine) this.crownEngine.stopTimer();
      if (this.tangoEngine) this.tangoEngine.stopTimer();
      this.updateHomeDashboard();
    } else if (screenName === 'crown') {
      if (this.tangoEngine) this.tangoEngine.stopTimer();
      const idx = this.getTierProgress('crown', this.crownEngine.tier);
      if (
        this.crownEngine.levelData &&
        !this.crownEngine.isDailyMode &&
        !this.crownEngine.isSolved &&
        this.crownEngine.levelIndex === idx &&
        document.getElementById('crown-grid-el')
      ) {
        this.crownEngine.resumeTimer();
        this.crownEngine.refreshGridUI();
      } else {
        this.crownEngine.loadLevel(this.crownEngine.tier, idx, null, false);
      }
    } else if (screenName === 'block') {
      if (this.crownEngine) this.crownEngine.stopTimer();
      if (this.tangoEngine) this.tangoEngine.stopTimer();
      this.state.quests.blockPlayed += 1;
      this.saveState();
      if (this.blockEngine.grid.length === 0) {
        this.blockEngine.startNewGame(false);
      } else {
        this.blockEngine.render();
      }
    } else if (screenName === 'tango') {
      if (this.crownEngine) this.crownEngine.stopTimer();
      const idx = this.getTierProgress('tango');
      if (
        this.tangoEngine.levelData &&
        !this.tangoEngine.isDailyMode &&
        !this.tangoEngine.isSolved &&
        this.tangoEngine.levelIndex === idx &&
        document.getElementById('tango-grid-el')
      ) {
        this.tangoEngine.resumeTimer();
        this.tangoEngine.refreshGridUI();
      } else {
        this.tangoEngine.loadLevel(idx, null, false);
      }
    }
  }

  updateHomeDashboard() {
    const dateBadge = document.getElementById('daily-date-badge');
    if (dateBadge) dateBadge.textContent = `📅 ${this.todayStr}`;

    const isDoneToday = Boolean(this.state.dailyRecord[this.todayStr]);
    const startBtn = document.getElementById('btn-start-daily');
    const shareBtn = document.getElementById('btn-share-daily');
    const statusText = document.getElementById('daily-status-text');

    if (isDoneToday) {
      const rec = this.state.dailyRecord[this.todayStr];
      if (statusText) {
        statusText.innerHTML = `✅ <strong>Completed Today!</strong> Neko Queens: ${rec.crownTime}s • Tango: ${rec.tangoTime}s • Block: ${rec.blockScore} pts`;
      }
      if (startBtn) startBtn.textContent = '↻ Replay Daily Medley';
      if (shareBtn) shareBtn.classList.remove('hidden');
    } else {
      if (statusText) {
        statusText.textContent = '3 Quick Stages: Neko Queens 6×6 → Tango 6×6 → Block 350 pts. Win +200 🪙 & +2 💡!';
      }
      if (startBtn) startBtn.textContent = `▶ ${window.i18n.t('playDaily')}`;
      if (shareBtn) shareBtn.classList.add('hidden');
    }

    const crownSolvedTotal = Object.values(this.state.progress.crown || {}).reduce((a, b) => a + b, 0);
    const crownProgEl = document.getElementById('home-crown-prog');
    if (crownProgEl) crownProgEl.textContent = `Level ${crownSolvedTotal + 1}`;

    const tangoProgEl = document.getElementById('home-tango-prog');
    if (tangoProgEl) tangoProgEl.textContent = `Level ${(this.state.progress.tango || 0) + 1}`;

    const blockProgEl = document.getElementById('home-block-prog');
    if (blockProgEl) blockProgEl.textContent = `🏆 ${localStorage.getItem('nc_block_best') || 0}`;

    window.monetization.updateBannerVisibility();
  }

  getDateHashSeed() {
    let hash = 0;
    for (let i = 0; i < this.todayStr.length; i++) {
      hash = (hash * 31 + this.todayStr.charCodeAt(i)) % 100000;
    }
    return hash;
  }

  startDailyMedley() {
    if (!window.NEON_CROWN_LEVELS || !window.NEON_CROWN_LEVELS.crown || !window.NEON_CROWN_LEVELS.tango) {
      this.showToast('⚠️ Level data not loaded yet. Please try again.');
      return;
    }
    const seed = this.getDateHashSeed();
    const crownList = window.NEON_CROWN_LEVELS.crown.easy;
    const tangoList = window.NEON_CROWN_LEVELS.tango;

    if (!crownList || crownList.length === 0 || !tangoList || tangoList.length === 0) {
      this.showToast('⚠️ No levels available for daily medley.');
      return;
    }

    const dailyCrown = crownList[seed % crownList.length];
    const dailyTango = tangoList[seed % tangoList.length];

    this.activeScreen = 'crown';
    this.updateHeaderContext('crown');
    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active-screen'));
    document.getElementById('screen-crown').classList.add('active-screen');

    this.crownEngine.loadLevel('easy', 0, dailyCrown, true, (crownRes) => {
      this.showToast('✅ Stage 1/3 Complete! Next: Binary Tango ☀️🌙');
      this.updateHeaderContext('tango');
      document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active-screen'));
      document.getElementById('screen-tango').classList.add('active-screen');

      this.tangoEngine.loadLevel(0, dailyTango, true, (tangoRes) => {
        this.showToast('✅ Stage 2/3 Complete! Final Stage: Score 350 in Block Blitz 🟦');
        this.updateHeaderContext('block');
        document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active-screen'));
        document.getElementById('screen-block').classList.add('active-screen');

        this.blockEngine.startNewGame(true, 350, (blockRes) => {
          this.completeDailyMedley({
            crownTime: crownRes.timeSec,
            crownHints: crownRes.hintsUsed,
            tangoTime: tangoRes.timeSec,
            tangoHints: tangoRes.hintsUsed,
            blockScore: blockRes.score
          });
        });
      });
    });
  }

  completeDailyMedley(stats) {
    if (this.state.lastDailyDate !== this.todayStr) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (this.state.lastDailyDate === yesterday) {
        this.state.streak += 1;
      } else {
        this.state.streak = 1;
      }
      this.state.lastDailyDate = this.todayStr;
      this.addCoins(200);
      this.addHints(2);
    }
    this.state.dailyRecord[this.todayStr] = stats;
    this.saveState();
    this.navigateTo('home');
    this.showDailyVictoryModal(stats);
  }

  buildEmojiScorecardText(stats) {
    const rec = stats || this.state.dailyRecord[this.todayStr] || {
      crownTime: 42,
      crownHints: 0,
      tangoTime: 38,
      blockScore: 410
    };
    return [
      `🐾👑 NEKOCROWN DAILY #${this.todayStr}`,
      `🐾 Neko Queens: ${rec.crownTime}s (${rec.crownHints === 0 ? 'No Hints ✨' : `${rec.crownHints}💡`})`,
      `☀️ Binary Tango: ${rec.tangoTime}s`,
      `🟦 Block Blitz: ${rec.blockScore} pts`,
      `🔥 Daily Streak: ${this.state.streak} Days`,
      `Play NekoCrown free offline on Google Play!`
    ].join('\n');
  }

  async shareDailyScorecard(stats) {
    const text = this.buildEmojiScorecardText(stats);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'NekoCrown Daily Challenge', text });
        return;
      }
    } catch (_) {}

    try {
      await navigator.clipboard.writeText(text);
      this.showToast(window.i18n.t('copiedShare'));
    } catch (_) {
      this.showToast('Scorecard ready!');
    }
  }

  showDailyVictoryModal(stats) {
    const cardText = this.buildEmojiScorecardText(stats);
    const overlay = document.createElement('div');
    overlay.className = 'sim-ad-overlay';
    overlay.innerHTML = `
      <div class="sim-ad-card">
        <div class="sim-ad-top">
          <span class="sim-ad-badge">🌍 DAILY MEDLEY COMPLETE!</span>
          <span class="sim-ad-timer">🔥 ${this.state.streak} Day Streak</span>
        </div>
        <div class="sim-ad-stage">
          <div class="sim-ad-pulse">🏆</div>
          <h3>+200 Coins & +2 Hints Earned!</h3>
          <pre class="emoji-share-preview">${cardText}</pre>
        </div>
        <div class="sim-ad-actions">
          <button class="btn-secondary" id="daily-win-close">Close</button>
          <button class="btn-primary" id="daily-win-share">📤 Share Emoji Scorecard</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#daily-win-close').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#daily-win-share').addEventListener('click', () => {
      this.shareDailyScorecard(stats);
    });
  }

  onPuzzleSolved({ mode, tier, levelNumber, timeSec, hintsUsed, emojiGrid }) {
    const coinReward = hintsUsed === 0 ? 45 : 25;
    this.addCoins(coinReward);

    if (mode === 'crown') {
      this.state.progress.crown[tier] = (this.state.progress.crown[tier] || 0) + 1;
      this.state.quests.crownSolved += 1;
    } else if (mode === 'tango') {
      this.state.progress.tango = (this.state.progress.tango || 0) + 1;
      this.state.quests.tangoSolved += 1;
    }
    this.saveState();

    const m = String(Math.floor(timeSec / 60)).padStart(2, '0');
    const s = String(timeSec % 60).padStart(2, '0');

    const shareBlockHtml = emojiGrid
      ? `<pre class="emoji-share-preview" style="text-align:center; font-size:15px; line-height:1.35; letter-spacing:2px;">Queens #${levelNumber} (${m}:${s})\n${emojiGrid}</pre>`
      : '';

    const overlay = document.createElement('div');
    overlay.className = 'sim-ad-overlay';
    overlay.innerHTML = `
      <div class="sim-ad-card">
        <div class="sim-ad-top">
          <span class="sim-ad-badge">${window.i18n.t('levelComplete')}</span>
          <span class="sim-ad-timer">⏱️ ${m}:${s}</span>
        </div>
        <div class="sim-ad-stage">
          <div class="sim-ad-pulse">👑</div>
          <h3>Puzzle #${levelNumber} Solved!</h3>
          <p>Reward: <strong>+${coinReward} Neon Coins 🪙</strong> ${hintsUsed === 0 ? '• Flawless No-Hint Solve!' : ''}</p>
          ${shareBlockHtml}
        </div>
        <div class="sim-ad-actions">
          ${emojiGrid ? `<button class="btn-secondary" id="win-share-grid">📤 Share Grid</button>` : ''}
          <button class="btn-secondary" id="win-double-ad">🎬 2x (+${coinReward} 🪙)</button>
          <button class="btn-primary" id="win-next-lvl">${window.i18n.t('nextLevel')} →</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#win-share-grid')?.addEventListener('click', async () => {
      const shareText = `🐾👑 Neko Queens #${levelNumber} (${tier.toUpperCase()}) — Solved in ${m}:${s}!\n${emojiGrid}\nPlay NekoCrown free on Google Play!`;
      try {
        await navigator.clipboard.writeText(shareText);
        this.showToast('Neko Queens emoji board copied to clipboard! 📋');
      } catch (_) {}
    });

    const advanceToNext = () => {
      window.monetization.maybeShowInterstitialAfterLevel(() => {
        if (mode === 'crown') {
          const nextIdx = this.getTierProgress('crown', tier);
          this.crownEngine.loadLevel(tier, nextIdx);
        } else if (mode === 'tango') {
          const nextIdx = this.getTierProgress('tango');
          this.tangoEngine.loadLevel(nextIdx);
        }
        this.maybePromptInAppReview();
      });
    };

    overlay.querySelector('#win-double-ad').addEventListener('click', () => {
      overlay.remove();
      window.monetization.showRewardedAd(`Double Level Reward (+${coinReward} Coins)`, () => {
        this.addCoins(coinReward);
        this.showToast(`Doubled! +${coinReward} Extra Coins 🪙`);
        advanceToNext();
      });
    });

    overlay.querySelector('#win-next-lvl').addEventListener('click', () => {
      overlay.remove();
      advanceToNext();
    });
  }

  maybePromptInAppReview() {
    const totalSolved = parseInt(localStorage.getItem('nc_total_solved') || '0', 10);
    const alreadyReviewed = localStorage.getItem('nc_reviewed') === 'true';
    if (totalSolved === 5 && !alreadyReviewed) {
      localStorage.setItem('nc_reviewed', 'true');
      const overlay = document.createElement('div');
      overlay.className = 'sim-ad-overlay';
      overlay.innerHTML = `
        <div class="sim-ad-card">
          <div class="sim-ad-top">
            <span class="sim-ad-badge">ENJOYING NEKOCROWN?</span>
            <span class="sim-ad-timer">⭐⭐⭐⭐⭐</span>
          </div>
          <div class="sim-ad-stage">
            <div class="sim-ad-pulse">💛</div>
            <h3>Rate Us on Google Play!</h3>
            <p>Your 5-star review helps our indie puzzle game reach more players—and we'll gift you <strong>+100 Free Coins</strong> as a thank-you!</p>
          </div>
          <div class="sim-ad-actions">
            <button class="btn-secondary" id="rate-later">Later</button>
            <button class="btn-primary" id="rate-now">⭐⭐⭐⭐⭐ Rate (+100 🪙)</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('#rate-later').addEventListener('click', () => overlay.remove());
      overlay.querySelector('#rate-now').addEventListener('click', () => {
        overlay.remove();
        this.addCoins(100);
        window.audioEngine.playCoin();
        this.showToast('Thank you for your 5-star support! +100 Coins 🪙');
      });
    }
  }

  openShopModal() {
    const products = window.monetization.getLocalizedProducts();
    const curTier = window.monetization.getCurrencyTier();

    const overlay = document.createElement('div');
    overlay.className = 'sim-ad-overlay';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-sheet-header">
          <div>
            <h3>💎 VIP Store &amp; Board Themes</h3>
            <span class="store-region-tag">${curTier.label} • Instant Unlock</span>
          </div>
          <button class="modal-close-btn" id="shop-close">✕</button>
        </div>
        <div class="modal-sheet-body">
          <div class="currency-Segment">
            ${Object.values(window.CURRENCY_TIERS).map(c => `
              <button class="curr-pill ${window.monetization.currency === c.code ? 'active' : ''}" data-curr="${c.code}">
                ${c.label}
              </button>
            `).join('')}
          </div>

          <div class="iap-grid">
            ${Object.values(products).map(p => `
              <div class="iap-card ${p.badge ? 'iap-featured' : ''}">
                ${p.badge ? `<span class="iap-ribbon">${p.badge}</span>` : ''}
                <div class="iap-icon-bubble">${p.icon}</div>
                <div class="iap-info">
                  <h4>${p.title}</h4>
                  <p>${p.desc}</p>
                </div>
                <button class="btn-primary iap-buy-btn" data-sku="${p.id}">
                  ${p.strikePrice ? `<span class="strike-price">${p.strikePrice}</span> ` : ''}
                  ${(p.id === 'remove_ads_forever' && window.monetization.adsRemoved) ? 'Owned ✓' : p.price}
                </button>
              </div>
            `).join('')}
          </div>

          <h4 class="section-subhead">🎨 Unlockable Visual Themes (Spend Coins)</h4>
          <div class="theme-grid">
            ${Object.values(THEMES).map(th => {
              const unlocked = this.state.unlockedThemes.includes(th.id);
              const active = this.state.theme === th.id;
              return `
                <div class="theme-card ${active ? 'active-theme' : ''}">
                  <div class="theme-swatch" style="background: ${th.preview};"></div>
                  <div class="theme-meta">
                    <strong>${th.name}</strong>
                    <span>${unlocked ? (active ? 'Equipped ✓' : 'Unlocked') : `${th.price} 🪙`}</span>
                  </div>
                  <button class="btn-secondary theme-select-btn" data-theme="${th.id}">
                    ${active ? 'Active' : unlocked ? 'Equip' : `${th.price} 🪙`}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#shop-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    overlay.querySelectorAll('.curr-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-curr');
        window.monetization.setCurrency(code);
        window.audioEngine.playTap();
        overlay.remove();
        this.openShopModal();
      });
    });

    overlay.querySelectorAll('.iap-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.getAttribute('data-sku');
        overlay.remove();
        window.monetization.purchaseProduct(sku, () => {
          this.openShopModal();
        });
      });
    });

    overlay.querySelectorAll('.theme-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const thId = btn.getAttribute('data-theme');
        const th = THEMES[thId];
        if (this.state.unlockedThemes.includes(thId)) {
          this.applyTheme(thId);
          window.audioEngine.playTap();
          overlay.remove();
          this.openShopModal();
        } else if (this.state.coins >= th.price) {
          this.addCoins(-th.price);
          this.unlockTheme(thId);
          this.applyTheme(thId);
          window.audioEngine.playCoin();
          this.showToast(`Unlocked & Equipped ${th.name}! 🎨`);
          overlay.remove();
          this.openShopModal();
        } else {
          window.audioEngine.playError();
          this.showToast(`Need ${th.price - this.state.coins} more Coins! Watch a free ad or solve puzzles.`);
        }
      });
    });
  }

  unlockTheme(themeId) {
    if (!this.state.unlockedThemes.includes(themeId)) {
      this.state.unlockedThemes.push(themeId);
      this.saveState();
    }
  }

  applyTheme(themeId) {
    this.state.theme = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    this.saveState();
  }

  openQuestsModal() {
    const q = this.state.quests;
    const questItems = [
      { idx: 0, title: 'Solve 2 Neko Queens Puzzles', cur: q.crownSolved, target: 2, rewardCoins: 100, rewardHints: 1 },
      { idx: 1, title: 'Solve 1 Binary Tango Grid', cur: q.tangoSolved, target: 1, rewardCoins: 80, rewardHints: 1 },
      { idx: 2, title: 'Play Neon Block Blast', cur: q.blockPlayed, target: 1, rewardCoins: 60, rewardHints: 0 }
    ];

    const overlay = document.createElement('div');
    overlay.className = 'sim-ad-overlay';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-sheet-header">
          <h3>🎯 Daily Quests &amp; Rewards</h3>
          <button class="modal-close-btn" id="quests-close">✕</button>
        </div>
        <div class="modal-sheet-body">
          ${questItems.map(item => {
            const done = item.cur >= item.target;
            const claimed = q.claimed[item.idx];
            return `
              <div class="quest-row">
                <div class="quest-info">
                  <h4>${item.title}</h4>
                  <p>Progress: ${Math.min(item.cur, item.target)} / ${item.target} • Reward: +${item.rewardCoins} 🪙 ${item.rewardHints ? `+${item.rewardHints} 💡` : ''}</p>
                </div>
                <button class="btn-primary quest-claim-btn" data-qidx="${item.idx}" ${(!done || claimed) ? 'disabled' : ''}>
                  ${claimed ? 'Claimed ✓' : done ? 'Claim 🎁' : `${Math.min(item.cur, item.target)}/${item.target}`}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#quests-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    overlay.querySelectorAll('.quest-claim-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-qidx'), 10);
        const item = questItems[idx];
        if (item && !this.state.quests.claimed[idx] && item.cur >= item.target) {
          this.state.quests.claimed[idx] = true;
          this.addCoins(item.rewardCoins);
          this.addHints(item.rewardHints);
          window.audioEngine.playWinFanfare();
          this.showToast(`Quest Reward Claimed! +${item.rewardCoins} 🪙`);
          overlay.remove();
          this.openQuestsModal();
        }
      });
    });
  }

  openSettingsModal() {
    const stats = window.monetization.adStats;
    const langs = [
      { code: 'en', label: '🇮🇳/🇺🇸 English' },
      { code: 'hi', label: '🇮🇳 हिन्दी (Hindi)' },
      { code: 'es', label: '🇪🇸 Español' },
      { code: 'pt', label: '🇧🇷 Português' },
      { code: 'de', label: '🇩🇪 Deutsch' },
      { code: 'fr', label: '🇫🇷 Français' },
      { code: 'ja', label: '🇯🇵 日本語' },
      { code: 'ko', label: '🇰🇷 한국어' },
      { code: 'id', label: '🇮🇩 Indonesia' },
      { code: 'tr', label: '🇹🇷 Türkçe' }
    ];

    const overlay = document.createElement('div');
    overlay.className = 'sim-ad-overlay';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-sheet-header">
          <h3>⚙️ Settings, Region &amp; Telemetry</h3>
          <button class="modal-close-btn" id="settings-close">✕</button>
        </div>
        <div class="modal-sheet-body">
          <div class="setting-row">
            <span>🔊 Synthesized Sound Effects</span>
            <button class="btn-secondary" id="toggle-sound-btn">${window.audioEngine.soundEnabled ? 'ON' : 'OFF'}</button>
          </div>
          <div class="setting-row">
            <span>📳 Haptic Vibration</span>
            <button class="btn-secondary" id="toggle-haptic-btn">${window.audioEngine.hapticsEnabled ? 'ON' : 'OFF'}</button>
          </div>
          <div class="setting-row">
            <span>💱 Store Currency (PPP)</span>
            <select id="curr-select" class="lang-dropdown">
              ${Object.values(window.CURRENCY_TIERS).map(c => `<option value="${c.code}" ${window.monetization.currency === c.code ? 'selected' : ''}>${c.label}</option>`).join('')}
            </select>
          </div>
          <div class="setting-row">
            <span>🌍 App Language (10 Locales)</span>
            <select id="lang-select" class="lang-dropdown">
              ${langs.map(l => `<option value="${l.code}" ${window.i18n.lang === l.code ? 'selected' : ''}>${l.label}</option>`).join('')}
            </select>
          </div>

          <h4 class="section-subhead">📊 Monetization &amp; Player Telemetry</h4>
          <div class="telemetry-box">
            <div>Total Puzzles Solved: <strong>${window.monetization.totalLevelsCompleted}</strong></div>
            <div>Rewarded Ads Watched: <strong>${stats.rewarded}</strong></div>
            <div>Interstitials Served: <strong>${stats.interstitial}</strong></div>
            <div>IAP Purchases Completed: <strong>${stats.iapCount}</strong></div>
            <div>Ad-Free VIP Status: <strong>${window.monetization.adsRemoved ? 'ACTIVE 👑' : 'Free Tier'}</strong></div>
          </div>

          <div class="legal-links">
            <a href="privacy-policy.html" target="_blank">Privacy Policy (GDPR/DPDP)</a> •
            <a href="app-ads.txt" target="_blank">View app-ads.txt</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#settings-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    overlay.querySelector('#toggle-sound-btn').addEventListener('click', (e) => {
      window.audioEngine.soundEnabled = !window.audioEngine.soundEnabled;
      localStorage.setItem('nc_sound', String(window.audioEngine.soundEnabled));
      e.target.textContent = window.audioEngine.soundEnabled ? 'ON' : 'OFF';
      window.audioEngine.playTap();
    });

    overlay.querySelector('#toggle-haptic-btn').addEventListener('click', (e) => {
      window.audioEngine.hapticsEnabled = !window.audioEngine.hapticsEnabled;
      localStorage.setItem('nc_haptics', String(window.audioEngine.hapticsEnabled));
      e.target.textContent = window.audioEngine.hapticsEnabled ? 'ON' : 'OFF';
    });

    overlay.querySelector('#curr-select').addEventListener('change', (e) => {
      window.monetization.setCurrency(e.target.value);
      this.showToast(`Store currency set to ${e.target.value}!`);
    });

    overlay.querySelector('#lang-select').addEventListener('change', (e) => {
      window.i18n.setLanguage(e.target.value);
      this.updateHomeDashboard();
      this.showToast(`Language updated!`);
    });
  }

  showToast(message) {
    let toast = document.getElementById('nc-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'nc-toast';
      toast.className = 'nc-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2600);
  }
}

window.NeonCrownApp = NeonCrownApp;

document.addEventListener('DOMContentLoaded', () => {
  window.app = new NeonCrownApp();
  window.app.init();
});
