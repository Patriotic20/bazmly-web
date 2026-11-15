// Ro'yxatdan o'tish oqimidagi umumiy karta (Figma: 416px, 2px #D0D0D0, radius 20)
export function AuthCard({ className = "", children, ...rest }: React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      noValidate
      className={`relative w-full max-w-[416px] rounded-[20px] border-2 border-[#D0D0D0] dark:border-[#6C6C6C] bg-white dark:bg-[#2C2C2C] px-4 pb-6 pt-6 sm:px-[27.5px] sm:pb-[28px] sm:pt-[28px] ${className}`}
      {...rest}
    >
      {children}
    </form>
  );
}

export const primaryBtn =
  "block h-[55px] w-full rounded-[16px] bg-brand text-[22px] font-medium sm:text-[24px] text-[#FCFCFD] transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export const textInput =
  "h-[55px] rounded-[16px] border border-[#D0D5DD] dark:border-[#6C6C6C] bg-[#FDFAFE] dark:bg-[#2C2C2C] px-[16px] text-[20px] leading-[20px] text-[#101828] dark:text-[#FFFFFF] outline-none placeholder:text-[#98A2B3] dark:placeholder:text-[#8A8A8A] focus:border-brand";
