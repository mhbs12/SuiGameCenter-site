import { useSuiClientContext } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";

export default function NetworkToggle() {
  const { network, selectNetwork } = useSuiClientContext();
  const isMainnet = network === "mainnet";

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background/60 p-1 text-xs">
      <Button
        type="button"
        variant={isMainnet ? "default" : "ghost"}
        size="sm"
        className="h-8 px-3"
        onClick={() => selectNetwork("mainnet")}
      >
        Mainnet
      </Button>
      <Button
        type="button"
        variant={!isMainnet ? "default" : "ghost"}
        size="sm"
        className="h-8 px-3"
        onClick={() => selectNetwork("testnet")}
      >
        Testnet
      </Button>
    </div>
  );
}
