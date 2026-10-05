/**
 * Placeholder route so the build has a page to render and the Playwright
 * harness has an `h1` to assert. No clinical content, auth, or data here —
 * those are Phase 2/3 non-goals. Plan 01-03 makes this locale-prefixed.
 */
export default function Home() {
  return (
    <main>
      <h1>Clinical Patient Workspace</h1>
    </main>
  );
}