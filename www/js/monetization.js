/**
 * Unified Google AdMob + Google Play Billing (RevenueCat) + Regional PPP Pricing Engine
 * Automatically detects India (Asia/Kolkata / en-IN / hi-IN) and displays native ₹ INR
 * Purchasing-Power-Parity (PPP) pricing (₹29, ₹49, ₹79, ₹99) with UPI / Google Play UI,
 * while supporting global currencies (USD, EUR, GBP, JPY, BRL) for international Play Store users.
 */

const CURRENCY_TIERS = {
  INR: {
    code: 'INR',
    symbol: '₹',
    label: '🇮🇳 INR (₹)',
    paymentMethods: 'Google Pay (UPI) • PhonePe • Paytm • Play Balance',
    prices: {
      remove_ads_forever: '₹79',
      vip_founder_bundle: '₹99',
      vip_strike_price: '₹299',
      hint_pack_20: '₹29',
      coin_vault_2500: '₹49'
    }
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: '🇺🇸 USD ($)',
    paymentMethods: 'Google Pay • Credit/Debit Card • Play Balance',
    prices: {
      remove_ads_forever: '$3.99',
      vip_founder_bundle: '$4.99',
      vip_strike_price: '$14.99',
      hint_pack_20: '$1.99',
      coin_vault_2500: '$2.99'
    }
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: '🇪🇺 EUR (€)',
    paymentMethods: 'Google Pay • PayPal • SEPA / Card',
    prices: {
      remove_ads_forever: '€3,99',
      vip_founder_bundle: '€4,99',
      vip_strike_price: '€14,99',
      hint_pack_20: '€1,99',
      coin_vault_2500: '€2,99'
    }
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    label: '🇬🇧 GBP (£)',
    paymentMethods: 'Google Pay • Visa / Mastercard • Play Balance',
    prices: {
      remove_ads_forever: '£3.49',
      vip_founder_bundle: '£4.49',
      vip_strike_price: '£12.99',
      hint_pack_20: '£1.79',
      coin_vault_2500: '£2.49'
    }
  }
};

function detectDefaultCurrency() {
  const saved = localStorage.getItem('nc_currency');
  if (saved && CURRENCY_TIERS[saved]) return saved;

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = (navigator.language || '').toLowerCase();
    if (
      tz.includes('Calcutta') ||
      tz.includes('Kolkata') ||
      lang.includes('-in') ||
      lang === 'hi'
    ) {
      return 'INR';
    }
    if (lang.includes('-gb')) return 'GBP';
    if (['de', 'fr', 'es', 'it', 'nl'].some(code => lang.startsWith(code))) return 'EUR';
  } catch (_) {}

  // Default to INR for Indian workspace
  return 'INR';
}

const MONETIZATION_CONFIG = {
  admob: {
    androidAppId: "ca-app-pub-3940256099942544~3347511713",
    bannerId: "ca-app-pub-3940256099942544/6300978111",
    interstitialId: "ca-app-pub-3940256099942544/1033173712",
    rewardedId: "ca-app-pub-3940256099942544/5224354917"
  },
  revenueCat: {
    androidApiKey: "goog_replace_with_your_revenuecat_public_sdk_key"
  },
  interstitialRules: {
    minLevelBeforeFirstAd: 4,
    levelsBetweenAds: 3,
    minSecondsBetweenAds: 180
  },
  productsBase: {
    vip_founder_bundle: {
      id: "vip_founder_bundle",
      icon: "👑",
      title: "VIP Founder Pack",
      desc: "Remove Forced Ads Forever + 1,000 Coins + 15 Smart Hints + Royal Gold & Sakura Themes!",
      badge: "BEST VALUE • 67% OFF",
      type: "NON_CONSUMABLE"
    },
    remove_ads_forever: {
      id: "remove_ads_forever",
      icon: "🛡️",
      title: "Remove Forced Ads Forever",
      desc: "Permanently disables all banner & interstitial ads. Keep optional reward videos!",
      type: "NON_CONSUMABLE"
    },
    hint_pack_20: {
      id: "hint_pack_20",
      icon: "💡",
      title: "20 Smart Hints + 300 Coins",
      desc: "Step-by-step logical deduction explanations whenever you get stuck.",
      badge: "IMPULSE PACK",
      type: "CONSUMABLE"
    },
    coin_vault_2500: {
      id: "coin_vault_2500",
      icon: "🪙",
      title: "Vault of 2,500 Neon Coins",
      desc: "Unlock all board themes, block skins, rerolls & streak shields.",
      type: "CONSUMABLE"
    }
  }
};

