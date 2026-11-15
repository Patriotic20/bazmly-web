// Figma'da vuesax/linear ikonlari ishlatilgan — shu uslubdagi SVG'lar
type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const SearchIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><circle cx="11.5" cy="11.5" r="9.5" /><path d="M22 22l-2-2" /></svg>
);
export const SlidersIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M22 6.5h-6M6 6.5H2M22 17.5h-4M8 17.5H2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <rect x="6" y="3" width="10" height="7" rx="3.5" />
    <rect x="8" y="14" width="10" height="7" rx="3.5" />
  </svg>
);
export const BookmarkTickIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M16.82 2H7.18C5.05 2 3.32 3.74 3.32 5.86v14.09c0 1.8 1.29 2.56 2.87 1.69l4.88-2.71c.52-.29 1.36-.29 1.87 0l4.88 2.71c1.58.88 2.87.12 2.87-1.69V5.86C20.68 3.74 18.95 2 16.82 2z" />
    <path d="M9.59 11l1.5 1.5 4-4" />
  </svg>
);
export const GlobeIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path fillRule="evenodd" d="M12 2a10 10 0 100 20 10 10 0 000-20zM8.04 4.3A8.5 8.5 0 003.5 11.25h3.52c.11-2.5.52-4.92 1.02-6.95zm-1.02 8.45H3.5a8.5 8.5 0 004.54 6.95c-.5-2.03-.91-4.45-1.02-6.95zm1.5 0h6.96c-.13 2.71-.63 5.27-1.25 7.27-.74.17-1.5.23-2.23.23s-1.49-.06-2.23-.23c-.62-2-1.12-4.56-1.25-7.27zm6.96-1.5H8.52c.13-2.71.63-5.27 1.25-7.27A8.6 8.6 0 0112 3.5c.73 0 1.49.06 2.23.23.62 2 1.12 4.56 1.25 7.27zm1.5 1.5c-.11 2.5-.52 4.92-1.02 6.95a8.5 8.5 0 004.54-6.95h-3.52zm3.52-1.5h-3.52c-.11-2.5-.52-4.92-1.02-6.95a8.5 8.5 0 014.54 6.95z" />
  </svg>
);
export const MapIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M2.29 7.78v9.73c0 1.9 1.35 2.68 2.99 1.74l2.35-1.34c.51-.29 1.36-.32 1.89-.05l5.25 2.63c.53.26 1.38.24 1.89-.05l4.33-2.48c.55-.32 1.01-1.1 1.01-1.74V6.49c0-1.9-1.35-2.68-2.99-1.74l-2.35 1.34c-.51.29-1.36.32-1.89.05L9.52 3.52c-.53-.26-1.38-.24-1.89.05L3.3 6.05c-.56.32-1.01 1.1-1.01 1.73zM8.56 4v13M15.73 6.62V20" />
  </svg>
);
export const PercentSquareIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M8.57 15.27l6.54-6.54M8.98 10.37a1.23 1.23 0 100-2.46 1.23 1.23 0 000 2.46zM15.52 16.09a1.23 1.23 0 100-2.46 1.23 1.23 0 000 2.46z" />
    <path d="M9 22h6c5 0 7-2 7-7V9c0-5-2-7-7-7H9C4 2 2 4 2 9v6c0 5 2 7 7 7z" />
  </svg>
);
export const LocationIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 13.43a3.12 3.12 0 100-6.24 3.12 3.12 0 000 6.24z" />
    <path d="M3.62 8.49c1.97-8.66 14.8-8.65 16.76.01 1.15 5.08-2.01 9.38-4.78 12.04a5.19 5.19 0 01-7.21 0c-2.76-2.66-5.92-6.97-4.77-12.05z" />
  </svg>
);
export const ArrowRightIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2}><path d="M14.43 5.93L20.5 12l-6.07 6.07M3.5 12h16.83" /></svg>
);
export const StarIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="#FFA12E">
    <path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z" />
  </svg>
);

