/**
 * OfflineIndicator Component
 * Shows offline/online status and sync progress
 */

"use client";

import { Alert, Badge, Button, Popover, Progress, Space, Typography } from "antd";
import {
  WifiOutlined,
  DisconnectOutlined,
  SyncOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useOnlineStatus, useSyncStatus } from "@/lib/offline/use-offline";

const { Text } = Typography;

interface OfflineIndicatorProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showPopover?: boolean;
}

export function OfflineIndicator({
  position = "bottom-right",
  showPopover = true,
}: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();
  const { isSyncing, pendingCount, triggerSync } = useSyncStatus();

  const positionStyles: Record<string, React.CSSProperties> = {
    "top-left": { position: "fixed", top: 80, left: 16, zIndex: 1000 },
    "top-right": { position: "fixed", top: 80, right: 16, zIndex: 1000 },
    "bottom-left": { position: "fixed", bottom: 16, left: 16, zIndex: 1000 },
    "bottom-right": { position: "fixed", bottom: 16, right: 16, zIndex: 1000 },
  };

  const content = (
    <Space direction="vertical" style={{ width: 280 }}>
      <div>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Connection Status
        </Text>
        <Space>
          {isOnline ? (
            <>
              <CheckCircleOutlined style={{ color: "#34C759", fontSize: 18 }} />
              <Text style={{ color: "#34C759" }}>Online</Text>
            </>
          ) : (
            <>
              <DisconnectOutlined style={{ color: "#FF3B30", fontSize: 18 }} />
              <Text style={{ color: "#FF3B30" }}>Offline</Text>
            </>
          )}
        </Space>
      </div>

      {pendingCount > 0 && (
        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Pending Sync
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {pendingCount} {pendingCount === 1 ? "item" : "items"} waiting to sync
          </Text>
          {isSyncing && (
            <Progress percent={100} status="active" showInfo={false} style={{ marginTop: 8 }} />
          )}
        </div>
      )}

      {isOnline && pendingCount > 0 && !isSyncing && (
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          onClick={triggerSync}
          block
          size="small"
        >
          Sync Now
        </Button>
      )}

      {!isOnline && (
        <Alert
          message="Working Offline"
          description="Your changes will be saved locally and synced when you're back online."
          type="info"
          showIcon
          style={{ fontSize: 12 }}
        />
      )}
    </Space>
  );

  // Don't show if online and no pending items
  if (isOnline && pendingCount === 0) {
    return null;
  }

  const indicator = (
    <Badge count={pendingCount} offset={[-2, 2]} size="small">
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: isOnline ? "#ffffff" : "#FF3B30",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: showPopover ? "pointer" : "default",
          border: isOnline ? "2px solid #34C759" : "2px solid #ffffff",
        }}
      >
        {isSyncing ? (
          <SyncOutlined spin style={{ fontSize: 20, color: "#007AFF" }} />
        ) : isOnline ? (
          <WifiOutlined style={{ fontSize: 20, color: "#34C759" }} />
        ) : (
          <DisconnectOutlined style={{ fontSize: 20, color: "#ffffff" }} />
        )}
      </div>
    </Badge>
  );

  if (!showPopover) {
    return <div style={positionStyles[position]}>{indicator}</div>;
  }

  return (
    <div style={positionStyles[position]}>
      <Popover content={content} title="Offline Status" trigger="click" placement="topRight">
        {indicator}
      </Popover>
    </div>
  );
}

/**
 * Simple banner-style offline indicator
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { pendingCount } = useSyncStatus();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <Alert
      message={
        <Space>
          {!isOnline && <DisconnectOutlined />}
          <Text strong>
            {isOnline
              ? `Syncing ${pendingCount} ${pendingCount === 1 ? "item" : "items"}...`
              : "Working Offline"}
          </Text>
        </Space>
      }
      description={
        isOnline
          ? "Your offline changes are being synced to the server."
          : "Your changes are being saved locally and will sync when you reconnect."
      }
      type={isOnline ? "info" : "warning"}
      banner
      closable
    />
  );
}