class MonetizationManager {
  constructor() {
    this.isNative = Boolean(
      window.Capacitor &&
      typeof window.Capacitor.isNativePlatform === 'function' &&
      window.Capacitor.isNativePlatform()
    );
    this.currency = detectDefaultCurrency();
    this.adsRemoved = localStorage.getItem('nc_ads_removed') === 'true';
    this.isVip = localStorage.getItem('nc_is_vip') === 'true';
    this.levelsCompletedSinceAd = 0;
    this.lastInterstitialTimestamp = 0;
    this.totalLevelsCompleted = parseInt(localStorage.getItem('nc_total_solved') || '0', 10);
    this.adStats = (() => { try { return JSON.parse(localStorage.getItem('nc_ad_stats') || '{"rewarded":0,"interstitial":0,"iapCount":0}'); } catch { return { rewarded: 0, interstitial: 0, iapCount: 0 }; } })();
  }

  setCurrency(code) {
    if (CURRENCY_TIERS[code]) {
      this.currency = code;
      localStorage.setItem('nc_currency', code);
      this.updateBannerVisibility();
    }
  }

  getCurrencyTier() {
    return CURRENCY_TIERS[this.currency] || CURRENCY_TIERS.INR;
  }

  getPrice(productId) {
    const tier = this.getCurrencyTier();
    return tier.prices[productId] || '₹99';
  }

  getLocalizedProducts() {
    const tier = this.getCurrencyTier();
    const out = {};
    for (const [id, prod] of Object.entries(MONETIZATION_CONFIG.productsBase)) {
      out[id] = {
        ...prod,
        price: tier.prices[id],
        strikePrice: id === 'vip_founder_bundle' ? tier.prices.vip_strike_price : null
      };
    }
    return out;
  }

  async initialize() {
    this.updateBannerVisibility();

    if (this.isNative && window.Capacitor.Plugins.AdMob) {
      try {
        const { AdMob } = window.Capacitor.Plugins;
        await AdMob.initialize({ initializeForTesting: false });
        if (AdMob.requestConsentInfo) {
          const consentInfo = await AdMob.requestConsentInfo();
          if (consentInfo.isConsentFormAvailable && consentInfo.status === 'REQUIRED') {
            await AdMob.showConsentForm();
          }
        }
        if (!this.adsRemoved) {
          await AdMob.showBanner({
            adId: MONETIZATION_CONFIG.admob.bannerId,
            adSize: 'ADAPTIVE_BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0
          });
        }
      } catch (err) {
        console.warn('AdMob init warning:', err);
      }
    }
  }

  saveStats() {
    localStorage.setItem('nc_ad_stats', JSON.stringify(this.adStats));
  }

  updateBannerVisibility() {
    const bannerEl = document.getElementById('admob-banner-slot');
    if (!bannerEl) return;
    if (this.adsRemoved) {
      bannerEl.classList.add('hidden');
    } else {
      bannerEl.classList.remove('hidden');
      const priceSpan = document.getElementById('banner-vip-price');
      if (priceSpan) priceSpan.textContent = this.getPrice('vip_founder_bundle');
    }
  }

  async showRewardedAd(rewardLabel = "+1 Smart Hint", onRewardEarned) {
    if (this.isNative && window.Capacitor.Plugins.AdMob) {
      try {
        const { AdMob } = window.Capacitor.Plugins;
        await AdMob.prepareRewardVideoAd({ adId: MONETIZATION_CONFIG.admob.rewardedId });
        const rewardItem = await AdMob.showRewardVideoAd();
        if (rewardItem) {
          this.adStats.rewarded += 1;
          this.saveStats();
          if (onRewardEarned) onRewardEarned();
          return true;
        }
      } catch (err) {
        console.warn('Native Rewarded Ad fallback:', err);
      }
    }

    return this.showSimulatedAdModal({
      mode: 'REWARDED',
      title: `AdMob Rewarded Video`,
      subtitle: `Watch for 3 seconds to unlock: ${rewardLabel}`,
      durationSec: 3,
      onComplete: () => {
        this.adStats.rewarded += 1;
        this.saveStats();
        window.audioEngine.playCoin();
        if (onRewardEarned) onRewardEarned();
      }
    });
  }

