export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  org: string;
}

interface StoredSession {
  token: string;
  user: AuthUser;
}

const STORAGE_KEY = 'rewive_auth';

export function getSession(): StoredSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function getCurrentUser(): AuthUser | null {
  return getSession()?.user ?? null;
}

export function setSession(session: StoredSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
