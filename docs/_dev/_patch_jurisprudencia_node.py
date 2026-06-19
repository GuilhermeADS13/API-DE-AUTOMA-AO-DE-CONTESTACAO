"""Patcha o workflow (PR19): adiciona node 'Buscar Jurisprudencia Aplicavel'
entre 'Buscar Legislacao Aplicavel' e 'Claude Gerador', e injeta o bloco
JURISPRUDENCIA APLICAVEL no USER_MSG do Gerador.

Idempotente: detecta se o node ja existe.

Uso:
    python docs/_dev/_patch_jurisprudencia_node.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

JURISPRUDENCIA_JS = r"""// n8n 2.17.5 JS sandbox shims (process, AbortController, fetch). Tudo em const.
const __AC_INIT = (() => { if (typeof globalThis.AbortController === 'undefined') { globalThis.AbortController = class { constructor() { this.signal = undefined; } abort() {} }; } return true; })();
const __PROC = (() => { try { return process.env || {}; } catch (_) { return {}; } })();
const __HTTP = (() => { try { if ($helpers && $helpers.httpRequest) return $helpers; } catch (_) {} try { if (typeof helpers !== 'undefined' && helpers && helpers.httpRequest) return helpers; } catch (_) {} try { if (this && this.helpers && this.helpers.httpRequest) return this.helpers; } catch (_) {} return null; })();
const __FETCH = async (url, opts) => {
  opts = opts || {};
  const method = opts.method || 'GET';
  const headers = opts.headers || {};
  let body = opts.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { } }
  if (!__HTTP) {
    try { const r = await fetch(url, opts); return r; } catch (_) {}
    throw new Error('http_unavailable');
  }
  try {
    const r = await __HTTP.httpRequest({ url, method, headers, body, json: true, returnFullResponse: true, ignoreHttpStatusErrors: true, timeout: 30000 });
    const status = r.statusCode || r.status || 200;
    const data = (r.body !== undefined) ? r.body : r;
    return { ok: status >= 200 && status < 300, status, json: async () => data, text: async () => (typeof data === 'string' ? data : JSON.stringify(data || {})) };
  } catch (e) {
    const status = e.statusCode || e.status || 500;
    const msg = (e.message || '').slice(0, 500);
    return { ok: false, status, json: async () => ({ error: msg }), text: async () => msg };
  }
};

// PR19 — Buscar Jurisprudencia Aplicavel
// Apos buscar legislacao, busca acordaos paradigma do STJ/TST/STF/TJ que casem
// com a peticao. Injetados verbatim no SYSTEM do Gerador, eliminam alucinacao
// de citacoes processuais (ex: REsp 1.234.567/SP inventado).
//
// Falha silenciosa: erro/timeout -> envelope.jurisprudencia_aplicavel = [] e
// o Gerador segue. Esse node eh otimizacao, nao requisito.

const envelope = $input.first().json;
if (envelope.status === 'erro_validacao') return [{ json: envelope }];

const readEnv = (key, fb = '') => {
  try {
    if (typeof $vars !== 'undefined' && $vars && $vars[key]) return String($vars[key]).trim();
    return ($env && $env[key]) ? String($env[key]).trim() : (__PROC[key] || fb);
  } catch { return __PROC[key] || fb; }
};

const dados = envelope.dados_extraidos || {};
const defesas = (envelope.defesas_anteriores || {}).casos || [];
const teseHint = defesas.length > 0 ? (defesas[0].tese_central || '') : '';

const BACKEND_URL = readEnv('BACKEND_URL', 'http://autojuri_backend:8000');
const ADMIN_TOKEN = readEnv('BACKEND_ADMIN_TOKEN', '');

let jurisprudencia_aplicavel = [];

if (ADMIN_TOKEN) {
  try {
    const resp = await __FETCH(BACKEND_URL + '/api/jurisprudencia/buscar', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + ADMIN_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fatos: dados.fatos_resumo || '',
        pedidos: Array.isArray(dados.pedidos) ? dados.pedidos : [],
        tese_central: teseHint,
        area_juridica: dados.area_juridica || null,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data && Array.isArray(data.acordaos)) {
        jurisprudencia_aplicavel = data.acordaos;
      }
    }
  } catch (_) { /* silencioso — jurisprudencia eh opcional */ }
}

