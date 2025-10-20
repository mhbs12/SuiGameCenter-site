import type { RequestHandler } from "express";
import { getFullnodeUrl } from "@mysten/sui/client";

// GET /api/controls/owner/:address?network=testnet
export const handleControlsByOwner: RequestHandler = async (req, res) => {
  const { address } = req.params;
  const network = (req.query.network as string) || "testnet";
  try {
    const url = getFullnodeUrl(network as any).replace(/\/$/, "");
    const body = { jsonrpc: "2.0", id: 1, method: "sui_getObjectsOwnedByAddress", params: [address] };
    const rpcResp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!rpcResp.ok) {
      return res.status(502).json({ message: "Fullnode RPC failed" });
    }
    const rpcJson = await rpcResp.json().catch(() => ({}));
    const refs = rpcJson.result ?? [];

    const controls: any[] = [];
    for (const r of refs) {
      const objectId = r?.objectId ?? r?.reference?.objectId ?? r?.object_id ?? r?.object_id;
      if (!objectId) continue;
      try {
        const oresp = await fetch(`${url}/objects/${objectId}`);
        if (!oresp.ok) continue;
        const ojson = await oresp.json().catch(() => null);
        if (!ojson) continue;
        const type = ojson?.data?.type ?? ojson?.type ?? "";
        if (!type.includes("::main::Control")) continue;
        const fields = ojson?.data?.content?.fields ?? ojson?.data?.content ?? ojson?.content?.fields ?? ojson?.content ?? ojson?.fields ?? null;
        controls.push({ id: objectId, type, fields });
      } catch (e) {
        // ignore per-object error
      }
    }

    return res.json({ controls });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: String(e?.message ?? e) });
  }
};

// GET /api/controls/by_type?type=...&network=testnet
export const handleControlsByType: RequestHandler = async (req, res) => {
  const typeStr = (req.query.type as string) || "";
  const network = (req.query.network as string) || "testnet";
  try {
    const explorerBase = "https://explorer.sui.io";
    const candidates = [
      `${explorerBase}/api/objects/by_type?type=${encodeURIComponent(typeStr)}&network=${network}`,
      `${explorerBase}/api/v1/objects/by_type?type=${encodeURIComponent(typeStr)}&network=${network}`,
      `${explorerBase}/api/search?query=${encodeURIComponent(typeStr)}&network=${network}`,
    ];
    let found: any[] = [];
    for (const u of candidates) {
      try {
        const r = await fetch(u);
        if (!r.ok) continue;
        const j = await r.json().catch(() => null);
        if (!j) continue;
        if (Array.isArray(j)) found = j;
        else if (Array.isArray(j.data)) found = j.data;
        else if (Array.isArray(j.result)) found = j.result;
        if (found.length > 0) break;
      } catch (e) {
        continue;
      }
    }

    // Normalize and attempt to fetch fields from fullnode
    const url = getFullnodeUrl(network as any).replace(/\/$/, "");
    const controls: any[] = [];
    for (const item of found) {
      const id = item?.objectId ?? item?.id ?? item?.object_id ?? item?.digest ?? item?.name;
      if (!id) continue;
      try {
        const oresp = await fetch(`${url}/objects/${id}`);
        if (!oresp.ok) continue;
        const ojson = await oresp.json().catch(() => null);
        if (!ojson) continue;
        const type = ojson?.data?.type ?? ojson?.type ?? "";
        if (!type.includes("::main::Control")) continue;
        const fields = ojson?.data?.content?.fields ?? ojson?.data?.content ?? ojson?.content?.fields ?? ojson?.content ?? ojson?.fields ?? null;
        controls.push({ id, type, fields });
      } catch (e) {
        // ignore
      }
    }

    return res.json({ controls });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: String(e?.message ?? e) });
  }
};
