#!/usr/bin/env python3
"""
Generates Play Store Visual Assets (512x512 App Icon, 1024x500 Feature Graphic, PWA Icons)
and 10-language Play Console ASO Listing Copy.
"""

import os
import subprocess

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORE_DIR = os.path.join(ROOT_DIR, "store-assets")
ICONS_DIR = os.path.join(ROOT_DIR, "www", "icons")

os.makedirs(STORE_DIR, exist_ok=True)
os.makedirs(ICONS_DIR, exist_ok=True)

APP_ICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0D1021"/>
      <stop offset="50%" stop-color="#151934"/>
      <stop offset="100%" stop-color="#090B14"/>
    </linearGradient>
    <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE066"/>
      <stop offset="50%" stop-color="#FFB800"/>
      <stop offset="100%" stop-color="#FF7A00"/>
    </linearGradient>
    <linearGradient id="cyanTile" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F5D4"/>
      <stop offset="100%" stop-color="#00BBF9"/>
    </linearGradient>
    <linearGradient id="purpleTile" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9B5DE5"/>
      <stop offset="100%" stop-color="#F15BB5"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect x="14" y="14" width="484" height="484" rx="100" fill="none" stroke="#2A3260" stroke-width="4"/>

  <!-- Subtle Puzzle Grid -->
  <g opacity="0.88">
    <rect x="64" y="64" width="118" height="118" rx="22" fill="url(#purpleTile)" opacity="0.25" stroke="#9B5DE5" stroke-width="3"/>
    <rect x="197" y="64" width="118" height="118" rx="22" fill="url(#cyanTile)" opacity="0.25" stroke="#00F5D4" stroke-width="3"/>
    <rect x="330" y="64" width="118" height="118" rx="22" fill="#1E2548" stroke="#3B467E" stroke-width="3"/>

    <rect x="64" y="197" width="118" height="118" rx="22" fill="#1E2548" stroke="#3B467E" stroke-width="3"/>
    <rect x="197" y="197" width="118" height="118" rx="22" fill="#2A1F4A" stroke="#FFB800" stroke-width="4"/>
    <rect x="330" y="197" width="118" height="118" rx="22" fill="url(#purpleTile)" opacity="0.25" stroke="#F15BB5" stroke-width="3"/>

    <rect x="64" y="330" width="118" height="118" rx="22" fill="url(#cyanTile)" opacity="0.25" stroke="#00BBF9" stroke-width="3"/>
    <rect x="197" y="330" width="118" height="118" rx="22" fill="#1E2548" stroke="#3B467E" stroke-width="3"/>
    <rect x="330" y="330" width="118" height="118" rx="22" fill="url(#cyanTile)" opacity="0.3" stroke="#00F5D4" stroke-width="3"/>
  </g>

  <!-- Glowing Neon Crown Hero Icon -->
  <g filter="url(#glow)" transform="translate(0, 8)">
    <path d="M126 350 L98 188 L194 252 L256 142 L318 252 L414 188 L386 350 Z"
          fill="url(#crownGrad)" stroke="#FFF3B0" stroke-width="8" stroke-linejoin="round"/>
    <rect x="126" y="366" width="260" height="32" rx="14" fill="url(#crownGrad)" stroke="#FFF3B0" stroke-width="6"/>
    <circle cx="98" cy="172" r="18" fill="#00F5D4" stroke="#FFFFFF" stroke-width="5"/>
    <circle cx="256" cy="122" r="22" fill="#FFE066" stroke="#FFFFFF" stroke-width="5"/>
    <circle cx="414" cy="172" r="18" fill="#F15BB5" stroke="#FFFFFF" stroke-width="5"/>
  </g>
