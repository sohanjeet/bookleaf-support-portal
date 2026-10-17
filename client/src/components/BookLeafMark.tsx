import React from 'react';

// The BookLeaf signature: an open book whose spine continues upward as a leaf stem.
// One drawing, two scales — `compact` for the brand mark, `detail` adds stacked page
// edges for the oversized sidebar watermark. Strokes only, so it inherits currentColor.
const LEFT = 'M16 29.5C12.6 26.6 7.8 25.9 3.5 27.2V13.6C7.8 12.3 12.6 13 16 15.9';
const RIGHT = 'M16 29.5C19.4 26.6 24.2 25.9 28.5 27.2V13.6C24.2 12.3 19.4 13 16 15.9';
const STEM = 'M16 29.5V4.2';
const LEAF = 'M16 11C16 6.6 18.4 3.6 22.8 2.6C22.8 7 20.4 10.2 16 11Z';
const VEIN = 'M16 10.2C18 8 19.8 6.2 21.4 4.6';

interface Props {
  size?: number;
  strokeWidth?: number;
  detail?: boolean;
  className?: string;
}

export const BookLeafMark: React.FC<Props> = ({ size = 24, strokeWidth = 1.75, detail = false, className }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={LEFT} />
    <path d={RIGHT} />
    <path d={STEM} />
    <path d={LEAF} />
    {detail && (
      <>
        <path d={VEIN} />
        {/* stacked page edges, each a little lower and narrower than the last */}
        <path d="M16 30.9C12.4 28 7.4 27.3 4.6 28.2" />
        <path d="M16 32.2C12.2 29.3 8.2 28.7 6 29.4" />
        <path d="M16 30.9C19.6 28 24.6 27.3 27.4 28.2" />
        <path d="M16 32.2C19.8 29.3 23.8 28.7 26 29.4" />
        <path d="M5.7 14.3V26.1M26.3 14.3V26.1" />
      </>
    )}
  </svg>
);
