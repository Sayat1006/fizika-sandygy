#!/bin/bash
# usage: check.sh DIR  -> converts to PDF in ./pdfcheck/<dir> and prints page counts
D="$1"; O="/home/claude/kmzh/pdfcheck/$(basename "$D")"; mkdir -p "$O"
soffice --headless --convert-to pdf --outdir "$O" "$D"/*.docx >/dev/null 2>&1
for f in "$O"/*.pdf; do echo "$(pdfinfo "$f" | awk '/Pages/{print $2}') $(basename "$f")"; done
