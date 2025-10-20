import { useEffect, useMemo, useState } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";

function shortAddress(addr: string, chars = 6) {
  return addr.length > 12
    ? `${addr.slice(0, chars)}…${addr.slice(-chars)}`
    : addr;
}

export default function AccountInfo() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const [balance, setBalance] = useState<string | null>(null);
  const owner = account?.address;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!owner) {
        setBalance(null);
        return;
      }
      try {
        const res = await client.getBalance({
          owner,
          coinType: "0x2::sui::SUI",
        });
        if (!cancelled)
          setBalance(
            (Number(res.totalBalance) / 1e9).toLocaleString(undefined, {
              maximumFractionDigits: 4,
            }) + " SUI",
          );
      } catch (e) {
        if (!cancelled) setBalance("—");
      }
    }
    load();
    const id = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [client, owner]);

  const connected = Boolean(owner);

  if (!connected) return null;

  return (
    <div className="mt-6 w-full max-w-xl rounded-lg border border-border bg-card/60 backdrop-blur p-4 text-sm text-muted-foreground">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-foreground/70">
            Connected account
          </p>
          <p className="font-mono text-foreground">{shortAddress(owner!)}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-xs uppercase tracking-wide text-foreground/70">
            SUI Balance
          </p>
          <p className="font-semibold text-foreground">
            {balance ?? "Loading…"}
          </p>
        </div>
      </div>
    </div>
  );
}
