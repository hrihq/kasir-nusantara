# AGENTS.md

Kasir Nusantara — offline POS app for Android. Vite + React 18 + Tailwind web view wrapped by Capacitor 8. No backend; all data stays in device localStorage.

## Commands

- Dev: `npm run dev` · Web build: `npm run build` (output `dist/`)
- After changing native/web assets: `npm run build && npx cap sync android`
- Local APK: from `android/` run `./gradlew assembleDebug` → `app/build/outputs/apk/debug/app-debug.apk`
- There are NO test/lint/typecheck scripts. Verification = `npm run build` succeeds.

## Release flow

- `version` in root `package.json` is the single source of truth: android `versionName`/`versionCode` are derived from it (`JsonSlurper` block at top of `android/app/build.gradle`). Never bump version anywhere else.
- Pushing to `main` triggers `.github/workflows/release.yml`: if GitHub release `v{version}` doesn't exist yet, it builds the APK and publishes release `v{version}` with generated notes + attached `KasirNusantara-vX.X.X.apk`. Same version pushed again is a no-op.
- Debug and release builds both sign with the same `kasir.keystore` (`android/app/build.gradle`). This signature match is what lets users install updates over an existing install — do not change the signing config.

## In-app updater (src/lib/update.js)

- Startup check ~2.5 s after launch (App.jsx): fetches latest release from `api.github.com/repos/hrihq/kasir-nusantara`, semver-compares against `VERSI`, then fires a local notification + `PembaruanModal`.
- APK download/install goes through the custom Capacitor plugin **PembukaApk** (`registerPlugin('PembukaApk')`), implemented in Java at `android/app/src/main/java/com/kasirnusantara/app/InstallerPlugin.java` (download with progress, install via FileProvider, share, clean).
- Downloads fall back to mirrors `gh-proxy.com` / `ghp.ci` (GitHub CDN is blocked by some ISPs).
- `bersihkanSisa()` runs on every startup to delete leftover downloaded APKs from cache.
- Closing `PembaruanModal` snoozes until tomorrow (`pengaturan.tundaUpdateSampai`).
- Changelog popup (`CatatanRilisModal`) shows exactly once after an update: localStorage key `kasir_versi_terakhir` vs current `VERSI` in App.jsx. Don't reset that key except on version change.

## i18n convention (src/lib/bahasa.js)

- UI strings are written in Indonesian inline, wrapped in `t('...')`. English comes from the `EN` dictionary keyed by the exact Indonesian string.
- Any new UI string must get an `EN` entry or English users silently see Indonesian.
- Default mode `'sistem'` follows `navigator.language` (`id*` → Indonesian, otherwise English). Locale for date/number formatting also follows this.

## Data & state

- Persistence is plain localStorage via `useLocalStorage` (src/lib/storage.js). Keys: `kasir_produk`, `kasir_transaksi`, `kasir_pengeluaran`, `kasir_pengaturan`, `kasir_nomor_urut`, `kasir_bahasa`, `kasir_versi_terakhir`.
- Global state: `StoreContext` (products, transactions, expenses, settings, cart). No router — tab switching + swipe gestures live in `src/App.jsx`; pages in `src/pages/`.

## Conventions

- Code identifiers and comments are in Indonesian (`cekPembaruan`, `unduhApk`, `pengaturan`, …). Match this.
- Gitignored local-only files: `SPESIFIKASI-*.md`, `KasirNusantara.apk`, `dev-server.log`, `android/app/src/main/assets/public/`.
