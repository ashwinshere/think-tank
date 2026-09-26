export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-surface border border-line rounded-xl2 shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="text-xs font-semibold tracking-wide uppercase text-accent-dark mb-2">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-2xl md:text-[28px] font-semibold text-ink leading-snug">
        {title}
      </h1>
      {description && (
        <p className="text-subink mt-2 max-w-2xl leading-relaxed">{description}</p>
      )}
    </div>
  );
}

export function ScoreBar({
  label,
  value,
  colorClass = "bg-accent",
}: {
  label: string;
  value: number;
  colorClass?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-sm font-semibold text-subink">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-paper border border-line overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-700 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
