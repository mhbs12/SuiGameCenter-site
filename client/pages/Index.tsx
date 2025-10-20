import ConnectWalletButton from "@/components/wallet/ConnectWalletButton";
import AccountInfo from "@/components/wallet/AccountInfo";
import { useCurrentAccount } from "@mysten/dapp-kit";
import MintOgNftButton from "@/components/wallet/MintOgNftButton";

export default function Index() {
  const account = useCurrentAccount();
  const connected = Boolean(account?.address);
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_75%_10%,hsl(var(--brand)/0.25)_0%,transparent_60%),radial-gradient(40%_40%_at_30%_90%,hsl(var(--primary)/0.18)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,transparent_0,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,transparent_0,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute -top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-brand/20 blur-3xl animate-float" />
      <div className="absolute -bottom-24 -left-24 -z-10 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-float-slow" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              Live on Sui Testnet
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              <span className="bg-gradient-to-br from-brand to-primary bg-clip-text text-transparent">
                SuiGameCenter
              </span>
            </h1>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
              A minimal, SUI‑inspired platform. Connect your wallet, manage your
              assets, and play on‑chain experiences with smooth effects and
              performance.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!connected ? <ConnectWalletButton size="lg" /> : null}
              <MintOgNftButton size="lg" />
              <a
                href="https://docs.sui.io/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-primary transition-colors"
              >
                Learn about Sui →
              </a>
            </div>
            <AccountInfo />
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-tr from-brand/20 to-primary/20 blur-2xl" />
            <div className="rounded-3xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur">
              <div className="aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-background to-muted/60 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-14 w-14 rounded-xl bg-gradient-to-br from-brand to-primary text-white grid place-content-center shadow-md">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 3c5 0 9 4 9 9s-4 9-9 9S3 17 3 12 7 3 12 3Z"
                        fill="currentColor"
                        opacity=".1"
                      />
                      <path
                        d="M7 13.5c1.5-2.5 3.5-5 5-5s3.5 2.5 5 5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9 15.5c.9-1.5 2.1-3 3-3s2.1 1.5 3 3"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Minimal & SUI‑like
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                    UI limpa, responsiva e com conectividade de carteira pronta
                    para uso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16">
          <h2 className="text-xl font-semibold text-foreground">Games</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a game to start playing with SUI stakes.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <a
              href="/tictactoe"
              className="group rounded-xl border border-border bg-card/60 p-5 backdrop-blur transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    TicTacToe
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Play head‑to‑head. Create or join a room with SUI stakes.
                  </p>
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                  Live
                </span>
              </div>
            </a>
            <div className="rounded-xl border border-border bg-card/60 p-5 opacity-60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Chess</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Coming soon
                  </p>
                </div>
                <span className="rounded-md bg-muted px-2 py-1 text-xs text-foreground/70">
                  Coming soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
