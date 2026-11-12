import { getRecommendations, dismissRecommendation, generateDiscoverWeekly } from '../services/recommendationsService.js';

export async function index(req, res) {
  const recommendations = await getRecommendations(req.user.id, {
    kind: req.validated?.query?.kind ?? undefined,
    limit: Number(req.validated?.query?.limit ?? 12),
  });
  res.json({ recommendations });
}

export async function dismiss(req, res) {
  const dismissed = await dismissRecommendation(req.user.id, req.validated.params.id);
  if (!dismissed) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recommendation not found.' } });
  res.json({ dismissed: true });
}

export async function discoverWeekly(req, res) {
  const recommendations = await generateDiscoverWeekly(req.user.id);
  res.json({ recommendations });
}
