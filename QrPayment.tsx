import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { KioskButton, Panel, Row, DemoBadge } from "./kiosk-ui";
import { rupees } from "@/lib/sfap/data";
import { newTxnId } from "@/lib/sfap/store";
import { QrCode, ShieldCheck, TimerReset, XCircle } from "lucide-react";

type Props = {
  amount: number;
  fee?: number;
  purpose: string;
  onSuccess: (ref: string) => void;
  onFailure?: (ref: string, reason: string) => void;
  onCancel: () => void;
  expirySeconds?: number;
};

export function QrPayment({
  amount,
  fee = 0,
  purpose,
  onSuccess,
  onFailure,
  onCancel,
  expirySeconds = 90,
}: Props) {
  const [ref, setRef] = useState(() => newTxnId());
  const [dataUrl, setDataUrl] = useState<string>("");
  const [left, setLeft] = useState(expirySeconds);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    const payload = `upi://pay?pa=sfap.demo@kiosk&pn=SFAP%20Demo%20Kiosk&am=${amount + fee}&tn=${encodeURIComponent(
      purpose,
    )}&tr=${ref}&mode=DEMO`;
    QRCode.toDataURL(payload, { margin: 1, width: 480, errorCorrectionLevel: "M" })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [amount, fee, purpose, ref]);

  useEffect(() => {
    if (failed) return;
    if (left <= 0) {
      setFailed("Demo payment timeout");
      onFailure?.(ref, "Demo payment timeout");
      return;
    }
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left, failed, onFailure, ref]);

  const retry = () => {
    setRef(newTxnId());
    setLeft(expirySeconds);
    setFailed(null);
  };

  if (failed) {
    return (
      <Panel className="mx-auto max-w-2xl text-center">
        <XCircle className="mx-auto size-16 text-destructive" aria-hidden />
        <h2 className="mt-4 text-3xl font-bold">Payment Status: Failed</h2>
        <p className="mt-2 text-lg text-muted-foreground">Reason: “{failed}”</p>
        <p className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-lg font-semibold text-destructive">
          Cash has NOT been dispensed.
        </p>
        <div className="mt-3 text-sm text-muted-foreground">Reference: {ref}</div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <KioskButton onClick={retry}>
            <TimerReset className="size-5" aria-hidden /> Retry
          </KioskButton>
          <KioskButton variant="ghost" onClick={onCancel}>
            Cancel
          </KioskButton>
        </div>
      </Panel>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel>
        <h2 className="text-2xl font-bold">Transaction Summary</h2>
        <div className="mt-4">
          <Row label={purpose} value={rupees(amount)} />
          <Row label="Service Fee" value={rupees(fee)} />
          <Row label="Total" value={rupees(amount + fee)} strong />
          <Row label="Demo Transaction ID" value={ref} />
        </div>
        <div className="mt-6 rounded-xl border border-border bg-muted/60 p-4 text-base">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-5 text-success" aria-hidden /> Safety logic
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Unique demo transaction ID per QR</li>
            <li>QR expires in {left}s — expired QR cannot dispense cash</li>
            <li>Cash is released only after payment confirmation</li>
          </ul>
        </div>
      </Panel>

      <Panel className="text-center">
        <DemoBadge label="Demo QR" />
        <div className="mx-auto mt-4 w-fit rounded-2xl border border-border bg-card p-4">
          {dataUrl ? (
            <img src={dataUrl} alt={`Demo UPI QR code for ${purpose}`} className="size-56 sm:size-64" />
          ) : (
            <div className="grid size-56 place-items-center text-muted-foreground sm:size-64">
              <QrCode className="size-16" aria-hidden />
            </div>
          )}
        </div>
        <p className="mt-4 text-xl font-semibold">Scan this QR using your UPI app.</p>
        <p className="mt-1 text-base text-muted-foreground">
          Demo transaction — no real money will be transferred.
        </p>
        <p className="mt-3 text-lg font-semibold" aria-live="polite">
          Expires in {left}s
        </p>
        <div className="mt-6 grid gap-3">
          <KioskButton onClick={() => onSuccess(ref)}>Simulate Successful Payment</KioskButton>
          <KioskButton
            variant="danger"
            onClick={() => {
              setFailed("Demo payment timeout");
              onFailure?.(ref, "Demo payment timeout");
            }}
          >
            Simulate Failed Payment
          </KioskButton>
          <KioskButton variant="ghost" onClick={onCancel}>
            Cancel Transaction
          </KioskButton>
        </div>
      </Panel>
    </div>
  );
}
