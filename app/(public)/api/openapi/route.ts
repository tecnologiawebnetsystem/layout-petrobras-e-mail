import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export async function GET() {
  try {
    const yamlPath = path.join(process.cwd(), 'public', 'openapi.yaml')
    const yamlContent = fs.readFileSync(yamlPath, 'utf8')
    const jsonSpec = yaml.load(yamlContent)
    
    return NextResponse.json(jsonSpec, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error loading OpenAPI spec:', error)
    return NextResponse.json(
      { error: 'Failed to load OpenAPI specification' },
      { status: 500 }
    )
  }
}