export const ChevronLeftIcon = ({ className }: P) => (
  <svg viewBox="0 0 12 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 1.5L1.5 12l9 10.5" /></svg>
);
export const ShareIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.8}>
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);
export const BookmarkPlusIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.6}>
    <path d="M6 2.5h12a1.5 1.5 0 011.5 1.5v17.3l-7.5-4.2-7.5 4.2V4A1.5 1.5 0 016 2.5z" /><path d="M12 7.5v6M9 10.5h6" />
  </svg>
);
export const DiscountIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M21.53 10.6l-1.52-1.52a1.7 1.7 0 01-.48-1.17V5.76c0-.88-.72-1.6-1.6-1.6h-2.15c-.43 0-.86-.17-1.17-.48L13.09 2.16a1.6 1.6 0 00-2.26 0L9.3 3.68c-.31.31-.74.48-1.17.48H5.98c-.88 0-1.6.72-1.6 1.6v2.15c0 .43-.17.86-.48 1.17L2.38 10.6a1.6 1.6 0 000 2.26l1.52 1.52c.31.31.48.74.48 1.17v2.15c0 .88.72 1.6 1.6 1.6h2.15c.43 0 .86.17 1.17.48l1.52 1.52c.62.62 1.64.62 2.26 0l1.52-1.52c.31-.31.74-.48 1.17-.48h2.15c.88 0 1.6-.72 1.6-1.6v-2.15c0-.43.17-.86.48-1.17l1.52-1.52c.63-.61.63-1.63.01-2.26z" />
    <path d="M9 15l6-6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /><circle cx="9.3" cy="9.3" r="1" fill="#fff" /><circle cx="14.7" cy="14.7" r="1" fill="#fff" />
  </svg>
);
export const PlusIcon = ({ className }: P) => (
  <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M10 3v14M3 10h14" /></svg>
);
export const MinusIcon = ({ className }: P) => (
  <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 10h14" /></svg>
);
export const CheckIcon = ({ className }: P) => (
  <svg viewBox="0 0 12 10" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 5.5l3 3 6-7" /></svg>
);
export const UserIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><circle cx="12" cy="7.5" r="4.5" /><path d="M20.5 22c0-3.9-3.8-7-8.5-7s-8.5 3.1-8.5 7" /></svg>
);
export const CallIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M21.97 18.33c0 .36-.08.73-.25 1.09-.17.36-.39.7-.68 1.02-.49.54-1.03.93-1.64 1.18-.6.25-1.25.38-1.95.38-1.02 0-2.11-.24-3.26-.73a17.6 17.6 0 01-3.44-1.98 28.75 28.75 0 01-3.28-2.8 28.42 28.42 0 01-2.79-3.27c-.82-1.14-1.48-2.28-1.96-3.41C2.24 8.67 2 7.58 2 6.54c0-.68.12-1.33.36-1.93.24-.61.62-1.17 1.15-1.67C4.15 2.31 4.85 2 5.59 2c.28 0 .56.06.81.18.26.12.49.3.67.56l2.32 3.27c.18.25.31.48.4.7.09.21.14.42.14.61 0 .24-.07.48-.21.71-.13.23-.32.47-.56.71l-.76.79c-.11.11-.16.24-.16.4 0 .08.01.15.03.23.03.08.06.14.08.2.18.33.49.76.93 1.28.45.52.93 1.05 1.45 1.58.54.53 1.06 1.02 1.59 1.47.52.44.95.74 1.29.92.05.02.11.05.18.08.08.03.16.04.25.04.17 0 .3-.06.41-.17l.76-.75c.25-.25.49-.44.72-.56.23-.14.46-.21.71-.21.19 0 .39.04.61.13.22.09.45.22.7.39l3.31 2.35c.26.18.44.39.55.64.1.25.16.5.16.78z" />
  </svg>
);
export const CardIcon = ({ className, filled }: P & { filled?: boolean }) =>
  filled ? (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M22 7.55v1.2H2V7.4C2 5.11 3.86 3.25 6.15 3.25h11.7C20.14 3.25 22 5.11 22 7.4v.15zM2 10.25v6.35c0 2.29 1.86 4.15 4.15 4.15h11.7c2.29 0 4.15-1.86 4.15-4.15v-6.35H2zm6 6.75H6a.75.75 0 010-1.5h2a.75.75 0 010 1.5zm6.5 0h-4a.75.75 0 010-1.5h4a.75.75 0 010 1.5z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M2 8.5h20M6 16.5h2M10.5 16.5h4" /><path d="M6.44 3.5h11.11c3.56 0 4.45.88 4.45 4.39v8.21c0 3.51-.89 4.39-4.44 4.39H6.44C2.89 20.5 2 19.62 2 16.11V7.89C2 4.38 2.89 3.5 6.44 3.5z" />
    </svg>
  );
