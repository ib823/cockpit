/**
 * Empty State Component - Ant Design wrapper
 */

import React from 'react';
import { Empty as AntEmpty, Button } from 'antd';

export interface EmptyProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const Empty: React.FC<EmptyProps> = ({ icon, title, description, action, className }) => {
  return (
    <div className={className}>
      <AntEmpty
        image={icon || AntEmpty.PRESENTED_IMAGE_SIMPLE}
        description={
          <>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</div>
            {description && <div style={{ fontSize: 14, color: '#666' }}>{description}</div>}
          </>
        }
      >
        {action}
      </AntEmpty>
    </div>
  );
};
