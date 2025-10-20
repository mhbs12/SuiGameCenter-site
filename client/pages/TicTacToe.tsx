import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  useCurrentAccount,
  useSuiClientContext,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Link, useNavigate } from "react-router-dom";
import { SUI_PACKAGES, PLAYER_REGISTRY } from "@/lib/env";
import { addRoom, NetworkName } from "@/lib/rooms";
import { Transaction } from "@mysten/sui/transactions";

function parseSui(value: string) {
  const n = Number(value);
  if (!isFinite(n) || n <= 0) return null;
  return n;
}

export default function TicTacToePage() {
  const account = useCurrentAccount();
  const connected = Boolean(account?.address);
  const navigate = useNavigate();

  const [createAmount, setCreateAmount] = useState("");
  const [controlId, setControlId] = useState("");
  const [joinAmount, setJoinAmount] = useState("");

  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { network } = useSuiClientContext();
  const pkg =
    network === "mainnet" ? SUI_PACKAGES.mainnet : SUI_PACKAGES.testnet;
  const playerRegistry =
    network === "mainnet" ? PLAYER_REGISTRY.mainnet : PLAYER_REGISTRY.testnet;

  const onCreate = async () => {
    if (!connected) {
      toast({ title: "Connect your wallet first" });
      return;
    }
    const amt = parseSui(createAmount);
    if (amt == null) {
      toast({ title: "Enter a valid SUI amount (> 0)" });
      return;
    }
    if (!pkg || !playerRegistry) {
      toast({
        title: "Missing env",
        description: "Set package and PLAYER_REGISTRY IDs for current network.",
      });
      return;
    }

    try {
      const mist = BigInt(Math.floor(amt * 1e9));
      const tx = new Transaction();
      const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(mist)]);
      tx.moveCall({
        target: `${pkg}::ttt::start_bttt`,
        arguments: [stakeCoin, tx.pure.u64(mist), tx.object(playerRegistry)],
      });
      const res = await signAndExecute({ transaction: tx });

      function findObjectId(obj: any): string | undefined {
        if (!obj || typeof obj !== "object") return undefined;
        if (typeof obj.objectId === "string") return obj.objectId;
        if (obj.reference && typeof obj.reference === "object" && typeof obj.reference.objectId === "string")
          return obj.reference.objectId;
        for (const k of Object.keys(obj)) {
          const v = (obj as any)[k];
          if (typeof v === "string" && /^0x[0-9a-fA-F]{20,}$/i.test(v)) return v;
          if (typeof v === "object") {
            const found = findObjectId(v);
            if (found) return found;
          }
        }
        return undefined;
      }

      const controlId = findObjectId(res) ?? undefined;
      const id = res?.digest ?? `${Date.now()}`;
      addRoom(network as NetworkName, {
        id,
        name: "",
        stakeMist: String(mist),
        creator: account!.address,
        network: network as NetworkName,
        status: "waiting",
        createdAt: Date.now(),
        txDigest: res?.digest,
        controlId,
      });
      navigate(`/tictactoe/wait/${encodeURIComponent(id)}`);
    } catch (e: any) {
      toast({ title: "Create failed", description: String(e?.message ?? e) });
    }
  };

  const onJoin = () => {
    if (!connected) {
      toast({ title: "Connect your wallet first" });
      return;
    }
    const amt = parseSui(joinAmount);
    if (amt == null || !controlId.trim()) {
      toast({ title: "Enter a Control ID and SUI amount" });
      return;
    }
    toast({
      title: "Joining control",
      description: `Control: ${controlId} • Stake: ${amt} SUI`,
    });
  };

  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">TicTacToe</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a room and set a stake in SUI, or join an existing room.
            </p>
          </div>
          <Link to="/" className="text-sm text-foreground/70 hover:text-primary">
            ← Back to games
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur">
            <h2 className="text-lg font-semibold">Create room</h2>
            <p className="mt-1 text-sm text-muted-foreground">Set the stake and create a new room.</p>
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="create-amount">Stake (SUI)</Label>
                <Input id="create-amount" inputMode="decimal" placeholder="e.g. 1.5" value={createAmount} onChange={(e) => setCreateAmount(e.target.value)} />
              </div>

              <Button onClick={onCreate} className="w-full">
                Create Room
              </Button>

              {!connected && (
                <p className="text-xs text-muted-foreground">You must connect your wallet before creating a room.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur">
            <h2 className="text-lg font-semibold">Join room</h2>
            <p className="mt-1 text-sm text-muted-foreground">Enter the room name and your matching stake.</p>
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="room-name">Room name</Label>
                <Input id="room-name" placeholder="e.g. pro-match-1" value={joinName} onChange={(e) => setJoinName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="join-amount">Stake (SUI)</Label>
                <Input id="join-amount" inputMode="decimal" placeholder="e.g. 1.5" value={joinAmount} onChange={(e) => setJoinAmount(e.target.value)} />
              </div>

              <Button onClick={onJoin} className="w-full" variant="secondary">
                Join Room
              </Button>

              {!connected && (
                <p className="text-xs text-muted-foreground">You must connect your wallet before joining a room.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
