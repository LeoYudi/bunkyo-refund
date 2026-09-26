import type { Database } from "@/models/database.types";

export type RefundRequest =
  Database["public"]["Tables"]["refund_requests"]["Row"];

export function RequestsTable({ requests }: { requests: RefundRequest[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">
              Nome
            </th>
            <th scope="col" className="px-6 py-3">
              Status
            </th>
            <th scope="col" className="px-6 py-3">
              Data
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                Nenhuma solicitação encontrada.
              </td>
            </tr>
          ) : (
            requests.map((req) => (
              <tr
                key={req.id}
                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  {req.requester_name}
                </td>
                <td className="px-6 py-4">{req.status}</td>
                <td className="px-6 py-4">
                  {new Date(req.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
