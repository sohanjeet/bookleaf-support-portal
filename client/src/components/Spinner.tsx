import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Visible caption under the spinner. Also used as the accessible name. */
  label?: string;
  /** Center in its container with padding — for panels/sections that are loading. */
  block?: boolean;
  className?: string;
}

/**
 * Local (component-level) loader: a calm ring with a rotating arc and a small leaf at its head.
 * Use for panels, tables and buttons. The full-screen BookLeafLoader is for app boot only.
 */
export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', label, block = false, className = '' }) => (
  <span
    className={`bl-spinner bl-spinner-${size}${block ? ' bl-spinner-block' : ''} ${className}`.trim()}
    role="status"
    aria-live="polite"
    aria-label={label ?? 'Loading'}
  >
    <svg className="bl-spinner-svg" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="bl-spinner-track" cx="20" cy="20" r="16" />
      <g className="bl-spinner-orbit">
        <circle className="bl-spinner-arc" cx="20" cy="20" r="16" />
        <path className="bl-spinner-leaf" d="M20 1.5 C25 1.5 28 4 28.5 8 C24 8.5 20.5 6 20 1.5 Z" />
      </g>
    </svg>
    {label && <span className="bl-spinner-label">{label}</span>}
  </span>
);
