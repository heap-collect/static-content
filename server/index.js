const { chromium } = require('playwright');
const app = require('./app');
const sessionManager = require('./services/sessionManager');

const PORT = process.env.PORT || 3000;

async function start() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
  const browser = await chromium.launch({ headless: true, executablePath });
  app.locals.browser = browser;

  sessionManager.startCleanup();

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('API endpoints:');
    console.log('  POST   /api/sessions              - Create session & screenshot');
    console.log('  GET    /api/sessions/:id           - Session status');
    console.log('  POST   /api/sessions/:id/click     - Click & re-screenshot');
    console.log('  DELETE /api/sessions/:id           - Close session');
  });

  async function shutdown() {
    console.log('\nShutting down...');
    await sessionManager.destroyAll();
    await browser.close();
    server.close(() => process.exit(0));
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
