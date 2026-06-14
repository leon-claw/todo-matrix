# Mobile Header Layout Implementation Plan

> **For Codex:** Execute this plan task by task, preserving the existing desktop header and account behavior.

**Goal:** Make the mobile home header readable and explicit by placing the brand on the first row and equal-width task/account controls on the second row.

**Architecture:** Keep `AppHeader` as the single shared header component and express the layout entirely through MUI responsive `sx` values. Do not change authentication, synchronization, routing, or task creation behavior.

**Tech Stack:** React 19, TypeScript, MUI 9, Node test runner, Vite.

---

### Task 1: Lock the responsive contract with a regression test

**Files:**
- Create: `tests/appHeaderResponsive.test.ts`
- Read: `src/components/AppHeader.tsx`

**Step 1: Write the failing test**

Add static source assertions for these deliberate layout rules:

- The main header stack is column-based below `sm` and row-based from `sm`.
- The mobile action area uses two equal columns.
- The task button text is no longer hidden on mobile.
- Both controls have a 42px mobile height and full mobile width.
- The subtitle is hidden only below 360px.

**Step 2: Run the focused test and confirm failure**

Run: `node --import tsx --test tests/appHeaderResponsive.test.ts`

Expected: FAIL because `AppHeader` still uses a single row and hides the task label on mobile.

### Task 2: Implement the approved MUI layout

**Files:**
- Modify: `src/components/AppHeader.tsx`

**Step 1: Stack the mobile header**

Make the outer content stack use `column` below `sm`, stretch mobile children, and retain the existing desktop row.

**Step 2: Preserve the brand**

Give the brand row full mobile width and retain the logo, title, and single-line subtitle. Add a narrowly scoped media query that hides only the subtitle below 360px.

**Step 3: Build the mobile action row**

Make the controls container a two-column grid below `sm` and the existing compact flex row from `sm`.

**Step 4: Normalize the controls**

Keep “添加任务” visible at every width. Give the task button, login button, and account-status chip full mobile width and 42px mobile height. Preserve desktop sizing and existing click/loading behavior.

**Step 5: Run the focused test**

Run: `node --import tsx --test tests/appHeaderResponsive.test.ts`

Expected: PASS.

### Task 3: Verify the shared frontend

**Files:**
- Verify: `src/components/AppHeader.tsx`
- Verify: `tests/appHeaderResponsive.test.ts`

**Step 1: Run the complete test suite**

Run: `npm.cmd test`

Expected: All tests pass.

**Step 2: Run a production web build**

Run: `npm.cmd run build`

Expected: TypeScript and Vite complete successfully.

**Step 3: Inspect the diff**

Run: `git diff -- src/components/AppHeader.tsx tests/appHeaderResponsive.test.ts docs/superpowers/plans/2026-06-14-mobile-header-layout.md`

Expected: Only the approved responsive layout, its regression test, and documentation are present.

### Task 4: Perform browser visual verification

**Files:**
- Test URL: `http://127.0.0.1:5173/#/`

**Step 1: Verify narrow mobile**

At 320px width, confirm the title remains visible, the subtitle is hidden, and both controls remain labeled and equal-width without overlap.

**Step 2: Verify normal mobile**

At 434px width, confirm the full subtitle is visible and the two controls occupy the second row evenly.

**Step 3: Verify desktop**

At 900px or wider, confirm the original one-row desktop composition remains intact.

**Step 4: Check interaction**

Confirm the task button still opens the task dialog and the login/account control still exposes its existing behavior.
