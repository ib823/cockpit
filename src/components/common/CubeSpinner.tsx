/**
 * Cube Spinner Component
 *
 * Now uses the branded HexCubeLoader with Lottie animation
 * Features rotating hex cube with brand colors and smooth animations
 */

'use client';

import { HexCubeLoader } from './HexCubeLoader';

interface CubeSpinnerProps {
  size?: number;
  className?: string;
}

export function CubeSpinner({ size = 44, className = '' }: CubeSpinnerProps) {
  return <HexCubeLoader size={size} className={className} />;
}
