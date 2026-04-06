/* eslint-env browser */
const MARGIN_RESET_ID = '__screenshot_reset';

async function injectMarginReset(page) {
  await page.evaluate((id) => {
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = 'html, body { margin: 0 !important; padding: 0 !important; }';
      document.head.appendChild(style);
    }
  }, MARGIN_RESET_ID);
}

async function takeScreenshot(page) {
  await injectMarginReset(page);
  // Abort any pending font/resource loads that would block the screenshot
  await page.evaluate(() => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.catch(() => {});
    }
  });
  const { width, height } = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));
  const buffer = await page.screenshot({ fullPage: true, type: 'png', timeout: 10000 });
  return { buffer, width, height };
}

function remapCoordinates(clickX, clickY, displayWidth, displayHeight, screenshotWidth, screenshotHeight) {
  const scaleX = screenshotWidth / displayWidth;
  const scaleY = screenshotHeight / displayHeight;
  return {
    absX: clickX * scaleX,
    absY: clickY * scaleY,
  };
}

async function clickAtCoordinates(page, absX, absY, viewportHeight) {
  const scrollY = Math.max(0, absY - viewportHeight / 2);
  await page.evaluate((y) => window.scrollTo(0, y), scrollY);
  await page.waitForTimeout(100);

  const viewportRelativeY = absY - scrollY;
  await page.mouse.click(absX, viewportRelativeY, { delay: 50 });
}

async function waitForDomSettle(page) {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 2000 });
  } catch {
    // No navigation happened
  }
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch {
    // Some pages never reach networkidle
  }
  await page.waitForTimeout(300);
}

module.exports = {
  takeScreenshot,
  remapCoordinates,
  clickAtCoordinates,
  waitForDomSettle,
};
