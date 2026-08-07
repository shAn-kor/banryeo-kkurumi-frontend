import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useSession } from '../features/session';
import { Button, Card, Container, Page, Section, TextInput } from '../shared/design';
import { ErrorState } from '../shared/states';
import './storefront-pages.css';

const initial = { birthDate: '', email: '', loginId: '', name: '', password: '', phone: '' };

function readableError(error: unknown): string {
  if (error instanceof ApiError && error.kind === 'conflict') return '이미 사용 중인 회원 정보입니다.';
  if (error instanceof ApiError && error.kind === 'validation') return '입력 내용을 다시 확인해 주세요.';
  return '회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

export default function SignupPage() {
  const session = useSession();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [form, setForm] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  function change(key: keyof typeof initial, next: string) { setForm({ ...form, [key]: next }); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(undefined);
    try {
      await session.register(form);
      const returnTo = search.get('returnTo');
      navigate(`/login?registered=1${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`);
    } catch (caught) { setError(readableError(caught)); } finally { setPending(false); }
  }

  return <Page><Container><Section className="storefront-page" labelledBy="signup-title"><Card className="auth-card"><p className="page-kicker">MEMBERSHIP</p><h1 className="storefront-page__heading" id="signup-title">회원가입</h1><p className="storefront-page__intro">반려꾸러미를 이용할 회원 정보를 입력해 주세요.</p>{error && <ErrorState>{error}</ErrorState>}<form className="auth-form" onSubmit={submit}>
    <label htmlFor="signup-login-id">아이디<TextInput autoComplete="username" id="signup-login-id" minLength={1} onChange={(event) => change('loginId', event.target.value)} required value={form.loginId} /></label>
    <label htmlFor="signup-password">비밀번호<TextInput autoComplete="new-password" id="signup-password" minLength={1} onChange={(event) => change('password', event.target.value)} required type="password" value={form.password} /></label>
    <label htmlFor="signup-name">이름<TextInput autoComplete="name" id="signup-name" minLength={1} onChange={(event) => change('name', event.target.value)} required value={form.name} /></label>
    <label htmlFor="signup-birth-date">생년월일<TextInput aria-describedby="signup-birth-date-hint" id="signup-birth-date" inputMode="numeric" onChange={(event) => change('birthDate', event.target.value)} pattern="[0-9]{8}" placeholder="19900101" required value={form.birthDate} /></label><p className="auth-form__hint" id="signup-birth-date-hint">숫자 8자리로 입력해 주세요.</p>
    <label htmlFor="signup-email">이메일<TextInput autoComplete="email" id="signup-email" onChange={(event) => change('email', event.target.value)} required type="email" value={form.email} /></label>
    <label htmlFor="signup-phone">휴대폰 번호<TextInput aria-describedby="signup-phone-hint" autoComplete="tel" id="signup-phone" onChange={(event) => change('phone', event.target.value)} pattern="010-[0-9]{4}-[0-9]{4}" placeholder="010-1234-5678" required value={form.phone} /></label><p className="auth-form__hint" id="signup-phone-hint">010-0000-0000 형식으로 입력해 주세요.</p>
    <div className="form-actions"><Button disabled={pending} type="submit">{pending ? '회원가입 중' : '회원가입'}</Button><Link className="inline-link" to="/login">이미 회원이신가요?</Link></div>
  </form></Card></Section></Container></Page>;
}
