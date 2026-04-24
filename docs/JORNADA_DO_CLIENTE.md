# AutoJuri — Jornada do Cliente
**Como o advogado usa o sistema no dia a dia**

---

## Situação real antes do AutoJuri

João é advogado num escritório de médio porte. Toda semana chegam 20 novos casos de defesa do consumidor, rescisões contratuais e cobranças indevidas. Ele e sua equipe gastam entre 2h e 4h por peça pesquisando, estruturando e escrevendo — trabalho repetitivo que consome tempo que poderia estar em estratégia e atendimento ao cliente.

---

## Passo 1 — Acesso à plataforma

João abre o navegador e acessa o AutoJuri. Faz login com e-mail e senha do escritório.

> A plataforma é web — não precisa instalar nada. Funciona em qualquer computador ou notebook.

**O que ele vê:**
- Um painel com os casos em andamento do escritório
- Quantas peças foram geradas, quantas aguardam revisão e quantas foram finalizadas
- Um botão para iniciar uma nova contestação

---

## Passo 2 — Preenchimento do caso

João clica em **"Nova Contestação"** e preenche um formulário simples:

| Campo | O que João preenche |
|---|---|
| Número do processo | 0001234-56.2026.8.26.0100 |
| Autor (quem está processando) | Maria da Silva |
| Réu (cliente do escritório) | Empresa XYZ Ltda |
| Tipo de ação | Direito do Consumidor |
| Fatos do caso | "Cliente alega que produto veio defeituoso e pede devolução + danos morais" |
| Pedido do autor | Devolução de R$ 1.200 + R$ 5.000 de danos morais |
| Pontos que quer defender | "Produto foi entregue sem defeito, laudo técnico disponível" |
| Modelo de peça (opcional) | Faz upload de uma contestação anterior do escritório |

Clica em **"Enviar para a IA"**.

---

## Passo 3 — A IA trabalha (nos bastidores)

Enquanto João toma um café, o sistema faz tudo automaticamente:

1. **Busca no histórico do escritório** — encontra 3 contestações anteriores de casos parecidos (mesmo tipo de ação) que o escritório já ganhou
2. **Monta o contexto completo** — junta o caso atual com as referências do escritório
3. **Chama a inteligência artificial** — envia tudo ao modelo Claude da Anthropic
4. **Recebe e organiza a resposta** — estrutura a minuta no formato do sistema

> Tempo total: **30 segundos a 2 minutos**

---

## Passo 4 — Minuta pronta para revisão

A tela exibe a contestação gerada, já estruturada:

```
RESUMO ESTRATÉGICO
A ré comprova que o produto foi entregue em perfeito estado
mediante laudo técnico e histórico de entrega. O dano moral
alegado carece de comprovação de efetivo abalo...

TESE CENTRAL
Ausência de defeito no produto e inexistência de nexo causal
para caracterizar dano moral indenizável...

FUNDAMENTOS JURÍDICOS
Art. 14 do CDC — responsabilidade pelo fato do produto...
Inversão do ônus da prova — aplicação ao caso concreto...

PEDIDOS
Improcedência total dos pedidos autorais...
Condenação em honorários advocatícios...

PONTOS DE ATENÇÃO
- Laudo técnico deve ser anexado como prova documental
- Verificar se há reclamação anterior no Procon

RISCOS IDENTIFICADOS
- Ausência de política de troca clara pode fragilizar a defesa
```

---

## Passo 5 — Revisão e edição

João lê a peça na tela. Está 80% pronto.

- Ajusta dois parágrafos de fundamento
- Adiciona uma cláusula contratual específica que ele lembrou
- Remove uma parte que não se aplica ao caso

> Tudo diretamente na tela, sem precisar copiar para o Word.

**Tempo de revisão:** 15 a 30 minutos em vez de 2 a 4 horas.

---

## Passo 6 — Exportação

João clica em **"Exportar"** e escolhe o formato:

- **PDF** — para protocolo imediato
- **Word (.docx)** — para formatação final com o timbre do escritório

Arquivo gerado e pronto para envio.

---

## Resultado no fim do dia

