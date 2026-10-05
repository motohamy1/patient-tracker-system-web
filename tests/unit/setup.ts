// Global setup for the Vitest jsdom environment.
// React 19 requires this global flag before `act()` may be used to flush
// concurrent `createRoot` renders in component tests.
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

export {};