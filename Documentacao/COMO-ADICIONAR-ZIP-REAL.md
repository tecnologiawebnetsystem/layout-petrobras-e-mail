# Como Adicionar Arquivos ZIP Reais para Demonstração

Este guia explica como adicionar arquivos ZIP reais ao sistema para demonstração na área do supervisor.

## Para que serve?

Quando você clica na **lupa** 🔍 ao lado de um arquivo ZIP na página do supervisor, o sistema abre um modal mostrando o conteúdo do arquivo. Por padrão, usa dados mockados (fictícios), mas você pode substituir por arquivos ZIP reais para demonstração.

---

## Opção 1: Upload de Arquivo ZIP Real (Mais Simples)

### Passo 1: Adicionar ZIP ao projeto

1. Coloque seu arquivo ZIP na pasta `public/demo-files/`
2. Exemplo: `public/demo-files/documentos-tecnicos.zip`

### Passo 2: Atualizar o workflow-store

Edite o arquivo `lib/stores/workflow-store.ts` e modifique o upload que deseja usar arquivo real:

```typescript
{
  id: "upload-3",
  name: "Documentação Técnica Q4 2024",
  files: [
    {
      name: "Documentos_Tecnicos_Q4.zip",
      size: "45.2 MB",
      type: "ZIP",
      url: "/demo-files/documentos-tecnicos.zip", // <-- Caminho do seu ZIP real
    },
  ],
  // ... resto do código
}
```

### Passo 3: Testar

1. Faça login como supervisor
2. Clique em "Exibir Detalhes" no upload
3. Clique na lupa 🔍 ao lado do arquivo ZIP
4. O modal abrirá mostrando o **conteúdo real** do seu arquivo!

---

## Opção 2: Criar ZIP Programaticamente

Se você quiser criar um ZIP com conteúdo específico sem ter o arquivo físico:

### Passo 1: Usar o utilitário create-mock-zip

O sistema já tem um utilitário que cria ZIPs fictícios. Você pode personalizá-lo:

Edite `lib/utils/create-mock-zip.ts`:

```typescript
export async function createMockZipFile() {
  const zip = new JSZip()

  // Adicione seus próprios arquivos aqui
  zip.file("documentos/contrato.pdf", "Conteúdo do contrato...")
  zip.file("planilhas/orcamento.xlsx", "Dados da planilha...")
  
  // Adicione pastas
  zip.folder("imagens")
  zip.file("imagens/logo.png", "dados-da-imagem-base64")

  const blob = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(blob)

  return { url, blob }
}
```

---

## Opção 3: Usar Blob Storage (Produção Real)

Para produção, você deve armazenar arquivos ZIP no **S3 da AWS**:

### Arquitetura

```
Usuário Upload → Next.js API → S3 Bucket → URL Pública
                                    ↓
                          DynamoDB (salva URL)
                                    ↓
                    Supervisor visualiza → Lê do S3
```

### Implementação

1. **Upload para S3:**

```typescript
// app/api/upload-zip/route.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File
  
  const s3Client = new S3Client({ region: "us-east-1" })
  
  const command = new PutObjectCommand({
    Bucket: "petrobras-uploads",
    Key: `uploads/${Date.now()}-${file.name}`,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: "application/zip",
  })
  
  await s3Client.send(command)
  
  const fileUrl = `https://petrobras-uploads.s3.amazonaws.com/uploads/${file.name}`
  
  return Response.json({ url: fileUrl })
}
```

2. **Salvar URL no DynamoDB:**

```python
# back-end/python/services/upload_service.py
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Uploads')

table.put_item(
    Item={
        'upload_id': 'upload-123',
        'file_name': 'documentos.zip',
        'file_url': 'https://s3.amazonaws.com/...',  # URL do S3
        'file_type': 'ZIP',
        'file_size': '45.2 MB',
    }
)
```

3. **Visualizar no Frontend:**

O componente `ZipViewerModal` já está preparado para ler de URLs públicas ou blobs!

---

## Como Funciona Tecnicamente?

### 1. Quando você clica na lupa:

```typescript
<Button onClick={() => handleOpenZipViewer(
  file.name,           // Nome do arquivo
  file.url,            // URL do ZIP (pode ser /public ou S3)
  mockZipBlob          // Blob opcional (se criado em memória)
)}>
  <Search /> Ver Conteúdo