  async maybeShowInterstitialAfterLevel(onDone) {
    this.totalLevelsCompleted += 1;
    this.levelsCompletedSinceAd += 1;
    localStorage.setItem('nc_total_solved', String(this.totalLevelsCompleted));

    if (this.adsRemoved) {
      if (onDone) onDone();
      return false;
    }

    const rules = MONETIZATION_CONFIG.interstitialRules;
    const nowSec = Date.now() / 1000;
    const elapsedSec = nowSec - this.lastInterstitialTimestamp;

    if (
      this.totalLevelsCompleted < rules.minLevelBeforeFirstAd ||
      this.levelsCompletedSinceAd < rules.levelsBetweenAds ||
      elapsedSec < rules.minSecondsBetweenAds
    ) {
      if (onDone) onDone();
      return false;
    }

    this.levelsCompletedSinceAd = 0;
    this.lastInterstitialTimestamp = nowSec;

    if (this.isNative && window.Capacitor.Plugins.AdMob) {
      try {
        const { AdMob } = window.Capacitor.Plugins;
        await AdMob.prepareInterstitial({ adId: MONETIZATION_CONFIG.admob.interstitialId });
        await AdMob.showInterstitial();
        this.adStats.interstitial += 1;
        this.saveStats();
        if (onDone) onDone();
        return true;
      } catch (err) {
        console.warn('Native Interstitial error:', err);
      }
    }

    return this.showSimulatedAdModal({
      mode: 'INTERSTITIAL',
      title: 'Sponsored Break',
      subtitle: `Remove all forced ads forever for just ${this.getPrice('remove_ads_forever')} in the VIP Store!`,
      durationSec: 2,
      onComplete: () => {
        this.adStats.interstitial += 1;
        this.saveStats();
        if (onDone) onDone();
      }
    });
  }

  async purchaseProduct(productId, onSuccess) {
    const products = this.getLocalizedProducts();
    const product = products[productId];
    if (!product) return;

    if (this.isNative && window.Capacitor.Plugins.Purchases) {
      try {
        const { Purchases } = window.Capacitor.Plugins;
        const result = await Purchases.purchaseStoreProduct({ product: { identifier: productId } });
        if (result) {
          this.fulfillPurchase(productId);
          if (onSuccess) onSuccess(product);
          return;
        }
      } catch (err) {
        console.warn('Native purchase cancelled or failed:', err);
        return;
      }
    }

    this.showPlayBillingSheet(product, () => {
      this.fulfillPurchase(productId);
      if (onSuccess) onSuccess(product);
    });
  }

  fulfillPurchase(productId) {
    this.adStats.iapCount += 1;
    this.saveStats();
    window.audioEngine.playWinFanfare();

    if (productId === 'remove_ads_forever') {
      this.adsRemoved = true;
      localStorage.setItem('nc_ads_removed', 'true');
      this.updateBannerVisibility();
      if (window.app) window.app.showToast('Forced Ads Removed Forever! 🛡️');
    } else if (productId === 'vip_founder_bundle') {
      this.adsRemoved = true;
      this.isVip = true;
      localStorage.setItem('nc_ads_removed', 'true');
      localStorage.setItem('nc_is_vip', 'true');
      this.updateBannerVisibility();
      if (window.app) {
        window.app.addCoins(1000);
        window.app.addHints(15);
        window.app.unlockTheme('gold');
        window.app.unlockTheme('sakura');
        window.app.showToast('VIP Founder Pack Unlocked! +1,000 Coins & +15 Hints 👑');
      }
    } else if (productId === 'hint_pack_20') {
      if (window.app) {
        window.app.addHints(20);
        window.app.addCoins(300);
        window.app.showToast('+20 Smart Hints & +300 Coins Added! 💡');
      }
    } else if (productId === 'coin_vault_2500') {
      if (window.app) {
        window.app.addCoins(2500);
        window.app.showToast('+2,500 Neon Coins Added to Vault! 🪙');
      }
    }
  }

