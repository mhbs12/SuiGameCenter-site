import { useParams, Link } from "react-router-dom";
import { useSuiClientContext, useCurrentAccount } from "@mysten/dapp-kit";
import { getRoomById, removeRoom, NetworkName } from "@/lib/rooms";
import { Button } from "@/components/ui/button";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function WaitingRoom() {
  const { id } = useParams<{ id: string }>();
  const { network } = useSuiClientContext();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const room = id ? getRoomById(network as NetworkName, id) : undefined;

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
