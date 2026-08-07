import type { ComponentPropsWithoutRef, PropsWithChildren } from 'react';

type ClassNameProps = PropsWithChildren<{
  className?: string;
}>;

export function Page({ children, className = '' }: ClassNameProps) {
  return <div className={`ds-page ${className}`.trim()}>{children}</div>;
}

export function Container({ children, className = '' }: ClassNameProps) {
  return <div className={`ds-container ${className}`.trim()}>{children}</div>;
}

type SectionProps = ClassNameProps & {
  ariaLabel?: string;
  labelledBy?: string;
};

export function Section({ ariaLabel, children, className = '', labelledBy }: SectionProps) {
  return <section className={`ds-section ${className}`.trim()} aria-label={ariaLabel} aria-labelledby={labelledBy}>{children}</section>;
}

export function Card({ children, className = '' }: ClassNameProps) {
  return <div className={`ds-card ${className}`.trim()}>{children}</div>;
}

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  tone?: 'primary' | 'secondary';
};

export function Button({ children, className = '', tone = 'primary', type = 'button', ...props }: ButtonProps) {
  return <button {...props} className={`ds-button ds-button--${tone} ${className}`.trim()} type={type}>{children}</button>;
}

export function TextInput({ className = '', ...props }: ComponentPropsWithoutRef<'input'>) {
  return <input {...props} className={`ds-input ${className}`.trim()} />;
}

type BadgeProps = ClassNameProps & {
  tone?: 'neutral' | 'positive' | 'warning';
};

export function Badge({ children, className = '', tone = 'neutral' }: BadgeProps) {
  return <span className={`ds-badge ds-badge--${tone} ${className}`.trim()}>{children}</span>;
}

export function Skeleton({ label = '불러오는 중', className = '' }: { label?: string; className?: string }) {
  return <span aria-label={label} className={`ds-skeleton ${className}`.trim()} role="status" />;
}

type NoticeProps = ClassNameProps & {
  tone?: 'info' | 'warning';
};

export function Notice({ children, className = '', tone = 'info' }: NoticeProps) {
  return <div className={`ds-notice ds-notice--${tone} ${className}`.trim()} role="status">{children}</div>;
}
