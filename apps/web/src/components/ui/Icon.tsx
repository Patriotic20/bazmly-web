// Figma'da Material Symbols ishlatilgan (table_restaurant, schedule, group ...)
export function Icon({ name, className = "", fill = false }: { name: string; className?: string; fill?: boolean }) {
  return (
    <span
      className={`material-symbols-rounded select-none leading-none ${className}`}
      style={fill ? { fontVariationSettings: '"FILL" 1' } : undefined}
      aria-hidden
    >
      {name}
    </span>
  );
}
