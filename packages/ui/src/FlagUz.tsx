// O'zbekiston bayrog'i — dumaloq (Figma: "uz" 29×29)
export function FlagUz({ className = "" }: { className?: string }) {
  const stars: [number, number][] = [];
  // 3 qator yulduz: 3, 4, 5 ta (o'ngdan)
  [[3, 0], [4, 1], [5, 2]].forEach(([n, row]) => {
    for (let i = 0; i < n; i++) stars.push([25 - i * 2.6, 3.4 + row * 2.6]);
  });
  return (
    <svg viewBox="0 0 29 29" className={className} role="img" aria-label="O‘zbekiston">
      <defs>
        <clipPath id="uz-c"><circle cx="14.5" cy="14.5" r="14.5" /></clipPath>
      </defs>
      <g clipPath="url(#uz-c)">
        <rect width="29" height="29" fill="#fff" />
        <rect width="29" height="9.6" fill="#0099B5" />
        <rect y="19.4" width="29" height="9.6" fill="#1EB53A" />
        <rect y="9.6" width="29" height="0.9" fill="#CE1126" />
        <rect y="18.5" width="29" height="0.9" fill="#CE1126" />
        <circle cx="9.2" cy="5" r="3.1" fill="#fff" />
        <circle cx="10.3" cy="5" r="2.6" fill="#0099B5" />
        {stars.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="0.55" fill="#fff" />
        ))}
      </g>
    </svg>
  );
}
