export function generateOTPEmail(
  email: string,
  code: string,
  shareInfo: { senderName: string; fileName: string },
): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Acesso - Petrobras</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header com cores Petrobras -->
          <tr>
            <td style="background: linear-gradient(135deg, #0047BB 0%, #003A99 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🔒 Acesso Seguro</h1>
              <p style="color: #FFB81C; margin: 10px 0 0 0; font-size: 16px;">Petrobras - Compartilhamento Confidencial</p>
            </td>
          </tr>

          <!-- Corpo do email -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá,
              </p>

              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>${shareInfo.senderName}</strong> compartilhou o arquivo <strong>"${shareInfo.fileName}"</strong> com você através do Portal Seguro da Petrobras.
              </p>

              <div style="background-color: #f8f9fa; border-left: 4px solid #0047BB; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">Seu código de acesso:</p>
                <p style="color: #0047BB; font-size: 48px; font-weight: bold; margin: 0; text-align: center; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </p>
                <p style="color: #999999; font-size: 12px; margin: 15px 0 0 0; text-align: center;">
                  ⏰ Este código expira em <strong>3 minutos</strong>
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://layout-petro-e-mail.vercel.app"}/external-verify?email=${encodeURIComponent(email)}" 
                   style="display: inline-block; background-color: #0047BB; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Acessar Portal Seguro →
                </a>
              </div>

              <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 30px 0;">
                <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                  <strong>⚠️ Importante:</strong><br>
                  • Não compartilhe este código com ninguém<br>
                  • Este é um acesso temporário e monitorado<br>
                  • Todos os downloads são registrados para auditoria
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666666; font-size: 12px; margin: 0 0 10px 0;">
                Este é um email automático. Por favor, não responda.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 Petrobras. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
