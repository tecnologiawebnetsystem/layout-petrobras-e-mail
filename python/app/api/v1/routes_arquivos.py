
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlmodel import Session, select
from pathlib import Path
from datetime import datetime
from app.db.session import get_session
from app.models.arquivo import Arquivo
from app.models.area import AreaCompartilhamento
from app.schemas.arquivo_schema import ArquivoCreate, ArquivoRead
from app.core.aws_utils import generate_presigned_upload, generate_presigned_download
from app.services.audit_service import log_event
from app.core.config import settings

router = APIRouter(prefix="/arquivos", tags=["Arquivos"])

STORAGE_ROOT = Path("./storage")  # armazenamento local para dev
STORAGE_ROOT.mkdir(exist_ok=True)

@router.post("/", response_model=ArquivoRead, status_code=status.HTTP_201_CREATED)
def create_metadata(payload: ArquivoCreate, session: Session = Depends(get_session), request: Request = None):
    # valida área
    area = session.get(AreaCompartilhamento, payload.area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Área não encontrada.")

    arq = Arquivo(
        area_id=payload.area_id,
        nome_arquivo=payload.nome_arquivo,
        chave_s3=payload.chave_s3,  # no dev pode ser um caminho lógico
        tamanho_bytes=payload.tamanho_bytes,
        mime_type=payload.mime_type,
        checksum=payload.checksum,
        upload_por_id=payload.upload_por_id, # Identificação do usuário que fez o upload do arquivo (usuário interno petro)
        expira_em=payload.expira_em, # Campo extra caso no futuro a gente evolua na aplicação para validação tb ser por arquivo (caso muito provavel que não exista)
        ativo=True
    )
    session.add(arq)
    session.commit()
    session.refresh(arq)

    log_event(
        session=session,
        evento="CRIAR_METADATA_ARQUIVO",
        usuario_id=payload.upload_por_id,
        arquivo_id=arq.id,
        detalhe=f"area_id={payload.area_id} nome={payload.nome_arquivo}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    return arq

@router.get("/", response_model=list[ArquivoRead])
def list_arquivos(area_id: int | None = None, session: Session = Depends(get_session)):
    if area_id:
        return session.exec(select(Arquivo).where(Arquivo.area_id == area_id)).all()
    return session.exec(select(Arquivo)).all()

@router.get("/{arquivo_id}", response_model=ArquivoRead)
def get_arquivo(arquivo_id: int, session: Session = Depends(get_session)):
    arq = session.get(Arquivo, arquivo_id)
    if not arq:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    return arq

# Upload LOCAL (sem AWS): grava arquivo no disco e atualiza tamanho/mime
@router.post("/upload-local", response_model=ArquivoRead, status_code=status.HTTP_201_CREATED)
def upload_local(
    area_id: int,
    nome_arquivo: str,
    file: UploadFile = File(...),
    upload_por_id: int | None = None,
    session: Session = Depends(get_session),
    request: Request = None
):
    area = session.get(AreaCompartilhamento, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Área não encontrada.")

    # Caminho local: storage/areas/<prefixo>/nome_arquivo
    area_path = STORAGE_ROOT / area.prefixo_s3
    area_path.mkdir(parents=True, exist_ok=True)
    dest = area_path / nome_arquivo

    with dest.open("wb") as f:
        f.write(file.file.read())

    arq = Arquivo(
        area_id=area_id,
        nome_arquivo=nome_arquivo,
        chave_s3=str(dest),  # no dev guardamos path local
        tamanho_bytes=dest.stat().st_size,
        mime_type=file.content_type,
        upload_por_id=upload_por_id,
        ativo=True
    )
    session.add(arq)
    session.commit()
    session.refresh(arq)

    log_event(
        session=session,
        evento="UPLOAD_LOCAL",
        usuario_id=upload_por_id,
        arquivo_id=arq.id,
        detalhe=f"path={dest}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return arq

# Presigned (mock) para PUT — cliente faz upload direto (futuro S3)
@router.get("/{arquivo_id}/presigned-upload")
def presigned_upload(arquivo_id: int, expires_in: int = 600, session: Session = Depends(get_session), request: Request = None):
    arq = session.get(Arquivo, arquivo_id)
    if not arq:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    url = generate_presigned_upload(arq.chave_s3, expires_in)

    log_event(
        session=session,
        evento="PRESIGNED_UPLOAD",
        usuario_id=arq.upload_por_id,
        arquivo_id=arquivo_id,
        detalhe=f"expires_in={expires_in}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    return {"url": url, "expires_in": expires_in}

# Presigned (mock) para GET — interno baixar (útil para testes)
@router.get("/{arquivo_id}/presigned-download")
def presigned_download(arquivo_id: int, expires_in: int = 300, session: Session = Depends(get_session), request: Request = None):
    arq = session.get(Arquivo, arquivo_id)
    if not arq:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    url = generate_presigned_download(arq.chave_s3, expires_in)

    log_event(
        session=session,
        evento="PRESIGNED_DOWNLOAD",
        usuario_id=arq.upload_por_id,
        arquivo_id=arquivo_id,
        detalhe=f"expires_in={expires_in}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    return {"url": url, "expires_in": expires_in}

# Precisa remover o arquivo, mas não necessariamente o registro do cadastro do mesmo
# @router.delete("/{arquivo_id}", status_code=status.HTTP_204_NO_CONTENT)
# def remove_arquivo(arquivo_id: int, session: Session = Depends(get_session), request: Request = None):
#     arq = session.get(Arquivo, arquivo_id)
#     if not arq:
#         raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
#     arq.ativo = False
#     session.add(arq)
#     session.commit()

#     log_event(
#         session=session,
#         evento="REMOVER_ARQUIVO",
#         arquivo_id=arquivo_id,
#         detalhe="status=REMOVIDO",
#         ip=request.client.host if request else None,
#         user_agent=request.headers.get("User-Agent") if request else None
#     )
#     return
