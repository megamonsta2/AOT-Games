// Modules
import { question } from "readline-sync";
import { exit } from "process";
import { main as Expanse } from "./Expanse/index.js";

// Variables
const QUESTION =
  "What game?\r\n1. AOT:U\r\n2. Expanse\r\n3. Despair\r\n4. Quit\r\n> ";

// Module Setup
async function main() {
  while (true) {
    // Yield until answer
    const answer = question(QUESTION);

    if (answer == "1") {
      console.log("AOT: U!");
    } else if (answer == "2") {
      console.log("Expanse!");
      await Expanse();
    } else if (answer == "3") {
      console.log("Despair!");
    } else if (answer == "4") {
      exit();
    } else {
      console.log("Invalid input!");
    }
  }
}

main();
