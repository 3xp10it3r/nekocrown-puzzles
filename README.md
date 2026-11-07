# 🐱👑 NekoCrown: Cozy Cat & Logic (`com.nekocrown.cozypuzzles`)

A 3-in-1 offline-first mobile logic & block puzzle game built for Google Play Store with native **₹ INR** Purchasing-Power-Parity (PPP) pricing, 10-language localization, and 200 verified deterministic logic levels:

1. **🐾 Neko Queens (6×6 to 9×9):** Place 1 Royal Cat per row, column, and colored satin-cushion region with no touching—even diagonally. Includes step-by-step logical deduction ("Why") Smart Hints.
2. **🟦 Neon Block Blast (8×8):** Drag 3D beveled jewel polyominoes onto the grid, clear rows & columns for multi-combos, and use the 4×4 Bomb Booster.
3. **☀️🌙 Binary Tango (6×6):** Balance 3 Suns & 3 Moons per row and column with no 3 identical adjacent symbols while obeying `=` (Same) and `×` (Opposite) connectors.

---

## 🔗 Live GitHub Pages URLs (For Google Play Console & AdMob)

Once GitHub Pages is enabled on this repository (**Settings → Pages → Source: GitHub Actions** or **Deploy from a branch: `main` / `(root)`**):

- **Privacy Policy URL (Google Play Console → App Content → Privacy Policy):**
  `https://3xp10it3r.github.io/nekocrown-puzzles/privacy-policy.html`
- **AdMob `app-ads.txt` URL (Google Play Console → Store Settings → Website):**
  `https://3xp10it3r.github.io/nekocrown-puzzles/` (serves `app-ads.txt` at `/app-ads.txt`)
- **Playable Web App:**
  `https://3xp10it3r.github.io/nekocrown-puzzles/www/` (or root `/` via GitHub Actions Pages workflow)

---

## 📦 Automated Android `.aab` & `.apk` Cloud Build

Every push to `main` triggers [`.github/workflows/build-android-aab.yml`](.github/workflows/build-android-aab.yml), which:
1. Verifies all **200 logic puzzle levels** (`scripts/verify_game_logic.js`).
2. Syncs Capacitor 6 Android (`com.nekocrown.cozypuzzles`).
3. Builds both the **Debug APK** and **Signed Play Store Release Bundle (`app-release.aab`)** and uploads them under **Actions → Artifacts → `nekocrown-playstore-release-bundle`**.

See [PLAYSTORE_MASTER_PLAN.md](PLAYSTORE_MASTER_PLAN.md) and [store-assets/ASO_STORE_LISTING_10_LANGUAGES.md](store-assets/ASO_STORE_LISTING_10_LANGUAGES.md) for the complete Play Store launch, ASO, and monetization guide.
