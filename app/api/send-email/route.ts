import { Resend } from "resend"
import { type NextRequest, NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] === INÍCIO DO ENVIO DE E-MAIL ===")

    if (!process.env.RESEND_API_KEY) {
      console.error("[v0] ERRO CRÍTICO: RESEND_API_KEY não está configurada!")
      return NextResponse.json(
        {
          error: "RESEND_API_KEY não configurada. Vá em 'Vars' na sidebar e adicione a chave do Resend.",
          success: false,
        },
        { status: 500 },
      )
    }

    console.log("[v0] ✓ RESEND_API_KEY encontrada")

    const body = await request.json()
    const { to, subject, uploadData, type = "supervisor" } = body

    console.log("[v0] Dados recebidos:")
    console.log("[v0] - Para:", to)
    console.log("[v0] - Assunto:", subject)
    console.log("[v0] - Tipo:", type)
    console.log("[v0] - Upload:", uploadData?.name)

    const supervisorTemplate = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f5f5f5;
            }
            .email-wrapper { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white; 
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #00A99D 0%, #0047BB 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 { 
              font-size: 28px; 
              font-weight: 700; 
              margin-bottom: 8px;
            }
            .content { 
              padding: 40px 30px;
            }
            .greeting { 
              font-size: 16px; 
              margin-bottom: 20px;
              color: #2c3e50;
            }
            .upload-card { 
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 25px; 
              border-radius: 12px; 
              margin: 25px 0; 
              border-left: 5px solid #00A99D;
            }
            .upload-card h2 { 
              font-size: 20px;
              color: #0047BB; 
              margin-bottom: 20px;
            }
            .info-grid {
              display: grid;
              gap: 15px;
            }
            .info-item { 
              display: flex;
              align-items: flex-start;
              gap: 12px;
              padding: 12px;
              background: white;
              border-radius: 8px;
            }
            .info-icon {
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, #00A99D 0%, #0047BB 100%);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              font-size: 20px;
            }
            .info-content {
              flex: 1;
            }
            .info-label { 
              font-weight: 600; 
              color: #495057;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .info-value { 
              color: #212529;
              font-size: 15px;
              font-weight: 500;
            }
            .files-section {
              background: white;
              padding: 20px;
              border-radius: 12px;
              margin: 20px 0;
              border: 2px solid #e9ecef;
            }
            .files-header {
              font-weight: 600;
              font-size: 15px;
              color: #495057;
              margin-bottom: 15px;
            }
            .file-item { 
              padding: 12px; 
              background: #f8f9fa;
              border-radius: 8px;
              margin-bottom: 8px;
              display: flex; 
              justify-content: space-between; 
              align-items: center;
            }
            .file-size { 
              color: #6c757d; 
              font-size: 13px;
              font-weight: 500;
            }
            .description-box {
              background: #fff8e1;
              border-left: 4px solid #FDB913;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .description-box strong {
              color: #f57c00;
              display: block;
              margin-bottom: 8px;
            }
            .cta-button { 
              display: inline-block; 
              background: linear-gradient(135deg, #00A99D 0%, #0047BB 100%);
              color: white !important; 
              padding: 16px 40px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 30px 0;
              font-weight: 600;
              font-size: 16px;
              text-align: center;
              box-shadow: 0 4px 15px rgba(0,71,187,0.3);
            }
            .alert-box { 
              background: #fff3cd; 
              border-left: 4px solid #ffc107; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 25px 0;
            }
            .alert-box strong { 
              color: #856404;
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: #f8f9fa;
              color: #6c757d;
              font-size: 13px;
              border-top: 1px solid #dee2e6;
            }
            .petrobras-logo {
              font-size: 24px;
              font-weight: 700;
              color: white;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="petrobras-logo">⛽ PETROBRAS</div>
              <h1>🔔 Novo Upload para Aprovação</h1>
              <p>Sistema de Compartilhamento Seguro de Arquivos</p>
            </div>
            
            <div class="content">
              <p class="greeting">Olá <strong>Wagner Gaspar Brazil</strong>,</p>
              <p class="greeting">Um novo documento foi enviado e aguarda sua análise e aprovação:</p>
              
              <div class="upload-card">
                <h2>📄 ${uploadData.name}</h2>
                
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-icon">👤</div>
                    <div class="info-content">
                      <div class="info-label">Remetente</div>
                      <div class="info-value">${uploadData.sender.name}</div>
                    </div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-icon">📧</div>
                    <div class="info-content">
                      <div class="info-label">E-mail do Remetente</div>
                      <div class="info-value">${uploadData.sender.email}</div>
                    </div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-icon">🎯</div>
                    <div class="info-content">
                      <div class="info-label">Destinatário Final</div>
                      <div class="info-value">${uploadData.recipient}</div>
                    </div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-icon">⏱️</div>
                    <div class="info-content">
                      <div class="info-label">Validade Após Aprovação</div>
                      <div class="info-value">${uploadData.expirationHours} horas</div>
                    </div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-icon">📅</div>
                    <div class="info-content">
                      <div class="info-label">Data e Hora do Envio</div>
                      <div class="info-value">${uploadData.uploadDate}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="files-section">
                <div class="files-header">
                  📎 Arquivos no Pacote (${uploadData.files.length})
                </div>
                ${uploadData.files
                  .map(
                    (file: any) => `
                  <div class="file-item">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span>📄</span>
                      <strong>${file.name}</strong>
                    </div>
                    <span class="file-size">${file.size}</span>
                  </div>
                `,
                  )
                  .join("")}
              </div>

              ${
                uploadData.description
                  ? `
                <div class="description-box">
                  <strong>📝 Descrição do Conteúdo:</strong>
                  <p style="margin: 0; color: #424242; line-height: 1.6;">${uploadData.description}</p>
                </div>
              `
                  : ""
              }

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/supervisor" class="cta-button">
                  🔍 Revisar e Aprovar Agora
                </a>
              </div>

              <div class="alert-box">
                <strong>⚠️ Ação Necessária</strong>
                <p style="margin: 0;">Este documento está aguardando sua análise e aprovação. Após aprovado, o destinatário <strong>${uploadData.recipient}</strong> receberá automaticamente um e-mail com link seguro para download, válido por <strong>${uploadData.expirationHours} horas</strong>.</p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Sistema de Compartilhamento Seguro de Arquivos</strong></p>
              <p>Petrobras - Petróleo Brasileiro S.A.</p>
              <p style="margin-top: 15px;">Este é um e-mail automático. Por favor, não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const senderTemplate = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f5f5f5;
            }
            .email-wrapper { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white; 
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 { 
              font-size: 28px; 
              font-weight: 700; 
              margin-bottom: 8px;
            }
            .content { 
              padding: 40px 30px;
            }
            .success-box {
              background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
              padding: 25px;
              border-radius: 12px;
              margin: 25px 0;
              border-left: 5px solid #10b981;
              text-align: center;
            }
            .success-box h2 {
              font-size: 24px;
              color: #047857;
              margin-bottom: 10px;
            }
            .success-box p {
              color: #065f46;
              font-size: 15px;
            }
            .info-grid {
              display: grid;
              gap: 15px;
              margin: 25px 0;
            }
            .info-item { 
              display: flex;
              align-items: flex-start;
              gap: 12px;
              padding: 12px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .info-icon {
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              font-size: 20px;
            }
            .info-content {
              flex: 1;
            }
            .info-label { 
              font-weight: 600; 
              color: #495057;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .info-value { 
              color: #212529;
              font-size: 15px;
              font-weight: 500;
            }
            .files-section {
              background: white;
              padding: 20px;
              border-radius: 12px;
              margin: 20px 0;
              border: 2px solid #e9ecef;
            }
            .files-header {
              font-weight: 600;
              font-size: 15px;
              color: #495057;
              margin-bottom: 15px;
            }
            .file-item { 
              padding: 12px; 
              background: #f8f9fa;
              border-radius: 8px;
              margin-bottom: 8px;
              display: flex; 
              justify-content: space-between; 
              align-items: center;
            }
            .file-size { 
              color: #6c757d; 
              font-size: 13px;
              font-weight: 500;
            }
            .description-box {
              background: #fff8e1;
              border-left: 4px solid #FDB913;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .description-box strong {
              color: #f57c00;
              display: block;
              margin-bottom: 8px;
            }
            .next-steps {
              background: #e0f2fe;
              border-left: 4px solid #0284c7;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .next-steps strong {
              color: #075985;
              display: block;
              margin-bottom: 12px;
              font-size: 16px;
            }
            .next-steps ul {
              margin: 0;
              padding-left: 20px;
              color: #0c4a6e;
            }
            .next-steps li {
              margin-bottom: 8px;
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: #f8f9fa;
              color: #6c757d;
              font-size: 13px;
              border-top: 1px solid #dee2e6;
            }
            .petrobras-logo {
              font-size: 24px;
              font-weight: 700;
              color: white;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="petrobras-logo">⛽ PETROBRAS</div>
              <h1>✅ Upload Confirmado</h1>
              <p>Seu documento foi enviado com sucesso</p>
            </div>
            
            <div class="content">
              <div class="success-box">
                <h2>🎉 Documento Enviado!</h2>
                <p>Seu upload foi processado e encaminhado para aprovação</p>
              </div>
              
              <p style="font-size: 16px; color: #2c3e50; margin-bottom: 20px;">
                Olá <strong>${uploadData.sender.name}</strong>,
              </p>
              <p style="font-size: 15px; color: #475569; line-height: 1.8; margin-bottom: 25px;">
                Confirmamos que seu documento <strong>"${uploadData.name}"</strong> foi enviado com sucesso para o sistema de compartilhamento seguro. 
                Veja abaixo todos os detalhes do envio:
              </p>
              
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-icon">📄</div>
                  <div class="info-content">
                    <div class="info-label">Nome do Documento</div>
                    <div class="info-value">${uploadData.name}</div>
                  </div>
                </div>
                
                <div class="info-item">
                  <div class="info-icon">🎯</div>
                  <div class="info-content">
                    <div class="info-label">Destinatário</div>
                    <div class="info-value">${uploadData.recipient}</div>
                  </div>
                </div>
                
                <div class="info-item">
                  <div class="info-icon">⏱️</div>
                  <div class="info-content">
                    <div class="info-label">Validade Após Aprovação</div>
                    <div class="info-value">${uploadData.expirationHours} horas</div>
                  </div>
                </div>
                
                <div class="info-item">
                  <div class="info-icon">📅</div>
                  <div class="info-content">
                    <div class="info-label">Data e Hora do Envio</div>
                    <div class="info-value">${uploadData.uploadDate}</div>
                  </div>
                </div>
                
                <div class="info-item">
                  <div class="info-icon">👨‍💼</div>
                  <div class="info-content">
                    <div class="info-label">Supervisor Responsável</div>
                    <div class="info-value">Wagner Gaspar Brazil</div>
                  </div>
                </div>
              </div>

              <div class="files-section">
                <div class="files-header">
                  📎 Arquivos Enviados (${uploadData.files.length})
                </div>
                ${uploadData.files
                  .map(
                    (file: any) => `
                  <div class="file-item">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span>📄</span>
                      <strong>${file.name}</strong>
                    </div>
                    <span class="file-size">${file.size}</span>
                  </div>
                `,
                  )
                  .join("")}
              </div>

              ${
                uploadData.description
                  ? `
                <div class="description-box">
                  <strong>📝 Descrição do Conteúdo:</strong>
                  <p style="margin: 0; color: #424242; line-height: 1.6;">${uploadData.description}</p>
                </div>
              `
                  : ""
              }

              <div class="next-steps">
                <strong>📋 Próximos Passos</strong>
                <ul>
                  <li><strong>Wagner Gaspar Brazil</strong> foi notificado e receberá um e-mail para revisar o documento</li>
                  <li>Você será notificado quando o documento for <strong>aprovado</strong> ou <strong>rejeitado</strong></li>
                  <li>Após aprovação, <strong>${uploadData.recipient}</strong> receberá automaticamente um link seguro para download</li>
                  <li>O link terá validade de <strong>${uploadData.expirationHours} horas</strong> após a aprovação</li>
                </ul>
              </div>

              <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 30px; padding: 20px; background: #f1f5f9; border-radius: 8px;">
                💡 <strong>Dica:</strong> Você pode acompanhar o status do seu envio acessando o sistema
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Sistema de Compartilhamento Seguro de Arquivos</strong></p>
              <p>Petrobras - Petróleo Brasileiro S.A.</p>
              <p style="margin-top: 15px;">Este é um e-mail automático. Por favor, não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const htmlContent = type === "supervisor" ? supervisorTemplate : senderTemplate

    console.log(`[v0] Enviando e-mail tipo "${type}" para: ${to}`)

    const cleanSubject = subject
      .replace(/[áàãâä]/gi, "a")
      .replace(/[éèêë]/gi, "e")
      .replace(/[íìîï]/gi, "i")
      .replace(/[óòõôö]/gi, "o")
      .replace(/[úùûü]/gi, "u")
      .replace(/[ç]/gi, "c")
      .replace(/\n/g, " ")
      .trim()

    console.log(`[v0] Subject limpo: ${cleanSubject}`)

    console.log("[v0] Enviando e-mail via Resend...")
    const { data, error } = await resend.emails.send({
      from: "Sistema Petrobras <onboarding@resend.dev>",
      to: [to],
      subject: cleanSubject,
      html: htmlContent,
    })

    if (error) {
      console.error("[v0] ERRO do Resend:", error)
      return NextResponse.json({ error: error.message, success: false }, { status: 400 })
    }

    console.log("[v0] ✓ E-mail enviado com sucesso!")
    console.log("[v0] ID do e-mail:", data?.id)
    console.log("[v0] === FIM DO ENVIO DE E-MAIL ===")

    return NextResponse.json({ success: true, id: data?.id }, { status: 200 })
  } catch (error: any) {
    console.error("[v0] ERRO CRÍTICO NO CATCH:", error)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}
