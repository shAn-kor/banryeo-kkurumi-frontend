import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useSession } from '../features/session';
import { Button, Card, Container, Notice, Page, Section, TextInput } from '../shared/design';
import { ErrorState } from '../shared/states';
import './storefront-pages.css';

function safeReturnTo(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export default function LoginPage() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [search] = useSearchParams();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const returnTo = safeReturnTo(search.get('returnTo'));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(undefined);
    try { await session.login({ loginId, password }); navigate(returnTo, { replace: true }); }
    catch (caught) { setError(caught instanceof ApiError && caught.kind === 'unauthorized' ? '아이디 또는 비밀번호를 확인해 주세요.' : '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.'); }
    finally { setPending(false); }
  }

  const signupPath = `/signup?returnTo=${encodeURIComponent(returnTo)}`;
  return <Page><Container><Section className="storefront-page" labelledBy="login-title"><Card className="auth-card"><p className="page-kicker">WELCOME BACK</p><h1 className="storefront-page__heading" id="login-title">로그인</h1>{search.get('registered') === '1' && <Notice>회원가입이 완료되었습니다. 로그인해 주세요.</Notice>}{location.state && <Notice>계속하려면 로그인해 주세요.</Notice>}{error && <ErrorState>{error}</ErrorState>}
    <form className="auth-form" onSubmit={submit}><label htmlFor="login-id">아이디<TextInput autoComplete="username" id="login-id" onChange={(event) => setLoginId(event.target.value)} required value={loginId} /></label><label htmlFor="login-password">비밀번호<TextInput autoComplete="current-password" id="login-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label><div className="form-actions"><Button disabled={pending || session.status === 'checking'} type="submit">{pending ? '로그인 중' : '로그인'}</Button><Link className="inline-link" to={signupPath}>회원가입</Link></div></form>
  </Card></Section></Container></Page>;
}
