// Hamkor paneli ikonlari (Figma: Material / vuesax uslubida)
type P = { className?: string };

export const GroupFillIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);
export const TableFillIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M21.96 9.73l-1.43-5a.996.996 0 00-.96-.73H4.43c-.45 0-.84.3-.96.73l-1.43 5c-.18.64.3 1.27.96 1.27h2.2L4 20h2l.67-5h10.67l.66 5h2l-1.2-9H21c.66 0 1.14-.63.96-1.27zM6.93 13l.27-2h9.6l.27 2H6.93z" />
  </svg>
);
export const CheckCircleFillIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);
export const PhoneFillIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
  </svg>
);
export const FilterLinesIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M4 7h16M7 12h10M10 17h4" />
  </svg>
);
export const ClockOutlineIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);
export const StoreIcon = ({ className }: P) => (
  <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
    <path d="M3 4.5h22l1.5 5.5H1.5L3 4.5z" />
    <path d="M1.5 10c0 1.6 1.4 2.8 3.1 2.8S7.8 11.6 7.8 10c0 1.6 1.4 2.8 3.1 2.8S14 11.6 14 10c0 1.6 1.4 2.8 3.1 2.8s3.1-1.2 3.1-2.8c0 1.6 1.4 2.8 3.1 2.8s3.2-1.2 3.2-2.8" />
    <path d="M5 7.2h2M10 7.2h2M16 7.2h2M21 7.2h2" />
    <path d="M3.5 13v11M24.5 13v11M2 24.5h24M8 24V17h4v7M15 17h6v4h-6z" />
  </svg>
);
export const UsersOutlineIcon = ({ className }: P) => (
  <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
    <circle cx="10.5" cy="8.5" r="4.5" />
    <path d="M3 23.5c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5c0 1-.8 1.5-1.8 1.5H4.8C3.8 25 3 24.5 3 23.5z" />
    <path d="M17.5 4.4a4.5 4.5 0 010 8.2M20.5 16.6c2.7 1 4.5 3.6 4.5 6.6 0 1-.7 1.6-1.6 1.6h-1.6" />
  </svg>
);
/** Kichik o'sish belgisi (+12% yonida) */
export const TrendIcon = ({ className }: P) => (
  <svg viewBox="0 0 20 20" className={className} aria-hidden>
    <rect width="20" height="20" rx="4" fill="currentColor" opacity=".2" />
    <path d="M6.5 13V9M10 13V6.5M13.5 13v-2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
export const PersonFillIcon = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden><circle cx="8" cy="4.5" r="3.2" /><path d="M1.8 14.3c0-3.1 2.8-5.2 6.2-5.2s6.2 2.1 6.2 5.2c0 .5-.4.9-.9.9H2.7c-.5 0-.9-.4-.9-.9z" /></svg>
);
