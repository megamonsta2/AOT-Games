// Modules
import {
  AddMissingPlayer,
  GetPlayer,
  GetMissingPlayer,
  GetIdFromUsername,
  FindInvalidPlayer,
  CheckScoreForErrors,
  WaitForKey,
  ReadFile,
} from "./Storage.js";

// Variables
const MAX_SCORE = 60;

// Module Setup
export async function index() {
  await ProcessData();
}

async function GetData() {
  let [RawNames, RawScores] = await ReadFiles();

  // Check lengths
  while (!(RawNames.length == RawScores.length)) {
    console.warn(
      "The length of the knowledge test names and scores are NOT the same.\r\nWhen this is amended, press any key."
    );
    WaitForKey();

    [RawNames, RawScores] = await ReadFiles();
  }

  // Check if scores are valid
  while (true) {
    let AllValid = true;

    // Loop through scores
    RawScores.forEach((score: string, index: number) => {
      if (!CheckScoreForErrors(index + 1, Number(score), MAX_SCORE)) {
        AllValid = false;
      }
    });

    // Check if can break
    if (!AllValid) {
      console.warn("When the errors are amended, press any key.");
      await WaitForKey();

      RawScores = await ReadFile("KnowledgeScores");
    } else {
      break;
    }
  }

  return [RawNames, RawScores];
}

function ReadFiles(): Promise<string[][]> {
  return Promise.all([ReadFile("KnowledgeNames"), ReadFile("KnowledgeScores")]);
}

async function ProcessData() {
  const [RawNames, RawScores] = await GetData();

  for (let i = 0; i < RawNames.length; i++) {
    const name = RawNames[i].trim();
    const score = Number(RawScores[i].trim());
    const Id = GetIdFromUsername(name);
    const PlayerObj = GetPlayer(Id);

    if (PlayerObj) {
      // Player exists as AT
      PlayerObj.AddKnowledge(score);
    } else {
      const LogPlayer = await FindInvalidPlayer(name);
      console.log(`Log player: ${LogPlayer}`);
      if (!LogPlayer) {
        continue;
      }

      let MissingPlayer = GetMissingPlayer(name);
      if (!MissingPlayer) {
        MissingPlayer = AddMissingPlayer(name);
      }

      MissingPlayer.AddKnowledge(score);
    }
  }
}
