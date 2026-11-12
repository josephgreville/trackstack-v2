import {
  getUserProfile, updateUserProfile, addXp, listAchievements, checkAchievements,
} from '../services/achievementsService.js';

export async function me(req, res) {
  const profile = await getUserProfile(req.user.id);
  res.json({ profile });
}

export async function updateProfile(req, res) {
  const profile = await updateUserProfile(req.user.id, req.validated.body);
  res.json({ profile });
}

export async function achievementsIndex(req, res) {
  const achievements = await listAchievements(req.user.id);
  res.json({ achievements });
}

export async function achievementsCheck(req, res) {
  const earned = await checkAchievements(req.user.id);
  res.json({ earned });
}
