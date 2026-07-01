"""Notificador humano-in-the-loop para CAPTCHAs impossiveis (PR28).

Ultima etapa da cascade do captcha_orchestrator. Quando CRNN e cookies session
nao resolvem (tipico caso: Cloudflare Turnstile em datacenter, reCAPTCHA v2
image grid), envia notificacao pro dev/admin resolver manualmente.

Canais suportados (probe por env):
  1. Telegram (se TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID setados)
     - Push instantaneo no celular via Telegram bot
     - Envia imagem + URL de resposta
  2. Email SMTP (fallback default; reusa `SUPPORT_SMTP_*` do projeto)
     - Assunto claro, corpo com URL de resposta + attachment da imagem

Se nenhum canal configurado, funcao retorna False + log warning. Chamador
decide se aborta ou continua com fallback estatico.
"""

from __future__ import annotations

import logging
import os
import smtplib
from email.message import EmailMessage
from pathlib import Path
from typing import Optional

import requests

logger = logging.getLogger(__name__)

_TELEGRAM_TIMEOUT_SEC = 10
_SMTP_TIMEOUT_SEC = 15


def _base_url() -> str:
    """URL base do backend pra montar link de resposta no email/telegram.

    Usa BACKEND_PUBLIC_URL se setado (produção), senao localhost (dev).
    """
    return os.getenv("BACKEND_PUBLIC_URL", "http://localhost:8000").rstrip("/")


def _enviar_telegram(
    *,
    token: str,
    chat_id: str,
    caption: str,
    image_bytes: bytes | None,
    answer_url: str,
) -> bool:
    """Envia foto do CAPTCHA + caption via Telegram Bot API.

    Retorna True se HTTP 200. Falha silenciosa em qualquer erro (chamador
    tenta proximo canal).
    """
    try:
        if image_bytes:
            resp = requests.post(
                f"https://api.telegram.org/bot{token}/sendPhoto",
                data={
                    "chat_id": chat_id,
                    "caption": f"{caption}\n\nResponder em: {answer_url}",
                },
                files={"photo": ("captcha.png", image_bytes, "image/png")},
                timeout=_TELEGRAM_TIMEOUT_SEC,
            )
        else:
            # Sem imagem — Turnstile/reCAPTCHA nao tem sprite pra enviar
            resp = requests.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                data={
                    "chat_id": chat_id,
                    "text": f"{caption}\n\nResponder em: {answer_url}",
                },
                timeout=_TELEGRAM_TIMEOUT_SEC,
            )
        if resp.ok:
            return True
        logger.warning(
            "Telegram HTTP %d: %s", resp.status_code, resp.text[:200],
        )
    except requests.RequestException as err:
        logger.warning("Telegram falhou: %s", err)
    return False


def _enviar_email(
    *,
    caption: str,
    image_bytes: bytes | None,
    answer_url: str,
) -> bool:
    """Envia notificacao por email SMTP. Reusa config `SUPPORT_SMTP_*`.

    Retorna True se enviou; False se config ausente ou erro SMTP.
    """
    host = os.getenv("SUPPORT_SMTP_HOST", "").strip()
    to_email = os.getenv("CAPTCHA_NOTIFY_EMAIL", os.getenv("SUPPORT_EMAIL_TO", "")).strip()
    if not host or not to_email:
        return False

    user = os.getenv("SUPPORT_SMTP_USER", "").strip()
    password = os.getenv("SUPPORT_SMTP_PASSWORD", "").strip()
    from_email = os.getenv("SUPPORT_EMAIL_FROM", user).strip() or user
    use_tls = os.getenv("SUPPORT_SMTP_STARTTLS", "true").lower() in {"1", "true", "yes"}
    use_ssl = os.getenv("SUPPORT_SMTP_SSL", "false").lower() in {"1", "true", "yes"}
    try:
        port = int(os.getenv("SUPPORT_SMTP_PORT", "587").strip())
    except ValueError:
        port = 587

    if not from_email:
        logger.warning("SMTP config incompleta pra notificar CAPTCHA")
        return False

    msg = EmailMessage()
    msg["Subject"] = "[JurisFlow][CAPTCHA] Intervencao humana necessaria"
    msg["From"] = from_email
    msg["To"] = to_email
    msg.set_content(
        f"Um CAPTCHA nao pode ser resolvido automaticamente pelo scraper.\n\n"
        f"{caption}\n\n"
        f"Abra o link abaixo pra digitar a resposta:\n"
        f"{answer_url}\n\n"
        f"Timeout: 10 minutos. Apos isso, o scraper aborta o request atual.\n"
    )
    if image_bytes:
        msg.add_attachment(
            image_bytes, maintype="image", subtype="png", filename="captcha.png",
        )

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(host, port, timeout=_SMTP_TIMEOUT_SEC) as smtp:
                if user:
                    smtp.login(user, password)
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=_SMTP_TIMEOUT_SEC) as smtp:
                if use_tls:
                    smtp.starttls()
                if user:
                    smtp.login(user, password)
                smtp.send_message(msg)
        return True
    except (smtplib.SMTPException, OSError) as err:
        logger.warning("SMTP CAPTCHA notify falhou: %s", err)
        return False


def notificar_humano(
    *,
    token_pending: str,
    tipo_captcha: str,
    tribunal: Optional[str] = None,
    image_bytes: Optional[bytes] = None,
) -> bool:
    """Notifica humano por Telegram (se configurado) OU email SMTP.

    Args:
        token_pending: token unico da tarefa pending; entra na URL de resposta.
        tipo_captcha: 'visual' | 'turnstile' | 'recaptcha_v2' | 'hcaptcha' | 'desconhecido'.
        tribunal: sigla do tribunal (STJ/TJ-PE/...) quando aplicavel.
        image_bytes: PNG do CAPTCHA (visual) ou None (Turnstile invisivel).

    Retorna True se pelo menos 1 canal enviou. False se nenhum configurado
    OU todos falharam.
    """
    answer_url = f"{_base_url()}/captcha/responder/{token_pending}"
    caption = (
        f"CAPTCHA aguardando resposta.\n"
        f"Tipo: {tipo_captcha}\n"
        f"Tribunal: {tribunal or '?'}"
    )

    # Telegram primeiro (push instantaneo)
    tg_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    tg_chat = os.getenv("TELEGRAM_CHAT_ID", "").strip()
    if tg_token and tg_chat:
        if _enviar_telegram(
            token=tg_token, chat_id=tg_chat,
            caption=caption, image_bytes=image_bytes, answer_url=answer_url,
        ):
            logger.info("CAPTCHA pending %s notificado via Telegram", token_pending)
            return True
        # Se Telegram configurado mas falhou, cai pra email

    if _enviar_email(
        caption=caption, image_bytes=image_bytes, answer_url=answer_url,
    ):
        logger.info("CAPTCHA pending %s notificado via email SMTP", token_pending)
        return True

    logger.warning(
        "CAPTCHA pending %s SEM canal de notificacao configurado. "
        "Setar TELEGRAM_BOT_TOKEN+TELEGRAM_CHAT_ID ou SUPPORT_SMTP_*.",
        token_pending,
    )
    return False
