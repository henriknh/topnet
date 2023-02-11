import puppeteer, { Browser, Page } from "puppeteer";

if (typeof process.env.HEMNET_URL !== "string") {
  throw "You need to define a environment variable for HEMNET_URL";
}
if (typeof process.env.KEYWORDS_REQUIRED !== "string") {
  throw "You need to define a environment variable for KEYWORDS_REQUIRED";
}
if (typeof process.env.KEYWORDS_OPTIONAL !== "string") {
  throw "You need to define a environment variable for HEMNET_URL";
}

const keywordsRequired =
  (process.env.KEYWORDS_REQUIRED as string)?.split(";") || [];
const keywordsOptional =
  (process.env.KEYWORDS_OPTIONAL as string)?.split(";") || [];

const OTHER_KEY = "other";

export const getNewResults = async (): Promise<object> => {
  const results: any = {};

  const browser = await puppeteer.launch({
    headless: !!process.env.HEADLESS,
    //slowMo: 250, // slow down by 250ms
    defaultViewport: null,
    args: [`--window-size=${1280},${720}`],
  });

  const hemnetObjects = await getHemnetObjects(browser);
  console.log("Potential new objects:", hemnetObjects.length);

  //Iterate over the hrefs
  for (let href of hemnetObjects) {
    const result = await handleObject(browser, href);

    if (typeof result === "string") {
      // Matches a keyword group
      if (!results[result]) results[result] = [];
      results[result].push(href);
    } else if (result) {
      if (!results[OTHER_KEY]) results[OTHER_KEY] = [];
      results[OTHER_KEY].push(href);
    }
  }

  await browser.close();

  return results;
};

const getHemnetObjects = async (browser: Browser): Promise<string[]> => {
  const page = await browser.newPage();

  console.log("Opening Hemnet URL:", process.env.HEMNET_URL);
  await page.goto(process.env.HEMNET_URL as string);

  //Accept terms
  await page.waitForSelector(
    ".consent-model__content-wrapper .consent__buttons button.hcl-button--primary"
  );
  await page.click(
    ".consent-model__content-wrapper .consent__buttons button.hcl-button--primary"
  );

  //Get href from cards
  return await page.$$eval(
    "ul.normal-results.qa-organic-results a.js-listing-card-link.listing-card",
    (element) => element.map((a) => a.href)
  );
};

const handleObject = async (
  browser: Browser,
  href: string
): Promise<boolean | string> => {
  const newPage = await browser.newPage();
  await newPage.goto(href);

  const hasBalcony = await getHasBalcony(newPage);
  const isTopFloor = await getIsTopFloor(newPage);

  //Get text from description
  const description = (
    await newPage.$$eval(
      ".property-description",
      (element) => element.map((p) => p.textContent)?.[0]
    )
  )?.toLowerCase();

  await newPage.close();

  const hasAllRequired = keywordsRequired.length
    ? description &&
      keywordsRequired.every((keywords) =>
        keywords.split("|").some((keyword) => description.includes(keyword))
      )
    : true;

  if (hasAllRequired && hasBalcony && isTopFloor) {
    if (keywordsOptional.length && description) {
      for (const keywords of keywordsOptional) {
        if (
          keywords.split("|").some((keyword) => description.includes(keyword))
        ) {
          return keywords;
        }
      }
    }

    return true;
  }
  return false;
};

const getHasBalcony = async (newPage: Page): Promise<boolean> => {
  const hasBalcony = await newPage.evaluate(() => {
    const balcony = document.querySelector(
      "div.property-attributes-table__row.qa-balcony-attribute dd.property-attributes-table__value"
    );
    const patio = document.querySelector(
      "div.property-attributes-table__row.qa-patio-attribute dd.property-attributes-table__value"
    );

    return (
      balcony?.textContent?.trim().toLowerCase() === "ja" ||
      patio?.textContent?.trim().toLowerCase() === "ja"
    );
  });

  return hasBalcony;
};

const getIsTopFloor = async (newPage: Page): Promise<boolean> => {
  const floorValue = await newPage.evaluate(() => {
    const element = document.querySelector(
      "div.property-attributes-table__row.qa-floor-attribute dd.property-attributes-table__value"
    );
    if (element) {
      return element.textContent;
    }
    return null;
  });

  //Split floorvalue
  let floor,
    topFloor,
    isTopFloor = false;
  const floorValues = floorValue?.split(",")[0].split(" av ");
  if (floorValues) {
    [floor, topFloor] = floorValues;
    isTopFloor = parseInt(floor) === parseInt(topFloor);
  }
  return isTopFloor;
};
