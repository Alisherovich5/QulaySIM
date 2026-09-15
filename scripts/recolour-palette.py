"""Move journey.css's hardcoded palette from the green family to the marine one.

Every colour keeps its lightness — the design's contrast and depth are in the
lightness, and that is what must not move. Only the hue and the chroma are
rewritten, and they are rewritten onto the ramp the approved palette actually
uses rather than onto a guess.
"""
import re, sys, math, pathlib

# ---------- sRGB <-> OKLab ----------
def srgb_to_lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def lin_to_srgb(c):
    v = 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055
    return max(0, min(255, round(v * 255)))
def hex_to_rgb(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
def rgb_to_hex(r):
    return '#%02x%02x%02x' % r
def to_oklab(rgb):
    r, g, b = (srgb_to_lin(c) for c in rgb)
    l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b
    m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b
    s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b
    l_, m_, s_ = l ** (1/3), m ** (1/3), s ** (1/3)
    return (0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_,
            1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_,
            0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_)
def from_oklab(lab):
    L, a, b = lab
    l_ = L + 0.3963377774*a + 0.2158037573*b
    m_ = L - 0.1055613458*a - 0.0638541728*b
    s_ = L - 0.0894841775*a - 1.2914855480*b
    l, m, s = l_**3, m_**3, s_**3
    return (lin_to_srgb( 4.0767416621*l - 3.3077115913*m + 0.2309699292*s),
            lin_to_srgb(-1.2684380046*l + 2.6097574011*m - 0.3413193965*s),
            lin_to_srgb(-0.0041960863*l - 0.7034186147*m + 1.7076147010*s))

# ---------- the marine neutral ramp, from the approved palette ----------
NEUTRALS = ['#ffffff', '#f4fafc', '#edf6f7', '#dcebee', '#a0b7c1',
            '#56697a', '#21434d', '#10313b', '#10283e', '#0a242d', '#04161d', '#000000']
ANCHORS = sorted(((to_oklab(hex_to_rgb(h))[0], to_oklab(hex_to_rgb(h))[1], to_oklab(hex_to_rgb(h))[2]) for h in NEUTRALS))

# ---------- the brand ramp, for the saturated greens ----------
BRAND = ['#e7f8f4', '#c9f0e8', '#99dfd2', '#62cbb7', '#24ae97', '#008e7c',
         '#007365', '#005a4e', '#004038', '#002823']

def marine_at(L):
    """(a, b) of the marine ramp at lightness L, interpolated between anchors."""
    if L <= ANCHORS[0][0]: return ANCHORS[0][1], ANCHORS[0][2]
    if L >= ANCHORS[-1][0]: return ANCHORS[-1][1], ANCHORS[-1][2]
    for i in range(len(ANCHORS) - 1):
        lo, hi = ANCHORS[i], ANCHORS[i + 1]
        if lo[0] <= L <= hi[0]:
            t = 0 if hi[0] == lo[0] else (L - lo[0]) / (hi[0] - lo[0])
            return lo[1] + (hi[1] - lo[1]) * t, lo[2] + (hi[2] - lo[2]) * t
    return ANCHORS[-1][1], ANCHORS[-1][2]

def nearest_brand(L):
    return min(BRAND, key=lambda h: abs(to_oklab(hex_to_rgb(h))[0] - L))

def convert(hx):
    rgb = hex_to_rgb(hx)
    L, a, b = to_oklab(rgb)
    chroma = math.hypot(a, b)
    if chroma >= 0.045:                       # a real colour, not a tint
        return nearest_brand(L), 'brand'
    na, nb = marine_at(L)
    # keep the original's chroma strength relative to the ramp's, so a near-grey
    # stays near-grey instead of being pushed to the ramp's full tint
    scale = 1.0 if chroma > 0.012 else chroma / 0.012 if chroma else 0.0
    return rgb_to_hex(from_oklab((L, na * scale, nb * scale))), 'neutral'

path = pathlib.Path(sys.argv[1])
src = path.read_text()
KEEP = {'#fff', '#ffffff', '#000', '#000000', '#0000'}
seen = {}
for m in re.finditer(r'#[0-9a-fA-F]{3,8}\b', src):
    hx = m.group(0)
    if len(hx) not in (4, 7) or hx.lower() in KEEP:
        continue
    seen.setdefault(hx.lower(), 0)
    seen[hx.lower()] += 1

table = {}
for hx, n in sorted(seen.items(), key=lambda kv: -kv[1]):
    new, kind = convert(hx)
    if new.lower() != hx.lower():
        table[hx] = new
    print(f'{hx}  x{n:<3} -> {new}   ({kind})')

if len(sys.argv) > 2 and sys.argv[2] == '--apply':
    def repl(m):
        hx = m.group(0)
        return table.get(hx.lower(), hx)
    path.write_text(re.sub(r'#[0-9a-fA-F]{3,8}\b', repl, src))
    print(f'\n{len(table)} ta rang yozildi -> {path}')
