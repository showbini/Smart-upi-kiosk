import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KioskButton, Panel, Row, StatusPill, DemoBadge } from "./kiosk-ui";
import { QrPayment } from "./QrPayment";
import { Receipt } from "./Receipt";
import { useSfap, speak, type TxnType } from "@/lib/sfap/store";
import {
  BILLERS,
  DEMO_USER,
  FX_RATES,
  GOVT_SERVICES,
  KIOSKS,
  OPERATORS,
  rupees,
} from "@/lib/sfap/data";
import { cn } from "@/lib/utils";
import {
  Banknote,
  Building2,
  Download,
  ExternalLink,
  Info,
  MapPin,
  Printer,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const fmt = (ts: number) =>
  new Date(ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

/* ---------------- amount picker ---------------- */

export function AmountPicker({
  amounts,
  onPick,
  label = "Select amount",
}: {
  amounts: number[];
  onPick: (n: number) => void;
  label?: string;
}) {
  const [custom, setCustom] = useState("");
  return (
    <Panel>
      <h2 className="text-2xl font-bold">{label}</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {amounts.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onPick(a)}
            className="min-h-24 rounded-2xl border border-border bg-card text-3xl font-bold transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            {rupees(a)}
          </button>
        ))}
      </div>
      <form
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(custom);
          if (!n || n <= 0) {
            toast.error("Enter a valid demo amount");
            return;
          }
          onPick(n);
        }}
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="custom-amount" className="mb-1 block text-base font-medium">
            Custom Amount
          </label>
          <input
            id="custom-amount"
            inputMode="numeric"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
            placeholder="e.g. 1500"
            className="min-h-14 w-full rounded-xl border border-input bg-card px-4 text-lg placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          />
        </div>
        <KioskButton>Continue</KioskButton>
      </form>
    </Panel>
  );
}

/* ---------------- dispensing animation ---------------- */

function Dispensing({ amount, onDone }: { amount: number; onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const a = setTimeout(() => setStep(1), 1200);
    const b = setTimeout(() => setStep(2), 2600);
    const c = setTimeout(onDone, 4200);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
    };
  }, [onDone]);

  return (
    <Panel className="mx-auto max-w-2xl text-center">
      <DemoBadge label="Simulation" />
      <h2 className="mt-4 text-3xl font-bold" aria-live="polite">
        {step === 0 ? "Payment Verified" : step === 1 ? "Dispensing Cash…" : `${rupees(amount)} Cash Dispensed Successfully`}
      </h2>
      <div className="relative mx-auto mt-10 h-44 w-72">
        <div className="absolute inset-x-0 bottom-0 h-10 rounded-xl border-2 border-dashed border-border bg-muted" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 flex h-14 w-56 -translate-x-1/2 items-center justify-center rounded-lg border border-success/40 bg-success/15 text-lg font-bold text-success"
            style={{
              top: step === 0 ? -80 : 20 + i * 34,
              opacity: step === 0 ? 0 : 1,
              transition: `all 900ms ease-out ${i * 220}ms`,
            }}
          >
            <Banknote className="mr-2 size-5" aria-hidden /> Demo Note
          </div>
        ))}
      </div>
      <p className="mt-8 text-lg text-muted-foreground">Please collect your demo cash from the tray.</p>
    </Panel>
  );
}

/* ---------------- generic pay + receipt flow ---------------- */

