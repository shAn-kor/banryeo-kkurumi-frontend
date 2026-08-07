import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SignupPage from './SignupPage';

vi.mock('../features/session', () => ({
  useSession: () => ({ register: vi.fn() }),
}));

afterEach(cleanup);

function renderPage() {
  render(<MemoryRouter><SignupPage /></MemoryRouter>);
}

describe('SignupPage', () => {
  it('nativePattern_normalBirthDateAndPhone_areValid', () => {
    renderPage();
    const birthDate = screen.getByLabelText('생년월일') as HTMLInputElement;
    const phone = screen.getByLabelText('휴대폰 번호') as HTMLInputElement;

    fireEvent.change(birthDate, { target: { value: '19900101' } });
    fireEvent.change(phone, { target: { value: '010-1234-5678' } });

    expect(birthDate).toHaveAttribute('pattern', '[0-9]{8}');
    expect(phone).toHaveAttribute('pattern', '010-[0-9]{4}-[0-9]{4}');
    expect(birthDate.checkValidity()).toBe(true);
    expect(phone.checkValidity()).toBe(true);
  });

  it('nativePattern_malformedBirthDateAndPhone_areInvalid', () => {
    renderPage();
    const birthDate = screen.getByLabelText('생년월일') as HTMLInputElement;
    const phone = screen.getByLabelText('휴대폰 번호') as HTMLInputElement;

    fireEvent.change(birthDate, { target: { value: '1990-01-01' } });
    fireEvent.change(phone, { target: { value: '01012345678' } });

    expect(birthDate.checkValidity()).toBe(false);
    expect(phone.checkValidity()).toBe(false);
  });
});
