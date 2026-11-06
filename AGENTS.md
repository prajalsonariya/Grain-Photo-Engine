<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CRITICAL ARCHITECTURAL INVARIANTS & SYSTEM PROTOCOL

> **MANDATORY READING**: All engineers and AI agents must review `SYSTEM_PROTOCOL.md` in the project root for detailed architectural specifications, Material 3 Dark Surface tokens, and Google Drive resumable streaming standards.

1. **Zero-Blur Rendering Invariant**: Never add `backdrop-blur-*` or CSS `blur-*` filters anywhere on scrollable grids, headers, or modals. Use Material 3 surface luminance tokens (`#0e0e0e` through `#333333`) and 1px `rgba(255, 255, 255, 0.08)` borders.
2. **Monotonic Fetch Sequencing (`latestFetchSeq`)**: All client-side folder/file fetches must increment a sequence counter and drop stale out-of-order responses.
3. **Optimistic UI Locking (`actionLocks`)**: File deletes, folder creations, renames, and cover picks update the UI immediately in 0ms with optimistic locking.
4. **Direct Browser-to-Drive Resumable Uploads**: High-res photos and videos stream directly from browser to Google Drive via `uploadType=resumable`, bypassing Vercel/Next 4.5MB limits.
5. **Single Source of Truth (SSOT)**: Never store binary media buffers or base64 in PostgreSQL. DB stores user identities, Google OAuth tokens, and studio metadata.
6. **Git & Production Safety**: Never run `git push` or destructive DB commands without explicit instruction.
