import { getRefundRequestsAction } from "@/actions/refund.actions";
import { RequestsTable } from "@/components/ui/requests-table";

export default async function AdminDashboardPage() {
  const result = await getRefundRequestsAction();

  if (!result.success) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          Erro ao carregar solicitações: {result.error}
        </div>
      </div>
    );
  }

  const requests = result.data || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Solicitações de Reembolso</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie e avalie os pedidos de reembolso enviados pelos
          colaboradores.
        </p>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        <RequestsTable requests={requests} />
      </div>
    </div>
  );
}
