"""Regenera a tabela de projetos e o badge de progresso do README.md.

Reescreve apenas o conteúdo entre os marcadores:
  <!-- PROJETOS:INICIO --> ... <!-- PROJETOS:FIM -->
  <!-- BADGE:INICIO --> ... <!-- BADGE:FIM -->
Idempotente: rodar duas vezes seguidas não altera o arquivo.

Uso: python scripts/gerar_readme.py
"""

from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
JSON_PATH = RAIZ / "projects.json"
README_PATH = RAIZ / "README.md"

STATUS = {
    "lancado": "✅ Lançado",
    "em_andamento": "🚧 Em andamento",
    "em_breve": "⏳ Em breve",
}


def celula(texto: str) -> str:
    """Escapa texto para caber numa célula de tabela Markdown."""
    return " ".join(str(texto).split()).replace("|", "\\|")


def formatar_data(iso: str | None) -> str:
    if not iso:
        return "—"
    return date.fromisoformat(iso).strftime("%d/%m/%Y")


def links(p: dict) -> str:
    partes = []
    if p.get("demo"):
        partes.append(f"[Demo]({p['demo']})")
    if p.get("repo"):
        partes.append(f"[Código]({p['repo']})")
    return " · ".join(partes) or "—"


def gerar_tabela(dados: dict) -> str:
    total = dados["desafio"]["total_semanas"]
    por_semana = {p["semana"]: p for p in dados["projetos"]}
    linhas = [
        "| Sem | Projeto | Descrição | Stack | Lançamento | Status | Links |",
        "|:---:|---|---|---|:---:|---|---|",
    ]
    for semana in range(1, total + 1):
        p = por_semana.get(semana)
        num = f"{semana:02d}"
        if p is None:
            linhas.append(f"| {num} | *A definir* | — | — | — | — | — |")
            continue
        nome = f"**{celula(p['nome'])}**"
        stack = ", ".join(celula(s) for s in p.get("stack", [])) or "—"
        linhas.append(
            f"| {num} | {nome} | {celula(p['subtitulo'])} | {stack} | "
            f"{formatar_data(p.get('lancamento'))} | {STATUS.get(p['status'], p['status'])} | {links(p)} |"
        )
    return "\n".join(linhas)


def gerar_badge(dados: dict) -> str:
    total = dados["desafio"]["total_semanas"]
    lancados = sum(1 for p in dados["projetos"] if p["status"] == "lancado")
    cor = "34d399" if lancados == total else "2dd4bf"
    return f"![Progresso](https://img.shields.io/badge/Progresso-{lancados}%20de%20{total}-{cor})"


def substituir(texto: str, marcador: str, conteudo: str, bloco: bool) -> str:
    inicio, fim = f"<!-- {marcador}:INICIO -->", f"<!-- {marcador}:FIM -->"
    padrao = re.compile(re.escape(inicio) + r".*?" + re.escape(fim), re.DOTALL)
    if not padrao.search(texto):
        print(f"AVISO: marcadores {marcador} não encontrados no README; trecho ignorado.")
        return texto
    novo = f"{inicio}\n{conteudo}\n{fim}" if bloco else f"{inicio}{conteudo}{fim}"
    return padrao.sub(lambda _: novo, texto, count=1)


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    dados = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    original = README_PATH.read_text(encoding="utf-8")

    atualizado = substituir(original, "PROJETOS", gerar_tabela(dados), bloco=True)
    atualizado = substituir(atualizado, "BADGE", gerar_badge(dados), bloco=False)

    if atualizado == original:
        print("README.md já está atualizado.")
        return 0
    README_PATH.write_text(atualizado, encoding="utf-8", newline="\n")
    print("README.md atualizado.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
