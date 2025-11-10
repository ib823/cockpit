/**
 * WebSocket Client for Real-time Collaboration
 * Handles real-time updates, presence, and collaborative editing
 */

export type CollaborationEvent =
  | "user_joined"
  | "user_left"
  | "cursor_moved"
  | "data_changed"
  | "comment_added"
  | "heartbeat";

export interface CollaborationMessage {
  type: CollaborationEvent;
  userId: string;
  userName: string;
  timestamp: number;
  data?: any;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  color: string;
  lastSeen: number;
}

export interface CursorPosition {
  x: number;
  y: number;
  elementId?: string;
}

type MessageHandler = (message: CollaborationMessage) => void;

export class CollaborationClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Map<CollaborationEvent, Set<MessageHandler>> = new Map();
  private currentUserId: string;
  private currentUserName: string;
  private roomId: string;
  private isConnected = false;

  constructor(userId: string, userName: string, roomId: string) {
    this.currentUserId = userId;
    this.currentUserName = userName;
    this.roomId = roomId;
  }

  /**
   * Connect to WebSocket server
   */
  connect(url?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = url || this.getWebSocketUrl();
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("[Collaboration] Connected to WebSocket");
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Send join message
          this.send({
            type: "user_joined",
            userId: this.currentUserId,
            userName: this.currentUserName,
            timestamp: Date.now(),
            data: { roomId: this.roomId },
          });

          // Start heartbeat
          this.startHeartbeat();

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: CollaborationMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("[Collaboration] Failed to parse message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("[Collaboration] WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("[Collaboration] Disconnected from WebSocket");
          this.isConnected = false;
          this.stopHeartbeat();

          // Attempt reconnection
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnectAttempts++;
              console.log(`[Collaboration] Reconnecting... Attempt ${this.reconnectAttempts}`);
              this.connect(url);
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      // Send leave message
      this.send({
        type: "user_left",
        userId: this.currentUserId,
        userName: this.currentUserName,
        timestamp: Date.now(),
      });

      this.ws.close();
      this.ws = null;
    }

    this.stopHeartbeat();
  }

  /**
   * Send a message to the server
   */
  send(message: CollaborationMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("[Collaboration] Cannot send message: Not connected");
    }
  }

  /**
   * Register a message handler
   */
  on(event: CollaborationEvent, handler: MessageHandler): void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    this.messageHandlers.get(event)!.add(handler);
  }

  /**
   * Unregister a message handler
   */
  off(event: CollaborationEvent, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Broadcast cursor position
   */
  updateCursor(position: CursorPosition): void {
    this.send({
      type: "cursor_moved",
      userId: this.currentUserId,
      userName: this.currentUserName,
      timestamp: Date.now(),
      data: position,
    });
  }

  /**
   * Broadcast data change
   */
  broadcastChange(changeType: string, data: any): void {
    this.send({
      type: "data_changed",
      userId: this.currentUserId,
      userName: this.currentUserName,
      timestamp: Date.now(),
      data: {
        changeType,
        ...data,
      },
    });
  }

  /**
   * Add a comment
   */
  addComment(comment: string, elementId?: string): void {
    this.send({
      type: "comment_added",
      userId: this.currentUserId,
      userName: this.currentUserName,
      timestamp: Date.now(),
      data: {
        comment,
        elementId,
      },
    });
  }

  /**
   * Get connection status
   */
  isSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: CollaborationMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({
        type: "heartbeat",
        userId: this.currentUserId,
        userName: this.currentUserName,
        timestamp: Date.now(),
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get WebSocket URL based on environment
   */
  private getWebSocketUrl(): string {
    if (typeof window === "undefined") {
      throw new Error("WebSocket can only be used in browser");
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
    return `${protocol}//${host}/api/ws/collaboration?roomId=${this.roomId}`;
  }
}

/**
 * Generate a random color for user cursor
 */
export function generateUserColor(): string {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#FFA07A", // Orange
    "#98D8C8", // Mint
    "#F7DC6F", // Yellow
    "#BB8FCE", // Purple
    "#85C1E2", // Light Blue
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Create a singleton instance
 */
let collaborationClientInstance: CollaborationClient | null = null;

export function getCollaborationClient(
  userId: string,
  userName: string,
  roomId: string
): CollaborationClient {
  if (!collaborationClientInstance || collaborationClientInstance["roomId"] !== roomId) {
    if (collaborationClientInstance) {
      collaborationClientInstance.disconnect();
    }
    collaborationClientInstance = new CollaborationClient(userId, userName, roomId);
  }
  return collaborationClientInstance;
}