return [{ json: { ...envelope, jurisprudencia_aplicavel } }];
"""


def _build_jurisprudencia_block_replacement() -> tuple[str, str]:
    """Retorna (old, new) pra patchar o USER_MSG do Gerador injetando bloco verbatim
    de jurisprudencia logo apos o bloco de legislacao do PR13 B3."""
    # Marker: o template do Gerador hoje tem o bloco de legislacao do PR13 B3
    # com header '== LEGISLACAO VERIFICADA'. Injetamos novo bloco LOGO ANTES
    # do crase de fechamento `;` final do USER_MSG construido por template literal.
    old = "})()}`;"
    new = """})()}\n${(() => {
  const acordaos = envelope.jurisprudencia_aplicavel || [];
  if (!Array.isArray(acordaos) || acordaos.length === 0) return '';
  const linhas = acordaos.map(a => {
    const cab = `- ${a.tribunal} ${a.numero_processo}` + (a.relator ? ` (Rel. ${a.relator}` : ' (') + (a.data_julgamento ? `, j. ${a.data_julgamento})` : ')');
    const ementa = (a.ementa || '').replace(/\\s+/g, ' ').slice(0, 500);
    return `${cab}: \"${ementa}\"`;
  }).join('\\n');
  return `\\n\\n================================================================\\n== JURISPRUDENCIA APLICAVEL (cite verbatim no campo \\`fundamentos\\`, com tribunal + numero do processo) ==\\n================================================================\\n${linhas}\\n================================================================`;
})()}`;"""
    return old, new


def main() -> int:
    base = Path(__file__).resolve().parents[2]
    wf_path = base / "docs" / "n8n_workflow_contestar_por_peticao.json"
    wf = json.loads(wf_path.read_text(encoding="utf-8"))

    if any(n.get("id") == "node-buscar-jurisprudencia" for n in wf["nodes"]):
        print("Workflow ja contem 'Buscar Jurisprudencia Aplicavel'. Nada a fazer.")
        return 0

    # 1. Adiciona node novo entre 'Buscar Legislacao Aplicavel' e 'Claude Gerador'
    novo_node = {
        "id": "node-buscar-jurisprudencia",
        "name": "Buscar Jurisprudencia Aplicavel",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1180, 300],
        "parameters": {
            "mode": "runOnceForAllItems",
            "jsCode": JURISPRUDENCIA_JS,
        },
    }

    # Desloca os nodes da Gerador em diante pra abrir espaco visual
    desloc = {
        "node-gerador-peticao": 1380,
        "node-self-correction-peticao": 1560,
        "node-detector-contradicoes": 1740,
        "node-responder-peticao": 1940,
    }
    for node in wf["nodes"]:
        if node.get("id") in desloc:
            node["position"] = [desloc[node["id"]], 300]

    # Insere apos 'Buscar Legislacao Aplicavel' no array
    idx_after_legis = next(
        (i for i, n in enumerate(wf["nodes"]) if n.get("id") == "node-buscar-legislacao"),
        None,
    )
    if idx_after_legis is None:
        print("ERRO: node 'Buscar Legislacao Aplicavel' nao encontrado", file=sys.stderr)
        return 1
    wf["nodes"].insert(idx_after_legis + 1, novo_node)

    # 2. Rewire: Buscar Legislacao -> Buscar Jurisprudencia -> Claude Gerador
    wf["connections"]["Buscar Legislacao Aplicavel"] = {
        "main": [[{"node": "Buscar Jurisprudencia Aplicavel", "type": "main", "index": 0}]]
    }
    wf["connections"]["Buscar Jurisprudencia Aplicavel"] = {
        "main": [[{"node": "Claude Gerador de Contestacao", "type": "main", "index": 0}]]
    }

    # 3. Patcha USER_MSG do Gerador pra injetar bloco verbatim de jurisprudencia
    gerador = next(
        (n for n in wf["nodes"] if n.get("id") == "node-gerador-peticao"), None
    )
    if gerador is None:
        print("ERRO: node 'Claude Gerador' nao encontrado", file=sys.stderr)
        return 1
    js_ger = gerador["parameters"]["jsCode"]
    old, new = _build_jurisprudencia_block_replacement()
    # Cuidado: o marker '})()}`;' pode aparecer mais de uma vez (legislacao tambem usa).
    # Garantir que injetamos APENAS no ultimo (que eh o fechamento do USER_MSG final).
    if js_ger.count(old) < 1:
        print("AVISO: marker do fechamento do USER_MSG nao encontrado — injecao NAO feita")
    else:
        # rfind acha a ultima ocorrencia
        idx = js_ger.rfind(old)
        js_ger = js_ger[:idx] + new + js_ger[idx + len(old):]
        gerador["parameters"]["jsCode"] = js_ger
        print("OK: USER_MSG do Gerador patchado pra injetar jurisprudencia verbatim")

    wf["description"] = (
        wf.get("description", "")
        + " | PR19: Buscar Jurisprudencia Aplicavel + injecao verbatim no USER_MSG do Gerador."
    )
    wf["updatedAt"] = "2026-06-10T10:00:00.000Z"

    wf_path.write_text(
        json.dumps(wf, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"OK: 'Buscar Jurisprudencia Aplicavel' inserido em {wf_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
