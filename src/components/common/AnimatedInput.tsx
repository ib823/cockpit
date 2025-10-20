/**
 * Animated Input Component
 *
 * A text input with smooth hover and focus animations
 */

'use client';

import { InputHTMLAttributes } from 'react';

interface AnimatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function AnimatedInput({ label, className = '', id, ...props }: AnimatedInputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`animated-input-wrapper ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input id={inputId} className="animated-input" {...props} />
      <style jsx>{`
        .animated-input-wrapper {
          display: inline-block;
          width: 100%;
        }

        .animated-input {
          border: 2px solid transparent;
          width: 100%;
          min-width: 15em;
          height: 2.5em;
          padding-left: 0.8em;
          padding-right: 0.8em;
          outline: none;
          overflow: hidden;
          background-color: #F3F3F3;
          border-radius: 10px;
          transition: all 0.5s;
        }

        .animated-input:hover,
        .animated-input:focus {
          border: 2px solid #4A9DEC;
          box-shadow: 0px 0px 0px 7px rgba(74, 157, 236, 0.2);
          background-color: white;
        }
      `}</style>
    </div>
  );
}
