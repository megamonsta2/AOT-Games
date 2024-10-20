// Modules
import { ResetPlayers } from "./Storage.js";
import { index as GetUsernames } from "./Usernames.js";
import { index as GetKnowledge } from "./Knowledge.js";
import { index as GetPractical } from "./Practical.js";
import { index as GetTitanTraining } from "./TitanTraining.js";
import { index as GetBonusPoints } from "./BonusPoints.js";
import { index as Output } from "./Output.js";

// Module Setup
export async function index() {
  ResetPlayers();

  await GetUsernames();
  console.log("Gotten usernames.");
  await GetKnowledge();
  console.log("Gotten knowledge scores.");
  await GetPractical();
  console.log("Gotten practical scores.");
  await GetTitanTraining();
  console.log("Gotten titan training scores.");
  await GetBonusPoints();
  console.log("Gotten bonus points.");
  await Output();
}
