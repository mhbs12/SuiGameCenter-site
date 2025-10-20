export const SUI_PACKAGES = {
  mainnet: (import.meta as any).env?.VITE_SUI_PACKAGE_MAINNET || "",
  testnet: (import.meta as any).env?.VITE_SUI_PACKAGE_TESTNET || "",
} as const;

export const MINT_REGISTRY = {
  mainnet: (import.meta as any).env?.VITE_MINT_REGISTRY_MAINNET || "",
  testnet: (import.meta as any).env?.VITE_MINT_REGISTRY_TESTNET || "",
} as const;

export const PLAYER_REGISTRY = {
  mainnet: (import.meta as any).env?.VITE_PLAYER_REGISTRY_MAINNET || "",
  testnet: (import.meta as any).env?.VITE_PLAYER_REGISTRY_TESTNET || "",
} as const;
