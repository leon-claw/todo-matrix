# GitHub Releases Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace platform-specific application downloads with one direct GitHub Releases link.

**Architecture:** Keep the Releases URL in the download library, make the Mine page download row open it directly, and remove the downloads route and page. Normalize the legacy downloads hash to the Mine page for backward compatibility.

**Tech Stack:** React, TypeScript, Material UI, Node test runner, Vite

---

### Task 1: Define the unified download destination

**Files:**
- Modify: `tests/appDownloads.test.ts`
- Modify: `src/lib/appDownloads.ts`

- [ ] **Step 1: Write the failing test**

Replace the platform-link assertions with:

```ts
test('uses GitHub Releases as the single application download destination', () => {
  assert.equal(APP_RELEASES_URL, 'https://github.com/leon-claw/todo-matrix/releases');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- tests/appDownloads.test.ts`

Expected: FAIL because `APP_RELEASES_URL` is not exported.

- [ ] **Step 3: Write minimal implementation**

Replace the platform download list with:

```ts
export const APP_RELEASES_URL = 'https://github.com/leon-claw/todo-matrix/releases';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- tests/appDownloads.test.ts`

Expected: PASS.

### Task 2: Remove the downloads route and page

**Files:**
- Modify: `tests/appRouter.test.ts`
- Modify: `src/lib/appRouter.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/MinePage.tsx`

- [ ] **Step 1: Write the failing route test**

Assert that `#/mine/downloads` resolves to `{ id: 'mine' }` and requests replacement.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- tests/appRouter.test.ts`

Expected: FAIL because downloads is still a first-class route.

- [ ] **Step 3: Write minimal implementation**

Remove the downloads route, downloads view props, page component, download metadata rendering, and platform icons. Make the Mine page download row open `APP_RELEASES_URL` in a new external browser context.

- [ ] **Step 4: Run focused tests**

Run: `npm.cmd test -- tests/appDownloads.test.ts tests/appRouter.test.ts`

Expected: PASS.

### Task 3: Update documentation and verify

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Point README download link to Releases**

Use `https://github.com/leon-claw/todo-matrix/releases` without a platform-specific URL.

- [ ] **Step 2: Run full verification**

Run: `npm.cmd test`

Expected: all tests pass.

Run: `npm.cmd run build`

Expected: TypeScript and Vite production build succeed.
