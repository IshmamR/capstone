import fs from "fs";
import puppeteer from "puppeteer-extra";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";

puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

/**
 * Get the total number of pages from the webpage with pagination
 * @param {import('puppeteer').Page} page - The Puppeteer page object
 * @returns {Promise<number>} The total number of pages
 */
async function getTotalPages(page) {
  const totalPages = await page.evaluate(() => {
    const pageElements = document.querySelectorAll(
      ".pagination-holder .pagination ul li:not(:first-child):not(:last-child) a"
    );
    if (pageElements.length > 0) {
      // Extract the page number from the last page element
      const lastPageElement = pageElements[pageElements.length - 1];
      const href = lastPageElement.getAttribute("href");
      const match = href.match(/pg=(\d+)/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
    return 1; // Default to 1 page if pagination is not found or empty
  });
  return totalPages;
}

/**
 *
 * @param {import('puppeteer').Page} page
 * @returns {Promise<string>}
 */
async function getTitles(page) {
  const titles = await page.evaluate(() => {
    const imgTags = document.querySelectorAll("img");
    const titles = [];
    imgTags.forEach((img) => {
      const title = img.getAttribute("title");
      if (title && /^[A-Za-z\s]+$/.test(title)) {
        titles.push(title);
      }
    });
    return titles;
  });
  return titles;
}

/**
 *
 * @param {import('puppeteer').Page} page
 * @returns {Promise<{title:string, link:string, cd:string}[]>}
 */
async function getAuthorTitlesWithUrl(page) {
  const writerTitlesAndLinks = await page.evaluate(() => {
    /**
     * @type {{title:string, link:string, cd:string}[]}
     */
    const titlesAndLinks = [];
    const writerElements = document.querySelectorAll(
      ".col-lg-2.col-md-2.col-sm-2.col-xs-12 a"
    );

    writerElements.forEach((writerElement) => {
      const title = writerElement.querySelector("img").getAttribute("title");
      const link = writerElement.getAttribute("href");
      const cd = link.split("=")[1];
      titlesAndLinks.push({ title, link, cd });
    });

    return titlesAndLinks;
  });
  return writerTitlesAndLinks;
}

async function scrape() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://www.amarbooks.org/index.php");

  const totalPages = await getTotalPages(page);
  console.log(totalPages);

  /**
   * @type {Array<{title:string, link:string, cd:string}>}
   */
  const allAuthors = [];

  for (let i = 0; i < totalPages; i++) {
    const pageNo = i + 1;
    await page.goto(`https://www.amarbooks.org/index.php?pg=${[pageNo]}`);
    // const titles = await getTitles(page);

    const authors = await getAuthorTitlesWithUrl(page);
    for (const author of authors) {
      const exists = allAuthors.find((a) => a.cd === author.cd);
      if (!exists) {
        allAuthors.push(author);
      }
    }
  }

  console.log(allAuthors);

  const allAuthorsString = JSON.stringify(allAuthors, null, 2);

  fs.writeFileSync("./authors.json", allAuthorsString);

  // console.log(titles);

  // const body = await page.$("body");
  // const html = await body.evaluate((e) => e.innerHTML);
  // console.log(html);

  await page.close();
  await browser.close();
}

scrape();