| | Antes do AutoJuri | Com o AutoJuri |
|---|---|---|
| Tempo por contestação | 2h a 4h | 30min a 1h |
| Casos tratados por semana | 5 a 8 | 15 a 20 |
| Trabalho repetitivo | Alto | Baixo |
| Foco do advogado | Escrever | Estratégia e revisão |

---

---

# Melhorias previstas para as próximas fases

---

## Melhoria 1 — Jurisprudência em tempo real *(prioridade alta)*

### Situação atual
A IA redige peças tecnicamente corretas mas **sem citar acórdãos reais e recentes**. O advogado precisa buscar jurisprudência manualmente após receber a minuta.

### Como ficaria com a melhoria

No **Passo 3** (IA trabalhando), o sistema faria um passo extra antes de chamar o Claude:

```
Formulário preenchido
        ↓
Busca automática no STJ e STF
(palavras-chave extraídas do caso)
        ↓
Sistema encontra 3 a 5 decisões relevantes e recentes
        ↓
Claude recebe: caso + histórico do escritório + acórdãos reais
        ↓
Minuta com citações jurisprudenciais verificáveis
```

### O que muda para o João

A peça já sai assim:

```
FUNDAMENTOS JURÍDICOS
...conforme entendimento do STJ firmado no REsp 1.984.432/SP
(2024): "A simples entrega de produto com vício aparente já
configura defeito suficiente para inversão do ônus da prova
nos termos do art. 6º, VIII, do CDC"...
```

Em vez de o João precisar buscar esse acórdão, ele já vem na peça.

### Impacto
- Revisão cai de 30 minutos para 10 a 15 minutos
- Peças mais sólidas em casos que dependem de jurisprudência recente
- Maior diferencial frente a ferramentas genéricas de IA

---

## Melhoria 2 — Painel de produtividade do escritório *(prioridade média)*

### Situação atual
O painel mostra os casos do usuário logado. Não há visão gerencial do escritório como um todo.

### Como ficaria com a melhoria

O sócio ou gestor teria uma tela separada com:

- Total de peças geradas no mês por advogado
- Tipos de ação mais frequentes
- Tempo médio de revisão
- Taxa de aproveitamento da minuta (quanto foi editado vs. aprovado direto)

### Impacto
- Gestão consegue ver onde a IA ajuda mais e onde precisa de mais revisão
- Identifica quais advogados precisam de treinamento na ferramenta
- Dados reais para medir o ROI da plataforma

---

## Melhoria 3 — Upload de múltiplos arquivos como base *(prioridade média)*

### Situação atual
O advogado sobe apenas **um arquivo** como modelo de peça base.

### Como ficaria com a melhoria

Possibilidade de anexar:
- A petição inicial do autor (para a IA responder ponto a ponto)
- Documentos do processo (contratos, laudos, recibos)
- Múltiplos modelos de peça

A IA leria esses documentos e geraria uma defesa diretamente em resposta aos argumentos do autor.

### Impacto
- Peças muito mais aderentes ao caso específico
- Advogado não precisa resumir — a IA lê o processo original

---

## Melhoria 4 — Histórico e aprendizado por escritório *(prioridade futura)*

### Situação atual
O sistema usa contestações anteriores como referência de estilo. Mas não aprende com o feedback do advogado sobre o que foi bom ou ruim na minuta.

### Como ficaria com a melhoria

Após exportar, o advogado avalia a peça com uma nota simples (👍 ou 👎). Com o tempo, o sistema aprende quais tipos de argumento funcionam melhor para cada tipo de caso e escritório.

### Impacto
- Qualidade melhora continuamente com o uso
- A IA se adapta ao estilo específico do escritório
- Diferencial competitivo que aumenta quanto mais se usa

---

## Resumo das melhorias

| Melhoria | Impacto para o cliente | Prioridade |
|---|---|---|
| Jurisprudência em tempo real | Peças com citações reais, menos revisão | Alta |
| Painel gerencial | Visão de produtividade do escritório | Média |
| Upload de múltiplos arquivos | Peças mais aderentes ao processo real | Média |
| Aprendizado contínuo | Qualidade cresce com o uso | Futura |
