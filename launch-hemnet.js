const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    //slowMo: 250, // slow down by 250ms
    defaultViewport: null,
    args: [`--window-size=${1920},${1080}`],
  });
  const page = await browser.newPage();
  const wants = [];

  await page.goto(
    // three days no keyword
    "https://www.hemnet.se/bostader?location_ids%5B%5D=473990&location_ids%5B%5D=910066&location_ids%5B%5D=898493&location_ids%5B%5D=474004&location_ids%5B%5D=910092&location_ids%5B%5D=474015&location_ids%5B%5D=473992&location_ids%5B%5D=473991&location_ids%5B%5D=909693&location_ids%5B%5D=898482&item_types%5B%5D=radhus&item_types%5B%5D=bostadsratt&rooms_min=3&price_max=6000000&new_construction=exclude&published_since=3d"

    // one week no keyword
    //"https://www.hemnet.se/bostader?location_ids%5B%5D=473990&location_ids%5B%5D=910066&location_ids%5B%5D=898493&location_ids%5B%5D=474004&location_ids%5B%5D=910092&location_ids%5B%5D=474015&location_ids%5B%5D=473992&location_ids%5B%5D=473991&location_ids%5B%5D=909693&location_ids%5B%5D=898482&item_types%5B%5D=radhus&item_types%5B%5D=bostadsratt&rooms_min=3&price_max=6000000&new_construction=exclude&published_since=1w"

    // one week balcony keyword
    // "https://www.hemnet.se/bostader?location_ids%5B%5D=473990&location_ids%5B%5D=910066&location_ids%5B%5D=898493&location_ids%5B%5D=474004&location_ids%5B%5D=910092&location_ids%5B%5D=474015&location_ids%5B%5D=473992&location_ids%5B%5D=473991&location_ids%5B%5D=909693&location_ids%5B%5D=898482&item_types%5B%5D=radhus&item_types%5B%5D=bostadsratt&rooms_min=3&price_max=6000000&keywords=Balkong&new_construction=exclude&published_since=1w"

    // three days balcony key word
    // "https://www.hemnet.se/bostader?location_ids%5B%5D=473990&location_ids%5B%5D=910066&location_ids%5B%5D=898493&location_ids%5B%5D=474004&location_ids%5B%5D=910092&location_ids%5B%5D=474015&location_ids%5B%5D=473992&location_ids%5B%5D=473991&location_ids%5B%5D=909693&location_ids%5B%5D=898482&item_types%5B%5D=radhus&item_types%5B%5D=bostadsratt&rooms_min=3&price_max=6000000&keywords=Balkong&new_construction=exclude&published_since=3d"
  );
  //Accept terms
  await page.click(
    "body > div.ReactModalPortal > div > div > div > div > div > div:nth-child(2) > div.consent__buttons > div:nth-child(2) > button"
  );

  //Get href from cards
  const hrefs = await page.$$eval(
    "ul.normal-results.qa-organic-results a.js-listing-card-link.listing-card",
    (element) => element.map((a) => a.href)
  );

  //Iterate over the hrefs
  for (let href of hrefs) {
    const newPage = await browser.newPage();
    await newPage.goto(href);

    //Get text from description
    const description = await newPage.$$eval(
      ".property-description",
      (element) => element.map((p) => p.textContent)
    );

    const keywords = ["balkong", "terass"];
    const hasKeyword = keywords.some((keyword) =>
      description[0].toLowerCase().includes(keyword)
    );

    //Get has balcony
    const hasBalcony = await newPage.evaluate(hasKeyword => {
      const balcony = document.querySelector(
        "div.property-attributes-table__row.qa-balcony-attribute dd.property-attributes-table__value"
      );
      const patio = document.querySelector(
        "div.property-attributes-table__row.qa-patio-attribute dd.property-attributes-table__value"
      );

      return (
        balcony?.textContent?.trim().toLowerCase() === "ja" ||
        patio?.textContent?.trim().toLowerCase() === "ja" || 
        hasKeyword
      );
    }, hasKeyword);

    //Get floor value
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

    if (hasBalcony && isTopFloor) {
      //Add to wants
      wants.push(href);
    }
    newPage.close();
  }
  console.log(wants);

  await browser.close();
})();

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}
