import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

// Forcar Node.js runtime (nao Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  let specJson = '{}'
  let errorMsg = ''
  
  try {
    const yamlPath = path.join(process.cwd(), 'public', 'openapi.yaml')
    const yamlContent = fs.readFileSync(yamlPath, 'utf8')
    const spec = yaml.load(yamlContent)
    specJson = JSON.stringify(spec).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
  } catch (error) {
    console.error('[v0] Error loading OpenAPI spec:', error)
    errorMsg = error instanceof Error ? error.message.replace(/"/g, '\\"') : 'Unknown error'
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - Petrobras File Transfer</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #fafafa; }
    #redoc-container { min-height: 100vh; }
    .loading { 
      display: flex; 
      flex-direction: column;
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      font-size: 18px; 
      color: #0066b3;
      gap: 16px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #0066b3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .error-container {
      padding: 40px;
      text-align: center;
      max-width: 600px;
      margin: 100px auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .error-container h1 { color: #c00; margin-bottom: 16px; }
    .error-container p { color: #666; }
  </style>
</head>
<body>
  <div id="redoc-container">
    <div class="loading" id="loading-indicator">
      <div class="spinner"></div>
      <span>Carregando documentacao da API...</span>
    </div>
  </div>
  <script>
    var spec = ${specJson};
    var errorMsg = "${errorMsg}";
    var container = document.getElementById('redoc-container');
    
    function showError(msg) {
      container.innerHTML = '<div class="error-container"><h1>Erro ao carregar documentacao</h1><p>' + msg + '</p></div>';
    }
    
    if (errorMsg) {
      showError(errorMsg);
    } else {
      // Load ReDoc dynamically
      var script = document.createElement('script');
      script.src = 'https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js';
      script.onload = function() {
        try {
          Redoc.init(spec, {
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
          }, container);
        } catch(e) {
          showError('Erro ao inicializar ReDoc: ' + e.message);
        }
      };
      script.onerror = function() {
        showError('Nao foi possivel carregar a biblioteca ReDoc. Verifique sua conexao com a internet.');
      };
      document.body.appendChild(script);
    }
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
