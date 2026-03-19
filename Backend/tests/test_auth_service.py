"""Testes unitarios das funcoes de hash de senha."""

from App.services.auth_service import hash_password, verify_password


def test_hash_and_verify_password():
    """Valida fluxo feliz e negativo de verificacao de senha."""
    password = "Senha@123"
    hashed = hash_password(password)

    assert isinstance(hashed, str)
    assert hashed.startswith("pbkdf2_sha256$")
    assert verify_password(password, hashed) is True
    assert verify_password("senha_errada", hashed) is False
