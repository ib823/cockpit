/**
 * Emoji Toggle Component
 *
 * A toggle switch with emoji indicators (/)
 */

"use client";

import { InputHTMLAttributes, useId } from "react";

interface EmojiToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export function EmojiToggle({ label, className = "", id, ...props }: EmojiToggleProps) {
  const generatedId = useId();
  const toggleId = id || `toggle-${generatedId}`;

  return (
    <div className={`emoji-toggle-wrapper ${className}`}>
      <label htmlFor={toggleId} className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" id={toggleId} className="sr-only peer" {...props} />
        <div className="peer ring-0 bg-rose-400 rounded-full outline-none duration-300 after:duration-500 w-12 h-12 shadow-md peer-checked:bg-emerald-500 peer-focus:outline-none after:content-[''] after:rounded-full after:absolute after:outline-none after:h-10 after:w-10 after:bg-gray-50 after:top-1 after:left-1 after:flex after:justify-center after:items-center peer-hover:after:scale-75 peer-checked:after:content-[''] after:-rotate-180 peer-checked:after:rotate-0"></div>
      </label>
      {label && <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>}
    </div>
  );
}