</Button>
```

### 2. O modal recebe os dados:

```typescript
function ZipViewerModal({ fileName, fileUrl, fileBlob }) {
  // Prioridade: fileBlob > fileUrl
  
  if (fileBlob) {
    // Usa o blob diretamente (mais rápido)
    const zip = await JSZip.loadAsync(fileBlob)
  } else if (fileUrl) {
    // Faz fetch da URL e carrega
    const response = await fetch(fileUrl)
    const blob = await response.blob()
    const zip = await JSZip.loadAsync(blob)
  }
}
```

### 3. JSZip extrai a lista de arquivos:

```typescript
const zipFiles = []

zip.forEach((relativePath, zipEntry) => {
  zipFiles.push({
    name: zipEntry.name,
    size: zipEntry._data.uncompressedSize,
    isFolder: zipEntry.dir,
    path: relativePath
  })
})
```

### 4. Modal renderiza a lista:

```tsx
{zipFiles.map(file => (
  <div>
    <FileText /> {file.name} - {file.size} KB
  </div>
))}
```

---

## Exemplos Práticos

### Exemplo 1: ZIP com Documentos Petrobras

```bash
# Estrutura do ZIP
documentos-petrobras.zip
├── contratos/
│   ├── contrato_fornecedor_2024.pdf
│   └── termo_aditivo.pdf
├── relatorios/
│   ├── relatorio_anual_2023.pdf
│   └── analise_financeira.xlsx
└── README.txt
```

Coloque em `public/demo-files/documentos-petrobras.zip` e use:

```typescript
files: [{
  name: "documentos-petrobras.zip",
  url: "/demo-files/documentos-petrobras.zip",
  type: "ZIP"
}]
```

### Exemplo 2: ZIP criado dinamicamente

```typescript
async function criarZipPersonalizado() {
  const zip = new JSZip()
  
  // Adicionar PDF (base64)
  zip.file("contrato.pdf", pdfBase64Data, { base64: true })
  
  // Adicionar texto
  zip.file("README.txt", "Instruções de uso...")
  
  // Adicionar pasta com arquivos
  const pastaImagens = zip.folder("imagens")
  pastaImagens?.file("logo.png", imagemBase64, { base64: true })
  
  const blob = await zip.generateAsync({ type: "blob" })
  return blob
}
```

---

## Troubleshooting

### Problema: "Failed to fetch"

**Causa:** O arquivo não está acessível publicamente

**Solução:**
- Verifique se o arquivo está em `public/`
- Ou se a URL do S3 está pública
- Verifique CORS no S3:

```json
{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET"],
  "AllowedHeaders": ["*"]
}
```

### Problema: "Invalid ZIP file"

**Causa:** O arquivo não é um ZIP válido

**Solução:**
- Verifique se o arquivo está corrompido
- Recrie o ZIP usando ferramentas padrão (WinRAR, 7-Zip)
- Teste se abre no Windows Explorer

### Problema: Modal vazio

**Causa:** JSZip não conseguiu ler o arquivo

**Solução:**
- Abra o console do navegador (F12)
- Procure por erros com `[v0]`
- Verifique se o arquivo tem conteúdo: `file.size > 0`

---

## Resumo

✅ **Opção 1 (Recomendado para Demo):** Coloque ZIP em `public/demo-files/`  
✅ **Opção 2 (Testes):** Use `create-mock-zip.ts` para criar ZIPs fictícios  
✅ **Opção 3 (Produção):** Upload para S3 + DynamoDB  

O sistema está **100% preparado** para ler arquivos ZIP reais! Basta fornecer a URL ou Blob. 🚀
