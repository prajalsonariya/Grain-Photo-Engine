# Grain Photo Engine — System Protocol & Engineering Constitution

> **Scope**: Universal protocol and architectural guidelines for engineers and AI agents working on the Grain Photo Engine codebase across any machine, operating system, or environment.
> **Standard**: Zero-Blur Material 3 Dark Surface Hierarchy & High-Performance Photography PWA Engine
> **Core Persistence**: Google Drive API v3 (Resumable Streams) + PostgreSQL (Prisma Multi-Tenant SSOT)

---

## 1. Non-Negotiable Core Invariants

Every pull request, commit, and AI modification MUST respect these 6 inviolable rules:

1. **ZERO-BLUR RENDERING INVARIANT**:
   - Never introduce `backdrop-blur-*` or CSS `blur-*` filters to scrollable grids, headers, modal backdrops, or image cards.
   - Depth and elevation must be achieved strictly through the Material 3 Dark Surface luminance tokens (`#0e0e0e` $\rightarrow$ `#161616` $\rightarrow$ `#1c1c1c` $\rightarrow$ `#262626` $\rightarrow$ `#333333`) and `1px solid rgba(255, 255, 255, 0.08)` borders.
   - Image hovers use hardware-accelerated transforms (`transform: scale(1.05)`, `opacity`) and gradient scrims.

2. **MONOTONIC FETCH SEQUENCING ON CLIENTS (`latestFetchSeq`)**:
   - Every fetch must use `seq = ++latestFetchSeq;` and drop any response where `seq < latestFetchSeq`.
   - Any optimistic action (upload, delete, cover pick, rename) increments `latestFetchSeq++` immediately to invalidate and discard stale in-flight responses.

3. **OPTIMISTIC UI LOCKING (`actionLocks`)**:
   - Studio actions (file deletes, folder creation, renames) must update the UI state immediately in `0ms` and hold an optimistic lock to prevent user jitter until Google Drive confirms.

4. **SINGLE-SOURCE-OF-TRUTH (SSOT) & ZERO MEDIA IN DATABASE**:
   - **Never store binary image buffers, base64 data, or files in PostgreSQL**.
   - PostgreSQL stores user accounts, Google OAuth tokens, handle mappings, studio branding, and cache flags.
   - Google Drive stores all original photos, high-res videos, subfolders, and albums.

5. **DIRECT BROWSER-TO-DRIVE RESUMABLE UPLOADS**:
   - High-resolution photos and videos must **never** be proxied through Next.js server memory or Vercel route handlers (which fail on >4.5MB payloads).
   - The browser upload engine acquires a fresh short-lived OAuth token from `/api/studio/token` and streams chunked bytes directly to Google Drive via `uploadType=resumable`.

6. **GIT & PRODUCTION DATABASE SAFETY**:
   - NEVER run `git push` without explicit user instruction.
   - Never run destructive database commands (`prisma db push --force-reset` or raw drops) on production databases. Always use non-destructive schema migrations.

---

## 2. Material 3 Dark Surface Hierarchy

- `--color-surface: #111111` (Root application canvas)
- `--color-surface-container-lowest: #0e0e0e` (Inset viewports, media docks)
- `--color-surface-container-low: #161616` (Cards, folder items)
- `--color-surface-container: #1c1c1c` (Panels, floating docks, drawers)
- `--color-surface-container-high: #262626` (Active items, dialogs)
- `--color-surface-container-highest: #333333` (Hover states, elevated pills)
- `--border-subtle: rgba(255, 255, 255, 0.08)`
- `--border-focus: rgba(255, 255, 255, 0.25)`

---

## 3. Standard API Response Protocol

Every endpoint under `/api/**` returns:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-11-06T12:00:00+05:30"
  }
}
```
Or for errors:
```json
{
  "success": false,
  "error": {
    "code": "AUTH_EXPIRED",
    "message": "Human readable explanation"
  }
}
```
