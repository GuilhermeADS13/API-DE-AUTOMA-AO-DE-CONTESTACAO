"""Scraper do portal de Jurisprudencia Consolidada do STJ (SCON).

Portal publico: https://scon.stj.jus.br/SCON/
Pesquisa por palavras-chave (frase, operadores booleanos, filtros de data).
Cada resultado tem ementa estruturada + processo + relator + data julgamento.

Estrategia:
- requests + BeautifulSoup (HTML estatico, dispensa Playwright em IP residencial)
- Visita HOME pra cookies de sessao antes da busca
- Rate limit 2s entre paginas
- User-Agent mimicando Chrome 120
- Parser via seletores CSS estaveis do template do STJ
- Falha de parse de UM item nao derruba o lote (log warning + skip)

WAF do STJ — em IP de datacenter mesmo curl_cffi nao basta:
  O portal SCON tem WAF (provavelmente Cloudflare com JS challenge ou
  Imperva) que retorna 403 mesmo com TLS fingerprint Chrome via
  curl_cffi (impersonate=chrome120). Em IP residencial, o impersonate
  geralmente passa; em datacenter (AWS/Hetzner/GCP), o WAF parece checar
  reputacao do IP alem do fingerprint.

  Mitigacao definitiva (PR20):
  - Playwright headless: carrega Chromium real, resolve JS challenge.
    +150MB instalado, +30-60s por scraping (vs <1s do curl).
  - Alternativa: rodar este script localmente no notebook do dev
    (IP residencial passa o curl_cffi sem problema).

  Por que mantemos curl_cffi:
  - Outros tribunais (TJ-PE, TST) podem nao ter WAF tao agressivo
  - IPs residenciais (notebook do dev) funcionam
  - Fallback gracioso pro requests puro nao quebra testes

Outras limitacoes:
- Resultados acima de 100 paginadas viram captcha. Cap rigido em max=50
- Layout do portal as vezes muda em manutencoes — fixture HTML salva no repo
  + test_parse_html_fixture detecta regressao
"""

from __future__ import annotations

import logging
import re
import time
from datetime import datetime
from typing import Any

# curl_cffi mimica TLS fingerprint (JA3) do Chrome real — necessario porque
# o WAF do STJ identifica clientes Python pelo TLS handshake e retorna 403.
# Fallback pra requests so se curl_cffi nao estiver instalado (dev/testes).
try:
    from curl_cffi import requests as cffi_requests
    _HAS_CURL_CFFI = True
