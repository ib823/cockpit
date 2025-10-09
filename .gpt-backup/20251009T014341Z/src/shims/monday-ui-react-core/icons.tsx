import React from 'react';
import {
  PlusOutlined,
  DeleteOutlined,
  CheckOutlined,
  AlertOutlined,
  MailOutlined,
  CloseOutlined,
  EditOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

export const Add = (props: any) => <PlusOutlined {...props} />;
export const Delete = (props: any) => <DeleteOutlined {...props} />;
export const Check = (props: any) => <CheckOutlined {...props} />;
export const Alert = (props: any) => <AlertOutlined {...props} />;
export const Email = (props: any) => <MailOutlined {...props} />;
export const Close = (props: any) => <CloseOutlined {...props} />;
export const Edit = (props: any) => <EditOutlined {...props} />;

/* Newly required */
export const Team = (props: any) => <TeamOutlined {...props} />;
export const Bolt = (props: any) => <ThunderboltOutlined {...props} />;
