// Modules
import { Practical, AddRegexScore } from "./Storage.js";

// Variables
const MAX_SCORES: { [key in Practical]: number } = {
  Dummies: 20,
  Speed: 15,
  Musket: 5,
};
export const MAX_SCORE =
  MAX_SCORES.Dummies + MAX_SCORES.Musket + MAX_SCORES.Speed;

// Module Setup
export async function index() {
  await Promise.all([
    GetScores(Practical.Musket),
    GetScores(Practical.Speed),
    GetScores(Practical.Dummies),
  ]);
}

async function GetScores(prac: Practical) {
  await AddRegexScore(prac, MAX_SCORES[prac], (player, score: number) => {
    player.AddCorePractical(prac, score);
  });
}