export const PlusCircleIcon = ({ className }: P) => (
  <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"><circle cx="10" cy="10" r="9.2" /><path d="M10 6v8M6 10h8" /></svg>
);
export const ChevronRightIcon = ({ className }: P) => (
  <svg viewBox="0 0 10 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 1.5L8.5 10l-7 8.5" /></svg>
);
// vuesax/linear/discount-shape — to'q sariq doira ichida oq kontur
export const DiscountOutlineIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M3.99 14.66l-1.52-1.52a1.6 1.6 0 010-2.26l1.52-1.52c.26-.26.47-.77.47-1.13V6.08c0-.88.72-1.6 1.6-1.6h2.15c.36 0 .87-.21 1.13-.47l1.52-1.52a1.6 1.6 0 012.26 0l1.52 1.52c.26.26.77.47 1.13.47h2.15c.88 0 1.6.72 1.6 1.6v2.15c0 .36.21.87.47 1.13l1.52 1.52a1.6 1.6 0 010 2.26l-1.52 1.52c-.26.26-.47.77-.47 1.13v2.15c0 .88-.72 1.6-1.6 1.6h-2.15c-.36 0-.87.21-1.13.47l-1.52 1.52a1.6 1.6 0 01-2.26 0l-1.52-1.52c-.26-.26-.77-.47-1.13-.47H6.06c-.88 0-1.6-.72-1.6-1.6v-2.15c0-.37-.21-.88-.47-1.13z" />
    <path d="M9 15l6-6M14.5 14.5h.01M9.5 9.5h.01" strokeWidth={2} />
  </svg>
);
export const ScanIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.7}>
    <path d="M2 9V6.5C2 4.01 4.01 2 6.5 2H9M15 2h2.5C19.99 2 22 4.01 22 6.5V9M22 16v1.5c0 2.49-2.01 4.5-4.5 4.5H16M9 22H6.5C4.01 22 2 19.99 2 17.5V15" />
    <path d="M17 9.5v5c0 2-1 3-3 3h-4c-2 0-3-1-3-3v-5c0-2 1-3 3-3h4c2 0 3 1 3 3zM19 12H5" />
  </svg>
);
export const ShareBoxIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.7}>
    <path d="M9.32 6.5L12 3.83l2.68 2.67M12 11.84V3.9" />
    <path d="M4 12c0 4.42 3 8 8 8s8-3.58 8-8" />
  </svg>
);

