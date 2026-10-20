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
        {/* Step 1 */}
        <div className="flex flex-col space-y-2 p-4 rounded-lg bg-muted/40 border relative">
          <div className="flex items-center justify-between">
            <Badge variant="pending">Pendente</Badge>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Recebido do formulário público e aguardando triagem do
            administrador.
          </p>
          <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-muted-foreground" />
        </div>

        {/* Step 2 */}
        <div className="flex flex-col space-y-2 p-4 rounded-lg bg-muted/40 border relative">
          <div className="flex items-center justify-between">
            <Badge variant="processing">Processando</Badge>
            <Cpu className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nota fiscal em leitura e extração de dados pela IA (Gemini).
          </p>
          <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-muted-foreground" />
        </div>

        {/* Step 3 */}
        <div className="flex flex-col space-y-2 p-4 rounded-lg bg-muted/40 border relative">
          <div className="flex items-center justify-between">
            <Badge variant="approved">Aprovado</Badge>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dados extraídos e validados, pronto para envio em lote.
          </p>
          <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-muted-foreground" />
        </div>

        {/* Step 4 */}
        <div className="flex flex-col space-y-2 p-4 rounded-lg bg-muted/40 border relative">
          <div className="flex items-center justify-between">
            <Badge variant="sent">Enviado</Badge>
            <Send className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Lote consolidado e encaminhado por e-mail ao financeiro.
          </p>
          <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-muted-foreground" />
        </div>

        {/* Step 5 */}
        <div className="flex flex-col space-y-2 p-4 rounded-lg bg-muted/40 border relative">
          <div className="flex items-center justify-between">
            <Badge variant="paid">Pago</Badge>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Reembolso efetuado e concluído pelo financeiro.
          </p>
        </div>
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
              Pedido recusado ou invalidado na triagem.
            </p>
          </div>
        </div>
        <Badge variant="denied">Negado</Badge>
      </div>
    </div>
  );
}
