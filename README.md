# Pokem-Testing — Pokémon 2D Web Adventure

Game Pokémon 2D berbasis web (canvas) yang ditulis dalam **TypeScript + Vite**, bisa langsung dibuka di browser tanpa server maupun dikembangkan lewat dev server. Repositori ini sekaligus dipakai untuk menguji seberapa jauh model Gemini Flash bisa menghasilkan kode game lengkap.

---

## Cara Cepat Main

| Cara | Perintah | Kapan dipakai |
| --- | --- | --- |
| Main langsung | klik ganda **`Buka_Game.bat`** | Buka `play.html` (file tunggal, tanpa instalasi) |
| Mode pengembangan | klik ganda **`Buka_Server.bat`** | Menjalankan `npm run dev` (Vite) + buka `localhost:5173` |
| Build ulang | `npm install` lalu `npm run build` | Setelah mengubah file di `src/` |

**Kontrol:** `W A S D` / `↑ ↓ ← →` gerak · `Z` / `Space` aksi (A) · `X` batal (B) · `Shift` lari · `Enter`/`Esc` menu & Pokédex · tombol layar sentuh (D-Pad, A/B) untuk HP.

---

## Struktur File & Penjelasannya

### Berkas di root proyek

#### `index.html`
- **Maksud:** Halaman utama mode pengembangan. Berisi kerangka layar: header (tombol audio & fullscreen), `<canvas id="game-canvas" width="320" height="240">`, D-Pad virtual, tombol A/B, panel kontrol, dan petunjuk permainan. Memuat `src/style.css` serta font retro *Press Start 2P*.
- **----- Update:** Ditambahkan skrip redirect: kalau halaman dibuka lewat `file://` (klik ganda), otomatis dialihkan ke `play.html`, jadi game tetap jalan walaupun tidak lewat server.

#### `play.html`
- **Maksud:** Versi *standalone* satu file berisi seluruh HTML + CSS + JavaScript hasil build. Inilah yang dibuka `Buka_Game.bat` — bisa dikirim ke orang lain dan langsung jalan tanpa `npm install`.
- **----- Update:** Dibuat ulang setiap kali `npm run build` dijalankan (oleh `scripts/build-standalone.js`), jadi isinya selalu mengikuti kode terbaru di `src/`. Jangan diedit manual karena akan tertimpa.

#### `package.json`
- **Maksud:** Identitas dan daftar perintah proyek: `dev` (server pengembangan), `build` (tsc + vite + standalone), `build:standalone`, `preview`. Dependensi hanya `typescript` dan `vite` (semuanya *devDependencies*).
- **----- Update:** Skrip `build` kini memanggil tiga tahap berurutan: `tsc` (cek tipe) → `vite build` (hasil ke `dist/`) → `node scripts/build-standalone.js` (hasil `play.html`).

#### `package-lock.json`
- **Maksud:** Kunci versi pasti setiap dependensi beserta *checksum*-nya, supaya `npm install` di mesin mana pun menghasilkan versi yang sama persis.
- **----- Update:** Terkunci pada Vite 5.4.x dan TypeScript 5.6.x; file ini tidak boleh diedit manual, hanya berubah saat menambah/meng-upgrade paket.

#### `tsconfig.json`
- **Maksud:** Konfigurasi kompilator TypeScript — target `ES2022`, module `ESNext`, `moduleResolution: bundler`, mode ketat (`strict`) plus `noUnusedLocals`, `noUnusedParameters`, dan `noFallthroughCasesInSwitch`.
- **----- Update:** Dipakai tahap pertama `npm run build`; kalau ada tipe yang salah, build berhenti sebelum Vite jalan.

#### `vite.config.ts`
- **Maksud:** Konfigurasi Vite: `base: './'` (semua path relatif) dan output ke folder `dist/`.
- **----- Update:** Karena `base` relatif, hasil `dist/` bisa dibuka langsung dari folder mana pun (termasuk GitHub Pages) tanpa domain khusus.

#### `Buka_Game.bat`
- **Maksud:** Skrip Windows satu tujuan: membuka `play.html` di browser default.
- **----- Update:** Menjalankan game versi *standalone* — kalau file ini gagal, berarti `play.html` belum dibuat; jalankan `npm run build` dulu.

#### `Buka_Server.bat`
- **Maksud:** Skrip Windows untuk mode pengembangan: membuka `http://localhost:5173` lalu menjalankan `npm run dev`.
- **----- Update:** Butuh Node.js terpasang dan `npm install` sudah dijalankan sekali; file ini akan tetap terbuka untuk menampilkan log Vite.

