import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export async function GET() {
  const specPath = path.join(process.cwd(), 'public', 'openapi.yaml')
  let specJson = '{}'
  
  try {
    const specYaml = fs.readFileSync(specPath, 'utf-8')
    const specObj = yaml.load(specYaml)
    specJson = JSON.stringify(specObj)
  } catch (error) {
    console.error('[v0] Error reading OpenAPI spec:', error)
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - Petrobras File Transfer</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="redoc-container"></div>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  <script>
    Redoc.init(${specJson}, {
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
