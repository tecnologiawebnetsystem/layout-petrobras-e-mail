export function LoginBackground() {
  return (
    <div className="hidden lg:flex lg:flex-1 petrobras-gradient items-center justify-center relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-petrobras-green via-petrobras-green/90 to-petrobras-blue opacity-95" />

      {/* Animated particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
              backgroundColor: i % 3 === 0 ? "#FDB913" : i % 3 === 1 ? "#00A859" : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>

      {/* Main content container */}
      <div className="relative z-10 max-w-xl mx-auto px-8 text-white">
        {/* Hero illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-64 h-64">
            {/* Central circle with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 rounded-full backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
              <svg className="w-32 h-32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 13h6m-3-3v6m5 5H7c-1.66 0-3-1.34-3-3V6c0-1.66 1.34-3 3-3h7l5 5v10c0 1.66-1.34 3-3 3z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 3v4c0 .55.45 1 1 1h4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Orbiting elements - Upload */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-orbit-1">
              <div className="bg-white rounded-full p-3 shadow-lg">
                <svg className="w-6 h-6 text-petrobras-green" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 12l2 2 4-4m6 2c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Orbiting elements - Approval */}
            <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 animate-orbit-2">
              <div className="bg-white rounded-full p-3 shadow-lg">
                <svg className="w-6 h-6 text-petrobras-yellow" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 12l2 2 4-4m6 2c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Orbiting elements - Download */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 animate-orbit-3">
              <div className="bg-white rounded-full p-3 shadow-lg">
                <svg className="w-6 h-6 text-petrobras-blue" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Title and description */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-white leading-tight">Transferência Segura de Arquivos</h2>
          <p className="text-xl text-white/90 leading-relaxed">
            Compartilhe documentos com destinatários externos de forma controlada e auditável
          </p>
        </div>

        {/* Features list */}
        <div className="mt-12 space-y-4">
          {[
            {
              icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 12l2 2 4-4m6 2c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
              title: "Aprovação Supervisionada",
              description: "Todos os envios passam por validação antes da liberação",
            },
            {
              icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
              title: "Acesso Controlado",
              description: "Código único de verificação para cada destinatário",
            },
            {
              icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
              title: "Auditoria Completa",
              description: "Rastreabilidade total de uploads, aprovações e downloads",
            },
            {
              icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
              title: "Notificações em Tempo Real",
              description: "Acompanhe o status dos seus arquivos instantaneamente",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 transition-all duration-300 hover:bg-petrobras-yellow/20 hover:border-petrobras-yellow/40 hover:scale-105"
            >
              <div className="flex-shrink-0 text-petrobras-yellow">{feature.icon}</div>
              <div>
                <h3 className="font-semibold text-white text-lg">{feature.title}</h3>
                <p className="text-white/80 text-sm mt-1">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom decorative element */}
        <div className="mt-12 flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-petrobras-yellow animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-white animate-pulse delay-150" />
          <div className="w-2 h-2 rounded-full bg-petrobras-yellow animate-pulse delay-300" />
        </div>
      </div>
    </div>
  )
}
