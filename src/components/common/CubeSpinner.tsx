/**
 * 3D Cube Spinner Component
 *
 * A modern 3D rotating cube spinner with smooth animation
 */

'use client';

interface CubeSpinnerProps {
  size?: number;
  className?: string;
}

export function CubeSpinner({ size = 44, className = '' }: CubeSpinnerProps) {
  const cubeSize = size / 2;

  return (
    <div
      className={`cube-spinner ${className}`}
      style={{
        width: size,
        height: size,
        perspective: `${size * 10}px`
      }}
    >
      <div className="cube-inner">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <style jsx>{`
        .cube-spinner {
          display: inline-block;
          position: relative;
        }

        .cube-inner {
          width: 100%;
          height: 100%;
          animation: spinner-y0fdc1 2s infinite ease;
          transform-style: preserve-3d;
          position: relative;
        }

        .cube-inner > div {
          background-color: rgba(0, 77, 255, 0.2);
          height: 100%;
          position: absolute;
          width: 100%;
          border: 2px solid #004dff;
        }

        .cube-inner div:nth-of-type(1) {
          transform: translateZ(-${cubeSize}px) rotateY(180deg);
        }

        .cube-inner div:nth-of-type(2) {
          transform: rotateY(-270deg) translateX(50%);
          transform-origin: top right;
        }

        .cube-inner div:nth-of-type(3) {
          transform: rotateY(270deg) translateX(-50%);
          transform-origin: center left;
        }

        .cube-inner div:nth-of-type(4) {
          transform: rotateX(90deg) translateY(-50%);
          transform-origin: top center;
        }

        .cube-inner div:nth-of-type(5) {
          transform: rotateX(-90deg) translateY(50%);
          transform-origin: bottom center;
        }

        .cube-inner div:nth-of-type(6) {
          transform: translateZ(${cubeSize}px);
        }

        @keyframes spinner-y0fdc1 {
          0% {
            transform: rotate(45deg) rotateX(-25deg) rotateY(25deg);
          }

          50% {
            transform: rotate(45deg) rotateX(-385deg) rotateY(25deg);
          }

          100% {
            transform: rotate(45deg) rotateX(-385deg) rotateY(385deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cube-inner {
            animation: spinner-y0fdc1 4s infinite ease !important;
          }
        }
      `}</style>
    </div>
  );
}
