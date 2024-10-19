// Modules
import { question } from "readline-sync";
import * as Files from "./Files.js";
import { index as OrderScores } from "./OrderScores/index.js";
import * as xlsx from "xlsx";

// Variables
const QUESTION =
  "What action?\r\n1. Create Files\r\n2. Clear Files\r\n3. Order Scores\r\n4. Quit\r\n> ";

// Module Setup
export async function main() {
  while (true) {
    const answer = question(QUESTION);

    if (answer == "1") {
      await Files.Create();
    } else if (answer == "2") {
      await Files.Clear();
    } else if (answer == "3") {
      await OrderScores();
    } else if (answer == "4") {
      break;
    } else if (answer == "5") {
      Test();
    } else {
      console.log("Invalid input!");
    }
  }
}

function Test() {
  const WORK_BOOK = xlsx.utils.book_new();
  const tempData: string[][] = [
    ["a", "b", "c"],
    ["d", "e", "f"],
  ];

  xlsx.utils.book_append_sheet(
    WORK_BOOK,
    xlsx.utils.aoa_to_sheet(tempData),
    "Sheet1"
  );

  console.log(WORK_BOOK);
  xlsx.writeFile(WORK_BOOK, "src/Expanse/Scores.xlsx");
}
