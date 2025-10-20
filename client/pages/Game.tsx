import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSuiClientContext, useCurrentAccount } from "@mysten/dapp-kit";
import { getRoomById, NetworkName } from "@/lib/rooms";
import { getFullnodeUrl } from "@mysten/sui/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const { network } = useSuiClientContext();
  const account = useCurrentAccount();
  const room = id ? getRoomById(network as NetworkName, id) : undefined;

  const [controlData, setControlData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    // prefer game object if present
    const targetId = room?.gameId ?? room?.controlId;
    if (!targetId) return;
    const url = getFullnodeUrl(network as any).replace(/\/$/, "");
    let timer: any = null;

    const fetchControl = async () => {
      try {
        setLoading(true);
        const resp = await fetch(`${url}/objects/${targetId}`);
        if (!resp.ok) throw new Error(`Fetch failed ${resp.status}`);
        const data = await resp.json();
        if (!mounted) return;
        setControlData(data);
      } catch (e) {
        console.warn("Failed to fetch control object", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchControl();
    timer = setInterval(fetchControl, 2000);
    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [room?.controlId, network]);

  // helpers to extract board & players from control object
  function extractFields(obj: any) {
    return (
      obj?.data?.content?.fields ?? obj?.data?.content ?? obj?.content?.fields ?? obj?.content ?? obj?.fields ?? null
    );
  }

  const fields = extractFields(controlData);
  // For Game struct: x (address), o (address), board: vector<u8>, turn: u8
  const players = fields ? [fields.x ?? fields.player1 ?? (fields.players && fields.players[0]), fields.o ?? fields.player2 ?? (fields.players && fields.players[1])] : undefined;
  let board = null;
  if (fields) {
    if (Array.isArray(fields.board)) board = fields.board.map((v: any) => (typeof v === "object" && v !== null && v.value !== undefined ? v.value : v));
    else if (Array.isArray(fields.cells)) board = fields.cells;
  }
  const turn = fields?.turn ?? fields?.current_turn ?? null;

  // Render a 3x3 board if array-like
  const renderBoard = () => {
    if (!board || !Array.isArray(board)) return <p className="text-sm text-muted-foreground">Board state not available.</p>;
    // ensure length 9 for display
    const cells = board.slice(0, 9).concat(Array.from({ length: Math.max(0, 9 - board.length) }, () => null));
    return (
      <div className="grid grid-cols-3 gap-2 w-56">
        {cells.map((c: any, idx: number) => (
          <div key={idx} className="h-14 w-14 rounded-md border border-border bg-background/70 flex items-center justify-center text-lg font-semibold">
            {c === null || c === undefined ? "" : String(c)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">TicTacToe — Match</h1>
            <p className="mt-1 text-sm text-muted-foreground">Room: <span className="font-medium">{room?.name ?? id}</span></p>
          </div>
          <Link to="/tictactoe" className="text-sm text-foreground/70 hover:text-primary">← Back</Link>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur">
          <div className="mb-4">
            {loading && <p className="text-sm text-muted-foreground">Loading game state...</p>}
            {!loading && !controlData && <p className="text-sm text-muted-foreground">No on-chain control data yet.</p>}
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:gap-6">
            <div className="mb-4 md:mb-0">{renderBoard()}</div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Players</h3>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {players ? (
                  players.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-mono text-xs">{String(p)}</span>
                      {account?.address && account.address === String(p) && <span className="text-xs text-primary">(you)</span>}
                    </div>
                  ))
                ) : (
                  <p>No players yet.</p>
                )}
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold">Turn</h3>
                <p className="mt-1 text-sm text-muted-foreground">{turn ?? "unknown"}</p>
              </div>

              <div className="mt-6">
                <Button variant="secondary" onClick={() => {
                  toast({ title: "Syncing state" });
                }}>
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
