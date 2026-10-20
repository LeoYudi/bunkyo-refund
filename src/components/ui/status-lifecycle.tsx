import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  CornerDownRight,
  Cpu,
  DollarSign,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  REFUND_LIFECYCLE_STEPS,
  REFUND_STATUS_MAP,
  type RefundStatus,
} from "@/models/refund.model";

const statusIcons: Record<
  RefundStatus,
  React.ComponentType<{ className?: string }>
> = {
  PENDING: Clock,
  PROCESSING: Cpu,
  APPROVED: CheckCircle2,
  DENIED: AlertCircle,
  SENT: Send,
  PAID: DollarSign,
};

export function StatusLifecycle() {
  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Ciclo de Status
        </h3>
        <span className="text-xs text-muted-foreground">
          Fluxo operacional de pedidos de reembolso
        </span>
      </div>

      {/* Main Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {REFUND_LIFECYCLE_STEPS.map((status, index) => {
          const info = REFUND_STATUS_MAP[status];
          const Icon = statusIcons[status] || Clock;
          const isLast = index === REFUND_LIFECYCLE_STEPS.length - 1;

          return (
            <div
              key={status}
              className="flex flex-col space-y-2 p-4 rounded-lg bg-muted/40 border relative"
            >
              <div className="flex items-center justify-between">
                <Badge variant={info.badgeVariant}>{info.label}</Badge>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {info.description}
              </p>
              {!isLast && (
                <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Denied / Exception branch */}
      <div className="border-t pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-destructive/5 p-4 rounded-lg border border-destructive/20 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground flex items-center space-x-2">
              <span>Desvio / Exceção na Triagem</span>
              <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              {REFUND_STATUS_MAP.DENIED.description}
            </p>
          </div>
        </div>
        <Badge variant={REFUND_STATUS_MAP.DENIED.badgeVariant}>
          {REFUND_STATUS_MAP.DENIED.label}
        </Badge>
      </div>
    </div>
  );
}
