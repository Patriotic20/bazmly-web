import Link from "next/link";

export function Section({ title, moreHref, children }: { title: string; moreHref?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex h-[30px] items-center justify-between">
        <h2 className="text-[18px] font-semibold text-black dark:text-[#FFFFFF] md:text-[20px]">{title}</h2>
        {moreHref && (
          <Link href={moreHref} className="shrink-0 text-[14px] font-medium text-brand hover:underline dark:text-white">
            Barchasini ko‘rish
          </Link>
        )}
      </div>
      <div className="mt-[10px]">{children}</div>
    </section>
  );
}

export function Empty() {
  return <p className="flex h-[120px] items-center text-[16px] text-[#646464] dark:text-[#CFCFCF]">Hech narsa topilmadi</p>;
}
