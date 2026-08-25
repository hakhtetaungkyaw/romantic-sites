const PAYMENT_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  verified: "bg-green-500/15 text-green-300 border-green-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
};

const DELIVERY_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  in_progress: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  delivered: "bg-green-500/15 text-green-300 border-green-500/30",
};

function labelize(status: string): string {
  return status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const style = PAYMENT_STYLES[status] ?? "bg-white/5 text-gray-300 border-white/15";
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {labelize(status)}
    </span>
  );
}

export function DeliveryStatusBadge({ status }: { status: string }) {
  const style = DELIVERY_STYLES[status] ?? "bg-white/5 text-gray-300 border-white/15";
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {labelize(status)}
    </span>
  );
}

export function ArchivedBadge() {
  return (
    <span className="inline-block rounded-full border border-gray-500/30 bg-gray-500/15 px-2.5 py-0.5 text-xs font-medium text-gray-300">
      Archived
    </span>
  );
}
