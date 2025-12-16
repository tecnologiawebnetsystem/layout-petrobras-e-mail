
from sqlmodel import SQLModel
from pydantic import EmailStr
from datetime import datetime
from enum import Enum


class TipoUsuario(str, Enum):
    EXTERNO = "externo"
    INTERNO = "interno"
    SUPERVISOR = "supervisor"

# Entrada (POST /usuarios)


class UsuarioCreate(SQLModel):
    nome_completo: str
    email: EmailStr
    tipo: TipoUsuario

# Saída (GET /usuarios, POST /usuarios)


class UsuarioRead(SQLModel):
    id: int
    nome_completo: str
    email: EmailStr
    tipo: TipoUsuario
    ativo: bool
    criado_em: datetime

# Atualização (PATCH/PUT /usuarios/{id})


class UsuarioUpdate(SQLModel):
    nome_completo: str | None = None
    email: EmailStr | None = None
    tipo: TipoUsuario | None = None
    ativo: bool | None = None
