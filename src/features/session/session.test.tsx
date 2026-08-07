import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('../../api/client', () => ({
  ApiError: class ApiError extends Error {
    kind: string;
    status: number;
    constructor(kind: string, status: number) { super(kind); this.kind = kind; this.status = status; }
  },
  apiClient: { request: mocks.request },
}));

import { SessionProvider, useSession } from './session';

const member = { birthDate: '19900101', email: 'member@example.com', loginId: 'member01', name: '회원', phone: '010-1234-5678' };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => { resolve = next; });
  return { promise, resolve };
}

function SessionProbe() {
  const session = useSession();
  return <>
    <output>{session.status}:{session.member?.loginId ?? ''}</output>
    <button onClick={() => { void session.login({ loginId: 'member01', password: 'password' }); }}>로그인</button>
    <button onClick={() => { void session.logout(); }}>로그아웃</button>
    <button onClick={() => { void session.refresh(); }}>새로고침</button>
  </>;
}

async function renderProvider() {
  render(<SessionProvider><SessionProbe /></SessionProvider>);
  await act(async () => {});
}

afterEach(() => { cleanup(); mocks.request.mockReset(); });

describe('SessionProvider', () => {
  it('login_mountRefreshCompletesLate_keepsNewerLoginMember', async () => {
    const mountRead = deferred<unknown>();
    const loginRead = deferred<unknown>();
    mocks.request.mockImplementation((path: string) => {
      if (path === '/api/v1/auth/login') return Promise.resolve(undefined);
      return mocks.request.mock.calls.filter(([requested]) => requested === '/api/v1/members/me').length === 1 ? mountRead.promise : loginRead.promise;
    });
    await renderProvider();

    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    await act(async () => { loginRead.resolve(member); });
    expect(screen.getByRole('status')).toHaveTextContent('authenticated:member01');

    await act(async () => { mountRead.resolve({ ...member, loginId: 'stale-member' }); });
    expect(screen.getByRole('status')).toHaveTextContent('authenticated:member01');
  });

  it('logout_mountRefreshCompletesLate_keepsAnonymousState', async () => {
    const mountRead = deferred<unknown>();
    mocks.request.mockImplementation((path: string) => path === '/api/v1/auth/logout' ? Promise.resolve(undefined) : mountRead.promise);
    await renderProvider();

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    await act(async () => {});
    expect(screen.getByRole('status')).toHaveTextContent('anonymous:');

    await act(async () => { mountRead.resolve(member); });
    expect(screen.getByRole('status')).toHaveTextContent('anonymous:');
  });

  it('logout_manualRefreshCompletesLate_keepsAnonymousState', async () => {
    const mountRead = deferred<unknown>();
    const manualRead = deferred<unknown>();
    mocks.request.mockImplementation((path: string) => {
      if (path === '/api/v1/auth/logout') return Promise.resolve(undefined);
      return mocks.request.mock.calls.filter(([requested]) => requested === '/api/v1/members/me').length === 1 ? mountRead.promise : manualRead.promise;
    });
    await renderProvider();

    fireEvent.click(screen.getByRole('button', { name: '새로고침' }));
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    await act(async () => {});
    await act(async () => { manualRead.resolve(member); mountRead.resolve(member); });
    expect(screen.getByRole('status')).toHaveTextContent('anonymous:');
  });
});
