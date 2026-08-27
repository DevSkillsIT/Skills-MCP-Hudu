# ⚠️ `Hudu.json` está desatualizado — não use como fonte de verdade

Este arquivo é uma spec OpenAPI **anterior ao Hudu 2.44.3**. Ele é mantido só
como referência histórica dos `definitions` citados em
`src/formatters/enums.ts` e em `src/__tests__/BUG-03-photo-id-type.test.ts`.

## O que se sabe que está errado nele

- **Não contém** `/labels`, `/label_types`, `/flags` nem `/flag_types`, que
  existem na 2.44.3 e são a superfície de 8 tools deste servidor.
- Afirma *"Pagination is in sets of 25 results"*. O limite real é **1000**
  (`calculate_page_size(max_size: 1000)` no Rails). A exceção é
  `/asset_layouts`, que trava em 25 de verdade.
- O `$ref` de topo aponta para `./info.json`, que não existe neste repositório.
  Nenhuma ferramenta OpenAPI resolve o arquivo como está.

## Por que isso importa

Numa auditoria de 2026-08-27 esta spec produziu **três achados confiantes e
errados**, porque um arquivo com cara de fonte primária dentro do repositório é
lido como fonte primária. Uma spec velha é pior que nenhuma.

## Onde está a verdade

Na instância que você opera. A fonte é o Rails dentro do container:
`config/routes.rb` e os `Api::V1::*Controller`. Não existe download público
desta versão da spec.

Para comportamento de escrita especificamente, leia o `permit` do controller —
o serializer não serve: **ler não é escrever**. Foi assim que se descobriu que
`PUT /procedure_tasks/{id}` descarta `completed` e responde sucesso.
