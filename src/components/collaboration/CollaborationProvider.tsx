/**
 * Collaboration Provider
 * React context for managing real-time collaboration
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Avatar, Badge, Tooltip } from "antd";
import {
  CollaborationClient,
  User,
  CollaborationMessage,
  generateUserColor,
} from "@/lib/collaboration/websocket-client";

interface CollaborationContextType {
  isConnected: boolean;
  activeUsers: User[];
  currentUser: User | null;
  broadcastChange: (changeType: string, data: any) => void;
  addComment: (comment: string, elementId?: string) => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error("useCollaboration must be used within CollaborationProvider");
  }
  return context;
}

interface CollaborationProviderProps {
  userId: string;
  userName: string;
  roomId: string;
  children: React.ReactNode;
  enabled?: boolean;
}

export function CollaborationProvider({
  userId,
  userName,
  roomId,
  children,
  enabled = true,
}: CollaborationProviderProps) {
  const [client] = useState(() =>
    enabled ? new CollaborationClient(userId, userName, roomId) : null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [currentUser] = useState<User>({
    id: userId,
    name: userName,
    color: generateUserColor(),
    lastSeen: Date.now(),
  });

  useEffect(() => {
    if (!client || !enabled) return;

    // Connect to WebSocket
    client
      .connect()
      .then(() => {
        setIsConnected(true);
        console.log("[Collaboration] Provider connected");
      })
      .catch((error) => {
        console.error("[Collaboration] Provider connection failed:", error);
      });

    // Handle user joined
    const handleUserJoined = (message: CollaborationMessage) => {
      if (message.userId !== userId) {
        const newUser: User = {
          id: message.userId,
          name: message.userName,
          color: generateUserColor(),
          lastSeen: message.timestamp,
        };

        setActiveUsers((prev) => {
          const exists = prev.find((u) => u.id === newUser.id);
          return exists ? prev : [...prev, newUser];
        });
      }
    };

    // Handle user left
    const handleUserLeft = (message: CollaborationMessage) => {
      setActiveUsers((prev) => prev.filter((u) => u.id !== message.userId));
    };

    // Handle data changes
    const handleDataChanged = (message: CollaborationMessage) => {
      if (message.userId !== userId) {
        console.log("[Collaboration] Remote data change:", message.data);
        // Trigger re-render or update local state
        window.dispatchEvent(
          new CustomEvent("collaboration-change", {
            detail: message.data,
          })
        );
      }
    };

    // Register handlers
    client.on("user_joined", handleUserJoined);
    client.on("user_left", handleUserLeft);
    client.on("data_changed", handleDataChanged);

    return () => {
      client.off("user_joined", handleUserJoined);
      client.off("user_left", handleUserLeft);
      client.off("data_changed", handleDataChanged);
      client.disconnect();
      setIsConnected(false);
    };
  }, [client, userId, enabled]);

  const broadcastChange = useCallback(
    (changeType: string, data: any) => {
      if (client && isConnected) {
        client.broadcastChange(changeType, data);
      }
    },
    [client, isConnected]
  );

  const addComment = useCallback(
    (comment: string, elementId?: string) => {
      if (client && isConnected) {
        client.addComment(comment, elementId);
      }
    },
    [client, isConnected]
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <CollaborationContext.Provider
      value={{
        isConnected,
        activeUsers,
        currentUser,
        broadcastChange,
        addComment,
      }}
    >
      {children}
      <ActiveUsersIndicator users={activeUsers} currentUser={currentUser} />
    </CollaborationContext.Provider>
  );
}

/**
 * Active Users Indicator Component
 * Shows who else is viewing the dashboard
 */
function ActiveUsersIndicator({ users, currentUser }: { users: User[]; currentUser: User }) {
  if (users.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 1000,
        background: "white",
        padding: "12px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      <div className="text-xs" style={{ marginBottom: "8px", fontWeight: 600, color: "#666" }}>
        Active Users ({users.length + 1})
      </div>
      <Avatar.Group maxCount={5}>
        {/* Current user */}
        <Tooltip title={`${currentUser.name} (You)`}>
          <Badge dot color="green">
            <Avatar style={{ backgroundColor: currentUser.color }} size="small">
              {currentUser.name.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
        </Tooltip>

        {/* Other users */}
        {users.map((user) => (
          <Tooltip key={user.id} title={user.name}>
            <Badge dot color="green">
              <Avatar style={{ backgroundColor: user.color }} size="small">
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>
          </Tooltip>
        ))}
      </Avatar.Group>
    </div>
  );
}

/**
 * Hook to listen for collaboration changes
 */
export function useCollaborationListener(callback: (data: any) => void): void {
  useEffect(() => {
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };

    window.addEventListener("collaboration-change" as any, handler);

    return () => {
      window.removeEventListener("collaboration-change" as any, handler);
    };
  }, [callback]);
}
