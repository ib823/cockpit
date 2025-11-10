/**
 * Custom Animated Checkbox Component
 *
 * A checkbox with smooth animations and 3D transform effects
 */

"use client";

import { InputHTMLAttributes } from "react";

interface CustomCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export function CustomCheckbox({ label, className = "", id, ...props }: CustomCheckboxProps) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <label htmlFor={checkboxId} className={`custom-checkbox ${className}`}>
      <input type="checkbox" id={checkboxId} {...props} />
      <span className="checkmark"></span>
      {label && <span className="label-text">{label}</span>}
      <style jsx>{`
        .custom-checkbox {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
          font-size: 16px;
          color: #333;
          transition: color 0.3s;
        }

        .custom-checkbox input[type="checkbox"] {
          display: none;
        }

        .custom-checkbox .checkmark {
          width: 24px;
          height: 24px;
          border: 2px solid #333;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          transition:
            background-color 1.3s,
            border-color 1.3s,
            transform 0.3s;
          transform-style: preserve-3d;
          flex-shrink: 0;
        }

        .custom-checkbox .checkmark::before {
          content: "✓";
          font-size: 16px;
          color: transparent;
          transition:
            color 1.3s,
            transform 0.3s;
        }

        .custom-checkbox input[type="checkbox"]:checked + .checkmark {
          background-color: #333;
          border-color: #333;
          transform: scale(1.1) rotateZ(360deg) rotateY(360deg);
        }

        .custom-checkbox input[type="checkbox"]:checked + .checkmark::before {
          color: #fff;
        }

        .custom-checkbox:hover {
          color: #666;
        }

        .custom-checkbox:hover .checkmark {
          border-color: #666;
          background-color: #f0f0f0;
          transform: scale(1.05);
        }

        .custom-checkbox input[type="checkbox"]:focus + .checkmark {
          box-shadow: 0 0 3px 2px rgba(0, 0, 0, 0.2);
          outline: none;
        }

        .label-text {
          flex: 1;
        }
      `}</style>
    </label>
  );
}
