export function LoginBackground() {
  return (
    <div className="hidden lg:flex lg:flex-1 petrobras-gradient items-center justify-center relative">
      {/* Flowing Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute bottom-0 left-0 w-full h-full"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          {/* Large flowing shape */}
          <path
            d="M-50 400 Q 150 200, 300 350 T 500 450 Q 650 500, 750 350 L 750 850 L -50 850 Z"
            fill="url(#gradient1)"
            opacity="0.6"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; 30 -30; 0 0"
              dur="20s"
              repeatCount="indefinite"
            />
          </path>

          {/* Medium flowing shape */}
          <path
            d="M-50 500 Q 200 350, 350 450 T 600 550 Q 700 600, 850 500 L 850 850 L -50 850 Z"
            fill="url(#gradient2)"
            opacity="0.5"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; -20 20; 0 0"
              dur="15s"
              repeatCount="indefinite"
            />
          </path>

          {/* Small flowing shape */}
          <path
            d="M-50 600 Q 150 500, 300 580 T 550 650 Q 700 680, 850 620 L 850 850 L -50 850 Z"
            fill="url(#gradient3)"
            opacity="0.7"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; 15 15; 0 0"
              dur="25s"
              repeatCount="indefinite"
            />
          </path>

          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0085A8" />
              <stop offset="100%" stopColor="#00C4A0" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1A7B7B" />
              <stop offset="100%" stopColor="#0085A8" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00A99D" />
              <stop offset="100%" stopColor="#00C4A0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00C4A0] rounded-full blur-[120px] opacity-20 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0085A8] rounded-full blur-[120px] opacity-20 animate-pulse delay-1000" />
    </div>
  )
}
