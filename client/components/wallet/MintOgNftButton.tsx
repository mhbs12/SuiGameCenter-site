import { Button } from "@/components/ui/button";
import {
  useCurrentAccount,
  useSuiClientContext,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { SUI_PACKAGES, MINT_REGISTRY } from "@/lib/env";
import { toast } from "@/hooks/use-toast";
import { Transaction } from "@mysten/sui/transactions";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function MintOgNftButton({ className, size = "md" }: Props) {
  const account = useCurrentAccount();
  const { network } = useSuiClientContext();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const connected = Boolean(account?.address);
  const pkg =
    network === "mainnet" ? SUI_PACKAGES.mainnet : SUI_PACKAGES.testnet;
  const registry =
    network === "mainnet" ? MINT_REGISTRY.mainnet : MINT_REGISTRY.testnet;

  const disabled = !connected || !pkg || !registry;
  const label = "Mint OG NFT";

  const onClick = async () => {
    if (!connected) {
      toast({ title: "Connect your wallet to mint" });
      return;
    }
    if (!pkg) {
      toast({
        title: "Package ID not set",
        description: `Set VITE_SUI_PACKAGE_${network.toUpperCase()} in envs.`,
      });
      return;
    }
    if (!registry) {
      toast({
        title: "MintRegistry ID not set",
        description: `Set VITE_MINT_REGISTRY_${network.toUpperCase()} in envs.`,
      });
      return;
    }

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${pkg}::og_nft::mint_og`,
        arguments: [tx.object(registry)],
      });

      const res = await signAndExecute({ transaction: tx });
      toast({
        title: "Mint submitted",
        description: `Digest: ${res?.digest ?? "—"}`,
      });
    } catch (e: any) {
      toast({ title: "Mint failed", description: String(e?.message ?? e) });
    }
  };

  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      className={className}
      size={size === "lg" ? "lg" : size === "sm" ? "sm" : "default"}
    >
      {label}
    </Button>
  );
}
