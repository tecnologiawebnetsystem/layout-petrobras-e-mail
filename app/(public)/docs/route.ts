import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export async function GET() {
  let specJson = '{}'
  
  try {
    const yamlPath = path.join(process.cwd(), 'public', 'openapi.yaml')
    const yamlContent = fs.readFileSync(yamlPath, 'utf8')
    const spec = yaml.load(yamlContent)
    specJson = JSON.stringify(spec)
  } catch (error) {
    console.error('Error loading OpenAPI spec:', error)
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - Petrobras File Transfer</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
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
  </style>
</head>
<body>
  <div id="redoc-container">
    <div class="loading">
      <div class="spinner"></div>
      <span>Carregando documentacao da API...</span>
    </div>
  </div>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  <script>
    var spec = ${specJson};
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
    }, document.getElementById('redoc-container'));
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
