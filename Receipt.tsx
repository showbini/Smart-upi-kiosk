import { toast } from "sonner";
import { KioskButton, Panel, Row } from "./kiosk-ui";
import { CheckCircle2, Mail, Printer } from "lucide-react";

export function Receipt({
  heading,
  rows,
  onDone,
  onHome,
}: {
  heading: string;
  rows: { label: string; value: string }[];
  onDone: () => void;
  onHome?: () => void;
}) {
  return (
    <Panel className="mx-auto max-w-2xl">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-16 text-success" aria-hidden />
        <h2 className="mt-3 text-3xl font-bold">{heading}</h2>
        <p className="mt-1 text-base text-muted-foreground">Demo receipt — simulated transaction</p>
      </div>
      <div className="mt-6">
        {rows.map((r) => (
          <Row key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <KioskButton variant="secondary" onClick={() => window.print()}>
          <Printer className="size-5" aria-hidden /> Print Receipt
        </KioskButton>
        <KioskButton
          variant="secondary"
          onClick={() => toast.success("Digital receipt sent to demo@sfap.in (simulated)")}
        >
          <Mail className="size-5" aria-hidden /> Send Digital
        </KioskButton>
        <KioskButton onClick={onHome ?? onDone}>Done</KioskButton>
      </div>
    </Panel>
  );
}
