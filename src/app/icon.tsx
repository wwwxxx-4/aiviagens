import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

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
          background: 'transparent',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 24.5C14 24.5 3 17.5 3 10.5C3 7.46 5.46 5 8.5 5C10.24 5 11.8 5.8 12.86 7.04L14 8.4L15.14 7.04C16.2 5.8 17.76 5 19.5 5C22.54 5 25 7.46 25 10.5C25 17.5 14 24.5 14 24.5Z"
            fill="#4BBDE8"
            stroke="#177CBC"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
