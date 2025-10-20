'use client';
import React from 'react';
import { Drawer } from 'antd';

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  width?: number | string;
  children?: React.ReactNode;
};

export default function Sheet({
  open,
  onOpenChange,
  title,
  width = 480,
  children,
}: SheetProps) {
  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title={title}
      width={width}
      destroyOnHidden
    >
      {children}
    </Drawer>
  );
}
