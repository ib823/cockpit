import React from 'react';
import { Table, TableProps } from 'antd';
import clsx from 'clsx';
import './ant-table.css';

export interface AntDataGridProps<T> extends TableProps<T> {
  density?: 'compact' | 'default' | 'cozy';
  zebra?: boolean;
  stickyHeader?: boolean;
  rowAccentOnHover?: boolean;
}

export function AntDataGrid<T extends object>({
  density = 'default',
  zebra = true,
  stickyHeader = true,
  rowAccentOnHover = true,
  className,
  ...props
}: AntDataGridProps<T>) {
  return (
    <Table<T>
      className={clsx(
        'cockpit-ant-table',
        `dg-density-${density}`,
        zebra && 'dg-zebra',
        stickyHeader && 'dg-sticky',
        rowAccentOnHover && 'dg-hover',
        className
      )}
      {...props}
    />
  );
}
