import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  // Read the OpenAPI spec
  const specPath = path.join(process.cwd(), 'public', 'openapi.yaml')
  let spec = ''
  
  try {
    spec = fs.readFileSync(specPath, 'utf-8')
  } catch (error) {
    console.error('Error reading OpenAPI spec:', error)
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - Petrobras File Transfer</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fafafa; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .info .title { color: #1a1a1a; }
    .swagger-ui .scheme-container { background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const spec = \`${spec.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
      
      window.ui = SwaggerUIBundle({
        spec: jsyaml.load(spec),
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