// ---------- To'yxona sahifasi ----------
export const MoneyIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <rect x="2" y="5" width="20" height="14" rx="4" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 9.5v5M18 9.5v5" />
  </svg>
);
export const PeopleIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="9.2" cy="7" r="4" />
    <path d="M2.6 21c0-3.9 3-6.6 6.6-6.6 1.6 0 3 .5 4.1 1.3M16.4 3.2a3.8 3.8 0 0 1 0 7.5M17.4 14.6c2.4.6 4 2.6 4 5.4" />
  </svg>
);
export const SpeakerIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 20V9a2.5 2.5 0 0 1 5 0v11M12 6.5V4M15.5 20V7.5M19 20V11" />
  </svg>
);
export const MasksIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" fillRule="evenodd" d="M1.8 5.3c2.7-1.3 5.6-1.6 8.6-.9v5.4c0 3.3-1.9 5.8-4.3 5.8S1.8 13.1 1.8 9.8V5.3zM4.3 8.5a.95.95 0 1 0 1.9 0a.95.95 0 1 0-1.9 0zM7.9 8.5a.95.95 0 1 0 1.9 0a.95.95 0 1 0-1.9 0z" />
    <path fill="currentColor" fillRule="evenodd" d="M12 8.2c3.1-.9 6.6-.7 10.2.8v4.6c0 3.5-2.2 6.2-5 6.2S12 17.1 12 13.6V8.2zM14.6 11.6a1 1 0 1 0 2 0a1 1 0 1 0-2 0zM18.4 11.6a1 1 0 1 0 2 0a1 1 0 1 0-2 0z" />
    <path d="M4.6 12.1c.9.8 2.1.8 3 0M15.4 16.6c1-.9 2.5-.9 3.5 0" fill="none" stroke="#FFF5F0" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
export const SnowflakeIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5M4 10.4l3.4-.9-.9-3.4M20 13.6l-3.4.9.9 3.4M4 13.6l3.4.9-.9 3.4M20 10.4l-3.4-.9.9-3.4" />
  </svg>
);
export const CutleryIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 3v6a3 3 0 0 0 6 0V3M7 3v18M17.5 21V3c-2.3 1.4-3.5 4.3-3.5 8.3V13h3.5" />
  </svg>
);
export const WifiIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M2.5 9.2a14 14 0 0 1 19 0M5.7 12.6a9.4 9.4 0 0 1 12.6 0M9 15.9a4.7 4.7 0 0 1 6 0" />
    <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

// ---------- To'yxona bron oqimi (to'ldirilgan ikonlar) ----------
export const VerifiedIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M12 1.5l2.6 1.9 3.2-.1 1 3.1 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3.1-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3.1-2.6-1.9 1-3.1-1-3.1 2.6-1.9 1-3.1 3.2.1z" />
    <path d="M8 12.2l2.7 2.6L16.2 9.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const GroupIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <circle cx="12" cy="8" r="2.8" /><circle cx="5.5" cy="9.5" r="2.1" /><circle cx="18.5" cy="9.5" r="2.1" />
    <path d="M6.6 17.5c0-3 2.4-5.2 5.4-5.2s5.4 2.2 5.4 5.2v.5H6.6zM1.5 18c0-2.3 1.6-4 3.9-4 .7 0 1.3.1 1.8.4A6.4 6.4 0 0 0 5.4 18zM22.5 18c0-2.3-1.6-4-3.9-4-.7 0-1.3.1-1.8.4a6.4 6.4 0 0 1 1.8 3.6z" />
  </svg>
);
export const PencilIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75zM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z" />
  </svg>
);
export const LockIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <rect x="4" y="9.5" width="16" height="12.5" rx="2.6" fill="currentColor" />
    <circle cx="12" cy="15.6" r="1.7" fill="#fff" />
  </svg>
);
export const ShieldIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2l8 3v6.2c0 5-3.4 9.4-8 10.8-4.6-1.4-8-5.8-8-10.8V5z" /></svg>
);
export const DocIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
    <path d="M8.5 12.5h7M8.5 16.5h7M8.5 8.5h3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