function PayFlow({
  amount,
  fee = 0,
  purpose,
  type,
  note,
  dispense,
  extraRows = [],
  onExit,
}: {
  amount: number;
  fee?: number;
  purpose: string;
  type: TxnType;
  note?: string;
  dispense?: boolean;
  extraRows?: { label: string; value: string }[];
  onExit: () => void;
}) {
  const { addTxn, a11y } = useSfap();
  const [stage, setStage] = useState<"qr" | "dispense" | "receipt">("qr");
  const [txn, setTxn] = useState<{ id: string; ts: number } | null>(null);

  if (stage === "qr") {
    return (
      <QrPayment
        amount={amount}
        fee={fee}
        purpose={purpose}
        onCancel={onExit}
        onFailure={() => {
          addTxn({ type, amount, status: "Failed", note: "Demo payment timeout" });
          speak("Payment failed. Cash has not been dispensed.", a11y.voice);
        }}
        onSuccess={() => {
          const t = addTxn({ type, amount: amount + fee, status: "Success", ...(note ? { note } : {}) });
          setTxn(t);
          speak("Payment verified", a11y.voice);
          setStage(dispense ? "dispense" : "receipt");
        }}
      />
    );
  }

  if (stage === "dispense") {
    return <Dispensing amount={amount} onDone={() => setStage("receipt")} />;
  }

  return (
    <Receipt
      heading={dispense ? `${rupees(amount)} Cash Dispensed Successfully` : "Payment Successful"}
      rows={[
        { label: "Transaction ID", value: txn?.id ?? "—" },
        { label: "Date & Time", value: fmt(txn?.ts ?? Date.now()) },
        { label: "Amount", value: rupees(amount + fee) },
        ...extraRows,
        { label: "Status", value: "Success (Demo)" },
      ]}
      onDone={onExit}
      onHome={onExit}
    />
  );
}

/* ---------------- 1. withdrawal ---------------- */

export function WithdrawScreen({ onExit }: { onExit: () => void }) {
  const [amount, setAmount] = useState<number | null>(null);
  if (amount === null)
    return (
      <AmountPicker
        amounts={[100, 200, 500, 1000, 2000]}
        onPick={setAmount}
        label="Select withdrawal amount"
      />
    );
  return (
    <PayFlow
      amount={amount}
      purpose="Withdrawal Amount"
      type="Withdrawal"
      dispense
      onExit={onExit}
    />
  );
}

/* ---------------- 2. deposit ---------------- */

export function DepositScreen({ onExit }: { onExit: () => void }) {
  const { addTxn, balance, a11y } = useSfap();
  const [amount, setAmount] = useState<number | null>(null);
  const [stage, setStage] = useState<"insert" | "verified" | "receipt">("insert");
  const [txn, setTxn] = useState<{ id: string; ts: number } | null>(null);

  if (amount === null)
    return (
      <AmountPicker
        amounts={[100, 500, 1000, 2000, 5000]}
        onPick={setAmount}
        label="Select deposit amount"
      />
    );

  if (stage === "insert")
    return (
      <Panel className="mx-auto max-w-2xl text-center">
        <Wallet className="mx-auto size-16 text-primary" aria-hidden />
        <h2 className="mt-4 text-3xl font-bold">Insert Cash</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Place {rupees(amount)} in demo notes into the deposit slot.
        </p>
        <div className="mt-8 grid gap-3">
          <KioskButton
            onClick={() => {
              setStage("verified");
              speak("Cash verified", a11y.voice);
              setTimeout(() => {
                const t = addTxn({ type: "Deposit", amount, status: "Success" });
                setTxn(t);
                setStage("receipt");
              }, 1800);
            }}
          >
            Simulate Cash Inserted
          </KioskButton>
          <KioskButton variant="ghost" onClick={onExit}>
            Cancel
          </KioskButton>
        </div>
      </Panel>
    );

  if (stage === "verified")
    return (
      <Panel className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold" aria-live="polite">
          Cash Verified
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">Updating your demo balance…</p>
      </Panel>
    );

  return (
    <Receipt
      heading={`${rupees(amount)} Deposited Successfully`}
      rows={[
        { label: "Transaction ID", value: txn?.id ?? "—" },
        { label: "Date & Time", value: fmt(txn?.ts ?? Date.now()) },
        { label: "Amount", value: rupees(amount) },
        { label: "Updated Balance", value: rupees(balance) },
      ]}
      onDone={onExit}
    />
  );
}

/* ---------------- 3. balance ---------------- */

