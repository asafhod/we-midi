import WebSocket from "ws";

// dictionary variable for managing all connected WebSockets, grouped by project and username
// maps projectIDs to username-to-WebSocket dictionaries
const webSocketManager: Record<string, Record<string, WebSocket>> = {};

export default webSocketManager;
