# Rafael Mazuchi · prévia do site

Prévia de 12/11/2026 feita pela L R G Z. Site estático (HTML, CSS e JS puros), noindex.

## Conceito
O Rafael tatua o tradicional e também faz serigrafia, costura e cerâmica. Numa legenda ele escreveu: "a tela é orgânica e viva". O site junta as duas telas, a da serigrafia e a pele.
- **Hero:** quatro flashs dele (mão de dominó, palhaço, morangos e 05:00 AM) impressos no algodão cru uma tela por vez. Cada cor foi separada do desenho original com `tools/separar.py`, entra com uma passada de rodo, mostra a malha na tinta fresca e sai levemente fora de registro. O preto fecha a peça (`assets/js/hero.js`).
- **Celular:** usa `assets/video/hero.mp4`, gerado por `tools/gerar_video.py` a partir do mesmo shader (`?render`).
- **Paleta:** algodão cru #ece3cf, tinta #1b1714, escarlate das totes #d2261c e o azul dos "Disponíveis" #2a78a3.
- **Fontes:** Shrikhand, Space Mono e Instrument Sans, hospedadas no próprio site.
- **Seções:** desenho × pele (comparador), trabalhos, flash disponível, feito à mão, processo, artista, agendar pelo WhatsApp e estúdio.

## CONFIRMAR com o Rafael
- [ ] WhatsApp 55 11 91591-1178 (veio do link da bio).
- [ ] O endereço Av. Sen. Roberto Simonsen, 560, sala 02 é do estúdio atual? Fica no @fragmentottt?
- [ ] Preços do flash, de R$ 300 a R$ 500, e a regra do segundo flash pela metade: os posts são de 2025.
- [ ] Domínio. Sugestões: rafaelmazuchi.com.br ou mazuchi.com.br.

## Ferramentas
`tools/separar.py` faz a separação de cores do flash. `tools/ver.py` audita 7 tamanhos de tela. `tools/gerar_video.py` gera o MP4 do celular.
