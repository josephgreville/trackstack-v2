/**
 * Express 5 forwards rejected promises automatically, but wrapping handlers
 * keeps the route files explicit and works if the app is mounted elsewhere.
 */
export function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
