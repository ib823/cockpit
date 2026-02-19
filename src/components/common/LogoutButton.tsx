"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";

export function LogoutButton({
  variant = "button",
  theme: _theme = "light",
}: {
  variant?: "button" | "menu-item";
  theme?: "light" | "dark";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Call logout endpoint
      await fetch("/api/auth/logout", { method: "POST" });

      // SECURITY: Clear all local storage and session storage
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      // SECURITY: Use replace instead of push to prevent back button from returning
      // Also add timestamp to prevent caching
      router.replace("/login?logged_out=" + Date.now());

      // SECURITY: Reload to clear any in-memory state
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setLoading(false);
    }
  };

  if (variant === "menu-item") {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-transparent border-0 cursor-pointer p-0 [font:inherit] text-inherit"
      >
        Logout
      </button>
    );
  }

  return (
    <>
      <Button icon={<LogoutOutlined />} onClick={() => setOpen(true)}>
        Logout
      </Button>

      <Modal
        title="Logout?"
        open={open}
        centered
        onCancel={() => setOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setOpen(false)}>
            Cancel
          </Button>,
          <Button key="logout" type="primary" loading={loading} onClick={handleLogout}>
            Logout
          </Button>,
        ]}
      >
        <p>Are you sure you want to logout?</p>
      </Modal>
    </>
  );
}
