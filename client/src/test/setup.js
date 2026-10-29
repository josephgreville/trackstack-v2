/**
 * Test setup for Vitest + React Testing Library
 * Mocks matchMedia and clears auth state between tests.
 */

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