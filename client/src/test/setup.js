import { beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Provide a minimal localStorage implementation if the environment lacks one
const storageArea = typeof window !== 'undefined' ? window : globalThis;
if (!storageArea.localStorage) {
  const store = new Map();
  storageArea.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

// Mock matchMedia for jsdom
global.matchMedia = global.matchMedia || function (query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: function () { },
    removeListener: function () { },
    addEventListener: function () { },
    removeEventListener: function () { },
    dispatchEvent: function () { },
  };

};

// Clear any existing auth state before each test
beforeEach(() => {
  localStorage.removeItem('ts.sid');
});
