import * as dotenv from "dotenv";
dotenv.config();
console.log(process.env);
console.log(process.env.HEMNET_URL);
console.log(process.env.EMAIL_RECIEVERS);
import { buildEmail } from "./src/email";
import { getNewResults } from "./src/puppeteer";

(async () => {
  const results = await getNewResults();
  await buildEmail(results);
})();