export function BalanceScreen() {
  const { balance, txns } = useSfap();
  const today = txns.filter((t) => Date.now() - t.ts < 1000 * 60 * 60 * 24);
  return (
    <Panel className="mx-auto max-w-2xl">
      <DemoBadge label="Demo Account" />
      <p className="mt-6 text-lg text-muted-foreground">Available Balance</p>
      <p className="text-6xl font-bold tracking-tight">{rupees(balance)}</p>
      <p className="mt-2 text-base text-muted-foreground">
        {DEMO_USER.name} · Account {DEMO_USER.accountId}
      </p>
      <h3 className="mt-8 text-xl font-bold">Today’s transactions</h3>
      <div className="mt-2">
        {today.length === 0 ? (
          <p className="py-4 text-muted-foreground">No transactions in the last 24 hours.</p>
        ) : (
          today.map((t) => (
            <Row key={t.id} label={`${t.type}${t.note ? ` · ${t.note}` : ""}`} value={rupees(t.amount)} />
          ))
        )}
      </div>
    </Panel>
  );
}

/* ---------------- 4. mini statement ---------------- */

export function StatementScreen() {
  const { txns } = useSfap();
  const download = () => {
    const csv = ["Date,Type,Amount,Status", ...txns.map((t) => `${fmt(t.ts)},${t.type},${t.amount},${t.status}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "sfap-demo-statement.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Demo statement downloaded");
  };

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Mini Statement</h2>
        <DemoBadge label="Demo Account" />
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-base">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th scope="col" className="py-3 pr-4 font-semibold">Date</th>
              <th scope="col" className="py-3 pr-4 font-semibold">Type</th>
              <th scope="col" className="py-3 pr-4 font-semibold">Amount</th>
              <th scope="col" className="py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {txns.slice(0, 12).map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 whitespace-nowrap">{fmt(t.ts)}</td>
                <td className="py-3 pr-4">
                  {t.type}
                  {t.note ? <span className="block text-sm text-muted-foreground">{t.note}</span> : null}
                </td>
                <td
                  className={cn(
                    "py-3 pr-4 font-semibold",
                    t.status === "Failed"
                      ? "text-muted-foreground line-through"
                      : t.type === "Deposit"
                        ? "text-success"
                        : "text-foreground",
                  )}
                >
                  {t.type === "Deposit" ? "+" : "−"}
                  {rupees(t.amount)}
                </td>
                <td className="py-3">
                  <StatusPill status={t.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <KioskButton variant="secondary" onClick={download}>
          <Download className="size-5" aria-hidden /> Download Receipt
        </KioskButton>
        <KioskButton variant="secondary" onClick={() => window.print()}>
          <Printer className="size-5" aria-hidden /> Print Statement
        </KioskButton>
      </div>
    </Panel>
  );
}

/* ---------------- 5. bills ---------------- */

export function BillsScreen({ onExit }: { onExit: () => void }) {
  const [biller, setBiller] = useState<(typeof BILLERS)[number] | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!biller)
    return (
      <Panel>
        <h2 className="text-2xl font-bold">Choose a bill category</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BILLERS.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => setBiller(b)}
              className="min-h-28 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
            >
              <span className="block text-xl font-bold">{b.label}</span>
              <span className="mt-1 block text-sm text-muted-foreground">Consumer {b.consumer}</span>
              <span className="mt-2 block text-lg font-semibold">{rupees(b.amount)} due</span>
            </button>
          ))}
        </div>
      </Panel>
    );

  if (!confirmed)
    return (
      <Panel className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-bold">{biller.label} Bill</h2>
        <div className="mt-4">
          <Row label="Consumer Number" value={biller.consumer} />
          <Row label="Billing Period" value="Demo cycle · current month" />
          <Row label="Amount" value={rupees(biller.amount)} strong />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <KioskButton onClick={() => setConfirmed(true)}>Pay with UPI</KioskButton>
          <KioskButton variant="ghost" onClick={() => setBiller(null)}>
            Choose another
          </KioskButton>
        </div>
      </Panel>
    );

  return (
    <PayFlow
      amount={biller.amount}
      purpose={`${biller.label} Bill`}
      type="Bill Payment"
      note={biller.label}
      extraRows={[{ label: "Consumer Number", value: biller.consumer }]}
      onExit={onExit}
    />
  );
}

/* ---------------- 6. recharge ---------------- */

export function RechargeScreen({ onExit }: { onExit: () => void }) {
  const [mobile, setMobile] = useState("98765 43210");
  const [operator, setOperator] = useState<string>(OPERATORS[0] ?? "Demo Airnet");
  const [amount, setAmount] = useState<number | null>(null);

  if (amount === null)
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="text-2xl font-bold">Recharge details</h2>
          <div className="mt-6 grid gap-4">
            <div>
              <label htmlFor="mobile" className="mb-1 block text-base font-medium">
                Mobile Number (demo)
              </label>
              <input
                id="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="min-h-14 w-full rounded-xl border border-input bg-card px-4 text-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
              />
            </div>
            <div>
              <label htmlFor="operator" className="mb-1 block text-base font-medium">
                Operator
              </label>
              <select
                id="operator"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="min-h-14 w-full rounded-xl border border-input bg-card px-4 text-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
              >
                {OPERATORS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
        </Panel>
        <AmountPicker amounts={[199, 299, 499]} onPick={setAmount} label="Recharge amount" />
      </div>
    );

  return (
    <PayFlow
      amount={amount}
      purpose="Mobile Recharge"
      type="Recharge"
      note={operator}
      extraRows={[
        { label: "Mobile Number", value: mobile },
        { label: "Operator", value: operator },
      ]}
      onExit={onExit}
    />
  );
}

/* ---------------- 7. government services ---------------- */

export function GovtScreen() {
  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Government Services Directory</h2>
        <DemoBadge label="Information Only" />
      </div>
      <p className="mt-3 rounded-xl border border-warning/50 bg-warning/15 p-4 text-base font-medium">
        External government service — demonstration only. No application is submitted from this kiosk.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {GOVT_SERVICES.map((g) => (
          <button
            key={g.title}
            type="button"
            onClick={() => toast.info(`${g.title}: information screen only (demo)`)}
            className="flex min-h-28 items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            <Building2 className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0">
              <span className="block text-lg font-bold">{g.title}</span>
              <span className="block text-sm text-muted-foreground">{g.desc}</span>
            </span>
            <ExternalLink className="ml-auto size-5 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        ))}
      </div>
    </Panel>
  );
}

/* ---------------- 8. currency exchange ---------------- */

export function ForexScreen({ onExit }: { onExit: () => void }) {
  const [from, setFrom] = useState("USD");
  const [amount, setAmount] = useState(100);
  const [go, setGo] = useState(false);

  const rate = FX_RATES[from] ?? 1;
  const converted = Math.round(amount * rate);
  const fee = Math.round(converted * 0.01);

  if (go)
    return (
      <PayFlow
        amount={converted}
        fee={fee}
        purpose={`Currency Exchange ${amount} ${from}`}
        type="Currency Exchange"
        note={`${amount} ${from} @ demo rate`}
        extraRows={[
          { label: "Demo Exchange Rate", value: `1 ${from} = ${rupees(rate)}` },
          { label: "Demo Service Fee", value: rupees(fee) },
        ]}
        onExit={onExit}
      />
    );

  return (
    <Panel className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Currency Exchange</h2>
        <DemoBadge label="Demo Rates" />
      </div>
      <p className="mt-3 text-base text-muted-foreground">
        Rates below are fixed demo values. This is not a live foreign exchange service.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fx-amount" className="mb-1 block text-base font-medium">
            Amount
          </label>
          <input
            id="fx-amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)}
            className="min-h-14 w-full rounded-xl border border-input bg-card px-4 text-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          />
        </div>
        <div>
          <label htmlFor="fx-currency" className="mb-1 block text-base font-medium">
            Currency
          </label>
          <select
            id="fx-currency"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="min-h-14 w-full rounded-xl border border-input bg-card px-4 text-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            {Object.keys(FX_RATES).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-6">
        <Row label="Amount" value={`${amount} ${from}`} />
        <Row label="Demo Exchange Rate" value={`1 ${from} = ${rupees(rate)}`} />
        <Row label="Converted Amount" value={rupees(converted)} strong />
        <Row label="Demo Service Fee (1%)" value={rupees(fee)} />
      </div>
      <KioskButton className="mt-6 w-full" onClick={() => setGo(true)} disabled={amount <= 0}>
        Continue
      </KioskButton>
    </Panel>
  );
}

/* ---------------- 9. kiosk finder ---------------- */

export function KioskFinderScreen() {
  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Nearby SFAP Kiosks</h2>
        <DemoBadge label="Mock Locations" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div
          className="relative min-h-72 overflow-hidden rounded-2xl border border-border bg-muted"
          role="img"
          aria-label="Illustrative map with four mock kiosk locations"
        >
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:36px_36px]" />
          {[
            { top: "22%", left: "30%" },
            { top: "48%", left: "62%" },
            { top: "68%", left: "26%" },
            { top: "34%", left: "80%" },
          ].map((pos, i) => (
            <span
              key={i}
              className="absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow"
              style={pos}
            >
              <MapPin className="size-5" aria-hidden />
            </span>
          ))}
          <span className="absolute bottom-3 left-3 rounded-lg bg-card px-3 py-1 text-sm text-muted-foreground">
            Demo map · no live location tracking
          </span>
        </div>
        <div className="grid gap-4">
          {KIOSKS.map((k) => (
            <div key={k.name} className="rounded-2xl border border-border bg-card p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">{k.name}</p>
                  <p className="text-sm text-muted-foreground">{k.distance} away</p>
                </div>
                <StatusPill status={k.status} />
              </div>
              <p className="mt-3 text-base">
                Cash Available: <span className="font-semibold">{rupees(k.cash)}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Services: {k.services.join(", ")}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/* ---------------- security demo ---------------- */

export function SecurityScreen({ onExit }: { onExit: () => void }) {
  const { txns, addTxn } = useSfap();
  const [fail, setFail] = useState(false);

  if (fail)
    return (
      <Panel className="mx-auto max-w-2xl text-center">
        <ShieldCheck className="mx-auto size-14 text-destructive" aria-hidden />
        <h2 className="mt-4 text-3xl font-bold">Payment Status: Failed</h2>
        <p className="mt-2 text-lg text-muted-foreground">Reason: “Demo payment timeout”</p>
        <p className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-lg font-semibold text-destructive">
          Cash has NOT been dispensed.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <KioskButton onClick={() => setFail(false)}>Retry</KioskButton>
          <KioskButton variant="ghost" onClick={onExit}>
            Exit
          </KioskButton>
        </div>
      </Panel>
    );

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Security &amp; Safety Logic</h2>
        <DemoBadge label="Simulated" />
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {[
          "Every QR carries a unique demo transaction ID.",
          "Each QR expires after a simulated 90-second window.",
          "Cash dispenses only after simulated payment confirmation.",
          "Failed or expired transactions never dispense cash.",
          "All attempts — success and failure — are logged in history.",
        ].map((s) => (
          <li key={s} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            <span className="text-base">{s}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <KioskButton
          variant="danger"
          onClick={() => {
            addTxn({ type: "Withdrawal", amount: 1000, status: "Failed", note: "Demo payment timeout" });
            setFail(true);
          }}
        >
          Simulate Failed Transaction
        </KioskButton>
      </div>

      <h3 className="mt-8 flex items-center gap-2 text-xl font-bold">
        <Info className="size-5" aria-hidden /> Transaction Log
      </h3>
      <div className="mt-2">
        {txns.slice(0, 6).map((t) => (
          <Row key={t.id} label={`${t.id} · ${t.type} · ${t.status}`} value={rupees(t.amount)} />
        ))}
      </div>
    </Panel>
  );
}
