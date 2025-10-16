'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

export function LogoutButton({ 
  variant = 'button',
  theme = 'light' 
}: { 
  variant?: 'button' | 'menu-item';
  theme?: 'light' | 'dark';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      setLoading(false);
    }
  };

  if (variant === 'menu-item') {
    return <a onClick={() => setOpen(true)}>Logout</a>;
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
          <Button 
            key="logout" 
            type="primary" 
            loading={loading}
            onClick={handleLogout}
          >
            Logout
          </Button>
        ]}
      >
        <p>Are you sure you want to logout?</p>
      </Modal>
    </>
  );
}
