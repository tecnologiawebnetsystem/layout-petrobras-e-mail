interface PetrobrasLogoProps {
  size?: "sm" | "md" | "lg"
}

export function PetrobrasLogo({ size = "md" }: PetrobrasLogoProps) {
  const sizes = {
    sm: { container: "w-10 h-10", icon: 24 },
    md: { container: "w-14 h-14", icon: 32 },
    lg: { container: "w-20 h-20", icon: 48 },
  }

  const currentSize = sizes[size]

  return (
    <div className={`flex items-center justify-center ${currentSize.container} bg-[#00A99D] rounded-lg shadow-md`}>
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
  )
}
