# Agente de IA — AutoJuri
**Documento de referência para discussão com cliente**
*Gerado em 22/04/2026*

---

## O que o agente faz hoje

O AutoJuri utiliza o modelo **Claude Sonnet 4.6** (Anthropic) como motor de inteligência artificial para redigir minutas de contestação jurídica. O fluxo completo é:

1. **Recebe o caso** — advogado preenche formulário com: número do processo, partes, tipo de ação, fatos, pedido do autor, pontos estratégicos e (opcional) modelo de peça base
2. **Busca histórico** — o sistema consulta o banco de dados do escritório e recupera até **3 contestações anteriores do mesmo tipo de ação**, usadas como referência de tese e estilo
3. **Chama o agente IA** — envia tudo ao Claude com instrução para redigir a minuta respeitando o estilo do escritório
4. **Retorna a minuta** — estruturada em: resumo estratégico, tese central, fundamentos, pedidos, pontos atendidos, riscos e observações
5. **Advogado revisa e exporta** — edita ao vivo na tela e exporta em PDF ou DOCX

### Tempo médio de geração
Aproximadamente **30–90 segundos** dependendo do volume de informações.

### O que o agente NÃO faz (por design)
- Não inventa jurisprudência nem cita acórdãos fictícios
- Não toma decisões autônomas — toda peça exige revisão humana antes de uso
- Não acessa sistemas externos de tribunais (PJe, TJ, STJ) em tempo real

---

## Qualidade por área do direito

| Área | Qualidade Atual | Observação |
|---|---|---|
| Direito Civil | ★★★★★ | Excelente cobertura |
| Direito do Consumidor | ★★★★★ | Excelente cobertura |
| Direito do Trabalho | ★★★★★ | Excelente cobertura |
| Direito Tributário | ★★★★☆ | Bom, revisão recomendada em teses complexas |
| Direito de Família | ★★★★☆ | Bom, atenção a casos com jurisprudência recente |
| Direito Empresarial | ★★★★☆ | Bom |
| Direito Previdenciário | ★★★★☆ | Bom |
| Direito Contratual | ★★★★☆ | Bom |
| Direito Penal | ★★★☆☆ | Estrutura sólida, sem acórdãos recentes |
| Direito Administrativo | ★★★☆☆ | Varia conforme o ente público |
| Direito Bancário | ★★★☆☆ | Bom em defesa de cobranças, limitado em regulatório |
| Direito Imobiliário | ★★★☆☆ | Adequado para casos comuns |
| Direito Digital | ★★★☆☆ | Área nova, modelo menos treinado |
| Direito Ambiental | ★★★☆☆ | Genérico em licenciamentos específicos |
| Direito Marítimo/Aeronáutico | ★★☆☆☆ | Ramo muito nichado |
| Direito Eleitoral | ★★☆☆☆ | Limitado a casos gerais |
| Direito Agrário | ★★☆☆☆ | Básico |

---

## Principal limitação identificada

### Ausência de jurisprudência atualizada

O agente redige peças tecnicamente corretas em estrutura e linguagem, mas **não tem acesso à jurisprudência atual** (STJ, STF, TJs estaduais de 2024-2026). Isso significa:

- A peça sai sem citar acórdãos reais e recentes
- Em casos que dependem de súmula ou decisão recente, o advogado precisa complementar manualmente
- Escritórios que competem em cima de jurisprudência de ponta sentem mais esse gap

**Impacto prático:** Para 70–80% dos casos comuns (cobranças, rescisões, vícios de produto, danos morais), a ausência de jurisprudência específica não compromete a qualidade da peça. Para os 20–30% mais complexos, o advogado já precisaria revisar de qualquer forma.

---

## Melhoria proposta: Busca de jurisprudência em tempo real

### Como funcionaria

Antes de chamar o Claude, o sistema buscaria automaticamente decisões relevantes em fontes públicas e injetaria as ementas no contexto da IA.

**Fluxo com a melhoria:**

```
Formulário do advogado
        ↓
Busca automática de jurisprudência
(STJ, STF ou Jusbrasil via API)
        ↓
Claude recebe: caso + histórico do escritório + 3-5 acórdãos reais
        ↓
Minuta com citações jurisprudenciais verificáveis
```

### Fontes possíveis

| Fonte | Tipo de Acesso | Cobertura |
|---|---|---|
| **Jusbrasil API** | API paga (plano business) | STJ, STF, todos os TJs |
| **STJ Open Data** | Gratuito, limitado | Apenas STJ |
| **STF API pública** | Gratuito | Apenas STF |
| **TJ-SP, TJ-RJ** (etc.) | Gratuito por scraping | TJ específico |

### Impacto esperado

- Peças com citações jurisprudenciais **verificáveis e recentes**
- Redução do tempo de revisão do advogado (não precisa buscar manualmente)
- Maior diferencial competitivo frente a ferramentas genéricas
- Qualidade nas áreas ★★★ subiria para ★★★★

### Custo estimado de implementação

| Item | Estimativa |
|---|---|
| Integração n8n + Jusbrasil API | 3–5 dias de desenvolvimento |
| Custo Jusbrasil Business | A confirmar com Jusbrasil (geralmente R$ 300–800/mês) |
| Custo alternativo (STJ/STF gratuito) | 5–8 dias (mais frágil, sem cobertura de TJs) |
| Impacto nos tokens Claude | +10–15% por request (mais contexto no prompt) |

### Recomendação

Iniciar com **STJ + STF gratuitos** para validar a melhoria de qualidade sem custo adicional de API. Se o escritório confirmar valor, migrar para Jusbrasil com cobertura completa dos TJs.

---

## Resumo executivo para o cliente

**O que já funciona bem:**
- Geração de contestação completa em menos de 2 minutos
- Aprendizado com o histórico do próprio escritório (estilo e tese)
- Exportação em PDF/DOCX pronta para revisão
- Segurança: cada escritório vê apenas seus próprios dados

**O que pode melhorar:**
- Citações jurisprudenciais reais e atuais (melhoria prioridade alta)
- Cobertura de ramos mais nichados (Eleitoral, Agrário, Marítimo)
- Integração direta com sistemas de peticionamento (PJe) — melhoria futura

**Pergunta chave para o cliente:**
> *"Qual percentual dos seus casos depende de jurisprudência recente específica para a tese central da contestação?"*

A resposta define se a integração com Jusbrasil é urgente ou pode esperar uma segunda fase.