export const AppleIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 7.6c1.2-.9 2.4-1.3 3.7-1.2 3 .2 4.8 2.6 4.8 6 0 4.6-3.2 9.6-6 9.6-1 0-1.6-.5-2.5-.5s-1.5.5-2.5.5c-2.8 0-6-5-6-9.6 0-3.4 1.8-5.8 4.8-6 1.3-.1 2.5.3 3.7 1.2z" />
    <path d="M12 7.5c0-2.2.8-4 2.6-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M13 5.2c.6-1.6 2-2.4 3.8-2.4-.4 1.7-1.8 2.7-3.8 2.4z" />
  </svg>
);
export const DishIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M4 3.5h1.6V17H4zM7 3.5h13v1.6H7zM7 3.5h1.6v6H7z" />
    <path d="M9.5 15.6c.3-3.3 2.9-5.6 6.1-5.6s5.8 2.3 6.1 5.6z" />
    <rect x="3" y="17" width="19.5" height="1.8" rx=".9" /><rect x="5" y="20" width="15.5" height="1.6" rx=".8" />
  </svg>
);
export const CocktailIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M3 3h18v2.2l-7.9 8.4V19h4.4v2h-11v-2h4.4v-5.4L3 5.2zM6.1 5.2l1.6 1.8h8.6l1.6-1.8z" fillRule="evenodd" />
  </svg>
);
export const CakeIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2.5c1.3 1.5 1.6 2.6 1 3.4-.5.6-1.5.6-2 0-.6-.8-.3-1.9 1-3.4zM11.2 7h1.6v3.2h-1.6z" />
    <path d="M4 12.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.8c-1 .9-2 .9-3 0-1 .9-2 .9-3 0-1 .9-2 .9-3 0-1 .9-2 .9-3 0-1 .9-2 .9-3 0z" />
    <path d="M4 16.4c1 .7 2 .7 3 0 1 .7 2 .7 3 0 1 .7 2 .7 3 0 1 .7 2 .7 3 0 1 .7 2 .7 4 0V21H4z" /><rect x="2.5" y="20.2" width="19" height="1.8" rx=".9" />
  </svg>
);
export const CutleryFillIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M4 2.5h1.6V8h1.2V2.5h1.6V8h1.2V2.5h1.6v6.6a3 3 0 0 1-2.4 2.9V21.5H6.4V12a3 3 0 0 1-2.4-2.9zM17.6 2.5c1.6 0 2.4 1.7 2.4 5.5v6h-2.2v7.5h-2.2V2.9c.6-.3 1.3-.4 2-.4z" />
  </svg>
);
export const MoneyFillIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="5" width="20" height="14" rx="3.5" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v5M18 9.5v5" strokeLinecap="round" />
  </svg>
);

// ---------- Band qilingan joylar ----------
export const ClockIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><circle cx="12" cy="12" r="10" /><path d="M12 6.5V12l3.2 2.3" /></svg>
);
export const ChevronDownIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
);

// ---------- Profil ----------
export const BellIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 2.9c-3.3 0-6 2.7-6 6v2.9c0 .6-.3 1.6-.6 2.1l-1.1 1.9c-.7 1.2-.2 2.5 1.1 2.9 4.3 1.4 9 1.4 13.3 0 1.2-.4 1.8-1.8 1.1-2.9l-1.1-1.9c-.3-.5-.6-1.5-.6-2.1V8.9c0-3.3-2.7-6-6.1-6z" />
    <path d="M13.9 3.2a6.4 6.4 0 0 0-3.7 0c.3-.8 1-1.3 1.9-1.3s1.6.5 1.8 1.3zM15 19.1c0 1.7-1.4 3-3 3-.8 0-1.6-.4-2.1-.9s-.9-1.3-.9-2.1" />
  </svg>
);
export const WalletIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M13 9H7M22 10.97v2.06c0 .55-.44 1-1 1.02h-1.96c-1.08 0-2.07-.79-2.16-1.87-.06-.63.18-1.22.6-1.63.37-.38.88-.6 1.44-.6H21c.56.02 1 .47 1 1.02z" />
    <path d="M17.48 10.55c-.42.41-.66 1-.6 1.63.09 1.08 1.08 1.87 2.16 1.87H21v1.45c0 3-2 5-5 5H7c-3 0-5-2-5-5v-7c0-2.72 1.64-4.62 4.19-4.94C6.45 3.51 6.72 3.5 7 3.5h9c.26 0 .51.01.75.05C19.33 3.85 21 5.76 21 8.5v1.45h-2.08c-.56 0-1.07.22-1.44.6z" />
  </svg>
);
export const TranslateIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" />
    <path d="M7 8h10M12 6v2M15.5 8c-.6 4-3.3 7.5-8 9.5M9.5 11.5c1.2 2.6 3.6 4.7 7 6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
