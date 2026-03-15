# Calculadora de Custos

Versao web simplificada, em tela unica, baseada nos campos operacionais que voce informou para o sistema.

## O que foi removido

- Relatorio de produtos
- Dados de cadastro de produtos
- Persistencia de base de produtos
- Qualquer tela que nao esteja ligada ao calculo principal

## O que ficou na tela

Campos de entrada:

- Data hoje
- Ryobi ou Komori
- Caixas por folha
- Gramatura da folha
- Qtde folhas impressao
- Formato papel
- Tampa dia operador
- Box dia operador
- Custo do kilo do papel utilizado
- Fechamento
- Zerar valor impressao
- Margem lucro %
- Altura
- Largura
- Plastificacao
- Zerar valor setup
- Zerar custos fixos de insumo
- Preco com montagem de tampa e box

Saidas em tela:

- R$ Custo Unitario
- Custos papel folha
- Custos de impressao
- Custos de plastificacao
- Setup
- Custos de insumos
- Custos de m.o
- Custos corte e vinco
- TOTAL DE CUSTOS

## Como usar

1. Abra `index.html` no navegador.
2. Preencha os campos.
3. Clique em `Calcular`.

## Observacao

O calculo foi reorganizado para seguir os campos que voce listou. Como o codigo VBA nao ficou exposto diretamente, a formula atual e uma modelagem funcional da macro, pronta para novos ajustes finos caso voce queira aproximar ainda mais do comportamento exato.
