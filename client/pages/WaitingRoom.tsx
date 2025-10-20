import { useSuiClientContext, useCurrentAccount } from "@mysten/dapp-kit";
import { getRoomById, removeRoom, NetworkName } from "@/lib/rooms";
import { Button } from "@/components/ui/button";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { getFullnodeUrl } from "@mysten/sui/client";

export default function WaitingRoom() {
  const { id } = useParams<{ id: string }>();
  const { network } = useSuiClientContext();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const room = id ? getRoomById(network as NetworkName, id) : undefined;

  const [controlData, setControlData] = useState<any>(null);
  const [loadingControl, setLoadingControl] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!room?.controlId) return;
    const url = getFullnodeUrl(network as any).replace(/\/$/, "");
    let timer: any = null;

    const fetchControl = async () => {
      try {
        setLoadingControl(true);
        // Sui fullnode REST endpoint for object info
        const resp = await fetch(`${url}/objects/${room.controlId}`);
        if (!resp.ok) throw new Error(`Fetch failed ${resp.status}`);
        const data = await resp.json();
        if (!mounted) return;
        setControlData(data);

        // react to changes in the control object
        // Try to find players or status in common places
        const getFields = (obj: any) => obj?.data?.content?.fields ?? obj?.data?.content ?? obj?.content?.fields ?? obj?.content ?? obj?.fields ?? null;
        const fields = getFields(data);

        // heuristics: check for player1/player2 or players array or status/state
        let otherJoined = false;
        let stateValue: any = undefined;
        if (fields) {
          if (typeof fields.player2 !== "undefined") {
            // player2 might be address or option
            const p2 = fields.player2;
            if (p2 && p2 !== "0x0" && p2 !== null) otherJoined = true;
          }
          if (Array.isArray(fields.players) && fields.players.length > 1) {
            otherJoined = true;
          }
          if (typeof fields.state !== "undefined") stateValue = fields.state;
          if (typeof fields.status !== "undefined") stateValue = fields.status;
        }

        // If other player joined, try to find the created Game object and update local storage
        if (otherJoined) {
          try {
            // scan control data for candidate object ids
            function collectIds(obj: any, out: Set<string>) {
              if (!obj || typeof obj !== "object") return;
              for (const k of Object.keys(obj)) {
                const v = obj[k];
                if (typeof v === "string" && /^0x[0-9a-fA-F]{2,}$/.test(v)) out.add(v);
                else if (typeof v === "object") collectIds(v, out);
              }
            }
            const ids = new Set<string>();
            collectIds(data, ids);

            let foundGameId: string | undefined = undefined;
            for (const candidate of ids) {
              try {
                const resp = await fetch(`${url}/objects/${candidate}`);
                if (!resp.ok) continue;
                const obj = await resp.json();
                const f = obj?.data?.content?.fields ?? obj?.data?.content ?? obj?.content?.fields ?? obj?.content ?? obj?.fields ?? null;
                if (!f) continue;
                // check for Game struct: board (vector), turn (number), x and o addresses
                const hasBoard = Array.isArray(f.board) || Array.isArray(f.cells);
                const hasTurn = typeof f.turn !== "undefined" || typeof f.current_turn !== "undefined";
                const hasPlayers = typeof f.x !== "undefined" || typeof f.o !== "undefined" || (Array.isArray(f.players) && f.players.length >= 2);
                if (hasBoard && hasTurn && hasPlayers) {
                  foundGameId = candidate;
                  break;
                }
              } catch (e) {
                // ignore
              }
            }

            const { updateRoom } = await import("@/lib/rooms");
            updateRoom(network as NetworkName, room.id, { status: "active", ...(foundGameId ? { gameId: foundGameId } : {}) });
            toast({ title: "Opponent joined", description: "The match is ready." });
            if (foundGameId) {
              navigate(`/tictactoe/game/${encodeURIComponent(room.id)}`);
            }
          } catch (err) {
            console.warn("Failed to update room", err);
          }
        }

        // If stateValue suggests game started, redirect to game view
        if (stateValue === "active" || stateValue === "playing" || stateValue === 1) {
          toast({ title: "Game started", description: "Opening game view..." });
          navigate(`/tictactoe/game/${encodeURIComponent(room.id)}`);
        }
      } catch (e) {
        console.warn("Failed to fetch control object", e);
      } finally {
        if (mounted) setLoadingControl(false);
      }
    };

    // initial fetch
    fetchControl();
    // poll every 3s
    timer = setInterval(fetchControl, 3000);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [room?.controlId, network]);

  const handleDelete = () => {
    if (!id || !room) return;
    if (!account?.address) {
      toast({ title: "Connect your wallet first" });
      return;
    }
    if (account.address !== room.creator) {
      toast({ title: "Only the room creator can delete this room" });
      return;
    }
    // confirm
    if (!confirm("Are you sure you want to delete this room? This cannot be undone.")) {
      return;
    }

    try {
      removeRoom(network as NetworkName, id);
      toast({ title: "Room deleted" });
      navigate("/tictactoe");
    } catch (e: any) {
      toast({ title: "Delete failed", description: String(e?.message ?? e) });
    }
  };

  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="rounded-2xl border border-border bg-card/60 p-8 text-center backdrop-blur">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <h1 className="text-2xl font-bold">Waiting for an opponent…</h1>
          {room ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Room <span className="font-medium text-foreground">{room.name}</span> • Stake {(Number(room.stakeMist) / 1e9).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })} SUI
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Room: {id}</p>
          )}

          {room?.controlId && (
            <div className="mt-4 text-left">
              <p className="text-xs text-muted-foreground">Control object: <code className="font-mono">{room.controlId}</code></p>
              <div className="mt-2 rounded-md border border-border p-3 bg-background/40">
                {loadingControl && <p className="text-sm text-muted-foreground">Loading control object...</p>}
                {!loadingControl && controlData && (
                  <pre className="text-xs max-h-60 overflow-auto">{JSON.stringify(controlData, null, 2)}</pre>
                )}
                {!loadingControl && !controlData && (
                  <p className="text-sm text-muted-foreground">No control data yet.</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild variant="secondary">
              <a
                href={typeof window !== "undefined" ? window.location.href : "#"}
                target="_blank"
                rel="noreferrer"
              >
                Share link
              </a>
            </Button>
            <Link to="/tictactoe" className="text-sm text-foreground/70 hover:text-primary">
              Back
            </Link>
            {room && account?.address === room.creator && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete room
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
