/**
 * OpenAPI 3.0 Specification - Petrobras File Transfer API
 * 
 * Documentacao completa de todos os endpoints do backend
 */

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Petrobras File Transfer API",
    description: `
API RESTful para o sistema de transferência segura de arquivos da Petrobras.

## Visão Geral

Esta API permite:
- **Usuários Internos**: Criar compartilhamentos de arquivos para destinatários externos
- **Supervisores**: Aprovar/rejeitar compartilhamentos e gerenciar equipe
- **Usuários Externos**: Acessar arquivos compartilhados via autenticação OTP

## Autenticação

A API suporta dois métodos de autenticação:

1. **Microsoft Entra ID** (usuários internos/supervisores)
   - Token Bearer obtido via MSAL
   - Header: \`Authorization: Bearer {token}\`

2. **OTP por Email** (usuários externos)
   - Código de 6 dígitos enviado por email
   - Válido por 3 minutos

## Fluxo Principal

\`\`\`
Usuário Interno → Cria Share → Supervisor Aprova → Usuário Externo Baixa
\`\`\`

## Ambientes

| Ambiente | URL Base |
|----------|----------|
| Produção | https://api.transfer.petrobras.com.br/api/v1 |
| Homologação | https://api-hml.transfer.petrobras.com.br/api/v1 |
| Desenvolvimento | http://localhost:8000/api/v1 |
    `,
    version: "2.0.0",
    contact: {
      name: "Equipe de Desenvolvimento",
      email: "ti.desenvolvimento@petrobras.com.br"
    },
    license: {
      name: "Proprietary",
      url: "https://petrobras.com.br"
    }
  },
  servers: [
    {
      url: "https://api.transfer.petrobras.com.br/api/v1",
      description: "Produção"
    },
    {
      url: "https://api-hml.transfer.petrobras.com.br/api/v1",
      description: "Homologação"
    },
    {
      url: "http://localhost:8000/api/v1",
      description: "Desenvolvimento Local"
    }
  ],
  tags: [
    {
      name: "Authentication",
      description: "Autenticação de usuários (Entra ID e OTP)"
    },
    {
      name: "Shares",
      description: "Gerenciamento de compartilhamentos de arquivos"
    },
    {
      name: "Supervisor",
      description: "Operações exclusivas de supervisores"
    },
    {
      name: "External",
      description: "Acesso de usuários externos"
    },
    {
      name: "Files",
      description: "Upload e download de arquivos"
    },
    {
      name: "Audit",
      description: "Logs de auditoria e métricas"
    },
    {
      name: "Notifications",
      description: "Notificações e alertas"
    }
  ],
  paths: {
    // ============================================
    // AUTHENTICATION
    // ============================================
    "/auth/entra/validate": {
      post: {
        tags: ["Authentication"],
        summary: "Validar token Entra ID",
        description: `
Valida token do Microsoft Entra ID e cria sessão para usuário interno/supervisor.

**Fluxo:**
1. Frontend faz login com Microsoft (MSAL)
2. Frontend envia token e dados extraídos
3. Backend valida e determina tipo de usuário
4. Backend cria sessão e retorna token
        `,
        operationId: "validateEntraToken",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EntraTokenValidationRequest" },
              example: {
                access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Ik...",
                id_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik...",
                email: "joao.silva@petrobras.com.br",
                name: "João Silva",
                job_title: "Analista de Sistemas",
                department: "TI - Desenvolvimento",
                employee_id: "P12345",
                manager: {
                  id: "mgr-001",
                  name: "Maria Santos",
                  email: "maria.santos@petrobras.com.br",
                  job_title: "Gerente de TI"
                },
                photo_url: "https://graph.microsoft.com/v1.0/me/photo/$value"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Token validado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EntraTokenValidationResponse" },
                example: {
                  success: true,
                  user_id: "usr-12345-abcde",
                  email: "joao.silva@petrobras.com.br",
                  name: "João Silva",
                  user_type: "internal",
                  job_title: "Analista de Sistemas",
                  department: "TI - Desenvolvimento",
                  manager: {
                    id: "mgr-001",
                    name: "Maria Santos",
                    email: "maria.santos@petrobras.com.br"
                  },
                  session_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  session_expires_at: "2026-01-21T18:00:00.000Z",
                  permissions: ["view_own_shares", "create_shares", "cancel_own_shares"]
                }
              }
            }
          },
          "403": {
            description: "Domínio de email não autorizado",
            content: {
              "application/json": {
                example: { detail: "Domínio de email não autorizado" }
              }
            }
          },
          "500": {
            description: "Erro interno",
            content: {
              "application/json": {
                example: { detail: "Erro ao validar token: {mensagem}" }
              }
            }
          }
        }
      }
    },
    "/auth/external/verify": {
      post: {
        tags: ["Authentication"],
        summary: "Verificar email externo",
        description: `
Verifica se email externo tem compartilhamentos disponíveis e envia código OTP.

**Fluxo:**
1. Usuário externo informa email
2. Backend verifica se há shares aprovados
3. Se houver, gera e envia OTP por email
        `,
        operationId: "verifyExternalEmail",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ExternalVerifyRequest" },
              example: {
                email: "cliente@empresa.com"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Verificação realizada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ExternalVerifyResponse" },
                examples: {
                  "com_shares": {
                    summary: "Email com compartilhamentos",
                    value: {
                      has_shares: true,
                      shares_count: 3,
                      otp_sent: true,
                      message: "Código enviado para cliente@empresa.com"
                    }
                  },
                  "sem_shares": {
                    summary: "Email sem compartilhamentos",
                    value: {
                      has_shares: false,
                      shares_count: 0,
                      otp_sent: false,
                      message: "Nenhum compartilhamento encontrado para este email"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/auth/external/verify-otp": {
      post: {
        tags: ["Authentication"],
        summary: "Verificar código OTP",
        description: `
Valida código OTP e cria sessão para usuário externo.

**Características do OTP:**
- 6 dígitos numéricos
- Válido por 3 minutos
- Máximo 5 tentativas
- Cooldown de 30 segundos para reenvio
        `,
        operationId: "verifyExternalOTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ExternalOTPVerifyRequest" },
              example: {
                email: "cliente@empresa.com",
                otp_code: "123456"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Resultado da verificação",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ExternalOTPVerifyResponse" },
                examples: {
                  "sucesso": {
                    summary: "OTP válido",
                    value: {
                      success: true,
                      session_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      session_expires_at: "2026-01-21T13:00:00.000Z",
                      user_id: "ext-cliente-empresa-com",
                      shares_count: 3,
                      message: "Autenticação realizada com sucesso"
                    }
                  },
                  "invalido": {
                    summary: "OTP inválido",
                    value: {
                      success: false,
                      message: "Código inválido ou expirado"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/auth/external/resend-otp": {
      post: {
        tags: ["Authentication"],
        summary: "Reenviar código OTP",
        description: "Reenvia novo código OTP para email externo. Requer cooldown de 30 segundos.",
        operationId: "resendExternalOTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ExternalVerifyRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Resultado do reenvio",
            content: {
              "application/json": {
                examples: {
                  "sucesso": {
                    value: { success: true, message: "Novo código enviado" }
                  },
                  "cooldown": {
                    value: { success: false, message: "Aguarde 30 segundos para reenviar" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/auth/session/validate": {
      post: {
        tags: ["Authentication"],
        summary: "Validar sessão",
        description: "Verifica se sessão ainda está ativa e válida.",
        operationId: "validateSession",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  session_token: { type: "string" }
                },
                required: ["session_token"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Resultado da validação",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SessionValidationResponse" }
              }
            }
          }
        }
      }
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Encerrar sessão",
        description: "Faz logout e invalida token de sessão.",
        operationId: "logout",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  session_token: { type: "string" }
                },
                required: ["session_token"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Logout realizado",
            content: {
              "application/json": {
                example: { success: true, message: "Sessão encerrada" }
              }
            }
          }
        }
      }
    },

    // ============================================
    // SHARES
    // ============================================
    "/shares/create": {
      post: {
        tags: ["Shares"],
        summary: "Criar compartilhamento",
        description: `
Cria novo compartilhamento de arquivos.

**Fluxo:**
1. Valida dados e arquivos
2. Cria registro com status 'pending'
3. Notifica supervisor por email
4. Envia confirmação para remetente

**Extensões bloqueadas:** .exe, .dll, .bat, .cmd, .com, .msi, .scr, .vbs, .ps1, .sh
        `,
        operationId: "createShare",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateShareRequest" },
              example: {
                name: "Relatório Financeiro Q4 2025",
                sender: {
                  id: "usr-12345",
                  name: "João Silva",
                  email: "joao.silva@petrobras.com.br"
                },
                recipient: "auditor@empresa-auditoria.com",
                description: "Relatórios financeiros do quarto trimestre para análise da auditoria externa.",
                files: [
                  { name: "relatorio-q4-2025.pdf", size: "2.5 MB", type: "PDF" },
                  { name: "planilha-dados.xlsx", size: "1.2 MB", type: "XLSX" }
                ],
                expiration_hours: 72,
                sent_by_supervisor: false,
                approver: {
                  id: "mgr-001",
                  name: "Maria Santos",
                  email: "maria.santos@petrobras.com.br",
                  job_title: "Gerente de TI"
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Compartilhamento criado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateShareResponse" },
                example: {
                  success: true,
                  share_id: "shr-abc123-def456",
                  status: "pending",
                  approver: {
                    id: "mgr-001",
                    name: "Maria Santos",
                    email: "maria.santos@petrobras.com.br"
                  },
                  message: "Compartilhamento criado e enviado para aprovação"
                }
              }
            }
          },
          "400": {
            description: "Dados inválidos"
          },
          "401": {
            description: "Não autenticado"
          }
        }
      }
    },
    "/shares/my-shares": {
      get: {
        tags: ["Shares"],
        summary: "Listar meus compartilhamentos",
        description: "Lista todos os compartilhamentos criados pelo usuário autenticado.",
        operationId: "getMyShares",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "user_id",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "ID do usuário"
          },
          {
            name: "status",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["pending", "approved", "rejected", "cancelled", "expired"]
            },
            description: "Filtrar por status"
          }
        ],
        responses: {
          "200": {
            description: "Lista de compartilhamentos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ShareDetailResponse" }
                }
              }
            }
          }
        }
      }
    },
    "/shares/{share_id}": {
      get: {
        tags: ["Shares"],
        summary: "Obter detalhes do compartilhamento",
        description: "Retorna detalhes completos de um compartilhamento específico.",
        operationId: "getShareDetail",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "share_id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID do compartilhamento"
          }
        ],
        responses: {
          "200": {
            description: "Detalhes do compartilhamento",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ShareDetailResponse" }
              }
            }
          },
          "404": {
            description: "Compartilhamento não encontrado"
          }
        }
      }
    },
    "/shares/{share_id}/cancel": {
      patch: {
        tags: ["Shares"],
        summary: "Cancelar compartilhamento",
        description: "Cancela um compartilhamento pendente. Apenas o remetente pode cancelar.",
        operationId: "cancelShare",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "share_id",
            in: "path",
            required: true,
            schema: { type: "string" }
          },
          {
            name: "user_id",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "ID do usuário solicitante"
          }
        ],
        responses: {
          "200": {
            description: "Compartilhamento cancelado",
            content: {
              "application/json": {
                example: { success: true, message: "Compartilhamento cancelado" }
              }
            }
          },
          "400": {
            description: "Não pode ser cancelado (status diferente de pending)"
          },
          "403": {
            description: "Sem permissão"
          }
        }
      }
    },

    // ============================================
    // SUPERVISOR
    // ============================================
    "/shares/supervisor/pending": {
      get: {
        tags: ["Supervisor"],
        summary: "Listar pendentes para aprovação",
        description: "Lista compartilhamentos aguardando aprovação do supervisor.",
        operationId: "getSupervisorPending",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "supervisor_email",
            in: "query",
            required: true,
            schema: { type: "string", format: "email" },
            description: "Email do supervisor"
          }
        ],
        responses: {
          "200": {
            description: "Lista de pendentes",
            content: {
              "application/json": {
                example: {
                  shares: [
                    {
                      id: "shr-001",
                      name: "Documentos Técnicos",
                      status: "pending",
                      sender: { name: "João Silva", email: "joao@petrobras.com.br" },
                      recipient: "cliente@empresa.com",
                      created_at: "2026-01-21T10:00:00Z",
                      files: [{ name: "doc.pdf", size: "2 MB", type: "PDF" }]
                    }
                  ],
                  count: 1
                }
              }
            }
          }
        }
      }
    },
    "/shares/supervisor/all": {
      get: {
        tags: ["Supervisor"],
        summary: "Listar todos os compartilhamentos",
        description: "Lista todos os compartilhamentos que passaram pelo supervisor com filtros.",
        operationId: "getSupervisorAll",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "supervisor_email",
            in: "query",
            required: true,
            schema: { type: "string", format: "email" }
          },
          {
            name: "status",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["all", "pending", "approved", "rejected"]
            }
          },
          {
            name: "search",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Buscar por nome, remetente ou destinatário"
          }
        ],
        responses: {
          "200": {
            description: "Lista filtrada"
          }
        }
      }
    },
    "/shares/supervisor/approve": {
      post: {
        tags: ["Supervisor"],
        summary: "Aprovar compartilhamento",
        description: `
Aprova um compartilhamento pendente.

**Ações executadas:**
1. Atualiza status para 'approved'
2. Define data de expiração
3. Envia email com OTP para destinatário externo
4. Notifica remetente por email
        `,
        operationId: "approveShare",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApproveShareRequest" },
              example: {
                share_id: "shr-abc123",
                supervisor_id: "mgr-001",
                supervisor_name: "Maria Santos",
                supervisor_email: "maria.santos@petrobras.com.br",
                comments: "Aprovado. Documentos verificados e adequados para compartilhamento."
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Compartilhamento aprovado",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Compartilhamento aprovado",
                  expires_at: "2026-01-24T10:00:00Z"
                }
              }
            }
          }
        }
      }
    },
    "/shares/supervisor/reject": {
      post: {
        tags: ["Supervisor"],
        summary: "Rejeitar compartilhamento",
        description: "Rejeita um compartilhamento pendente. Os arquivos são deletados.",
        operationId: "rejectShare",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RejectShareRequest" },
              example: {
                share_id: "shr-abc123",
                supervisor_id: "mgr-001",
                supervisor_name: "Maria Santos",
                supervisor_email: "maria.santos@petrobras.com.br",
                reason: "Documentos contêm informações confidenciais que não podem ser compartilhadas externamente."
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Compartilhamento rejeitado"
          }
        }
      }
    },
    "/shares/supervisor/{share_id}/extend": {
      put: {
        tags: ["Supervisor"],
        summary: "Alterar tempo de expiração",
        description: "Altera o tempo de disponibilidade de um compartilhamento aprovado.",
        operationId: "extendExpiration",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "share_id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ExtendExpirationRequest" },
              example: {
                share_id: "shr-abc123",
                new_hours: 48
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Expiração atualizada"
          }
        }
      }
    },
    "/shares/supervisor/statistics": {
      get: {
        tags: ["Supervisor"],
        summary: "Obter estatísticas",
        description: "Retorna métricas e estatísticas dos compartilhamentos.",
        operationId: "getSupervisorStatistics",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "supervisor_email",
            in: "query",
            required: true,
            schema: { type: "string", format: "email" }
          }
        ],
        responses: {
          "200": {
            description: "Estatísticas",
            content: {
              "application/json": {
                example: {
                  total_shares: 150,
                  pending: 5,
                  approved: 120,
                  rejected: 15,
                  cancelled: 10,
                  approval_rate: 88.9,
                  avg_approval_time_hours: 2.5
                }
              }
            }
          }
        }
      }
    },

    // ============================================
    // EXTERNAL
    // ============================================
    "/external/shares": {
      get: {
        tags: ["External"],
        summary: "Listar compartilhamentos disponíveis",
        description: "Lista todos os compartilhamentos aprovados e não expirados para o usuário externo.",
        operationId: "getExternalShares",
        security: [{ externalAuth: [] }],
        parameters: [
          {
            name: "email",
            in: "query",
            required: true,
            schema: { type: "string", format: "email" }
          }
        ],
        responses: {
          "200": {
            description: "Lista de compartilhamentos",
            content: {
              "application/json": {
                example: {
                  shares: [
                    {
                      id: "shr-001",
                      name: "Relatório Q4",
                      sender: { name: "João Silva" },
                      files: [{ name: "relatorio.pdf", size: "2 MB" }],
                      expires_at: "2026-01-24T10:00:00Z",
                      terms_accepted: false
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/external/shares/{share_id}/accept-terms": {
      post: {
        tags: ["External"],
        summary: "Aceitar termos de uso",
        description: "Aceita os termos de uso e responsabilidade para acessar os arquivos.",
        operationId: "acceptTerms",
        security: [{ externalAuth: [] }],
        parameters: [
          {
            name: "share_id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AcceptTermsRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Termos aceitos"
          }
        }
      }
    },
    "/external/files/{file_id}/download": {
      get: {
        tags: ["External"],
        summary: "Gerar URL de download",
        description: "Gera URL pré-assinada do S3 para download do arquivo. URL válida por 1 hora.",
        operationId: "getDownloadUrl",
        security: [{ externalAuth: [] }],
        parameters: [
          {
            name: "file_id",
            in: "path",
            required: true,
            schema: { type: "string" }
          },
          {
            name: "share_id",
            in: "query",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "URL de download",
            content: {
              "application/json": {
                example: {
                  download_url: "https://s3.amazonaws.com/bucket/file.pdf?...",
                  expires_in_seconds: 3600,
                  file_name: "relatorio.pdf"
                }
              }
            }
          }
        }
      }
    },

    // ============================================
    // FILES
    // ============================================
    "/files/upload": {
      post: {
        tags: ["Files"],
        summary: "Upload de arquivos",
        description: `
Faz upload de arquivos para um compartilhamento.

**Limites:**
- Tamanho máximo por arquivo: 500 MB
- Extensões bloqueadas: .exe, .dll, .bat, .cmd, .com, .msi, .scr, .vbs, .ps1, .sh
        `,
        operationId: "uploadFiles",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  share_id: { type: "string" },
                  files: {
                    type: "array",
                    items: { type: "string", format: "binary" }
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Upload realizado",
            content: {
              "application/json": {
                example: {
                  success: true,
                  files: [
                    { file_id: "file-001", name: "doc.pdf", size: 2500000 }
                  ]
                }
              }
            }
          },
          "400": {
            description: "Arquivo bloqueado ou muito grande"
          }
        }
      }
    },
    "/files/presigned-url": {
      post: {
        tags: ["Files"],
        summary: "Gerar URL pré-assinada para upload",
        description: "Gera URL pré-assinada do S3 para upload direto do browser.",
        operationId: "getPresignedUploadUrl",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  share_id: { type: "string" },
                  file_name: { type: "string" },
                  content_type: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "URL gerada",
            content: {
              "application/json": {
                example: {
                  upload_url: "https://s3.amazonaws.com/bucket?...",
                  file_id: "file-001",
                  expires_in_seconds: 3600
                }
              }
            }
          }
        }
      }
    },

    // ============================================
    // AUDIT
    // ============================================
    "/audit/logs": {
      get: {
        tags: ["Audit"],
        summary: "Listar logs de auditoria",
        description: "Lista logs de auditoria com filtros.",
        operationId: "getAuditLogs",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "action",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Filtrar por ação (login, share_created, etc)"
          },
          {
            name: "user_id",
            in: "query",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "level",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["info", "success", "warning", "error"]
            }
          },
          {
            name: "start_date",
            in: "query",
            required: false,
            schema: { type: "string", format: "date" }
          },
          {
            name: "end_date",
            in: "query",
            required: false,
            schema: { type: "string", format: "date" }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 50 }
          }
        ],
        responses: {
          "200": {
            description: "Lista de logs"
          }
        }
      },
      post: {
        tags: ["Audit"],
        summary: "Criar log de auditoria",
        description: "Registra nova entrada no log de auditoria.",
        operationId: "createAuditLog",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuditLogEntry" }
            }
          }
        },
        responses: {
          "200": {
            description: "Log criado"
          }
        }
      }
    },
    "/audit/metrics": {
      get: {
        tags: ["Audit"],
        summary: "Obter métricas gerais",
        description: "Retorna métricas agregadas do sistema.",
        operationId: "getAuditMetrics",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Métricas",
            content: {
              "application/json": {
                example: {
                  total_users: 150,
                  total_shares: 1200,
                  total_downloads: 3500,
                  storage_used_gb: 45.5,
                  active_shares: 85
                }
              }
            }
          }
        }
      }
    },

    // ============================================
    // NOTIFICATIONS
    // ============================================
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Listar notificações",
        description: "Lista notificações do usuário.",
        operationId: "getNotifications",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "user_id",
            in: "query",
            required: true,
            schema: { type: "string" }
          },
          {
            name: "unread_only",
            in: "query",
            required: false,
            schema: { type: "boolean", default: false }
          }
        ],
        responses: {
          "200": {
            description: "Lista de notificações"
          }
        }
      }
    },
    "/notifications/{notification_id}/read": {
      patch: {
        tags: ["Notifications"],
        summary: "Marcar como lida",
        description: "Marca uma notificação como lida.",
        operationId: "markNotificationRead",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "notification_id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Notificação marcada como lida"
          }
        }
      }
    },

    // ============================================
    // HEALTH
    // ============================================
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "Verifica status da API e serviços.",
        operationId: "healthCheck",
        responses: {
          "200": {
            description: "API saudável",
            content: {
              "application/json": {
                example: {
                  status: "healthy",
                  version: "2.0.0",
                  timestamp: "2026-01-21T10:00:00Z",
                  services: {
                    dynamodb: "connected",
                    s3: "connected",
                    ses: "connected"
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token JWT obtido via login Entra ID"
      },
      externalAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token JWT obtido via autenticação OTP"
      }
    },
    schemas: {
      EntraTokenValidationRequest: {
        type: "object",
        required: ["access_token", "email", "name"],
        properties: {
          access_token: { type: "string", description: "Token de acesso do Entra ID" },
          id_token: { type: "string", description: "Token de ID do Entra ID" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          job_title: { type: "string" },
          department: { type: "string" },
          employee_id: { type: "string" },
          manager: { $ref: "#/components/schemas/ManagerInfo" },
          photo_url: { type: "string" }
        }
      },
      EntraTokenValidationResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          user_id: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          user_type: { type: "string", enum: ["internal", "supervisor"] },
          job_title: { type: "string" },
          department: { type: "string" },
          manager: { $ref: "#/components/schemas/ManagerInfo" },
          session_token: { type: "string" },
          session_expires_at: { type: "string", format: "date-time" },
          permissions: { type: "array", items: { type: "string" } }
        }
      },
      ExternalVerifyRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" }
        }
      },
      ExternalVerifyResponse: {
        type: "object",
        properties: {
          has_shares: { type: "boolean" },
          shares_count: { type: "integer" },
          otp_sent: { type: "boolean" },
          message: { type: "string" }
        }
      },
      ExternalOTPVerifyRequest: {
        type: "object",
        required: ["email", "otp_code"],
        properties: {
          email: { type: "string", format: "email" },
          otp_code: { type: "string", minLength: 6, maxLength: 6 }
        }
      },
      ExternalOTPVerifyResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          session_token: { type: "string" },
          session_expires_at: { type: "string", format: "date-time" },
          user_id: { type: "string" },
          shares_count: { type: "integer" },
          message: { type: "string" }
        }
      },
      SessionValidationResponse: {
        type: "object",
        properties: {
          valid: { type: "boolean" },
          user_id: { type: "string" },
          email: { type: "string" },
          user_type: { type: "string" },
          expires_at: { type: "string", format: "date-time" }
        }
      },
      ManagerInfo: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          job_title: { type: "string" },
          department: { type: "string" }
        }
      },
      SenderInfo: {
        type: "object",
        required: ["id", "name", "email"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" }
        }
      },
      ApproverInfo: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          job_title: { type: "string" }
        }
      },
      FileInfo: {
        type: "object",
        required: ["name", "size", "type"],
        properties: {
          name: { type: "string" },
          size: { type: "string" },
          type: { type: "string" }
        }
      },
      CreateShareRequest: {
        type: "object",
        required: ["name", "sender", "recipient", "description", "files"],
        properties: {
          name: { type: "string", description: "Título/descrição do compartilhamento" },
          sender: { $ref: "#/components/schemas/SenderInfo" },
          recipient: { type: "string", format: "email", description: "Email do destinatário externo" },
          description: { type: "string" },
          files: { type: "array", items: { $ref: "#/components/schemas/FileInfo" } },
          expiration_hours: { type: "integer", enum: [24, 48, 72], default: 72 },
          sent_by_supervisor: { type: "boolean", default: false },
          approver: { $ref: "#/components/schemas/ApproverInfo" }
        }
      },
      CreateShareResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          share_id: { type: "string" },
          status: { type: "string" },
          approver: { $ref: "#/components/schemas/ApproverInfo" },
          message: { type: "string" }
        }
      },
      ShareDetailResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          status: { type: "string", enum: ["pending", "approved", "rejected", "cancelled", "expired"] },
          sender: { $ref: "#/components/schemas/SenderInfo" },
          recipient: { type: "string" },
          description: { type: "string" },
          files: { type: "array", items: { $ref: "#/components/schemas/FileInfo" } },
          expiration_hours: { type: "integer" },
          created_at: { type: "string", format: "date-time" },
          approved_at: { type: "string", format: "date-time" },
          rejected_at: { type: "string", format: "date-time" },
          expires_at: { type: "string", format: "date-time" },
          rejection_reason: { type: "string" },
          approver: { $ref: "#/components/schemas/ApproverInfo" },
          download_count: { type: "integer" },
          terms_accepted: { type: "boolean" }
        }
      },
      ApproveShareRequest: {
        type: "object",
        required: ["share_id", "supervisor_id", "supervisor_name", "supervisor_email"],
        properties: {
          share_id: { type: "string" },
          supervisor_id: { type: "string" },
          supervisor_name: { type: "string" },
          supervisor_email: { type: "string", format: "email" },
          comments: { type: "string" }
        }
      },
      RejectShareRequest: {
        type: "object",
        required: ["share_id", "supervisor_id", "supervisor_name", "supervisor_email", "reason"],
        properties: {
          share_id: { type: "string" },
          supervisor_id: { type: "string" },
          supervisor_name: { type: "string" },
          supervisor_email: { type: "string", format: "email" },
          reason: { type: "string" }
        }
      },
      ExtendExpirationRequest: {
        type: "object",
        required: ["share_id", "new_hours"],
        properties: {
          share_id: { type: "string" },
          new_hours: { type: "integer", enum: [24, 48, 72] }
        }
      },
      AcceptTermsRequest: {
        type: "object",
        required: ["share_id", "external_user_email"],
        properties: {
          share_id: { type: "string" },
          external_user_email: { type: "string", format: "email" }
        }
      },
      AuditLogEntry: {
        type: "object",
        required: ["action", "level", "user_id", "user_type"],
        properties: {
          action: { type: "string" },
          level: { type: "string", enum: ["info", "success", "warning", "error"] },
          user_id: { type: "string" },
          user_type: { type: "string", enum: ["internal", "supervisor", "external"] },
          details: { type: "object" }
        }
      }
    }
  }
};
