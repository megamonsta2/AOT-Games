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
type PlayerJSON = {
  name: string;
  id: number;
};
type GroupJSON = {
  group: {
    id: number;
  };
  role: {
    id: number;
  };
}[];

// Variables
let Players: { [key: string]: Player } = {};
let Missing: { [key: string]: Player } = {};

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
export function GetPlayers() {
  return Players;
}

export function GetMissingPlayers() {
  return Missing;
}

export function GetPlayer(username: string): Player | null {
  let Id = GetIdFromUsername(username);
  if (Id in Players) {
    return Players[Id];
  } else {
    return null;
  }
}

export function GetMissingPlayer(username: string): Player | null {
  let Id = GetIdFromUsername(username);
  if (Id in Missing) {
    return Missing[Id];
  } else {
    return null;
  }
}

export function AddPlayer(username: string) {
  Players[GetIdFromUsername(username)] = new Player(username);
}

export function AddMissingPlayer(username: string) {
  const MissingPlayer = new Player(username);
  Missing[GetIdFromUsername(username)] = MissingPlayer;
  return MissingPlayer;
}

export function GetIdFromUsername(username: string): string {
  return username.toLowerCase();
}

// Check Functions

// If player doesn't exist, return true
// If player not in group, return true
// If player in group and lower rank, return false
export async function FindInvalidPlayer(Id: string): Promise<boolean> {
  // Check if they exist on roblox
  const UserId: number | undefined = await CheckPlayerExists(Id);

  // If user id wasn't found, player doesn't exist, so return true
  if (!UserId) {
    return true;
  }

  // Check if they are in group but lower rank (e.g. died)
  const PlayerInGroup = await CheckPlayerInGroup(UserId);

  // If player not found in group, return true
  if (!PlayerInGroup) {
    return true;
  }

  return false;
}

async function CheckPlayerExists(Id: string): Promise<number | undefined> {
  const URL = `https://users.roblox.com/v1/usernames/users`;

  try {
    // Get response
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ usernames: [Id] }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const ParsedResult: PlayerJSON[] | [] = JSON.parse(
      await response.text()
    ).data;

    // Check if returned player is same as input player
    if (ParsedResult.length > 0) {
      // Player found
      const PlayerData = ParsedResult[0];
      if (PlayerData.name.toLowerCase() === Id) {
        // Return user id
        return PlayerData.id;
      } else {
        // Return nothing, invalid player
        return;
      }
    } else {
      // Player not found
      return;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  return;
}

async function CheckPlayerInGroup(UserId: number): Promise<boolean> {
  const CurrentURL = `https://groups.roblox.com/v1/users/${UserId}/groups/roles`;

  try {
    // Get response
    const response = await fetch(CurrentURL);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const ParsedResult: GroupJSON = JSON.parse(await response.text()).data;

    // Check if player is found
    for (let i = 0; i < ParsedResult.length; i++) {
      // Get username
      const CurrentGroup = ParsedResult[i];
      const GroupId = CurrentGroup.group.id;
      const RoleId = CurrentGroup.role.id;

      // Group found
      if (String(GroupId) == GROUP_ID) {
        if (String(RoleId) == ROLE_ID) {
          // AT role
          console.warn(
            `The player with the id ${UserId} is of AT rank, but wasn't caught when getting Usernames.`
          );
        } else {
          // Not AT, probably died
          return true;
        }
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  // Group never found, not in group
  return false;
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

// Other Functions
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
  const Scores = await GetData(file, max);

  Scores.forEach(async (data) => {
    const name = data.Name;
    const score = data.Score;
    const Id = GetIdFromUsername(name);
    const player = GetPlayer(Id);

    if (player) {
      // Player exists as AT
      func(player, score);
    } else {
      // Check if player should be logged
      const LogPlayer = await FindInvalidPlayer(name);
      if (!LogPlayer) {
        return;
      }

      // If should be logged, create obj
      let MissingPlayer = GetMissingPlayer(name);
      if (!MissingPlayer) {
        MissingPlayer = AddMissingPlayer(name);
      }

      // Run score func
      func(MissingPlayer, score);
    }
  });
}

async function GetData(file: string, max: number) {
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

    for (const [key] of Object.entries(LinesToCheck)) {
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