except ImportError:
    cffi_requests = None
    _HAS_CURL_CFFI = False

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class STJScraper:
    """Coleta acordaos do STJ via pesquisa em scon.stj.jus.br."""

    BASE_URL = "https://scon.stj.jus.br/SCON/pesquisar.jsp"
    HOME_URL = "https://scon.stj.jus.br/SCON/"
    RATE_LIMIT_SEC = 2.0
    # User-Agent realista (Chrome moderno). Portal STJ bloqueia bots
    # explicitos via WAF. Mantemos rate limit conservador (2s) por etica.
    USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
    TIMEOUT_SEC = 15
    TRIBUNAL = "STJ"
    PESO_DEFAULT_REPETITIVO = 8
    PESO_DEFAULT_ACORDAO = 5

    def __init__(self) -> None:
        # Prefere curl_cffi (impersonate Chrome) pra burlar WAF. Fallback
        # pra requests so quando curl_cffi nao esta disponivel (testes
        # unitarios podem mockar a sessao via monkeypatch).
        if _HAS_CURL_CFFI:
            self.session = cffi_requests.Session(impersonate="chrome120")
            logger.info("STJ scraper: usando curl_cffi (impersonate=chrome120)")
        else:
            self.session = requests.Session()
            logger.warning(
                "STJ scraper: curl_cffi nao instalado, caindo em requests "
                "(provavel 403 pelo WAF do portal)"
            )
        self.session.headers.update({
            "User-Agent": self.USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        })
        self._last_request_ts: float = 0.0
        self._cookies_obtidos: bool = False

    def buscar(self, query: str, *, max_resultados: int = 20) -> list[dict[str, Any]]:
        """Pesquisa por `query` no portal e retorna lista de acordaos.

        `max_resultados` cap em 50 (alem disso o portal retorna captcha).
        """
        if not query or not query.strip():
            return []
        max_resultados = max(1, min(int(max_resultados), 50))

        logger.info("STJ scraper: query=%r max=%d", query, max_resultados)
        try:
            html = self._fetch_pagina(query)
        except Exception as err:  # noqa: BLE001 — curl_cffi vs requests
            logger.error("STJ scraper: HTTP falhou: %s", err)
            return []

        if self._detectou_captcha(html):
            logger.warning(
                "STJ scraper: CAPTCHA detectado. Aguardar 5-10min antes de "
                "rodar de novo. Considere reduzir --max"
            )
            return []

        acordaos = self._parse_pagina_resultados(html)
        return acordaos[:max_resultados]

    # ─────────────────────────── Internos ────────────────────────────────

    def _rate_limit_aguardar(self) -> None:
        """Garante intervalo de RATE_LIMIT_SEC entre requests."""
        agora = time.time()
        delta = agora - self._last_request_ts
        if delta < self.RATE_LIMIT_SEC:
            time.sleep(self.RATE_LIMIT_SEC - delta)
        self._last_request_ts = time.time()

    def _garantir_cookies_sessao(self) -> None:
        """Visita a home do SCON pra obter cookies de sessao antes da busca.

        Portal STJ retorna 403 quando bate direto em pesquisar.jsp sem ter
        passado pelo SCON/ primeiro (WAF detecta scraper bruto).
        Captura Exception generica porque curl_cffi tem hierarquia de
        excecoes diferente de requests.
        """
        if self._cookies_obtidos:
            return
        try:
            self._rate_limit_aguardar()
            resp = self.session.get(self.HOME_URL, timeout=self.TIMEOUT_SEC)
            resp.raise_for_status()
            self._cookies_obtidos = True
        except Exception as err:  # noqa: BLE001 — fallback amplo (curl_cffi vs requests)
            logger.warning("Falha ao obter cookies de sessao STJ: %s", err)

    def _fetch_pagina(self, query: str) -> str:
        """GET ao portal com query params do form de pesquisa.

        Faz visita previa ao SCON/ pra cookies de sessao (mitiga 403 WAF).
        Adiciona Referer apontando pra home (signals tipico de navegacao real).
        """
        self._garantir_cookies_sessao()
        self._rate_limit_aguardar()
        params = {
            "operador": "e",
            "b": "ACOR",          # busca em ACOR (acordaos consolidados)
            "thesaurus": "JURIDICO",
            "p": "true",
            "tp": "T",
            "processo": "",
            "ministro": "",
            "orgaoJulg": "",
            "pesquisaInicialAvancada": query,
        }
        resp = self.session.get(
            self.BASE_URL,
            params=params,
            timeout=self.TIMEOUT_SEC,
            headers={"Referer": self.HOME_URL},
        )
        resp.raise_for_status()
        return resp.text

    @staticmethod
    def _detectou_captcha(html: str) -> bool:
        """Heuristica simples: STJ inclui 'captcha' ou 'reCAPTCHA' no HTML
        quando bloqueia."""
        baixo = html.lower()
        return "captcha" in baixo or "recaptcha" in baixo

    def _parse_pagina_resultados(self, html: str) -> list[dict[str, Any]]:
        """Extrai metadados dos resultados.

        Seletores estaveis do template STJ (validados em jun/2026):
        - div.documento — wrapper de cada acordao
          - div.paragrafoBRS:has(.docTitulo:contains('Processo')) — numero
          - div.paragrafoBRS:has(.docTitulo:contains('Relator')) — relator
          - div.paragrafoBRS:has(.docTitulo:contains('Data do Julgamento')) — data
          - div.paragrafoBRS:has(.docTitulo:contains('Ementa')) — ementa
        """
        soup = BeautifulSoup(html, "lxml")
        documentos = soup.select("div.documento")
        if not documentos:
            logger.warning(
                "STJ scraper: nenhum div.documento encontrado — layout pode ter mudado"
            )
            return []

        acordaos: list[dict[str, Any]] = []
        for doc in documentos:
            try:
                acordao = self._parse_documento(doc)
                if acordao:
                    acordaos.append(acordao)
            except Exception as err:  # noqa: BLE001 — parse de UM nao derruba lote
                logger.warning("STJ scraper: skip documento por erro de parse: %s", err)
                continue
        return acordaos

    def _parse_documento(self, doc: Any) -> dict[str, Any] | None:
        """Extrai um acordao do div.documento. Retorna None se invalido."""
        numero_processo = self._extrair_campo(doc, "Processo")
        ementa = self._extrair_campo(doc, "Ementa")
        relator = self._extrair_campo(doc, "Relator")
        data_raw = self._extrair_campo(doc, "Data do Julgamento")

        if not numero_processo or not ementa:
            return None

        data_iso = self._normalizar_data(data_raw) if data_raw else None
        tipo, peso = self._inferir_tipo_e_peso(numero_processo, ementa)

        # tese_firmada: STJ as vezes inclui linha 'TESE FIRMADA' no fim da ementa
        tese_firmada = self._extrair_tese(ementa)

        # fonte_url: linka pra documento individual via processo (sem ID interno)
        fonte_url = (
            "https://scon.stj.jus.br/SCON/pesquisar.jsp?"
            f"pesquisaInicialAvancada={requests.utils.quote(numero_processo)}"
        )

        return {
            "tribunal": self.TRIBUNAL,
            "tipo_decisao": tipo,
            "numero_processo": numero_processo,
            "relator": relator,
            "data_julgamento": data_iso,
            "ementa": ementa.strip(),
            "tese_firmada": tese_firmada,
            "fonte_url": fonte_url,
            "peso_relevancia_sugerido": peso,
        }

    @staticmethod
    def _extrair_campo(doc: Any, titulo: str) -> str | None:
        """Extrai conteudo de div.paragrafoBRS cujo span.docTitulo tem texto
        contendo `titulo` (ex: 'Processo', 'Ementa')."""
        for paragrafo in doc.select("div.paragrafoBRS"):
            tit = paragrafo.select_one(".docTitulo")
            if not tit:
                continue
            if titulo.lower() not in tit.get_text(strip=True).lower():
                continue
            # Conteudo eh o(s) elemento(s) apos o titulo
            conteudo = paragrafo.select_one(".docTexto")
            if conteudo:
                return conteudo.get_text(" ", strip=True)
            # Fallback: texto do paragrafo sem o titulo
            texto = paragrafo.get_text(" ", strip=True)
            return texto.replace(tit.get_text(strip=True), "", 1).strip(": ").strip()
        return None

    @staticmethod
    def _normalizar_data(raw: str) -> str | None:
        """Converte 'DD/MM/AAAA' em ISO 'YYYY-MM-DD'. Retorna None se invalida."""
        m = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", raw)
        if not m:
            return None
        try:
            dt = datetime(int(m.group(3)), int(m.group(2)), int(m.group(1)))
            return dt.date().isoformat()
        except ValueError:
            return None

    def _inferir_tipo_e_peso(self, numero: str, ementa: str) -> tuple[str, int]:
        """Inferencia leve: REPETITIVO no texto -> tipo 'Repetitivo' peso 8.
        Caso contrario tipo 'Acordao' peso 5."""
        upper = (numero + " " + ementa).upper()
        if "RECURSO REPETITIVO" in upper or "TEMA REPETITIVO" in upper:
            return ("Repetitivo", self.PESO_DEFAULT_REPETITIVO)
        return ("Acordao", self.PESO_DEFAULT_ACORDAO)

    @staticmethod
    def _extrair_tese(ementa: str) -> str | None:
        """Se ementa tem 'TESE FIRMADA: ...' ou 'TESE: ...' no fim, extrai."""
        m = re.search(
            r"(?:TESE\s+FIRMADA|TESE\s+JURIDICA|TESE)\s*[:\.\-]\s*(.+?)(?:\Z|\n\n)",
            ementa, re.IGNORECASE | re.DOTALL,
        )
        if not m:
            return None
        return m.group(1).strip()[:1500]
