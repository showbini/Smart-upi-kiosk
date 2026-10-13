import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, Home, type LucideIcon } from "lucide-react";

export function DemoBadge({ label = "Demo Mode" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-warning/50 bg-warning/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-foreground">
      <span className="size-2 rounded-full bg-warning" aria-hidden />
      {label}
    </span>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string | undefined;
  icon?: LucideIcon | undefined;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-4 sm:flex">
      {Icon ? (
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-7" aria-hidden />
        </div>
      ) : null}
      <div className="min-w-0">
        <h1 className="truncate text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-base text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function KioskButton({
  children,
  onClick,
  variant = "primary",
  className,
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "accent" | "danger" | "ghost";
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
    accent: "bg-accent text-accent-foreground hover:bg-accent/90",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    ghost: "bg-transparent text-foreground hover:bg-muted border border-border",
  };
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-6 text-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-50",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function NavButtons({
  onBack,
  onHome,
  backLabel = "Back",
  homeLabel = "Home",
}: {
  onBack?: () => void;
  onHome?: () => void;
  backLabel?: string;
  homeLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {onBack ? (
        <KioskButton variant="ghost" onClick={onBack}>
          <ChevronLeft className="size-5" aria-hidden /> {backLabel}
        </KioskButton>
      ) : null}
      {onHome ? (
        <KioskButton variant="ghost" onClick={onHome}>
          <Home className="size-5" aria-hidden /> {homeLabel}
        </KioskButton>
      ) : null}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("kiosk-card p-6 sm:p-8", className)}>{children}</section>;
}

export function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right font-semibold", strong && "text-2xl")}>{value}</span>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Success: "bg-success/15 text-success border-success/40",
    Available: "bg-success/15 text-success border-success/40",
    Failed: "bg-destructive/15 text-destructive border-destructive/40",
    Offline: "bg-destructive/15 text-destructive border-destructive/40",
    Busy: "bg-warning/20 text-accent-foreground border-warning/50",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold",
        map[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status}
    </span>
  );
}
