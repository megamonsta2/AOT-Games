// Modules
import { createInterface } from "readline";
import { readFile } from "fs/promises";
import { INPUT_FOLDER } from "../Files.js";

// Types
export enum Practical {
  Musket = "Musket",
  Speed = "Speed",
  Dummies = "Dummies",
}

// Variables
let Players: Map<string, Player> = new Map<string, Player>();
let Missing: Map<string, Player> = new Map<string, Player>();

const FORMAT = "USERNAME - PATTERN";
const REGEX_PATTERN = /([A-z0-9_]+) - ([0-9]+)/;
export const GROUP_ID = "8536935";
export const ROLE_ID = "106749302";

// Class Setup
export class Player {
  Username: string;

  Knowledge!: number;
  BonusPoints!: number;

  Musket!: number;
  Speed!: number;
  Dummies!: number;
  TitanTraining!: number;

  constructor(Username: string) {
    this.Username = Username;
  }

  AddKnowledge(score: number) {
    // If knowledge doesn't exist or exists and score is less than current knowledge
    if (!this.Knowledge || this.Knowledge > score) {
      this.Knowledge = score;
    }
  }

  AddBonusPoints(points: number, max: number) {
    if (!this.BonusPoints) {
      this.BonusPoints = 0;
    }

    if (this.BonusPoints + points <= max) {
      this.BonusPoints += points;
    } else {
      this.BonusPoints = max;
    }
  }

  AddCorePractical(type: Practical, score: number) {
    // If prac score doesn't exist or exists and score is less than current prac
    if (!this[type] || this[type] > score) {
      this[type] = score;
    }
  }

  AddTitanTraining(score: number) {
    // Must not have other prac scores
    if (this.Musket || this.Speed || this.Dummies) {
      return;
    }

    // If tt score doesn't exist or exists and score is greater than current tt score
    if (!this.TitanTraining || score > this.TitanTraining) {
      this.TitanTraining = score;
    }
  }
}

// Player Functions
export function ResetPlayers() {
  Players.clear();
  Missing.clear();
}

export function GetPlayers() {
  return Players;
}

export function GetMissingPlayers() {
  return Missing;
}

export function GetPlayer(username: string): Player | undefined {
  let Id = GetIdFromUsername(username);
  return Players.get(Id);
}

export function GetMissingPlayer(username: string): Player | undefined {
  let Id = GetIdFromUsername(username);
  return Missing.get(Id);
}

export function AddPlayer(username: string) {
  Players.set(GetIdFromUsername(username), new Player(username));
}

export function AddMissingPlayer(username: string) {
  const MissingPlayer = new Player(username);
  Missing.set(GetIdFromUsername(username), MissingPlayer);
  return MissingPlayer;
}

export function RemoveMissingPlayer(username: string) {
  Missing.delete(GetIdFromUsername(username));
}

export function GetIdFromUsername(username: string): string {
  return username.toLowerCase();
}

// Other Functions
async function GetScores(file: string, max: number) {
  let CurrentInput = await ReadFile(file);
  let LinesToCheck: { [key: number]: true } = [];
  let Scores: { Name: string; Score: number }[] = [];

  // Get lines to check
  for (let i = 0; i < CurrentInput.length; i++) {
    LinesToCheck[i] = true;
  }

  // Check if scores are valid
  while (true) {
    let AllValid = true;

    for (const key in LinesToCheck) {
      // Get vars
      const index = Number(key);
      const line = CurrentInput[index];

      // Ignore empty strings
      if (line == "") {
        continue;
      }

      // Make index equal line number
      const LineNum = index + 1;

      // Check if pattern fits exactly on line
      const PatternResult = REGEX_PATTERN.exec(line);
      if (!PatternResult) {
        console.warn(
          `Data on line number ${LineNum} does not match the format ${FORMAT}`
        );
        AllValid = false;
        continue;
      }

      const name = PatternResult[1];
      const score = Number(PatternResult[2]);

      // Check if score errors
      if (!CheckScoreForErrors(LineNum, score, max)) {
        AllValid = false;
        continue;
      }

      // Remove line
      if (index in LinesToCheck) {
        delete LinesToCheck[index];
      }

      // Add to scores
      Scores.push({ Name: name, Score: score });
    }

    // Check if valid
    if (!AllValid) {
      console.warn("When the errors are amended, press any key.");
      await WaitForKey();

      CurrentInput = await ReadFile(file);
    } else {
      break;
    }
  }

  return Scores;
}

export function CheckScoreForErrors(
  index: number,
  score: number,
  max: number
): boolean {
  if (isNaN(score)) {
    console.warn(`The score on line ${index} is not a number.`);
    return false;
  } else if (!Number.isInteger(score)) {
    console.warn(
      `The score on line ${index} is not an integer (whole number).`
    );
    return false;
  } else if (score > max) {
    console.warn(
      `The score on line ${index} is greater than the maximum score (${max})`
    );
    return false;
  } else if (score < 0) {
    console.warn(`The score on line ${index} is less than 0.`);
    return false;
  }

  return true;
}

export function WaitForKey(): Promise<void> {
  return new Promise((resolve) => {
    // Get interface
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Once a key is pressed, close then resolve
    process.stdin.once("data", () => {
      rl.close();
      resolve();
    });
  });
}

export async function AddRegexScore(
  file: string,
  max: number,
  func: (player: Player, score: number) => void
) {
  const Scores = await GetScores(file, max);
  let Promises: Promise<void>[] = [];

  for (let i = 0; i < Scores.length; i++) {
    await LogPlayer(Scores[i], func);
    // Promises.push(LogPlayer(Scores[i], func));
  }

  return Promise.all(Promises);
}

async function LogPlayer(
  Score: { Name: string; Score: number },
  func: (player: Player, score: number) => void
) {
  const name = Score.Name;
  const score = Score.Score;
  const Id = GetIdFromUsername(name);

  // Check if player is AT
  const player = GetPlayer(Id);
  if (player) {
    // Player exists as AT
    func(player, score);
    return;
  }

  // Check if has missing data
  let MissingPlayer = GetMissingPlayer(name);
  if (!MissingPlayer) {
    MissingPlayer = AddMissingPlayer(name);
  }

  // Run func
  func(MissingPlayer, score);

  return;
}

export async function ReadFile(file: string): Promise<string[]> {
  const data = (await readFile(`${INPUT_FOLDER}/${file}.txt`, "utf8")).split(
    "\r\n"
  );

  // Is empty table with 1 empty string
  if (data.length == 1 && data[0] == "") {
    return [];
  } else {
    return data;
  }
}
