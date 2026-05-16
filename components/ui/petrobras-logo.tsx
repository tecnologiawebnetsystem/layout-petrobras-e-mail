import Image from "next/image"

interface PetrobrasLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
}

export function PetrobrasLogo({ size = "md", showText = false }: PetrobrasLogoProps) {
  const sizes = {
    sm: { width: 40, height: 40, text: "text-base" },
    md: { width: 64, height: 64, text: "text-xl" },
    lg: { width: 96, height: 96, text: "text-2xl" },
    xl: { width: 128, height: 128, text: "text-3xl" },
  }

  const currentSize = sizes[size]

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center hover:opacity-90 transition-opacity duration-300">
        <Image
          src="/images/petrobras-logo.png"
          alt="Petrobras"
          width={currentSize.width}
          height={currentSize.height}
          className="object-contain"
          priority
        />
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
