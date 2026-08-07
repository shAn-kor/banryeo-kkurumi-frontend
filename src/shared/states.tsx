import type { ReactNode } from 'react';

export function LoadingState(): ReactNode {
  return <p role="status">불러오는 중입니다.</p>;
}

export function EmptyState({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return <section className="state-card"><p>{children}</p></section>;
}

export function ErrorState({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return <section className="state-card" role="alert"><p>{children}</p></section>;
}

export function OfflineNotice(): ReactNode {
  return <p className="offline-notice" role="status">인터넷 연결을 확인해 주세요. 연결되면 최신 정보를 다시 불러옵니다.</p>;
}
