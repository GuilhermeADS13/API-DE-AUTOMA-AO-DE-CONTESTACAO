import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$", re.IGNORECASE)


def normalizar_email(email: str) -> str:
    return email.strip().lower()


def senha_forte(senha: str) -> bool:
    if any(char.isspace() for char in senha):
        return False
    if not any(char.isupper() for char in senha):
        return False
    if not any(char.islower() for char in senha):
        return False
    if not any(char.isdigit() for char in senha):
        return False
    if not any(not char.isalnum() for char in senha):
        return False
    return True


class Usuario(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str = Field(..., min_length=1, max_length=64)
    nome: str = Field(..., min_length=3, max_length=120, alias="name")
    email: str = Field(..., min_length=6, max_length=254)
    senha: str = Field(..., min_length=8, max_length=12, alias="password")

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, value: str) -> str:
        nome = value.strip()
        if len(nome) < 3:
            raise ValueError("Informe um nome valido com ao menos 3 caracteres.")
        return nome

    @field_validator("email")
    @classmethod
    def validar_email(cls, value: str) -> str:
        email = normalizar_email(value)
        if not EMAIL_REGEX.fullmatch(email):
            raise ValueError("Informe um e-mail valido.")
        return email

    @field_validator("senha")
    @classmethod
    def validar_senha(cls, value: str) -> str:
        senha = value.strip()
        if not senha_forte(senha):
            raise ValueError(
                "A senha deve ter 8-12 caracteres, com maiuscula, minuscula, numero e simbolo."
            )
        return senha

    @field_validator("id")
    @classmethod
    def validar_id(cls, value: str) -> str:
        identifier = value.strip()
        if not identifier:
            raise ValueError("Informe um id valido.")
        return identifier


class UsuarioCadastro(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    nome: str = Field(..., min_length=3, max_length=120, alias="name")
    email: str = Field(..., min_length=6, max_length=254)
    senha: str = Field(..., min_length=8, max_length=12, alias="password")

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, value: str) -> str:
        nome = value.strip()
        if len(nome) < 3:
            raise ValueError("Informe um nome valido com ao menos 3 caracteres.")
        return nome

    @field_validator("email")
    @classmethod
    def validar_email(cls, value: str) -> str:
        email = normalizar_email(value)
        if not EMAIL_REGEX.fullmatch(email):
            raise ValueError("Informe um e-mail valido.")
        return email

    @field_validator("senha")
    @classmethod
    def validar_senha(cls, value: str) -> str:
        senha = value.strip()
        if not senha_forte(senha):
            raise ValueError(
                "A senha deve ter 8-12 caracteres, com maiuscula, minuscula, numero e simbolo."
            )
        return senha


class UsuarioLogin(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    email: str = Field(..., min_length=6, max_length=254)
    senha: str = Field(..., min_length=1, max_length=128, alias="password")

    @field_validator("email")
    @classmethod
    def validar_email(cls, value: str) -> str:
        email = normalizar_email(value)
        if not EMAIL_REGEX.fullmatch(email):
            raise ValueError("Informe um e-mail valido.")
        return email

    @field_validator("senha")
    @classmethod
    def validar_senha_login(cls, value: str) -> str:
        senha = value.strip()
        if not senha:
            raise ValueError("Informe a senha.")
        return senha


class UsuarioLogout(BaseModel):
    token: str = Field(..., min_length=8, max_length=256)

    @field_validator("token")
    @classmethod
    def validar_token(cls, value: str) -> str:
        token = value.strip()
        if not token:
            raise ValueError("Token de sessao invalido.")
        return token
