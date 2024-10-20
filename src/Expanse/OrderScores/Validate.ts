// Modules
import {
  GROUP_ID,
  ROLE_ID,
  GetMissingPlayers,
  RemoveMissingPlayer,
} from "./Storage.js";

// Types
type PlayerData = {
  Username: string;
  UserId: number;
};
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

// Module Setup
export async function index() {
  const Usernames = GetUsernames();
  const PlayerData = await CheckPlayersExist(Usernames);
  const PlayersInGroup = await CheckPlayersInGroup(PlayerData);
  await RemovePlayers(PlayersInGroup);
}

function GetUsernames() {
  const MissingPlayers = GetMissingPlayers();
  let usernames: string[] = [];

  for (const [_, player] of MissingPlayers) {
    usernames.push(player.Username);
  }

  return usernames;
}

async function CheckPlayersExist(Usernames: string[]) {
  const URL = `https://users.roblox.com/v1/usernames/users`;
  let PlayerData: PlayerData[] = [];

  try {
    // Get response
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ usernames: Usernames }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const ParsedResult: PlayerJSON[] = JSON.parse(await response.text()).data;

    // Add usernames to user id list
    for (let i = 0; i < ParsedResult.length; i++) {
      const Username = ParsedResult[i].name;
      const UserId = ParsedResult[i].id;
      PlayerData.push({ Username: Username, UserId: UserId });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  return PlayerData;
}

async function CheckPlayersInGroup(PlayerData: PlayerData[]) {
  let Promises: Promise<void>[] = [];
  let PlayersInGroup: string[] = [];

  // Loop through every player
  for (let i = 0; i < PlayerData.length; i++) {
    const Player = PlayerData[i];

    // Add promise to tbl
    Promises.push(
      // Check player in group
      CheckPlayerInGroup(Player.UserId).then((InGroup: boolean) => {
        // If in group, add user to tbl
        if (InGroup) {
          PlayersInGroup.push(Player.Username);
        }
      })
    );
  }

  // Wait for promises to resolve
  await Promise.all(Promises);

  return PlayersInGroup;
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

function RemovePlayers(Usernames: string[]) {
  let Promises: Promise<void>[] = [];

  for (const username of Usernames) {
    Promises.push(
      new Promise((resolve) => {
        RemoveMissingPlayer(username);
        resolve();
      })
    );
  }

  return Promise.all(Promises);
}
