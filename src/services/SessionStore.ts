import { UssdSession, UssdSessionData, UssdStep } from "../types/ussd";

const SESSION_TTL_MS = 5 * 60 * 1000;

/**
 * In-memory session store, keyed by the gateway's sessionId. Swap this out
 * for a DB-backed store (mirroring cush's UssdSession model) once this
 * service needs to survive restarts or run behind multiple instances.
 */
export class SessionStore {
  private sessions = new Map<string, UssdSession>();

  get(sessionId: string): UssdSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session && Date.now() - session.updatedAt > SESSION_TTL_MS) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    return session;
  }

  getOrCreate(sessionId: string, phone: string): UssdSession {
    const existing = this.get(sessionId);
    if (existing) return existing;
    const fresh: UssdSession = {
      sessionId,
      phone,
      step: "main_menu",
      data: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.sessions.set(sessionId, fresh);
    return fresh;
  }

  update(sessionId: string, step: UssdStep, data: UssdSessionData): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.step = step;
    session.data = data;
    session.updatedAt = Date.now();
  }

  end(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
