# Mobile Header Layout Design

## Goal

Improve the mobile home-page header so the product identity remains readable
and both primary actions remain explicit at narrow viewport widths.

## Responsive Layout

At viewport widths below the Material UI `sm` breakpoint:

- Render the header as two rows.
- Put the logo, `Todo Matrix` title, and subtitle in the first row.
- Give the brand row the full available width.
- Hide the subtitle below approximately 360 pixels while retaining the logo
  and product title.
- Put the create-task action and account state in a two-column grid on the
  second row.
- Give both controls equal width and a stable height of 42 pixels.

At the `sm` breakpoint and above, retain the existing single-row desktop
layout.

## Actions

The create-task button always shows its icon and the full `添加任务` label.

When signed out, the login button occupies the second grid column and matches
the create-task button dimensions.

When signed in, the local/cloud state uses the same dimensions as a button but
remains non-interactive. Its visual treatment communicates status without
suggesting that it can be clicked. During synchronization, the loading spinner
replaces the leading status icon without changing the control width.

## Visual Behavior

- Keep the current logo, colors, border, and header container treatment.
- Use the existing Material UI spacing and typography system.
- Keep both second-row controls aligned and visually balanced.
- Do not change desktop, Electron, Android business logic, account state, or
  synchronization behavior.

## Verification

- Verify widths around 320, 360, 434, 520, and 600 pixels.
- Confirm the subtitle hides only on very narrow screens.
- Confirm `添加任务` is always visible.
- Confirm login, local mode, cloud mode, and syncing states have stable
  dimensions.
- Confirm the desktop header remains a single row.
