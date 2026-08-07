import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { ApiError, apiClient } from '../../api/client';

export type Member = Readonly<{
  loginId: string;
  name: string;
  email: string;
  birthDate: string;
  phone: string;
}>;

export type RegisterInput = Readonly<{
  loginId: string;
  password: string;
  name: string;
  birthDate: string;
  email: string;
  phone: string;
}>;

export type LoginInput = Readonly<Pick<RegisterInput, 'loginId' | 'password'>>;

type SessionState =
  | Readonly<{ status: 'checking'; member: undefined }>
  | Readonly<{ status: 'anonymous'; member: undefined }>
  | Readonly<{ status: 'authenticated'; member: Member }>
  | Readonly<{ status: 'error'; member: undefined }>;

export type Session = SessionState & Readonly<{
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
}>;

const SessionContext = createContext<Session | undefined>(undefined);

function isMember(value: unknown): value is Member {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return ['loginId', 'name', 'email', 'birthDate', 'phone'].every((key) => typeof record[key] === 'string');
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>({ status: 'checking', member: undefined });
  const generation = useRef(0);

  const loadMember = useCallback(async (requestGeneration: number) => {
    try {
      const response = await apiClient.request<unknown>('/api/v1/members/me');
      if (!isMember(response)) throw new ApiError('server', 500);
      if (requestGeneration === generation.current) setState({ status: 'authenticated', member: response });
    } catch (error) {
      if (requestGeneration !== generation.current) return;
      if (error instanceof ApiError && error.kind === 'unauthorized') {
        setState({ status: 'anonymous', member: undefined });
        return;
      }
      setState({ status: 'error', member: undefined });
    }
  }, []);

  const refresh = useCallback(async () => {
    const requestGeneration = ++generation.current;
    await loadMember(requestGeneration);
  }, [loadMember]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => () => { generation.current += 1; }, []);

  const value = useMemo<Session>(() => ({
    ...state,
    async login(input) {
      const requestGeneration = ++generation.current;
      await apiClient.request('/api/v1/auth/login', { body: input, method: 'POST' });
      if (requestGeneration === generation.current) await loadMember(requestGeneration);
    },
    async logout() {
      const requestGeneration = ++generation.current;
      await apiClient.request('/api/v1/auth/logout', { method: 'POST' });
      if (requestGeneration === generation.current) setState({ status: 'anonymous', member: undefined });
    },
    refresh,
    async register(input) {
      await apiClient.request('/api/v1/members', { body: input, method: 'POST' });
    },
  }), [loadMember, refresh, state]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('SessionProvider is required.');
  return session;
}

export function loginPathFor(returnTo: string): string {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}
