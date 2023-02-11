import * as dotenv from "dotenv";
dotenv.config();

import { buildEmail } from "./src/email";
import { getNewResults } from "./src/puppeteer";

(async () => {
  const results = await getNewResults();
  await buildEmail(results);
})();
