import "./global.css";
import "@mysten/dapp-kit/dist/index.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TicTacToe from "./pages/TicTacToe";
import WaitingRoom from "./pages/WaitingRoom";
import Layout from "@/components/layout/Layout";
import {
  SuiClientProvider,
  WalletProvider,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { useEffect } from "react";

const queryClient = new QueryClient();

const networks = {
  mainnet: { url: getFullnodeUrl("mainnet") },
  testnet: { url: getFullnodeUrl("testnet") },
};

function NetworkPersistor() {
  const { network, selectNetwork } = useSuiClientContext();
  useEffect(() => {
    const saved = localStorage.getItem("sui.network");
    if (
      saved &&
      saved !== network &&
      (saved === "mainnet" || saved === "testnet")
    ) {
      selectNetwork(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    localStorage.setItem("sui.network", network);
  }, [network]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SuiClientProvider
      networks={networks}
      defaultNetwork={(localStorage.getItem("sui.network") as any) || "testnet"}
    >
      <WalletProvider autoConnect>
        <NetworkPersistor />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/tictactoe" element={<TicTacToe />} />
                <Route path="/tictactoe/wait/:id" element={<WaitingRoom />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </SuiClientProvider>
  </QueryClientProvider>
);

import type { Root } from "react-dom/client";

declare global {
  interface Window {
    __fusion_root?: Root;
  }
}

const container = document.getElementById("root")!;
if (!window.__fusion_root) {
  window.__fusion_root = createRoot(container);
}
window.__fusion_root.render(<App />);
