// Polyfill for sockjs-client which uses Node's `global` in browser test environment
(window as any).global = window;
