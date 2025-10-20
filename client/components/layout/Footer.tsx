export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-xs text-muted-foreground flex items-center justify-between">
        <p>© {new Date().getFullYear()} SuiGameCenter</p>
        <p className="opacity-80">Built with React + Vite</p>
      </div>
    </footer>
  );
}
