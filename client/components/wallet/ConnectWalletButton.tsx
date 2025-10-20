import { ConnectButton } from "@mysten/dapp-kit";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function ConnectWalletButton({ className, size = "md" }: Props) {
  const sizing =
    size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm";

  return (
    <ConnectButton
      className={cn(
        "rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm",
        "data-[connected=true]:bg-secondary data-[connected=true]:text-secondary-foreground",
        sizing,
        className,
      )}
    />
  );
}
