// Modules
import { AddRegexScore } from "./Storage.js";

// Variables
const MAX_SCORE = 40;

// Module Setup
export async function index() {
  await AddRegexScore("TitanTraining", MAX_SCORE, (player, score: number) => {
    player.AddTitanTraining(score);
  });
}
