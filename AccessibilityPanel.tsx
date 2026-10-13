import { useSfap, speak } from "@/lib/sfap/store";
import { LANGUAGES } from "@/lib/sfap/data";
import { KioskButton } from "./kiosk-ui";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Contrast, Languages, Sparkles, Type, Volume2 } from "lucide-react";

const Toggle = ({
  label,
  desc,
  on,
  onClick,
  icon: Icon,
}: {
  label: string;
  desc: string;
  on: boolean;
  onClick: () => void;
  icon: typeof Type;
}) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={onClick}
    className={cn(
      "flex min-h-20 w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
      on ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted",
    )}
  >
    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
      <Icon className="size-6" aria-hidden />
    </span>
    <span className="min-w-0">
      <span className="block text-lg font-semibold">{label}</span>
      <span className="block text-sm text-muted-foreground">{desc}</span>
    </span>
    <span className="ml-auto shrink-0 text-sm font-bold uppercase">{on ? "On" : "Off"}</span>
  </button>
);

export function AccessibilityPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { a11y, setA11y, lang, setLang } = useSfap();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Accessibility</DialogTitle>
          <DialogDescription className="text-base">
            Adjust the kiosk so it is comfortable for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Toggle
            icon={Type}
            label="Large Text"
            desc="Increase text size across the kiosk"
            on={a11y.largeText}
            onClick={() => setA11y({ largeText: !a11y.largeText })}
          />
          <Toggle
            icon={Contrast}
            label="High Contrast"
            desc="Dark background with bold yellow highlights"
            on={a11y.highContrast}
            onClick={() => setA11y({ highContrast: !a11y.highContrast })}
          />
          <Toggle
            icon={Volume2}
            label="Voice Guidance"
            desc="Screen text is read aloud (simulated)"
            on={a11y.voice}
            onClick={() => {
              const next = !a11y.voice;
              setA11y({ voice: next });
              speak("Voice guidance enabled", next);
            }}
          />
          <Toggle
            icon={Sparkles}
            label="Simplified Mode"
            desc="Show only the six most used services"
            on={a11y.simplified}
            onClick={() => setA11y({ simplified: !a11y.simplified })}
          />
        </div>

        <div className="mt-2">
          <p className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <Languages className="size-5" aria-hidden /> Language Selection
          </p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                aria-pressed={lang === l.code}
                className={cn(
                  "min-h-12 rounded-xl border px-4 text-base font-semibold",
                  lang === l.code
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                {l.native}
              </button>
            ))}
          </div>
        </div>

        <KioskButton className="mt-4 w-full" onClick={() => onOpenChange(false)}>
          Done
        </KioskButton>
      </DialogContent>
    </Dialog>
  );
}
