# -*- coding: utf-8 -*-
"""Seed dos exemplares do escritorio (estilo de defesa) no RAG.
Duas contestacoes reais aprovadas: Rosineide (G. Trindade) e Ana Clariane
(Felipe Brandao). Capturam tese central + fundamentos + estilo reutilizavel.
"""
import sys
sys.path.insert(0, "/app")
from App.database import salvar_exemplar, get_contestacoes_exemplares  # noqa

EXEMPLARES = [
    {
        "tipo_acao": "Trabalhista - terceirizacao merenda - rescisao indireta / verbas rescisorias / insalubridade / FGTS",
        "tese_central": (
            "Terceirizada (merenda escolar, tomador ente publico) contra ex-empregada que pleiteia rescisao "
            "indireta e verbas rescisorias. Tese central: NAO houve rescisao indireta nem dispensa - o que "
            "terminou foi o CONTRATO ADMINISTRATIVO com o Tomador (Secretaria de Educacao), e a autora se "
            "ausentou antes do encerramento, configurando PEDIDO DE DEMISSAO (jurisprudencia TRT-2). A empresa "
            "nao reteve valores: o Tomador (ente publico) reteve as faturas, e ha acao coletiva do sindicato "
            "compelindo o deposito em juizo. Insalubridade descaracterizada por PROVA EMPRESTADA de laudo "
            "pericial (casos identicos merendeira/escola concluidos salubres) + EPIs + PCMSO/PPRA. Danos morais "
            "improcedentes por falta de prova de dano/nexo. Litigancia de ma-fe da autora (pede o que ja "
            "recebeu). Gratuidade da autora condicionada a comprovacao (art. 790 s4 CLT)."
        ),
        "fundamentos_resumo": (
            "PRELIMINARES (7, nominadas A-G): A) julgamento a luz da Lei 13.467/17 - custas, honorarios "
            "sucumbenciais, gratuidade condicionada (art. 790 s4 CLT, IN 41/2018 TST). B) incompetencia da JT "
            "para contribuicoes previdenciarias do pacto (Sumula 368 TST, Sumula Vinculante 53 STF, art. 876 "
            "par. unico CLT). C) limitacao da condenacao ao valor da causa (arts. 292/141/492 CPC, art. 840 s1 "
            "CLT). D) inepcia dos pedidos nao liquidados, ex. insalubridade (art. 840 s1 CLT + 485 I CPC). "
            "E) juizo 100% digital. F) gratuidade a Reclamada (crise financeira). G) prescricao quinquenal "
            "(art. 7 XXIX CF, art. 11 CLT). MERITO (subsecoes espelhando os pedidos): II.A rescisao indireta "
            "camuflada = pedido de demissao (fim do contrato administrativo, nao do trabalho; duty to mitigate "
            "the loss) - afasta multas 467/477 e verbas rescisorias tipicas. II.B salarios/diferencas CCT/FGTS: "
            "crise financeira, Tomador nao pagou faturas, FGTS englobado na rescisao do sindicato. II.C ferias "
            "2022-2024 pagas e gozadas, 2024/2025 em periodo concessivo (sem dobra); vale-transporte pago em "
            "dinheiro com anuencia do sindicato; desconto = estorno de adiantamento (bis in idem); jornada 44h "
            "com intervalo, comprovada por pontos. II.D insalubridade: ambiente salubre (NR-15 anexo 3, Portaria "
            "MTP 426/2021), agua abundante, EPIs, PCMSO/PPRA, PROVA EMPRESTADA de laudo + jurisprudencia de "
            "casos identicos. LITIGANCIA DE MA-FE (arts. 793-A e seg CLT): gratuidade NAO isenta a multa "
            "(jurisprudencia TST/STF/STJ). DANOS MORAIS improcedentes (exige prova de dano e nexo - TRT-6). "
            "Impugnacao de calculos. AUTENTICIDADE dos documentos (art. 830 CLT). PEDIDOS: improcedencia total, "
            "custas/honorarios a autora, condenacao em ma-fe, compensacao/deducao, retencao previdenciaria/fiscal "
            "(art. 767 CLT), notificacoes so no nome do patrono sob pena de nulidade (Sumula 427 TST)."
        ),
        "nota_qualidade": 9,
    },
    {
        "tipo_acao": "Trabalhista - terceirizacao - rescisao indireta pleiteada / demissao por justa causa (abandono)",
        "tese_central": (
            "Terceirizada (apoio administrativo) contra ex-empregada que pleiteia rescisao indireta e verbas "
            "rescisorias. Tese central: NAO houve rescisao indireta - configurou-se DEMISSAO POR JUSTA CAUSA "
            "(abandono de emprego + desidia/indisciplina: registro de ponto divergente do laborado, falsa "
            "alegacao de salarios atrasados). A empresa ofereceu extincao por acordo (art. 484-A CLT) ou pedido "
            "de demissao, mas a autora simplesmente deixou de comparecer, configurando abandono (art. 482 "
            "b/e/h/i CLT). Onus da justa causa e da re, suprido por documentos (pontos, TRCTs com e sem justa "
            "causa, extratos comprovando pagamento em dia). Litigancia de ma-fe da autora (valor irrazoavel, sem "
            "prova). Gratuidade da autora indevida (Sumula 219 TST, Lei 5.584/70). Honorarios de 20% pedidos sao "
            "indevidos (art. 791-A CLT: 5 a 15%)."
        ),
        "fundamentos_resumo": (
            "ESTRUTURA (topicos): AUTENTICIDADE dos documentos (art. 830 CLT). NOTIFICACOES so no nome do "
            "patrono, sob pena de nulidade (art. 272 CPC, Sumula 427 TST). Contestar a GRATUIDADE DA AUTORA "
            "(Sumula 219 TST, art. 14 Lei 5.584/70 - representacao pelo sindicato). GRATUIDADE A RECLAMADA "
            "(crise financeira pos-pandemia). MERITO - DEMISSAO POR JUSTA CAUSA: autora nao quis mais laborar, "
            "recusou o acordo do art. 484-A e a demissao comum e abandonou o emprego (art. 482 i CLT); somam-se "
            "desidia e indisciplina (art. 482 b/e/h) - ponto divergente, falsa alegacao de atraso (era pontual; "
            "houve so atraso por troca de banco CEF->Itau). Jurisprudencia TRT-20 (justa causa por mau "
            "procedimento/quebra de fiducia; gradacao de penas dispensavel quando grave; Sumula 212 TST sobre "
            "onus e continuidade). HONORARIOS: art. 791-A preve 5% a 15% (nao os 20% pedidos). LITIGANCIA DE "
            "MA-FE R$ 5.000 (arts. 793-A a 793-D CLT): gratuidade NAO isenta a multa (jurisprudencia TST/STF/STJ). "
            "IMPUGNACAO AO VALOR DA CAUSA (arts. 291/292/319 CPC - valor aleatorio, sem comprovacao). "
            "REQUERIMENTOS CAUTELARES (eventualidade): apuracao em liquidacao de sentenca, juros/correcao Lei "
            "8.177/91 e Sumula 381 TST, evolucao salarial, retencao na fonte de IR e INSS. PEDIDOS: indeferir "
            "gratuidade da autora, conceder gratuidade a re, improcedencia total, condenacao em ma-fe (R$ 5.000), "
            "honorarios de 15%. Depoimento pessoal sob pena de confissao (Sumula 74 TST)."
        ),
        "nota_qualidade": 9,
    },
]

for ex in EXEMPLARES:
    novo_id = salvar_exemplar(
        ex["tipo_acao"], ex["tese_central"], ex["fundamentos_resumo"], ex["nota_qualidade"]
    )
    print(f"  exemplar id={novo_id} | {ex['tipo_acao'][:60]}")

print()
print("total exemplares agora:", len(get_contestacoes_exemplares("Trabalhista - terceirizacao")))
