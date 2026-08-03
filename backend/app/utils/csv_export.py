"""
csv_export.py — Utilitários para exportação de dados em CSV.

Centraliza a geração de arquivos CSV para os relatórios exportáveis
(Painel do Gestor e Painel do Monitor).

Características:
- Delimitador ";" (padrão pt-BR, abre corretamente no Excel).
- BOM UTF-8 no início do arquivo (Excel reconhece acentuação).
- Seleção de colunas: o cliente escolhe quais colunas exportar via query param.
- Formatação amigável de datas (dd/mm/aaaa HH:MM:SS) e booleanos (Sim/Nao).
"""

import csv
import io
from datetime import datetime
from typing import Any, Optional

from fastapi.responses import StreamingResponse

# Limite de segurança para evitar exportações gigantes (DoS)
EXPORT_MAX_ROWS = 10000


# Caracteres que iniciam fórmulas em Excel/Sheets/LibreOffice.
# Prefixar com aspa simples neutraliza a execução (CSV/Formula Injection).
_FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def _sanitize_formula(text: str) -> str:
    """Neutraliza injeção de fórmula em planilhas prefixando com aspa simples."""
    if text and text[0] in _FORMULA_PREFIXES:
        return "'" + text
    return text


def _format_value(value: Any) -> str:
    """Converte um valor Python em texto amigável para a célula do CSV."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return "Sim" if value else "Nao"
    if isinstance(value, datetime):
        return value.strftime("%d/%m/%Y %H:%M:%S")
    return _sanitize_formula(str(value))


def parse_columns(columns: Optional[str]) -> Optional[list[str]]:
    """Converte 'col1,col2,col3' em ['col1','col2','col3']. None se vazio."""
    if not columns:
        return None
    parsed = [c.strip() for c in columns.split(",") if c.strip()]
    return parsed or None


def build_csv_response(
    rows: list[dict[str, Any]],
    columns: list[tuple[str, str]],
    filename: str,
    selected_keys: Optional[list[str]] = None,
) -> StreamingResponse:
    """
    Monta uma resposta HTTP de download de CSV.

    :param rows: lista de dicionários (uma linha por registro).
    :param columns: lista de tuplas (chave, rótulo) que define as colunas
                    disponíveis e sua ordem.
    :param filename: nome sugerido do arquivo (ex.: "usuarios.csv").
    :param selected_keys: chaves escolhidas pelo cliente. Se None ou vazio,
                          exporta todas as colunas disponíveis.
    """
    if selected_keys:
        sel = set(selected_keys)
        cols = [(key, label) for (key, label) in columns if key in sel]
        if not cols:
            cols = columns
    else:
        cols = columns

    buffer = io.StringIO()
    buffer.write("\ufeff")  # BOM UTF-8
    writer = csv.writer(buffer, delimiter=";", quoting=csv.QUOTE_MINIMAL)
    writer.writerow([label for (_, label) in cols])
    for row in rows:
        writer.writerow([_format_value(row.get(key)) for (key, _) in cols])
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