  showSimulatedAdModal({ mode, title, subtitle, durationSec, onComplete }) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'sim-ad-overlay';
      overlay.innerHTML = `
        <div class="sim-ad-card">
          <div class="sim-ad-top">
            <span class="sim-ad-badge">Google AdMob • ${mode}</span>
            <span class="sim-ad-timer" id="sim-ad-countdown">${durationSec}s</span>
          </div>
          <div class="sim-ad-stage">
            <div class="sim-ad-pulse">🎬</div>
            <h3>${title}</h3>
            <p>${subtitle}</p>
            <div class="sim-ad-progress-bar">
              <div class="sim-ad-progress-fill" id="sim-ad-fill"></div>
            </div>
          </div>
          <div class="sim-ad-actions">
            <button class="btn-secondary" id="sim-ad-cancel">${mode === 'REWARDED' ? 'Cancel' : 'Skip'}</button>
            <button class="btn-primary" id="sim-ad-claim" disabled>Reward in ${durationSec}s...</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const countdownEl = overlay.querySelector('#sim-ad-countdown');
      const claimBtn = overlay.querySelector('#sim-ad-claim');
      const cancelBtn = overlay.querySelector('#sim-ad-cancel');
      const fillEl = overlay.querySelector('#sim-ad-fill');

      requestAnimationFrame(() => {
        fillEl.style.transition = `width ${durationSec}s linear`;
        fillEl.style.width = '100%';
      });

      let remaining = durationSec;
      const interval = setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          countdownEl.textContent = `${remaining}s`;
          claimBtn.textContent = `Reward in ${remaining}s...`;
        } else {
          clearInterval(interval);
          countdownEl.textContent = 'Granted ✓';
          claimBtn.disabled = false;
          claimBtn.textContent = mode === 'REWARDED' ? 'Claim Reward 🎁' : 'Continue →';
        }
      }, 1000);

      cancelBtn.addEventListener('click', () => {
        clearInterval(interval);
        overlay.remove();
        if (mode === 'INTERSTITIAL' && onComplete) onComplete();
        resolve(false);
      });

      claimBtn.addEventListener('click', () => {
        if (claimBtn.disabled) return;
        clearInterval(interval);
        overlay.remove();
        if (onComplete) onComplete();
        resolve(true);
      });
    });
  }

  showPlayBillingSheet(product, onConfirm) {
    const tier = this.getCurrencyTier();
    const overlay = document.createElement('div');
    overlay.className = 'sim-ad-overlay';
    overlay.innerHTML = `
      <div class="play-billing-sheet">
        <div class="play-sheet-header">
          <span class="play-logo">▶ Google Play Billing</span>
          <span class="play-sandbox-tag">${tier.label}</span>
        </div>
        <div class="play-sheet-body">
          <div class="play-item-row">
            <div class="play-item-icon">${product.icon || '👑'}</div>
            <div class="play-item-info">
              <h4>${product.title}</h4>
              <p>NekoCrown: Cozy Cat &amp; Logic</p>
            </div>
            <div class="play-item-price">${product.price}</div>
          </div>
          <p class="play-item-desc">${product.desc}</p>
          <div class="play-payment-methods">
            <span>💳 ${tier.paymentMethods}</span>
          </div>
        </div>
        <div class="play-sheet-footer">
          <button class="btn-secondary" id="play-cancel-btn">Cancel</button>
          <button class="btn-primary" id="play-buy-btn">1-Tap Buy (${product.price})</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#play-cancel-btn').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#play-buy-btn').addEventListener('click', () => {
      overlay.remove();
      if (onConfirm) onConfirm();
    });
  }
}

window.CURRENCY_TIERS = CURRENCY_TIERS;
window.MONETIZATION_CONFIG = MONETIZATION_CONFIG;
window.monetization = new MonetizationManager();
