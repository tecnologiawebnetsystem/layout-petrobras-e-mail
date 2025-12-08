# Validação de Segurança de Arquivos

## Sistema de Detecção de Extensões Bloqueadas em Arquivos ZIP

O sistema agora possui validação automática de arquivos ZIP para detectar extensões perigosas que possam representar riscos de segurança.

### Como Funciona

Quando um usuário faz upload de um arquivo ZIP, o sistema:

1. **Detecta automaticamente** que o arquivo é do tipo ZIP
2. **Analisa o conteúdo** sem extrair os arquivos
3. **Verifica todas as extensões** dos arquivos internos
4. **Bloqueia o upload** se encontrar extensões perigosas
5. **Exibe uma modal detalhada** mostrando quais arquivos foram bloqueados

### Extensões Bloqueadas

#### Executáveis
- `.exe`, `.bat`, `.cmd`, `.com`, `.msi`, `.scr`, `.vbs`, `.ps1`
- `.app`, `.deb`, `.rpm`

#### Scripts
- `.sh`, `.bash`, `.js`, `.py`, `.rb`, `.pl`, `.php`

#### Bibliotecas
- `.dll`, `.so`, `.dylib`

#### Outros
- `.jar`, `.apk`, `.ipa`

### Experiência do Usuário

#### Durante o Upload
- Indicador visual "Validando arquivos..." aparece
- Ícone de escudo animado mostra que a validação está em andamento
- Upload fica bloqueado até a validação terminar

#### Se Arquivos Bloqueados Forem Detectados
- Modal vermelha de alerta aparece
- Lista completa dos arquivos bloqueados é exibida
- Extensão e categoria de cada arquivo são mostrados
- Upload é cancelado automaticamente
- Usuário recebe orientações claras sobre o que fazer

#### Se Validação Passar
- Arquivos são aceitos normalmente
- Upload continua com animação de progresso
- Badge verde "Pronto" aparece quando concluído

### Limitações Atuais

1. **Apenas ZIP**: Validação funciona apenas para arquivos `.zip`
2. **Arquivos com senha**: Não consegue inspecionar ZIPs protegidos por senha
3. **Frontend only**: Validação ocorre no navegador (pode ser burlada por usuários técnicos)

### Recomendações para Produção

Para um sistema corporativo completo, recomenda-se adicionar:

1. **Validação backend**: Antivírus (ClamAV) no servidor
2. **Suporte a mais formatos**: RAR, 7Z, TAR.GZ
3. **Scanner de malware**: Análise de assinatura de vírus
4. **Quarentena**: Sistema de quarentena para arquivos suspeitos
5. **Auditoria**: Log de todas as tentativas de upload de arquivos bloqueados

### Demonstração

Para testar a validação:

1. Crie um arquivo ZIP contendo um arquivo `.exe` ou `.bat`
2. Tente fazer upload na página de Upload
3. O sistema detectará e bloqueará automaticamente
4. Uma modal aparecerá listando os arquivos problemáticos

### Configuração

As extensões bloqueadas podem ser configuradas editando o arquivo:
\`\`\`
lib/utils/zip-validator.ts
\`\`\`

Modifique o objeto `BLOCKED_EXTENSIONS` para adicionar ou remover extensões.
