/**
 * SyncControls Component
 *
 * Controls for timeline synchronization with estimator.
 * Features:
 * - Lock/unlock toggle to prevent auto-sync
 * - Manual force sync button
 * - Visual indicators for sync state
 */

"use client";

import { useState } from "react";
import { Button, Switch, Space, Tooltip } from "antd";
import { LockOutlined, UnlockOutlined, SyncOutlined } from "@ant-design/icons";

interface SyncControlsProps {
  isLocked: boolean;
  onToggleLock: () => void;
  onForceSync?: () => void;
  syncInProgress?: boolean;
}

export function SyncControls({
  isLocked,
  onToggleLock,
  onForceSync,
  syncInProgress = false,
}: SyncControlsProps) {
  return (
    <Space size="middle">
      <div className="flex items-center gap-2">
        <Tooltip
          title={
            isLocked
              ? "Timeline is locked - changes from estimator will not sync"
              : "Auto-sync enabled - timeline will update when estimator changes"
          }
        >
          <Switch
            checkedChildren={<LockOutlined />}
            unCheckedChildren={<UnlockOutlined />}
            checked={isLocked}
            onChange={onToggleLock}
          />
        </Tooltip>
        <span className="text-sm font-medium">
          {isLocked ? "Timeline Locked" : "Auto-sync Enabled"}
        </span>
      </div>

      {onForceSync && (
        <Tooltip title="Manually sync timeline from estimator results">
          <Button
            icon={<SyncOutlined spin={syncInProgress} />}
            disabled={isLocked || syncInProgress}
            onClick={onForceSync}
            size="small"
          >
            {syncInProgress ? "Syncing..." : "Force Sync"}
          </Button>
        </Tooltip>
      )}
    </Space>
  );
}
