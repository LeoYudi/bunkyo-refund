"use client";

import { useState } from "react";

export function BatchPaymentDialog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md dark:bg-gray-800">
        <h2 className="text-xl font-bold mb-4">Enviar Pagamentos em Lote</h2>
        <p className="mb-4">Deseja consolidar e enviar os pagamentos selecionados?</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-md">Cancelar</button>
          <button className="px-4 py-2 bg-primary text-white rounded-md">Confirmar Envio</button>
        </div>
      </div>
    </div>
  );
}
