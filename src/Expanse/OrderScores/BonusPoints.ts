// Modules
import { AddRegexScore } from "./Storage.js";

// Variables
const MAX_SCORE = 6;

// Module Setup
export async function index() {
  await AddRegexScore("BonusPoints", MAX_SCORE, (player, score: number) => {
    player.AddBonusPoints(score, MAX_SCORE);
  });
}
