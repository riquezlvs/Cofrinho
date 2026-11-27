"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Landmark, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((mod) => mod.PluggyConnect),
  { ssr: false }
);

interface ConnectBankButtonProps {
  onConnected?: () => void;
}

export function ConnectBankButton({ onConnected }: ConnectBankButtonProps) {
  const router = useRouter();
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleConnect = async () => {
    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/connect-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { accessToken?: string; error?: string };

      if (!res.ok || !data.accessToken) {
        setStatus("error");
        setMessage(
          data.error ?? "Não foi possível iniciar a conexão Open Finance."
        );
        return;
      }

      setConnectToken(data.accessToken);
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Erro de rede ao conectar com Open Finance.");
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleConnect()}
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#ccff00] text-black font-semibold text-sm hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
      >
        {status === "loading" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Landmark className="w-4 h-4" />
        )}
        {status === "loading"
          ? "Conectando ao Open Finance..."
          : "Conectar banco via Open Finance"}
      </button>

      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={true}
          onSuccess={async (itemData) => {
            setConnectToken(null);
            setStatus("loading");
            try {
              const syncRes = await fetch("/api/open-finance/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  itemId: itemData.item.id,
                  institutionName: itemData.item.connector?.name,
                }),
              });
              const syncData = (await syncRes.json().catch(() => ({}))) as {
                error?: string;
              };
              if (syncRes.ok) {
                setStatus("success");
                setMessage("Banco conectado e sincronizado com sucesso!");
                router.refresh();
                onConnected?.();
              } else {
                setStatus("error");
                setMessage(
                  syncData.error ||
                    "Conectado, mas houve erro ao sincronizar dados."
                );
              }
            } catch {
              setStatus("error");
              setMessage("Erro ao enviar dados para sincronização.");
            }
          }}
          onError={(error) => {
            setConnectToken(null);
            setStatus("error");
            setMessage(error.message || "Falha na conexão com o banco.");
          }}
          onClose={() => {
            setConnectToken(null);
          }}
        />
      )}

      {message && (
        <div
          className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border ${
            status === "error"
              ? "bg-red-500/10 border-red-500/30 text-red-300"
              : "bg-[#ccff00]/10 border-[#ccff00]/30 text-[#ccff00]"
          }`}
        >
          {status === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
