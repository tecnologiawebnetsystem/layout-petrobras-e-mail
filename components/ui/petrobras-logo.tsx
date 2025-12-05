interface PetrobrasLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
}

export function PetrobrasLogo({ size = "md", showText = false }: PetrobrasLogoProps) {
  const sizes = {
    sm: { container: "w-10 h-10", icon: 24, text: "text-base" },
    md: { container: "w-16 h-16", icon: 40, text: "text-xl" },
    lg: { container: "w-24 h-24", icon: 56, text: "text-2xl" },
    xl: { container: "w-32 h-32", icon: 72, text: "text-3xl" },
  }

  const currentSize = sizes[size]

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center justify-center ${currentSize.container} bg-gradient-to-br from-[#00A859] to-[#003F7F] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}
      >
        <svg
          width={currentSize.icon}
          height={currentSize.icon}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          <path d="M8 8H14C18.4183 8 22 11.5817 22 16C22 20.4183 18.4183 24 14 24H8V8Z" fill="currentColor" />
          <path d="M8 8H14C17.3137 8 20 10.6863 20 14C20 17.3137 17.3137 20 14 20H8V8Z" fill="currentColor" />
          <rect x="8" y="8" width="4" height="16" fill="currentColor" />
        </svg>
      </div>
      {showText && (
        <span
          className={`font-bold ${currentSize.text} bg-gradient-to-r from-[#00A859] to-[#003F7F] bg-clip-text text-transparent`}
        >
          Petrobras
        </span>
      )}
    </div>
  )
}
