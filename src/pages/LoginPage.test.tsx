import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ login: vi.fn() }));

vi.mock('../features/session', () => ({
  useSession: () => ({ login: mocks.login, status: 'authenticated' }),
}));

import LoginPage, { safeReturnTo } from './LoginPage';

afterEach(() => { cleanup(); mocks.login.mockReset(); });

function LocationProbe() {
  return <output>{useLocation().pathname}{useLocation().search}{useLocation().hash}</output>;
}

function renderLogin(entry: string) {
  render(<MemoryRouter initialEntries={[entry]}><Routes><Route element={<LoginPage />} path="/login" /><Route element={<LocationProbe />} path="*" /></Routes></MemoryRouter>);
}

describe('safeReturnTo', () => {
  it.each([
    ['//evil.example'],
    ['/\\evil.example'],
    ['/%5Cevil.example'],
    ['https://evil.example'],
    ['/orders/%'],
    [`/orders/${String.fromCharCode(0)}control`],
  ])('adversarialPath_returnsRoot(%s)', (value) => {
    expect(safeReturnTo(value)).toBe('/');
  });

  it('internalPath_preservesPathQueryAndHash', () => {
    expect(safeReturnTo('/orders/uuid?from=list#x')).toBe('/orders/uuid?from=list#x');
  });

  it('decodedBackslashFromSearchParams_returnsRoot', () => {
    expect(safeReturnTo(new URLSearchParams('returnTo=/%5Cevil.example').get('returnTo'))).toBe('/');
  });
});

describe('LoginPage', () => {
  it('login_adversarialReturnTo_navigatesOnlyToInternalRoot', async () => {
    mocks.login.mockResolvedValue(undefined);
    renderLogin('/login?returnTo=/%5Cevil.example');
    fireEvent.change(screen.getByLabelText('아이디'), { target: { value: 'member01' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password' } });
    fireEvent.submit(screen.getByRole('button', { name: '로그인' }).closest('form')!);

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('/'));
    expect(mocks.login).toHaveBeenCalledWith({ loginId: 'member01', password: 'password' });
  });
});