</svg>
"""

FEATURE_GRAPHIC_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" width="1024" height="500">
  <defs>
    <linearGradient id="fgBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090C18"/>
      <stop offset="50%" stop-color="#141B38"/>
      <stop offset="100%" stop-color="#1E1136"/>
    </linearGradient>
    <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF099"/>
      <stop offset="50%" stop-color="#FFC300"/>
      <stop offset="100%" stop-color="#FF7700"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#fgBg)"/>
  <!-- Decorative Grid Glow -->
  <g opacity="0.22" stroke="#00F5D4" stroke-width="2" fill="none">
    <rect x="620" y="60" width="340" height="340" rx="24"/>
    <line x1="705" y1="60" x2="705" y2="400"/>
    <line x1="790" y1="60" x2="790" y2="400"/>
    <line x1="875" y1="60" x2="875" y2="400"/>
    <line x1="620" y1="145" x2="960" y2="145"/>
    <line x1="620" y1="230" x2="960" y2="230"/>
    <line x1="620" y1="315" x2="960" y2="315"/>
  </g>
  <!-- Coloured Blocks on Right -->
  <rect x="630" y="70" width="65" height="65" rx="12" fill="#9B5DE5" opacity="0.85"/>
  <rect x="715" y="155" width="65" height="65" rx="12" fill="#00F5D4" opacity="0.85"/>
  <rect x="800" y="240" width="65" height="65" rx="12" fill="#F15BB5" opacity="0.85"/>
  <rect x="885" y="325" width="65" height="65" rx="12" fill="#FFB800" opacity="0.9"/>

  <!-- Left Marketing Typography -->
  <text x="72" y="140" fill="#00F5D4" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="4">3-IN-1 DAILY CAT &amp; LOGIC PUZZLES</text>
  <text x="72" y="235" fill="url(#goldText)" font-family="system-ui, -apple-system, sans-serif" font-size="82" font-weight="900">NEKOCROWN</text>
  <text x="72" y="305" fill="#E2E8F0" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="600">Neko Queens • Block Blast • Binary Tango</text>

  <!-- Feature Pills -->
  <rect x="72" y="355" width="210" height="54" rx="27" fill="#1E293B" stroke="#00F5D4" stroke-width="2"/>
  <text x="177" y="389" text-anchor="middle" fill="#00F5D4" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700">100% OFFLINE</text>

  <rect x="302" y="355" width="245" height="54" rx="27" fill="#1E293B" stroke="#FFB800" stroke-width="2"/>
  <text x="424" y="389" text-anchor="middle" fill="#FFB800" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700">DAILY CHALLENGES</text>
</svg>
"""

