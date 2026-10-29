/**
 * Parses body, query and params with zod and stores the parsed values on
 * `req.validated`. Keeping the original request objects untouched avoids
 * Express 5's read-only query getter.
 */
export function validate({ body, query, params } = {}) {
  return function validateRequest(req, _res, next) {
    try {
      req.validated = {
        ...(req.validated ?? {}),
        ...(body ? { body: body.parse(req.body) } : {}),
        ...(query ? { query: query.parse(req.query) } : {}),
        ...(params ? { params: params.parse(req.params) } : {}),
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}
