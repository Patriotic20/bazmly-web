import { CheckIcon } from "@bazmly/ui/icons";

// Figma: 4 bosqichli shkala (1168px), doira 24px, chiziq 2px.
// Kichikroq ekranda chetki yozuvlar ekrandan chiqmasligi uchun doira chetiga tekislanadi.
export function Stepper({ steps, current, checkDone = true, nowrap = false, checkAll = false }: { steps: string[]; current: number; checkDone?: boolean; nowrap?: boolean; checkAll?: boolean }) {
  const pct = ((current - 1) / (steps.length - 1)) * 100;
  return (
    <ol className="relative mx-auto h-[67px] w-full max-w-[1168px]" aria-label="Bron bosqichlari">
      <span className="absolute inset-x-[12px] top-[11px] h-[2px] bg-[#DADADA] dark:bg-[#505050]" />
      <span className="absolute left-[12px] top-[11px] h-[2px] bg-brand" style={{ width: `calc((100% - 24px) * ${pct / 100})` }} />
      {steps.map((label, i) => {
        const n = i + 1;
        // Figma: 3-bosqichda 1-doira ✓, 4-bosqichda hamma doiralar raqam bilan
        const done = checkAll ? n < current : checkDone && n === 1 && current > 1;
        const active = n <= current;
        return (
          <li
            key={label}
            aria-current={n === current ? "step" : undefined}
            className="absolute top-0 flex w-[24px] flex-col items-center"
            style={{ left: `calc((100% - 24px) * ${i / (steps.length - 1)})` }}
          >
            <span className={`grid size-[24px] place-items-center rounded-full text-[11px] font-semibold text-white ${active ? "bg-brand" : "bg-[#DADADA] dark:bg-[#505050]"}`}>
              {done ? <CheckIcon className="size-[12px]" /> : n}
            </span>
            <span className={`mt-[13px] w-[72px] text-center text-[11px] font-medium leading-[1.3] sm:w-[88px] sm:text-[12px] ${active ? "text-[#1E1E1E] dark:text-[#FFFFFF]" : nowrap ? "text-[#D9D9D9] dark:text-[#FFFFFF]" : "text-[#1E1E1E] dark:text-[#FFFFFF]"} ${
              nowrap
                ? `lg:w-max lg:whitespace-nowrap ${i === 0 ? "self-start text-left wide:self-center wide:text-center" : ""} ${i === steps.length - 1 ? "self-end text-right wide:self-center wide:text-center" : ""}`
                : `${i === 0 ? "translate-x-[24px] sm:translate-x-[32px] wide:translate-x-0" : ""} ${i === steps.length - 1 ? "-translate-x-[24px] sm:-translate-x-[32px] wide:translate-x-0" : ""}`
            }`}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