ASO_MD = """# 🌍 Google Play Console ASO Listing (10 Languages)

Copy and paste these optimized titles and descriptions directly into **Google Play Console -> Grow -> Store presence -> Main store listing -> Manage translations**.

---

## 1. English (en-US / en-IN) — Default
- **Title (30 chars max):** `NekoCrown: Cozy Cat & Logic`
- **Short Description (80 chars max):** `Daily Neko Queens, Block Blast combos & Tango logic puzzles. Play 100% offline!`
- **Full Description:**
  Train your brain every day with **NekoCrown: Cozy Cat & Logic** — the ultimate 3-in-1 offline puzzle collection combining pure deductive cat logic with satisfying arcade block combos!

  **3 ADDICTIVE PUZZLE MODES IN ONE APP:**
  🐱👑 **Neko Queens (Royal Cat Star Battle Logic):** Place exactly 1 Royal Cat in each row, column, and colored cushion territory without any two Cats touching—even diagonally! Every board is 100% solvable by pure deduction.
  🟦 **Neon Block Blast (8×8 Combo Grid):** Drag glowing polyomino blocks onto the board, clear rows and columns simultaneously for massive multi-combos, and chase your all-time high score!
  ☀️ **Binary Tango (Sun & Moon Grid):** Balance each row and column with equal Suns and Moons, avoid 3 identical symbols in a row, and use `=` (Same) and `×` (Opposite) connectors to deduce the unique grid.

  **WHY PLAYERS LOVE NEKOCROWN:**
  • **Daily World Challenge:** Every day unlocks a fresh 3-stage Daily Medley with a shareable emoji scorecard!
  • **Smart Deduction Hints:** Stuck on a tricky board? Our Smart Hint doesn't just give away a cell—it explains the exact logical step ("Why")!
  • **100% Offline Play:** No Wi-Fi? No problem. Play on flights, commutes, or anywhere with zero internet required.
  • **Collectible Cat Mascots & 5 Themes:** Play with Mochi, Yuzu, Kuro, and Sakura across Cyber Indigo, Midnight AMOLED, Matcha Zen, Royal Gold, and Sakura Neon themes.

---

## 2. Spanish (es-ES / es-419)
- **Title:** `NekoCrown: Gatos y Lógica`
- **Short Description:** `Puzles diarios Neko Queens, bloques y Tango. ¡Juega 100% sin internet!`

## 3. Portuguese (pt-BR)
- **Title:** `NekoCrown: Gatos e Lógica`
- **Short Description:** `Neko Queens, explosão de blocos e desafios diários de lógica 100% offline!`

## 4. German (de-DE)
- **Title:** `NekoCrown: Katzen & Logik`
- **Short Description:** `Tägliche Neko Queens Logikrätsel, Block-Combos & Tango. 100% offline spielbar!`

## 5. French (fr-FR)
- **Title:** `NekoCrown: Chats & Logique`
- **Short Description:** `Puzzles de logique Neko Queens, combos de blocs et défis 100% hors ligne !`

## 6. Hindi (hi-IN)
- **Title:** `NekoCrown: दिमागी और ब्लॉक गेम`
- **Short Description:** `डेली नेको क्वींस लॉजिक, ब्लॉक ब्लास्ट और टैंगो पहेलियाँ। बिना इंटरनेट ऑफ़लाइन खेलें!`

## 7. Japanese (ja-JP)
- **Title:** `NekoCrown: ねこ論理＆ブロックパズル`
- **Short Description:** `ねこクイーン論理パズル、爽快ブロック消去、毎日の脳トレ！オフラインで遊べる決定版`

## 8. Korean (ko-KR)
- **Title:** `네코크라운: 고양이 로직 & 블록 퍼즐`
- **Short Description:** `매일 새로운 네코 퀸즈 논리 퍼즐과 블록 블라스트 콤보! 오프라인 완벽 지원`

## 9. Indonesian (id)
- **Title:** `NekoCrown: Puzzle Kucing Logika`
- **Short Description:** `Puzzle logika Neko Queens, kombo balok & tantangan harian. Main 100% offline!`

## 10. Turkish (tr-TR)
- **Title:** `NekoCrown: KediMantık & Blok`
- **Short Description:** `Günlük Neko Queens mantık bulmacaları, blok patlatma ve Tango! Çevrimdışı oyna.`
"""

def save_files():
    icon_svg_path = os.path.join(STORE_DIR, "app-icon-512x512.svg")
    with open(icon_svg_path, "w", encoding="utf-8") as f:
        f.write(APP_ICON_SVG)

    with open(os.path.join(ICONS_DIR, "icon-512.svg"), "w", encoding="utf-8") as f:
        f.write(APP_ICON_SVG)
    with open(os.path.join(ICONS_DIR, "icon-192.svg"), "w", encoding="utf-8") as f:
        f.write(APP_ICON_SVG.replace('width="512" height="512"', 'width="192" height="192"'))

    fg_svg_path = os.path.join(STORE_DIR, "feature-graphic-1024x500.svg")
    with open(fg_svg_path, "w", encoding="utf-8") as f:
        f.write(FEATURE_GRAPHIC_SVG)

    with open(os.path.join(STORE_DIR, "ASO_STORE_LISTING_10_LANGUAGES.md"), "w", encoding="utf-8") as f:
        f.write(ASO_MD)

    print("Saved SVG icons, Feature Graphic, and 10-language ASO listing.")

if __name__ == "__main__":
    save_files()
