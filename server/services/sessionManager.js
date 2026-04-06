const { v4: uuidv4 } = require('uuid');

const SESSION_IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;
const MAX_SESSIONS = 10;

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.cleanupTimer = null;
  }

  startCleanup() {
    this.cleanupTimer = setInterval(() => this._reapIdle(), CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();
  }

  async createSession(browser, url, viewport = { width: 1280, height: 720 }) {
    if (this.sessions.size >= MAX_SESSIONS) {
      throw new Error(`Maximum concurrent sessions (${MAX_SESSIONS}) reached`);
    }

    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
      // Some pages never reach networkidle -- that's fine
    }

    const sessionId = uuidv4();
    this.sessions.set(sessionId, {
      context,
      page,
      viewport,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });

    return { sessionId, page, viewport };
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.lastActivity = Date.now();
    return session;
  }

  async destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    await session.context.close();
    this.sessions.delete(sessionId);
    return true;
  }

  async destroyAll() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    const ids = [...this.sessions.keys()];
    await Promise.all(ids.map((id) => this.destroySession(id)));
  }

  _reapIdle() {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity > SESSION_IDLE_TIMEOUT_MS) {
        session.context.close().catch(() => {});
        this.sessions.delete(id);
      }
    }
  }
}

module.exports = new SessionManager();
