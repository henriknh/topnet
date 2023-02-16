import * as dotenv from "dotenv";
dotenv.config();

import { buildEmail } from "./src/email";
import { getNewResults } from "./src/puppeteer";

(async () => {
  const results = await getNewResults();

  if (Object.keys(results).length === 0) {
    console.log("No matches");
  } else {
    await buildEmail(results);
  }
})();
