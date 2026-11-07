/**
 * Procedural WebAudio Synthesizer & Haptic Feedback Engine
 * 100% Code-Generated Audio — Zero Copyright Risk, Zero External MP3 Bloat
 */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = localStorage.getItem('nc_sound') !== 'false';
    this.hapticsEnabled = localStorage.getItem('nc_haptics') !== 'false';
    this.comboNotes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  vibrate(pattern = 12) {
    if (!this.hapticsEnabled) return;
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' }).catch(() => {});
      } else if (navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (_) {}
  }

  playTone(freq, duration = 0.09, type = 'sine', volume = 0.16, slideTo = null, delay = 0) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  playTap() {
    this.vibrate(8);
    this.playTone(440, 0.055, 'triangle', 0.12, 580);
  }

  playMarkX() {
    this.vibrate(6);
    this.playTone(310, 0.045, 'sine', 0.09, 260);
  }

  playCrownPlace() {
    this.vibrate([12, 25, 18]);
    this.playTone(523.25, 0.14, 'triangle', 0.18, 659.25, 0);
    this.playTone(783.99, 0.18, 'sine', 0.15, 1046.5, 0.045);
  }

  playSunPlace() {
    this.vibrate(10);
    this.playTone(659.25, 0.11, 'sine', 0.14, 880);
  }

  playMoonPlace() {
    this.vibrate(10);
    this.playTone(493.88, 0.11, 'triangle', 0.14, 587.33);
  }

  playBlockPickup() {
    this.vibrate(8);
    this.playTone(280, 0.06, 'sine', 0.14, 420);
  }

  playBlockDrop() {
    this.vibrate(14);
    this.playTone(220, 0.08, 'triangle', 0.18, 150);
  }

  playLineClear(comboCount = 1) {
    this.vibrate([18, 30, 28]);
    const idx = Math.min(comboCount - 1, this.comboNotes.length - 1);
    const root = this.comboNotes[idx];
    this.playTone(root, 0.18, 'triangle', 0.2, root * 1.25, 0);
    this.playTone(root * 1.25, 0.22, 'sine', 0.18, root * 1.5, 0.06);
    this.playTone(root * 1.5, 0.28, 'sine', 0.16, root * 2.0, 0.12);
  }

  playError() {
    this.vibrate([30, 40, 30]);
    this.playTone(185, 0.14, 'sawtooth', 0.12, 140, 0);
    this.playTone(155, 0.18, 'sawtooth', 0.12, 120, 0.09);
  }

  playHint() {
    this.vibrate([10, 20, 15]);
    this.playTone(587.33, 0.12, 'sine', 0.15, 880, 0);
    this.playTone(880, 0.22, 'triangle', 0.15, 1174.66, 0.08);
  }

  playCoin() {
    this.vibrate(12);
    this.playTone(987.77, 0.08, 'sine', 0.16, 1318.51, 0);
    this.playTone(1318.51, 0.22, 'sine', 0.16, null, 0.07);
  }

  playWinFanfare() {
    this.vibrate([20, 40, 20, 40, 50]);
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((n, i) => {
      this.playTone(n, 0.24, 'triangle', 0.2, null, i * 0.085);
    });
    this.playTone(1318.51, 0.45, 'sine', 0.18, 1567.98, 0.34);
  }
}

window.audioEngine = new AudioEngine();
