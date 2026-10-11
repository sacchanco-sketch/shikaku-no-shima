"""assets/source/statue-sheet.jpg (2行x3列の6ポーズ)を、背景透過PNGに切り出して assets/mascot/ に保存する。
元画像は読み込むだけで編集しない。実行: python scripts/cut_mascot.py"""
from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC = "assets/source/statue-sheet.jpg"
OUT = "assets/mascot"
NAMES = [["wave", "reading", "bow"], ["fistpump", "thumbsup", "walking"]]
TARGET_H = 600
WHITE_MIN = 238
WHITE_STRICT = 244  # 全チャンネルがこの値以上なら「白背景」候補

sheet = Image.open(SRC).convert("RGB")
W, H = sheet.size

# 1. 白判定マスク(白=255)。外周から塗りつぶして「背景につながる白」だけを背景とみなす
#    (銅像内部のハイライトを誤って抜かないため)
r, g, b = sheet.split()
lowest = ImageChops.darker(ImageChops.darker(r, g), b)
is_white = lowest.point(lambda v: 255 if v >= WHITE_MIN else 0)

bg = is_white.copy()
# 外周全体を種にして塗りつぶす
seed = Image.new("L", (W + 2, H + 2), 255)
seed.paste(is_white, (1, 1))
ImageDraw.floodfill(seed, (0, 0), 128)  # 外周の白枠から広がる=背景につながる白だけ128に
bg = seed.crop((1, 1, W + 1, H + 1)).point(lambda v: 255 if v == 128 else 0)

# 2. alpha = 前景(背景でない部分)。縁を1px削って白フチを消し、少しぼかして滑らかにする
# 脚の間・腕と背中の隙間など、外周とつながらない「閉じた背景」も抜く。
# (純白に近い=WHITE_STRICT以上のみ。銅像のハイライトは届かない明るさ)
strict = lowest.point(lambda v: 255 if v >= WHITE_STRICT else 0)
bg = ImageChops.lighter(bg, strict)

fg = ImageChops.invert(bg)
fg = fg.filter(ImageFilter.MinFilter(3))
fg = fg.filter(ImageFilter.GaussianBlur(0.9))
fg = fg.point(lambda v: 0 if v < 40 else (255 if v > 215 else int((v - 40) * 255 / 175)))

rgba = sheet.copy()
rgba.putalpha(fg)

# 3. 2x3 のグリッドで切り分け、各セルの前景バウンディングボックスまで余白を詰める
for row in range(2):
    for col in range(3):
        cell_box = (col * W // 3, row * H // 2, (col + 1) * W // 3, (row + 1) * H // 2)
        cell = rgba.crop(cell_box)
        bbox = cell.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
        cell = cell.crop(bbox)
        scale = TARGET_H / cell.height
        cell = cell.resize((round(cell.width * scale), TARGET_H), Image.LANCZOS)
        path = f"{OUT}/{NAMES[row][col]}.png"
        cell.save(path, optimize=True)
        print(path, cell.size)
