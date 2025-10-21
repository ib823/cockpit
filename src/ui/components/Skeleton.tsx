/**
 * Skeleton Components - Ant Design wrappers
 * Maintains API compatibility with previous custom implementation
 */

import React from 'react';
import { Skeleton as AntSkeleton } from 'antd';

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className }) => (
  <div className={className}>
    <AntSkeleton active paragraph={{ rows: lines }} title={false} />
  </div>
);

export interface SkeletonRectProps {
  className?: string;
}

export const SkeletonRect: React.FC<SkeletonRectProps> = ({ className }) => (
  <div className={className}>
    <AntSkeleton.Button active style={{ width: '100%', height: 96 }} block />
  </div>
);

export interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({ size = 40, className }) => (
  <div className={className}>
    <AntSkeleton.Avatar active size={size} shape="circle" />
  </div>
);
