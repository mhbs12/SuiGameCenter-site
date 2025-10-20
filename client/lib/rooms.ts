export type NetworkName = "mainnet" | "testnet";

export interface RoomInfo {
  id: string;
  name: string;
  stakeMist: string; // store as string to avoid bigint JSON issues
  creator: string;
  network: NetworkName;
  status: "waiting" | "active" | "closed";
  createdAt: number;
  txDigest?: string;
}

const key = (network: NetworkName) => `ttt.rooms.${network}`;

export function getRooms(network: NetworkName): RoomInfo[] {
  try {
    const raw = localStorage.getItem(key(network));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RoomInfo[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRooms(network: NetworkName, rooms: RoomInfo[]) {
  localStorage.setItem(key(network), JSON.stringify(rooms));
}

export function addRoom(network: NetworkName, room: RoomInfo) {
  const rooms = getRooms(network);
  rooms.unshift(room);
  saveRooms(network, rooms);
}

export function getRoomById(
  network: NetworkName,
  id: string,
): RoomInfo | undefined {
  return getRooms(network).find((r) => r.id === id);
}

export function removeRoom(network: NetworkName, id: string) {
  const rooms = getRooms(network).filter((r) => r.id !== id);
  saveRooms(network, rooms);
}
