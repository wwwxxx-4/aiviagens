interface MesquitaLogoProps {
  className?: string
  height?: number
}

export function MesquitaLogo({ className = '', height = 48 }: MesquitaLogoProps) {
  const width = height * 2.8

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 100"
      width={width}
      height={height}
      className={className}
      aria-label="Mesquita Turismo"
    >
      {/* MESQUITA — azul claro */}
      <text
        x="140"
        y="42"
        textAnchor="middle"
        fontFamily="'DM Sans', 'Arial', sans-serif"
        fontWeight="700"
        fontSize="36"
        letterSpacing="2"
        fill="#4BBDE8"
      >
        MESQUITA
      </text>

      {/* TURISMO — azul escuro */}
      <text
        x="140"
        y="64"
        textAnchor="middle"
        fontFamily="'DM Sans', 'Arial', sans-serif"
        fontWeight="800"
        fontSize="28"
        letterSpacing="6"
        fill="#177CBC"
      >
        TURISMO
      </text>

      {/* Onda superior — azul escuro */}
      <path
        d="M 20 80 Q 80 65 140 78 Q 200 91 260 72"
        fill="none"
        stroke="#177CBC"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Onda inferior — azul claro */}
      <path
        d="M 30 90 Q 90 76 150 88 Q 210 100 265 82"
        fill="none"
        stroke="#4BBDE8"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  )
}

/** Versão compacta para sidebar/navbar pequena */
export function MesquitaLogoCompact({ className = '', height = 32 }: MesquitaLogoProps) {
  const width = height * 2.2

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 70"
      width={width}
      height={height}
      className={className}
      aria-label="Mesquita Turismo"
    >
      <text
        x="110"
        y="28"
        textAnchor="middle"
        fontFamily="'DM Sans', 'Arial', sans-serif"
        fontWeight="700"
        fontSize="24"
        letterSpacing="1.5"
        fill="#4BBDE8"
      >
        MESQUITA
      </text>
      <text
        x="110"
        y="46"
        textAnchor="middle"
        fontFamily="'DM Sans', 'Arial', sans-serif"
        fontWeight="800"
        fontSize="18"
        letterSpacing="4"
        fill="#177CBC"
      >
        TURISMO
      </text>
      <path
        d="M 15 58 Q 60 48 110 57 Q 160 66 205 52"
        fill="none"
        stroke="#177CBC"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M 22 65 Q 68 55 118 64 Q 168 73 208 60"
        fill="none"
        stroke="#4BBDE8"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  )
}
