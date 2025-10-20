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
              myRooms.length === 0 ? (
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
              )
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
