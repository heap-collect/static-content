/* eslint-env browser */
const { Router } = require('express');
const sessionManager = require('../services/sessionManager');
const {
  takeScreenshot,
  remapCoordinates,
  clickAtCoordinates,
  waitForDomSettle,
} = require('../services/screenshotService');

const router = Router();

// POST /api/sessions -- Create a new browser session and navigate to a URL
router.post('/', async (req, res, next) => {
  try {
    const { url, viewport } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const browser = req.app.locals.browser;
    const { sessionId, page, viewport: vp } = await sessionManager.createSession(browser, url, viewport);
    const { buffer, width, height } = await takeScreenshot(page);

    res.json({
      sessionId,
      screenshot: buffer.toString('base64'),
      viewport: vp,
      screenshotSize: { width, height },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:sessionId -- Session status
router.get('/:sessionId', (req, res) => {
  const session = sessionManager.getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({
    sessionId: req.params.sessionId,
    url: session.page.url(),
    alive: true,
  });
});

// POST /api/sessions/:sessionId/click -- Click at coordinates and re-screenshot
router.post('/:sessionId/click', async (req, res, next) => {
  try {
    const session = sessionManager.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const { x, y, screenshotDisplayWidth, screenshotDisplayHeight } = req.body;
    if (x == null || y == null || !screenshotDisplayWidth || !screenshotDisplayHeight) {
      return res.status(400).json({
        error: 'x, y, screenshotDisplayWidth, and screenshotDisplayHeight are required',
      });
    }

    // Get current screenshot dimensions for remapping
    const currentSize = await session.page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    }));

    const { absX, absY } = remapCoordinates(
      x,
      y,
      screenshotDisplayWidth,
      screenshotDisplayHeight,
      currentSize.width,
      currentSize.height,
    );

    await clickAtCoordinates(session.page, absX, absY, session.viewport.height);
    await waitForDomSettle(session.page);

    const { buffer, width, height } = await takeScreenshot(session.page);

    res.json({
      screenshot: buffer.toString('base64'),
      screenshotSize: { width, height },
      clickedAt: { viewportX: absX, viewportY: absY },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sessions/:sessionId -- Close session
router.delete('/:sessionId', async (req, res, next) => {
  try {
    const destroyed = await sessionManager.destroySession(req.params.sessionId);
    if (!destroyed) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
