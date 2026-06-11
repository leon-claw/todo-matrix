# Hash Routing Design

## Goal

Convert the app's page-level navigation to hash routes so browser, Android, and desktop back actions return to the previous page instead of immediately leaving the app.

## Routes

- `#/` renders the home page.
- `#/mine` renders the settings page.
- `#/mine/downloads` renders the application downloads page.
- An empty or unknown hash is normalized to `#/` with replacement navigation.

Dialogs such as task editing, login, password change, deletion confirmation, and import confirmation remain modal UI state. They are not page routes.

## History Behavior

- Switching between the `home` and `mine` primary tabs uses replacement navigation. Repeated tab switching never grows browser history.
- Opening a secondary page such as `downloads` uses push navigation so the system back action returns to `mine`.
- A secondary page's visible back button uses browser history when the previous entry belongs to this app. When the page was opened directly, it replaces the current route with its parent route instead of leaving the app.
- Hash changes caused by browser controls, Android system back, or desktop navigation controls update the rendered page.

## Architecture

Create a small framework-independent routing module that:

- Defines route and page types.
- Parses and normalizes the current hash.
- Builds route hashes.
- Performs push and replacement navigation.
- Exposes the parent route used by visible back buttons.

Create a React hook that subscribes to `hashchange`, returns the active route, and performs initial normalization. `App` renders from this route instead of maintaining an independent `activePage` state. `MinePage` receives its active subpage and navigation callbacks instead of maintaining its own `mineView` state.

No routing dependency is required. The app only has three routes, and using the platform hash/history APIs keeps the implementation small and compatible with Web, PWA, Capacitor OTA bundles, and Electron OTA bundles.

## Testing

- Unit-test parsing, normalization, parent routes, and primary-page selection.
- Unit-test that primary tabs request replacement navigation while secondary pages request push navigation.
- Run the full test suite and production Web build.
- Verify in a real browser that:
  - `home -> mine` replaces history.
  - `mine -> downloads` adds one history entry.
  - Back from downloads returns to mine.
  - Directly opening downloads and pressing its visible back button stays inside the app.

## Out of Scope

- Route-driven dialogs.
- Route parameters for individual tasks.
- Changes to the frozen WeChat Mini Program client.
