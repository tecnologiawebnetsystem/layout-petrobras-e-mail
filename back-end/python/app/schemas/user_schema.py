from sqlmodel import SQLModel
from pydantic import EmailStr
from datetime import datetime
from app.models.user import TypeUser


# Entrada (POST /usuarios)
class UserCreate(SQLModel):
    name: str
    email: EmailStr
    type: TypeUser


# Saída (GET /usuarios, POST /usuarios)
class UserRead(SQLModel):
    id: int
    name: str
    email: EmailStr
    type: TypeUser
    status: bool
    created_at: datetime


# Atualização (PATCH/PUT /usuarios/{id})
class UserUpdate(SQLModel):
    name: str | None = None
    email: EmailStr | None = None
    type: TypeUser | None = None
    status: bool | None = None
