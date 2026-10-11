"""assets/source/statue-sheet.jpg (2行x3列の6ポーズ)を、背景透過PNGに切り出して assets/mascot/ に保存する。
元画像は読み込むだけで編集しない。実行: python scripts/cut_mascot.py

make_icon.py からも、元の解像度のままポーズを切り出すために cut_pose_native() を使う。"""
from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC = "assets/source/statue-sheet.jpg"
OUT = "assets/mascot"
NAMES = [["wave", "reading", "bow"], ["fistpump", "thumbsup", "walking"]]
TARGET_H = 600
WHITE_MIN = 238  # 全チャンネルがこの値以上なら「白背景」候補
WHITE_STRICT = 244  # 閉じた隙間の白も抜く(銅像のハイライトは届かない明るさ)


def sheet_to_rgba(sheet: Image.Image) -> Image.Image:
    """シート全体の白背景を透過にした RGBA を返す"""
    sheet = sheet.convert("RGB")
    W, H = sheet.size

    # 1. 白判定マスク(白=255)。外周から塗りつぶして「背景につながる白」だけを背景とみなす
    #    (銅像内部のハイライトを誤って抜かないため)
    r, g, b = sheet.split()
    lowest = ImageChops.darker(ImageChops.darker(r, g), b)
    is_white = lowest.point(lambda v: 255 if v >= WHITE_MIN else 0)

    seed = Image.new("L", (W + 2, H + 2), 255)
    seed.paste(is_white, (1, 1))
    ImageDraw.floodfill(seed, (0, 0), 128)  # 外周の白枠から広がる=背景につながる白だけ128に
    bg = seed.crop((1, 1, W + 1, H + 1)).point(lambda v: 255 if v == 128 else 0)

    # 脚の間・腕と背中の隙間など、外周とつながらない「閉じた背景」も抜く
    strict = lowest.point(lambda v: 255 if v >= WHITE_STRICT else 0)
    bg = ImageChops.lighter(bg, strict)

    # 2. alpha = 前景。縁を1px削って白フチを消し、少しぼかして滑らかにする
    fg = ImageChops.invert(bg)
    fg = fg.filter(ImageFilter.MinFilter(3))
    fg = fg.filter(ImageFilter.GaussianBlur(0.9))
    fg = fg.point(lambda v: 0 if v < 40 else (255 if v > 215 else int((v - 40) * 255 / 175)))

    rgba = sheet.copy()
    rgba.putalpha(fg)
    return rgba


def cut_pose_native(rgba: Image.Image, row: int, col: int) -> Image.Image:
    """2x3 のグリッドのセルを切り出し、前景のバウンディングボックスまで詰める(拡縮しない=元の解像度)"""
    W, H = rgba.size
    cell = rgba.crop((col * W // 3, row * H // 2, (col + 1) * W // 3, (row + 1) * H // 2))
    bbox = cell.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    return cell.crop(bbox)


def main() -> None:
    rgba = sheet_to_rgba(Image.open(SRC))
    for row in range(2):
        for col in range(3):
            cell = cut_pose_native(rgba, row, col)
            scale = TARGET_H / cell.height
            cell = cell.resize((round(cell.width * scale), TARGET_H), Image.LANCZOS)
            path = f"{OUT}/{NAMES[row][col]}.png"
            cell.save(path, optimize=True)
            print(path, cell.size)


if __name__ == "__main__":
    main()
