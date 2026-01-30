import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin
  
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - Petrobras File Transfer</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.css">
  <style>
    body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
    #redoc-container { min-height: 100vh; }
    .loading { 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      font-size: 18px; 
      color: #0066b3;
    }
  </style>
</head>
<body>
  <div id="redoc-container">
    <div class="loading">Carregando documentacao...</div>
  </div>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      Redoc.init('${origin}/openapi.yaml', {
        theme: {
          colors: {
            primary: { main: '#0066b3' }
          },
          typography: {
            fontFamily: 'Inter, sans-serif',
            headings: { fontFamily: 'Inter, sans-serif' },
            code: { fontFamily: 'JetBrains Mono, monospace' }
          },
          sidebar: {
            backgroundColor: '#1a1a2e',
            textColor: '#ffffff'
          }
        },
        scrollYOffset: 0,
        hideDownloadButton: false,
        expandResponses: '200,201'
      }, document.getElementById('redoc-container'));
    });
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
