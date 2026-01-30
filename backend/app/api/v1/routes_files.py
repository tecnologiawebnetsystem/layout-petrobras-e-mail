
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlmodel import Session, select
from pathlib import Path
from app.db.session import get_session
from app.models.restricted_file import RestrictedFile
from app.models.area import SharedArea
from app.schemas.file_schema import FileCreate, FileRead
from app.core.aws_utils import generate_presigned_upload, generate_presigned_download
from app.services.audit_service import log_event

router = APIRouter(prefix="/files", tags=["Files"])

STORAGE_ROOT = Path("./storage")  # armazenamento local para dev
STORAGE_ROOT.mkdir(exist_ok=True)

@router.post("/", response_model=FileRead, status_code=status.HTTP_201_CREATED)
def create_metadata(payload: FileCreate, session: Session = Depends(get_session), request: Request = None):
    # valida área
    area = session.get(SharedArea, payload.area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Área não encontrada.")

    rfile = RestrictedFile(
        area_id=payload.area_id,
        name=payload.name,
        key_s3=payload.key_s3,  # no dev pode ser um caminho lógico
        size_bytes=payload.size_bytes,
        mime_type=payload.mime_type,
        checksum=payload.checksum,
        upload_id=payload.upload_id, # Identificação do usuário que fez o upload do arquivo (usuário interno petro)
        expires_at=payload.expires_at, # Campo extra caso no futuro a gente evolua na aplicação para validação tb ser por arquivo (caso muito provavel que não exista)
        status=True
    )
    session.add(rfile)
    session.commit()
    session.refresh(rfile)

    log_event(
        session=session,
        action="CRIAR_METADATA_ARQUIVO",
        user_id=payload.upload_id,
        file_id=rfile.id,
        detail=f"area_id={payload.area_id} nome={payload.name}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    return rfile

@router.get("/", response_model=list[FileRead])
def list_files(area_id: int | None = None, session: Session = Depends(get_session)):
    if area_id:
        return session.exec(select(RestrictedFile).where(RestrictedFile.area_id == area_id)).all()
    return session.exec(select(RestrictedFile)).all()

@router.get("/{file_id}", response_model=FileRead)
def get_file(file_id: int, session: Session = Depends(get_session)):
    rfile = session.get(RestrictedFile, file_id)
    if not rfile:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    return rfile

# Upload LOCAL (sem AWS): grava arquivo no disco e atualiza tamanho/mime
@router.post("/upload-local", response_model=FileRead, status_code=status.HTTP_201_CREATED)
def upload_local(
    area_id: int,
    name: str,
    file: UploadFile = File(...),
    upload_id: int | None = None,
    session: Session = Depends(get_session),
    request: Request = None
):
    area = session.get(SharedArea, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Área não encontrada.")

    # Caminho local: storage/areas/<prefixo>/nome_arquivo
    area_path = STORAGE_ROOT / area.prefix_s3
    area_path.mkdir(parents=True, exist_ok=True)
    dest = area_path / name

    with dest.open("wb") as f:
        f.write(file.file.read())

    rfile = RestrictedFile(
        area_id=area_id,
        name=name,
        key_s3=str(dest),  # no dev guardamos path local
        size_bytes=dest.stat().st_size,
        mime_type=file.content_type,
        upload_id=upload_id,
        status=True
    )
    session.add(rfile)
    session.commit()
    session.refresh(rfile)

    log_event(
        session=session,
        action="UPLOAD_LOCAL",
        user_id=upload_id,
        file_id=rfile.id,
        detail=f"path={dest}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return rfile

# Presigned (mock) para PUT — cliente faz upload direto (futuro S3)
@router.get("/{file_id}/presigned-upload")
def presigned_upload(file_id: int, expires_in: int = 600, session: Session = Depends(get_session), request: Request = None):
    rfile = session.get(RestrictedFile, file_id)
    if not rfile:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    url = generate_presigned_upload(rfile.key_s3, expires_in)

    log_event(
        session=session,
        action="PRESIGNED_UPLOAD",
        user_id=rfile.upload_id,
        file_id=file_id,
        detail=f"expires_in={expires_in}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    return {"url": url, "expires_in": expires_in}

# Presigned (mock) para GET — interno baixar (útil para testes)
@router.get("/{file_id}/presigned-download")
def presigned_download(file_id: int, expires_in: int = 300, session: Session = Depends(get_session), request: Request = None):
    rfile = session.get(RestrictedFile, file_id)
    if not rfile:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    url = generate_presigned_download(rfile.key_s3, expires_in)

    log_event(
        session=session,
        action="PRESIGNED_DOWNLOAD",
        user_id=rfile.upload_id,
        file_id=file_id,
        detail=f"expires_in={expires_in}",
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
