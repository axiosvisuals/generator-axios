const puppeteer = require("puppeteer");
const jimp = require("jimp");

const url = "https://graphics.axios.com/2021-01-19-global-cities/index.html";
const destinationPath = "../src/fallbacks";
const slug = "slug"; // todo: get this from gulpfile/project config

const fallbacks = [
  { name: "apple", width: 375 },
  { name: "fallback", width: 600 },
  { name: "social", width: 800, height: 450 }
];

const takeScreenshot = async size => {
  let browser = await puppeteer.launch({ headless: true });
  let page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

  // Constrain width and adjust height to fit everything in .chart-container
  await page.setViewport({
    width: size.width,
    height: 800 // arbitrary, will be reset below
  });
  const example = await page.$(".chart-container");
  const chartContainerSize = await example.boundingBox();
  await page.setViewport({
    width: size.width,
    height: chartContainerSize.height,
    deviceScaleFactor: 2 // retina
  });

  // Capture all of .chart-container
  const clip = {
    x: chartContainerSize.x,
    y: chartContainerSize.y,
    width: chartContainerSize.width,
    height: chartContainerSize.height
  };

  // Take the shot
  await page.screenshot({
    path: `${destinationPath}/${slug}-${size.name}.png`,
    type: "png",
    clip
  });
  await page.close();
  await browser.close();
};

const resizeSocial = async dms => {
  const imageToResize = await jimp.read(
    `${destinationPath}/${slug}-social.png`
  );
  imageToResize
    .background(0xffffffff)
    .contain(dms.width * 2, dms.height * 2) // contain within these dimensions
    .write(`${destinationPath}/${slug}-social-resized.png`);
};

const init = async () => {
  await Promise.all(fallbacks.map(size => takeScreenshot(size)));
  await resizeSocial(fallbacks.filter(d => d.name === "social")[0]);
  console.log("done ✨");
};

init();
