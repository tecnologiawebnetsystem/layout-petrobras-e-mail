"use client"

export function LoginBackground() {
  return (
    <aside 
      className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden"
      aria-hidden="true"
    >
      {/* Background gradient - cores Petrobras */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#003F7F] via-[#00A859] to-[#003F7F]" />
      
      {/* Subtle overlay pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center w-full max-w-xl mx-auto px-8 lg:px-12 py-12">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 13h6m-3-3v6m5 5H7c-1.66 0-3-1.34-3-3V6c0-1.66 1.34-3 3-3h7l5 5v10c0 1.66-1.34 3-3 3z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 3v4c0 .55.45 1 1 1h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4 text-balance">
          Transferencia Segura de Arquivos
        </h2>
        
        {/* Description */}
        <p className="text-lg text-white/80 leading-relaxed mb-10 text-pretty">
          Compartilhe documentos com destinatarios externos de forma controlada e auditavel.
        </p>

        {/* Features */}
        <div className="space-y-4">
          <FeatureItem 
            title="Aprovacao Supervisionada"
            description="Todos os envios passam por validacao antes da liberacao"
          />
          <FeatureItem 
            title="Acesso Controlado"
            description="Codigo unico de verificacao para cada destinatario"
          />
          <FeatureItem 
            title="Auditoria Completa"
            description="Rastreabilidade total de uploads, aprovacoes e downloads"
          />
        </div>
      </div>
    </aside>
  )
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 transition-colors hover:bg-white/10">
      <div className="flex-shrink-0 mt-0.5">
        <svg className="w-5 h-5 text-[#FDB913]" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 12l2 2 4-4m6 2c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <h3 className="font-semibold text-white text-base">{title}</h3>
        <p className="text-white/70 text-sm mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
