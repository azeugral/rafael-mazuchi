"""Separação de cores para a serigrafia do hero: flash -> PNG RGBA (R,G,B = 3 telas de cor, A = preto) + cores."""
import sys, json, numpy as np, cv2
src, nome, out = sys.argv[1], sys.argv[2], sys.argv[3]
im = cv2.imread(src)
if len(sys.argv) > 4:  # recorte x0,y0,x1,y1 em fração
    f = [float(v) for v in sys.argv[4].split(',')]; H, W = im.shape[:2]
    im = im[int(f[1] * H):int(f[3] * H), int(f[0] * W):int(f[2] * W)]
h, w = im.shape[:2]
lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
L, a, b = lab[..., 0], lab[..., 1] - 128, lab[..., 2] - 128
chroma = np.hypot(a, b)
fundo = (L > 175) & (chroma < 14)           # papel cinza claro
# limpar: componente com tinta
tinta = ~fundo
tinta = cv2.morphologyEx(tinta.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
n, cc, st, _ = cv2.connectedComponentsWithStats(cv2.dilate(tinta.astype(np.uint8), np.ones((25, 25), np.uint8)))
maior = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); tinta &= cc == maior
ys, xs = np.where(tinta)
y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
preto = tinta & (L < 70)
cor = tinta & ~preto
px = lab[cor][:, :].reshape(-1, 3)
cv2.setRNGSeed(1)
_, _, lab_c = cv2.kmeans(px[::7].copy(), 6, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, .5), 4, cv2.KMEANS_PP_CENTERS)
lbl = np.full((h, w), -1); lbl[cor] = np.argmin(((px[:, None, :] - lab_c[None]) ** 2).sum(-1), 1)
area = np.array([(lbl == k).sum() for k in range(6)])
# branco do desenho (L alto, pouco croma) não é tela, é o pano
claro = [k for k in range(6) if lab_c[k, 0] > 200 and np.hypot(*(lab_c[k, 1:] - 128)) < 18]
ordem = [k for k in np.argsort(-area) if k not in claro]
telas = ordem[:3]
def rgb(c): return cv2.cvtColor(np.uint8([[c]]), cv2.COLOR_LAB2RGB)[0, 0].tolist()
M = np.zeros((h, w, 4), np.uint8)
for k in ordem[3:]:  # sobras vão para a tela mais próxima
    j = min(telas, key=lambda t: np.linalg.norm(lab_c[t] - lab_c[k])); lbl[lbl == k] = j
for i, k in enumerate(telas):
    M[..., i] = (lbl == k) * 255
M[..., 3] = preto * 255
# recorte quadrado centrado com margem e 1024
cy, cx = (y0 + y1) // 2, (x0 + x1) // 2; s = int(max(y1 - y0, x1 - x0) * 1.08) // 2
P = np.zeros((2 * s, 2 * s, 4), np.uint8)
ya, yb, xa, xb = max(0, cy - s), min(h, cy + s), max(0, cx - s), min(w, cx + s)
P[ya - (cy - s):yb - (cy - s), xa - (cx - s):xb - (cx - s)] = M[ya:yb, xa:xb]
P = cv2.resize(P, (1024, 1024), interpolation=cv2.INTER_AREA)
P = cv2.GaussianBlur(P, (3, 3), 0)
cv2.imwrite(f'{out}/{nome}.png', cv2.cvtColor(P, cv2.COLOR_RGBA2BGRA))
cores = [rgb(lab_c[k]) for k in telas]
prev = np.full((1024, 1024, 3), (232, 224, 205), np.float32)
for i, c in enumerate(cores):
    m = P[..., i:i + 1] / 255.; prev = prev * (1 - m) + np.array(c) * m
prev = prev * (1 - P[..., 3:4] / 255. * .92)
cv2.imwrite(f'{out}/_prev_{nome}.jpg', cv2.cvtColor(prev.astype(np.uint8), cv2.COLOR_RGB2BGR))
print(json.dumps({nome: cores}))
