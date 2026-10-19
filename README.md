# Desafio 12x12

> 12 projetos em 12 semanas. Um lançamento por semana, com código aberto e deploy no ar.

[![Vitrine online](https://img.shields.io/badge/Vitrine-online-2dd4bf)](https://andeerdev.github.io/desafio-12x12/)
<!-- BADGE:INICIO -->![Progresso](https://img.shields.io/badge/Progresso-0%20de%2012-2dd4bf)<!-- BADGE:FIM -->
[![Licença MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-f59e0b)](./LICENSE)

**Vitrine:** https://andeerdev.github.io/desafio-12x12/

## O desafio

Um compromisso público com a entrega: lançar **um projeto por semana durante 12 semanas**,
cada um no ar, com código aberto e foco em resolver problemas reais.

As regras são simples:

1. **Um projeto por semana**, começando em 19/10/2026.
2. **Deploy funcionando**: cada projeto precisa estar no ar para qualquer pessoa testar.
3. **Código aberto**: repositório público e licença livre.

## Projetos

<!-- PROJETOS:INICIO -->
| Sem | Projeto | Descrição | Stack | Lançamento | Status | Links |
|:---:|---|---|---|:---:|---|---|
| 01 | **Conversor de Imagens** | PNG, JPG e WebP no navegador, sem enviar nada | HTML, JavaScript, Canvas API | — | 🚧 Em andamento | [Código](https://github.com/andeerdev/conversor-imagens) |
| 02 | *A definir* | — | — | — | — | — |
| 03 | *A definir* | — | — | — | — | — |
| 04 | *A definir* | — | — | — | — | — |
| 05 | *A definir* | — | — | — | — | — |
| 06 | *A definir* | — | — | — | — | — |
| 07 | *A definir* | — | — | — | — | — |
| 08 | *A definir* | — | — | — | — | — |
| 09 | *A definir* | — | — | — | — | — |
| 10 | *A definir* | — | — | — | — | — |
| 11 | *A definir* | — | — | — | — | — |
| 12 | *A definir* | — | — | — | — | — |
<!-- PROJETOS:FIM -->

## Princípios

- **Lançar toda semana.** Pronto e no ar vale mais que perfeito na gaveta.
- **Dados ficam com o usuário.** Local-first: sempre que possível, tudo roda no navegador, sem cadastro nem rastreamento.
- **Código aberto.** Dá para ler, estudar, copiar e melhorar.

## Como atualizar

Toda a vitrine sai do arquivo [`projects.json`](./projects.json). Para registrar um projeto ou um lançamento:

1. Edite `projects.json` (por exemplo, mude `status` para `"lancado"` e preencha `lancamento`, `demo` e `repo`).
2. Faça commit.
3. Dê push na `main`.

Nada mais. O GitHub Actions valida o JSON, publica o site e atualiza a tabela deste README sozinho.

Status possíveis: `lancado`, `em_andamento`, `em_breve`. Semanas sem projeto não precisam aparecer no JSON;
a vitrine mostra "A definir".

## Rodar localmente

O `fetch` do JSON não funciona abrindo o `index.html` direto do disco, então use um servidor:

```bash
python -m http.server 8000
```

E abra http://localhost:8000. Para simular outra data, use `?hoje=AAAA-MM-DD`
(ex.: http://localhost:8000/?hoje=2026-11-20).

Scripts úteis (Python 3.11+, só biblioteca padrão):

```bash
python scripts/validar_projects.py   # confere o projects.json
python scripts/gerar_readme.py       # regenera a tabela acima
```

## Licença

[MIT](./LICENSE) © 2026 Anderson Ferreira
