# Documentação de Teste de Bucket S3 via AWS CLI

## 1. Objetivo

Validar o acesso e as operações básicas (upload, listagem, consulta e remoção de objetos) em um bucket S3 utilizando autenticação via SSO (IAM Identity Center) e AWS CLI. O teste será automatizado por meio do arquivo `S3_check.py`.

## 2. Pré-requisitos

- AWS CLI instalado  
- Permissão para autenticação via SSO (IAM Identity Center)  
- Python 3.x instalado  
- Bibliotecas boto3 e botocore instaladas (`pip install boto3 botocore`)

## 3. Configuração do AWS CLI com SSO

Conforme a [documentação oficial da AWS](https://docs.aws.amazon.com/pt_br/cli/latest/userguide/cli-configure-sso.html):

1. No terminal, execute o comando abaixo para iniciar a configuração do SSO:
    ```
    aws configure sso
    ```
2. Preencha os campos solicitados:
    - **SSO session name (Recommended):** my-sso
    - **SSO start URL [None]:** https://petrobrasbr.awsapps.com/start/#
    - **SSO region [None]:** us-east-1
    - **SSO registration scopes [None]:** sso:account:access

3. Recomenda-se criar um nome para o profile, especialmente se você utiliza múltiplas contas (ex: DSV, HMG, TST).

4. Para autenticar, utilize:
    ```
    aws sso login --profile nprd
    ```

## 4. Teste de acesso ao bucket S3

Utilize o arquivo `S3_check.py` para validar o acesso e as operações no bucket. O script realiza as seguintes validações:

1. Verifica a identidade autenticada (conta e ARN)
2. Garante a existência do arquivo local para upload
3. Realiza upload do arquivo para o bucket
4. Lista objetos no prefixo especificado
5. Valida existência e acesso ao objeto enviado
6. Remove o arquivo do bucket

## 5. Observações

- Altere os valores de `PROFILE`, `REGION`, `BUCKET`, `KEY` e `LOCALFILE` conforme sua necessidade no arquivo `S3_check.py`.
- Caso ocorra algum erro, verifique as permissões do usuário, as configurações do SSO e as políticas do bucket S3.