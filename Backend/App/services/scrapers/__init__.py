"""PR19 - Scrapers de jurisprudencia de tribunais brasileiros.

Cada modulo eh um scraper independente (STJ, TJ-PE, TST, ...). Todos retornam
list[dict] no mesmo shape: {tribunal, tipo_decisao, numero_processo, relator,
data_julgamento, ementa, tese_firmada, fonte_url, peso_relevancia_sugerido}.

Pra adicionar um novo tribunal:
1. Copiar `stj.py` como template
2. Ajustar BASE_URL + parser HTML
3. Adicionar fixture HTML em `tests/fixtures/` + teste de parser
4. Registrar em `scripts/scrape_jurisprudencia.py` no dispatch por tribunal
"""

from .stj import STJScraper
from .tst import TSTScraper

__all__ = ["STJScraper", "TSTScraper"]