#### `README.md`
- **Maksud:** Berkas yang sedang kamu baca — dokumentasi proyek.
- **----- Update:** Diperbarui menjadi dokumentasi per-file seperti sekarang (cara main, kontrol, penjelasan tiap file + baris `----- Update:`).

---

### `scripts/`

#### `scripts/build-standalone.js`
- **Maksud:** Skrip Node.js yang menggulung seluruh TypeScript menjadi satu berkas JavaScript IIFE (memakai esbuild, minify), lalu menyuntikkan isi `src/style.css` ke dalam template HTML sehingga jadilah satu file mandiri tanpa dependensi eksternal.
- **----- Update:** Menulis keluaran ke dua tempat sekaligus: `play.html` (root) dan `dist/index.html`. Dijalankan otomatis sebagai tahap akhir `npm run build`, atau sendiri dengan `npm run build:standalone`.

---

### `src/` — kode sumber game

#### `src/main.ts` (86 baris)
- **Maksud:** Titik masuk (entry point) aplikasi. Mengambil `<canvas>`, membuat objek `Game`, lalu memasang event listener: tombol audio, tombol fullscreen, serta input sentuh/mouse untuk D-Pad dan tombol A/B (termasuk `touchstart`/`touchend` untuk HP).
- **----- Update:** Kini menunggu `DOMContentLoaded` dengan aman dan memakai `setVirtualDown()` sehingga kontrol layar sentuh & mouse mengalir ke modul input yang sama dengan keyboard.

#### `src/types.ts` (103 baris)
- **Maksud:** Definisi tipe TypeScript yang dipakai lintas modul: `PokemonType` (11 tipe), `Move`, `PokemonSpecies`, `ActivePokemon`, `PlayerData`, `InventoryItem`, dll.
- **----- Update:** Daftar tipe lengkap 11 elemen (normal, fire, water, grass, electric, flying, bug, poison, rock, ground, fighting) dan menjadi acuan bersama seluruh file `data/` dan `engine/`.

#### `src/style.css` (376 baris)
- **Maksud:** Seluruh tampilan halaman: tema retro, bingkai layar (`screen-frame` + efek kilau), D-Pad, tombol bulat A/B, panel instruksi, header, dan responsif untuk layar kecil.
- **----- Update:** Menyertakan kelas `.pressed` untuk memberi umpan balik visual saat tombol virtual ditekan.

#### `src/engine/game.ts` (895 baris)
- **Maksud:** Otak utama game — siklus render (`requestAnimationFrame`), state permainan (`STARTER_SELECT`, `OVERWORLD`, `BATTLE_TRANSITION`, dll), pemilihan Pokémon awal, penyimpanan/muat data pemain, inventaris, dan perpindahan antar mode.
- **----- Update:** Menjadi penghubung semua subsistem: membuat `InputHandler`, `Overworld`, `BattleSystem`, dan `SpriteLoader`, plus memuat daftar spesies dari `data/pokemon`.

#### `src/engine/overworld.ts` (513 baris)
- **Maksud:** Dunia luar: gerak pemain grid-per-grid (lengan animasi langkah), tabrakan dengan tile, NPC & dialog, acara bertemu Pokémon liar dari `WILD_ENCOUNTER_POOL`, serta transisi ke pertempuran.
- **----- Update:** State gerak kini dipecah (`isMoving`, timer langkah) supaya animasi halus dan pertemuan liar dicek setelah pemain selesai berpindah kotak.

#### `src/engine/battle.ts` (1068 baris — terbesar)
- **Maksud:** Sistem pertempuran giliran: intro pertarungan, menu utama (Fight/Bag/Pokémon/Run), pemilihan jurus, hitungan damage, efektivitas tipe, status PP/HP, tangkapan Pokémon, dan layar kemenangan/pelarian.
- **----- Update:** State-nya kini berantai `INTRO → MAIN_MENU → MOVE_SELECT → BAG_MENU`, dan jurus dihitung memakai `getTypeEffectiveness()` dari `data/typeChart` serta sprite dari `SpriteLoader`.

#### `src/engine/tilemap.ts` (693 baris)
- **Maksud:** Definisi peta: enum `TileType` (PATH, GRASS, TALL_GRASS, TREE, WATER, FENCE, ROOF, WALL, DOOR, …), data grid peta, aturan tabrakan per tile, gambar tile, dan definisi NPC.
- **----- Update:** Menyediakan `TileType` sebagai enum dan tipe `NPC` yang diekspor, dipakai bersama oleh `overworld.ts`.

