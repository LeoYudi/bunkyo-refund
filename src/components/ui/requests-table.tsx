"use client";

import { Eye } from "lucide-react";
import { useState } from "react";
import type { Database } from "@/models/database.types";
import { ReceiptModal } from "./receipt-modal";

export type RefundRequest =
  Database["public"]["Tables"]["refund_requests"]["Row"];

export function RequestsTable({ requests }: { requests: RefundRequest[] }) {
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            <th scope="col" className="px-6 py-3">
              Anexo
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
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
                <td className="px-6 py-4">
                  {req.receipt_file_url ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReceiptUrl(req.receipt_file_url);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-lg text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Ver anexo"
                    >
                      <Eye className="size-4" />
                    </button>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <ReceiptModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReceiptUrl(null);
        }}
        receiptUrl={selectedReceiptUrl}
      />
    </div>
  );
}
