# Marca do Elementum

- `Manual-Identidade-Elementum.pdf`: manual de identidade visual (16 páginas, A4 deitado):
  logo, versões, área de proteção, tamanhos mínimos, cores (HEX e RGB), degradês,
  tipografia (Barlow), uso correto e incorreto e como a marca aparece nas telas do jogo.
- `fonte/`: arquivos que geram o manual.
  - `logo-elementum.html`: a logo aprovada (brasão E1 refinado) em todas as versões, em SVG.
  - `defs.svg.part`: os desenhos da logo (símbolo, versão reduzida, monocromática e o nome).
  - `build_manual.py` + `manual.css`: montam `manual.html`; `render_manual.cjs` gera o PDF
    (precisa do Playwright): `python3 build_manual.py && node render_manual.cjs`.
