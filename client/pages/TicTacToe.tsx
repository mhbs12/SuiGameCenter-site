import { useMemo, useState } from "react";
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
import { addRoom, getRooms, removeRoom, NetworkName } from "@/lib/rooms";
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

  const [createName, setCreateName] = useState("");
  const [createAmount, setCreateAmount] = useState("");
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { network } = useSuiClientContext();
  const pkg =
    network === "mainnet" ? SUI_PACKAGES.mainnet : SUI_PACKAGES.testnet;
  const playerRegistry =
    network === "mainnet" ? PLAYER_REGISTRY.mainnet : PLAYER_REGISTRY.testnet;
  const [joinName, setJoinName] = useState("");
  const [joinAmount, setJoinAmount] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const rooms = useMemo(() => getRooms(network as NetworkName), [network, refreshKey]);
  const myRooms = useMemo(() => rooms.filter((r) => r.creator === account?.address), [rooms, account?.address]);

  const [myControls, setMyControls] = useState<any[]>([]);
  const [availableControls, setAvailableControls] = useState<any[]>([]);
  const [loadingControls, setLoadingControls] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!account?.address) {
      setMyControls([]);
      return;
    }
    const load = async () => {
      setLoadingControls(true);
      try {
        const url = getFullnodeUrl(network as any).replace(/\/$/, "");
        // call JSON-RPC sui_getObjectsOwnedByAddress
        const body = { jsonrpc: "2.0", id: 1, method: "sui_getObjectsOwnedByAddress", params: [account.address] };
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await resp.json();
        const refs = json.result ?? [];
        const controls: any[] = [];
        for (const r of refs) {
          const objectId = r?.objectId ?? r?.reference?.objectId ?? r?.object_id ?? r?.object_id;
          if (!objectId) continue;
          try {
            const oresp = await fetch(`${url}/objects/${objectId}`);
            if (!oresp.ok) continue;
            const ojson = await oresp.json();
            const type = ojson?.data?.type ?? ojson?.type ?? "";
            if (!type.includes(`${pkg}::main::Control`)) continue;
            const fields = ojson?.data?.content?.fields ?? ojson?.data?.content ?? ojson?.content?.fields ?? ojson?.content ?? ojson?.fields ?? null;
            controls.push({ id: objectId, type, fields });
          } catch (e) {
            // ignore per-object errors
          }
        }
        if (mounted) setMyControls(controls);
      } catch (e) {
        console.warn("Failed to load my controls", e);
      } finally {
        if (mounted) setLoadingControls(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [account?.address, network]);

  useEffect(() => {
    let mounted = true;
    const loadAvailable = async () => {
      try {
        const explorerBase = "https://explorer.sui.io";
        const typeStr = `${pkg}::main::Control`;
        const candidates = [
          `${explorerBase}/api/objects/by_type?type=${encodeURIComponent(typeStr)}&network=${network}`,
          `${explorerBase}/api/v1/objects/by_type?type=${encodeURIComponent(typeStr)}&network=${network}`,
          `${explorerBase}/api/search?query=${encodeURIComponent(typeStr)}&network=${network}`,
        ];
        let found: any[] = [];
        for (const u of candidates) {
          try {
            const r = await fetch(u);
            if (!r.ok) continue;
            const j = await r.json().catch(() => null);
            if (!j) continue;
            // try different shapes
            if (Array.isArray(j)) found = j;
            else if (Array.isArray(j.data)) found = j.data;
            else if (Array.isArray(j.result)) found = j.result;
            if (found.length > 0) break;
          } catch (e) {
            continue;
          }
        }
        // Normalize found entries to objects with id and fields when possible
        const controls: any[] = [];
        if (found.length > 0) {
          const url = getFullnodeUrl(network as any).replace(/\/$/, "");
          for (const item of found) {
            const id = item?.objectId ?? item?.id ?? item?.object_id ?? item?.digest ?? item?.name;
            if (!id) continue;
            try {
              const oresp = await fetch(`${url}/objects/${id}`);
              if (!oresp.ok) continue;
              const ojson = await oresp.json();
              const type = ojson?.data?.type ?? ojson?.type ?? "";
              if (!type.includes(`${pkg}::main::Control`)) continue;
              const fields = ojson?.data?.content?.fields ?? ojson?.data?.content ?? ojson?.content?.fields ?? ojson?.content ?? ojson?.fields ?? null;
              controls.push({ id, type, fields });
            } catch (e) {
              // ignore
            }
          }
        }
        if (mounted) setAvailableControls(controls);
      } catch (e) {
        if (mounted) setAvailableControls([]);
      }
    };
    loadAvailable();
    return () => {
      mounted = false;
    };
  }, [network]);

  const onCreate = async () => {
    if (!connected) {
      toast({ title: "Connect your wallet first" });
      return;
    }
    if (!createName.trim()) {
      toast({ title: "Enter a room name" });
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

      // attempt to extract a created control object id from the response
      function findObjectId(obj: any): string | undefined {
        if (!obj || typeof obj !== "object") return undefined;
        if (typeof obj.objectId === "string") return obj.objectId;
        // common nested shapes: reference: { objectId }
        if (obj.reference && typeof obj.reference === "object" && typeof obj.reference.objectId === "string") return obj.reference.objectId;
        for (const k of Object.keys(obj)) {
          const v = (obj as any)[k];
          if (typeof v === "string" && /^0x[0-9a-fA-F]{20,}$/i.test(v)) return v; // heuristic for sui object ids
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
        name: createName.trim(),
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
    if (amt == null || !joinName.trim()) {
      toast({ title: "Enter a room name and SUI amount" });
      return;
    }
    toast({
      title: "Joining room",
      description: `Room: ${joinName} • Stake: ${amt} SUI`,
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
          <Link
            to="/"
            className="text-sm text-foreground/70 hover:text-primary"
          >
            ← Back to games
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur">
            <h2 className="text-lg font-semibold">Create room</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set the stake and create a new room.
            </p>
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="create-name">Room name</Label>
                <Input
                  id="create-name"
                  placeholder="e.g. pro-match-1"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-amount">Stake (SUI)</Label>
                <Input
                  id="create-amount"
                  inputMode="decimal"
                  placeholder="e.g. 1.5"
                  value={createAmount}
                  onChange={(e) => setCreateAmount(e.target.value)}
                />
              </div>
              <Button onClick={onCreate} className="w-full">
                Create Room
              </Button>
              {!connected && (
                <p className="text-xs text-muted-foreground">
                  You must connect your wallet before creating a room.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur">
            <h2 className="text-lg font-semibold">Join room</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the room name and your matching stake.
            </p>
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="room-name">Room name</Label>
                <Input
                  id="room-name"
                  placeholder="e.g. pro-match-1"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="join-amount">Stake (SUI)</Label>
                <Input
                  id="join-amount"
                  inputMode="decimal"
                  placeholder="e.g. 1.5"
                  value={joinAmount}
                  onChange={(e) => setJoinAmount(e.target.value)}
                />
              </div>
              <Button onClick={onJoin} className="w-full" variant="secondary">
                Join Room
              </Button>
              {!connected && (
                <p className="text-xs text-muted-foreground">
                  You must connect your wallet before joining a room.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">My rooms</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Rooms you created on this device.
          </p>
          <div className="mt-4 grid gap-3">
            {account?.address ? (
              <>
                {myControls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium">On-chain Controls</h3>
                    <div className="mt-2 space-y-2">
                      {myControls.map((c) => (
                        <div key={c.id} className="flex items-center justify-between rounded-md border border-border/60 bg-background/60 p-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">Control • <code className="font-mono">{c.id}</code></p>
                            <p className="truncate text-xs text-muted-foreground">
                              Sender1: <span className="font-mono">{String(c.fields?.sender1 ?? c.fields?.sender)}</span> • Amount1: <span className="font-mono">{String(c.fields?.amount1 ?? c.fields?.amount)}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/tictactoe/wait/${encodeURIComponent(c.id)}`)}>
                              Open
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {myRooms.length === 0 && myControls.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You have no rooms yet.</p>
                ) : (
                  myRooms.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-md border border-border/60 bg-background/60 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{r.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          Stake: {(Number(r.stakeMist) / 1e9).toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })} SUI • ID: <code className="font-mono">{r.id}</code>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            navigate(`/tictactoe/wait/${encodeURIComponent(r.id)}`)
                          }
                        >
                          Open
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (!confirm("Delete this room?")) return;
                            removeRoom(network as NetworkName, r.id);
                            setRefreshKey((k) => k + 1);
                            toast({ title: "Room deleted" });
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Connect your wallet to see your rooms.</p>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold">Available rooms</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recently created rooms on this device for {network}.
          </p>
          <div className="mt-4 grid gap-3">
            {rooms.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No rooms yet. Create one to get started.
              </p>
            )}
            {rooms.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-border/60 bg-background/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {r.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Stake:{" "}
                    {(Number(r.stakeMist) / 1e9).toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}{" "}
                    SUI • ID: <code className="font-mono">{r.id}</code>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      navigate(`/tictactoe/wait/${encodeURIComponent(r.id)}`)
                    }
                  >
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
