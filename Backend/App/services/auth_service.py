import base64
import hashlib
import hmac
import os

PBKDF2_ALGORITHM = "sha256"
PBKDF2_ITERATIONS = 120_000
SALT_BYTES = 16


def hash_password(password: str) -> str:
    salt = os.urandom(SALT_BYTES)
    digest = hashlib.pbkdf2_hmac(
        PBKDF2_ALGORITHM,
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    encoded_salt = base64.b64encode(salt).decode("utf-8")
    encoded_digest = base64.b64encode(digest).decode("utf-8")
    return f"pbkdf2_{PBKDF2_ALGORITHM}${PBKDF2_ITERATIONS}${encoded_salt}${encoded_digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations_str, encoded_salt, encoded_digest = stored_hash.split("$", 3)
        if algorithm != f"pbkdf2_{PBKDF2_ALGORITHM}":
            return False

        iterations = int(iterations_str)
        salt = base64.b64decode(encoded_salt.encode("utf-8"))
        expected_digest = base64.b64decode(encoded_digest.encode("utf-8"))
    except (ValueError, TypeError):
        return False

    actual_digest = hashlib.pbkdf2_hmac(
        PBKDF2_ALGORITHM,
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(actual_digest, expected_digest)
