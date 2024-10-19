// Modules
import { GROUP_ID, ROLE_ID, AddPlayer } from "./Storage.js";

// Types
type ParsedJSON = {
  nextPageCursor: string | null;
  data: ParsedPlayers;
};
type ParsedPlayers = {
  username: string;
}[];

// Variables
let NextCursor: string | null = "";
let FetchCompleted = false;
let AmtProcessed = 0;
let FetchedData: ParsedPlayers[] = [];

// Module Setup
export async function index() {
  // Run funcs and yield until completed
  await Promise.all([FetchUsernames(), ProcessUsernames()]);
}

async function FetchUsernames() {
  // Repeat until next cursor is nil
  while (typeof NextCursor == "string") {
    const CurrentURL = `https://groups.roblox.com/v1/groups/${GROUP_ID}/roles/${ROLE_ID}/users?limit=100&sortOrder=Desc&cursor=${NextCursor}&`;

    try {
      // Get response
      const response = await fetch(CurrentURL);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const ParsedResult: ParsedJSON = JSON.parse(await response.text());

      // Assign new cursor
      NextCursor = ParsedResult.nextPageCursor;

      // Add usernames to data
      FetchedData.push(ParsedResult.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  FetchCompleted = true;
}

async function ProcessUsernames() {
  while (!FetchCompleted) {
    // Yield until has data
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (FetchedData.length >= AmtProcessed + 1) {
          clearInterval(interval); // Stop checking once the condition is true
          resolve(null); // Resolve the promise and continue
        }
      }, 10);
    });

    // Process usernames
    FetchedData[AmtProcessed].forEach((playerData) => {
      AddPlayer(playerData.username);
    });

    // Increment amt processed
    AmtProcessed += 1;
  }
}