export const SupportIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4.5 13.5V11a7.5 7.5 0 0 1 15 0v2.5" />
    <path d="M4.5 12.3c-1 .3-1.8 1.3-1.8 2.4 0 1.3 1 2.4 2.4 2.4h.6v-4.8h-.6c-.2 0-.4 0-.6 0zM19.5 12.3c1 .3 1.8 1.3 1.8 2.4 0 1.3-1 2.4-2.4 2.4h-.6v-4.8h.6l.6 0z" />
    <path d="M18 17.5c-.6 2-2.6 3.3-5 3.3h-1" /><circle cx="9.5" cy="12" r=".6" fill="currentColor" /><circle cx="14.5" cy="12" r=".6" fill="currentColor" />
    <path d="M7.5 8.5c1.5.8 3 1.2 4.5 1.2s3-.4 4.5-1.2" />
  </svg>
);
export const LoginIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M8.9 7.56c.31-3.6 2.16-5.07 6.21-5.07h.13c4.47 0 6.26 1.79 6.26 6.26v6.52c0 4.47-1.79 6.26-6.26 6.26h-.13c-4.02 0-5.87-1.45-6.2-4.99M2 12h12.88M12.65 8.65L16 12l-3.35 3.35" />
  </svg>
);
export const TrashIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M8.5 3.2c0-.9.7-1.6 1.6-1.6h3.8c.9 0 1.6.7 1.6 1.6v.6h4.2a1 1 0 1 1 0 2H4.3a1 1 0 1 1 0-2h4.2v-.6z" />
    <path d="M5.4 7.4h13.2l-.8 12.1a2.6 2.6 0 0 1-2.6 2.4H8.8a2.6 2.6 0 0 1-2.6-2.4L5.4 7.4zM9.5 12.5a.8.8 0 0 0 0 1.6h5a.8.8 0 0 0 0-1.6h-5zm.8 3.6a.8.8 0 0 0 0 1.6h3.4a.8.8 0 0 0 0-1.6h-3.4z" fillRule="evenodd" />
  </svg>
);
export const ImagePlusIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className}>
    <rect x="2.5" y="4.5" width="17" height="17" rx="4" fill="currentColor" />
    <circle cx="8" cy="10" r="1.8" fill="#fff" /><path d="M3.5 19l4.6-4.2 3 2.6 3.4-3.6 4.4 4.4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="19.5" cy="4.5" r="3.5" fill="#fff" /><path d="M19.5 2.7v3.6M17.7 4.5h3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
export const CalendarEditIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M8 2v3M16 2v3M3.5 9.09h17M19.21 15.77l-3.54 3.54c-.14.14-.27.4-.3.59l-.19 1.35c-.07.49.27.83.76.76l1.35-.19c.19-.03.46-.16.59-.3l3.54-3.54c.61-.61.9-1.32 0-2.22-.89-.89-1.6-.6-2.21.01zM18.7 16.28c.3 1.08 1.14 1.92 2.22 2.22" />
    <path d="M12 22H8c-3.5 0-5-2-5-5V8.5c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5V12" />
    <path d="M11.995 13.7h.009M8.294 13.7h.009M8.294 16.7h.009" strokeWidth="2" />
  </svg>
);
export const CloseCircleIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="12" r="10" /><path d="M9.17 14.83l5.66-5.66M14.83 14.83L9.17 9.17" />
  </svg>
);