#### `src/engine/input.ts` (123 baris)
- **Maksud:** Penerjemah input keyboard ke dalam bahasa game: `up/down/left/right/a/b/start/select`, membedakan tombol *sedang ditekan* vs *baru ditekan* (untuk aksi sekali-jalan).
- **----- Update:** Menambahkan `setVirtualDown()` agar tombol layar sentuh/mouse dari `main.ts` memakai jalur input yang sama dengan keyboard.

#### `src/engine/spriteLoader.ts` (81 baris)
- **Maksud:** Pemuat gambar Pokémon dari repositori sprite PokeAPI di GitHub dengan cache (peta gambar + janji pemuatan) agar gambar tidak diunduh berulang.
- **----- Update:** Kalau gambar gagal dimuat (misal offline), tersedia *fallback* piksel prosedural supaya game tetap tampil, bukan kotak kosong.

#### `src/data/pokemon.ts` (580 baris)
- **Maksud:** Database spesies Pokémon (`POKEMON_SPECIES_LIST`), pemetaan `POKEMON_MAP`, fungsi `createActivePokemon()` untuk membuat individu bertarung, dan kolam Pokémon liar.
- **----- Update:** URL sprite diarahkan ke `raw.githubusercontent.com/PokeAPI/sprites` (versi depan & belakang), sehingga gambar langsung tampil tanpa unduhan aset lokal.

#### `src/data/moves.ts` (294 baris)
- **Maksud:** Kamus semua jurus `MOVES_DATABASE`: nama, tipe, kekuatan, akurasi, PP, dan kategori (physical/special/status).
- **----- Update:** Setiap jurus kini membawa `maxPp` bersama `pp` supaya sisa PP bisa dipulihkan dengan tepat saat pulih dari pusat pemulihan.

#### `src/data/typeChart.ts` (108 baris)
- **Maksud:** Tabel keefektifan antar tipe (misal `fire` vs `grass` = 2.0, `normal` vs `ghost` = 0.0) dalam bentuk `TYPE_CHART`.
- **----- Update:** Dipakai `getTypeEffectiveness()` di `battle.ts` sebagai satu-satunya sumber perhitungan damage bertipe.

#### `src/audio/sound.ts` (391 baris)
- **Maksud:** Sintesis suara 8-bit lewat Web Audio API — BGM chiptune dan efek suara (langkah, serangan, menu) tanpa file audio sama sekali.
- **----- Update:** `AudioContext` baru dibuat pada interaksi pengguna pertama (kebijakan browser), dengan pemisahan bus `musicGain`/`sfxGain`, tombol mute, dan penggantian BGM per adegan (scene).

---

### `dist/` — hasil build Vite

#### `dist/index.html`
- **Maksud:** Versi produksi halaman game hasil `vite build` (path relatif, sudah dipadatkan).
- **----- Update:** Di-*generate* otomatis; file ini juga ditimpa oleh `build-standalone.js` dengan versi standalone.

#### `dist/assets/index-*.css` dan `dist/assets/index-*.js`
- **Maksud:** Bundel CSS dan JavaScript hasil kompresi Vite dengan nama ber-*hash* (agar cache browser selalu segar).
- **----- Update:** Nama file berubah setiap build mengikuti isinya — jangan diubah manual atau referensi di `dist/index.html` akan pecah.

#### `dist/standalone-bundle.js`
- **Maksud:** Bundel JavaScript tunggal (IIFE, minify) hasil esbuild, dipakai oleh versi standalone.
- **----- Update:** Hanya bahan untuk menyusun `play.html`; biasanya tidak dibuka langsung.

---

### `node_modules/`
- **Maksud:** Hasil `npm install` — seluruh pustaka yang dibutuhkan (Vite, TypeScript, esbuild, Rollup, PostCSS, dsb). **Jangan diedit.**
- **----- Update:** Ikut ter-commit ke repositori sesuai permintaan (±44 MB, 339 file). Kalau suatu saat ingin dirapikan, tambahkan `.gitignore` berisi `node_modules/` lalu jalankan `git rm -r --cached node_modules`.

---

## Catatan

- Repo ini memakai cabang **`main`**; riwayat awal berisi dua akar (commit `Initial commit` berisi README, dan commit proyek game) yang digabung lewat merge tanpa konflik.
- Perubahan di `src/` **tidak** langsung terlihat di `play.html` — jalankan `npm run build` dulu, lalu commit ulang file yang berubah.
