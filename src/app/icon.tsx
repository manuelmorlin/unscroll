import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = { width: 512, height: 512 };

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b',
          borderRadius: 96,
        }}
      >
        <svg
          width="400"
          height="400"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Popcorn bucket */}
          <path
            d="M100 160 L80 360 L320 360 L300 160 Z"
            fill="url(#bucketGradient)"
          />
          
          {/* Bucket stripes */}
          <path d="M115 180 L100 340" stroke="#dc2626" strokeWidth="12" strokeLinecap="round" />
          <path d="M160 165 L150 350" stroke="#dc2626" strokeWidth="12" strokeLinecap="round" />
          <path d="M240 165 L250 350" stroke="#dc2626" strokeWidth="12" strokeLinecap="round" />
          <path d="M285 180 L300 340" stroke="#dc2626" strokeWidth="12" strokeLinecap="round" />
          
          {/* Bucket rim */}
          <ellipse cx="200" cy="160" rx="110" ry="20" fill="#fbbf24" />
          
          {/* Popcorn pieces */}
          <circle cx="140" cy="100" r="35" fill="#fef3c7" />
          <circle cx="200" cy="80" r="40" fill="#fef9c3" />
          <circle cx="260" cy="100" r="35" fill="#fef3c7" />
          <circle cx="170" cy="60" r="30" fill="#fefce8" />
          <circle cx="230" cy="55" r="32" fill="#fef9c3" />
          <circle cx="200" cy="120" r="28" fill="#fef3c7" />
          <circle cx="130" cy="140" r="25" fill="#fefce8" />
          <circle cx="270" cy="140" r="25" fill="#fefce8" />
          <circle cx="155" cy="130" r="22" fill="#fef9c3" />
          <circle cx="245" cy="125" r="24" fill="#fef9c3" />
          
          {/* Small highlight details */}
          <circle cx="185" cy="70" r="8" fill="#fbbf24" opacity="0.4" />
          <circle cx="220" cy="95" r="6" fill="#fbbf24" opacity="0.4" />
          <circle cx="150" cy="95" r="5" fill="#fbbf24" opacity="0.4" />
          
          <defs>
            <linearGradient id="bucketGradient" x1="80" y1="160" x2="320" y2="360">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
