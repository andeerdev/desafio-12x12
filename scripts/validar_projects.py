"""Valida o projects.json contra o esquema da vitrine do Desafio 12x12.

Uso: python scripts/validar_projects.py [caminho/para/projects.json]
Sai com código 1 se encontrar qualquer erro.
"""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

RAIZ = Path(__file__).resolve().parent.parent
STATUS_VALIDOS = {"lancado", "em_andamento", "em_breve"}


def eh_data_iso(valor: object) -> bool:
    if not isinstance(valor, str) or len(valor) != 10:
        return False
    try:
        date.fromisoformat(valor)
    except ValueError:
        return False
    return True


def eh_url_https(valor: object) -> bool:
    if not isinstance(valor, str):
        return False
    partes = urlparse(valor)
    return partes.scheme == "https" and bool(partes.netloc)


def texto_obrigatorio(obj: dict, campo: str, onde: str, erros: list[str]) -> None:
    valor = obj.get(campo)
    if not isinstance(valor, str) or not valor.strip():
        erros.append(f"{onde}.{campo}: texto obrigatório e não vazio.")


def validar_autor(dados: dict, erros: list[str]) -> None:
    autor = dados.get("autor")
    if not isinstance(autor, dict):
        erros.append("autor: objeto obrigatório.")
        return
    texto_obrigatorio(autor, "nome", "autor", erros)
    texto_obrigatorio(autor, "github", "autor", erros)
    linkedin = autor.get("linkedin", "")
    if linkedin not in ("", None) and not eh_url_https(linkedin):
        erros.append("autor.linkedin: deve ser vazio ou uma URL https://.")


def validar_desafio(dados: dict, erros: list[str]) -> int | None:
    desafio = dados.get("desafio")
    if not isinstance(desafio, dict):
        erros.append("desafio: objeto obrigatório.")
        return None
    texto_obrigatorio(desafio, "titulo", "desafio", erros)
    texto_obrigatorio(desafio, "licenca", "desafio", erros)
    if not eh_data_iso(desafio.get("inicio")):
        erros.append("desafio.inicio: data obrigatória no formato AAAA-MM-DD.")

    total = desafio.get("total_semanas")
    if isinstance(total, bool) or not isinstance(total, int) or total < 1:
        erros.append("desafio.total_semanas: inteiro maior que zero.")
        total = None

    parceiro = desafio.get("parceiro")
    if parceiro is not None:
        if not isinstance(parceiro, dict):
            erros.append("desafio.parceiro: deve ser um objeto com nome e url.")
        else:
            texto_obrigatorio(parceiro, "nome", "desafio.parceiro", erros)
            if not eh_url_https(parceiro.get("url")):
                erros.append("desafio.parceiro.url: URL https:// obrigatória.")
    return total


def validar_projeto(p: object, i: int, total: int | None, vistas: set[int], erros: list[str]) -> None:
    onde = f"projetos[{i}]"
    if not isinstance(p, dict):
        erros.append(f"{onde}: deve ser um objeto.")
        return

    semana = p.get("semana")
    if isinstance(semana, bool) or not isinstance(semana, int):
        erros.append(f"{onde}.semana: inteiro obrigatório.")
    else:
        onde = f"projetos[{i}] (semana {semana})"
        if total is not None and not 1 <= semana <= total:
            erros.append(f"{onde}: semana deve estar entre 1 e {total}.")
        if semana in vistas:
            erros.append(f"{onde}: semana repetida.")
        vistas.add(semana)

    for campo in ("nome", "subtitulo", "descricao"):
        texto_obrigatorio(p, campo, onde, erros)

    stack = p.get("stack")
    if not isinstance(stack, list) or not all(isinstance(s, str) and s.strip() for s in stack):
        erros.append(f"{onde}.stack: lista de textos não vazios.")

    status = p.get("status")
    if status not in STATUS_VALIDOS:
        permitidos = ", ".join(sorted(STATUS_VALIDOS))
        erros.append(f"{onde}.status: '{status}' inválido (permitidos: {permitidos}).")

    lancamento = p.get("lancamento")
    if lancamento is not None and not eh_data_iso(lancamento):
        erros.append(f"{onde}.lancamento: use AAAA-MM-DD ou null.")
    if status == "lancado" and lancamento is None:
        erros.append(f"{onde}.lancamento: obrigatório quando status = 'lancado'.")

    for campo in ("demo", "repo"):
        if campo not in p:
            erros.append(f"{onde}.{campo}: campo obrigatório (URL https:// ou null).")
        elif p[campo] is not None and not eh_url_https(p[campo]):
            erros.append(f"{onde}.{campo}: deve ser URL https:// ou null.")


def validar(dados: object) -> list[str]:
    if not isinstance(dados, dict):
        return ["Raiz do JSON deve ser um objeto."]
    erros: list[str] = []
    validar_autor(dados, erros)
    total = validar_desafio(dados, erros)

    projetos = dados.get("projetos")
    if not isinstance(projetos, list):
        erros.append("projetos: lista obrigatória (pode ser vazia).")
        return erros
    vistas: set[int] = set()
    for i, p in enumerate(projetos):
        validar_projeto(p, i, total, vistas, erros)
    return erros


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    caminho = Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ / "projects.json"
    try:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"ERRO: arquivo não encontrado: {caminho}")
        return 1
    except json.JSONDecodeError as e:
        print(f"ERRO: JSON malformado em {caminho} (linha {e.lineno}, coluna {e.colno}): {e.msg}")
        return 1

    erros = validar(dados)
    if erros:
        print(f"ERRO: {len(erros)} problema(s) em {caminho.name}:")
        for erro in erros:
            print(f"  - {erro}")
        return 1
    print(f"OK: {caminho.name} válido ({len(dados['projetos'])} projeto(s)).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
