"""アプリアイコン一式を作る。実行: python scripts/make_icon.py

出力(assets/):
  icon.png          1024x1024 RGB(透過なし)。iOS用
  adaptive-icon.png 1024x1024 透過。Android用の前景(中心の直径約680pxに銅像・バッジ・文字を収める)
  favicon.png       48x48。銅像の顔だけ(web用)
  splash-icon.png   1024x1024 透過。銅像の上半身だけ(スプラッシュ用)
  (確認用の画像は assets/source/icon-preview/ に出力する)

銅像は assets/source/statue-sheet.jpg から元の解像度で切り出す(600px高さに縮めた assets/mascot/ の
PNG を拡大するより、くっきりするため)。フォントは Windows 付属の Noto Sans JP(可変フォント)の
最大ウェイト(Black=900)。Noto Sans CJK JP と同じ字形。
"""
import math
import os

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

from cut_mascot import SRC, cut_pose_native, sheet_to_rgba

LIME = (212, 242, 56, 255)
BLACK = (15, 15, 15, 255)
WHITE = (255, 255, 255, 255)

FONT_PATH = "C:/Windows/Fonts/NotoSansJP-VF.ttf"
FONT_WEIGHT = 900  # Black

SS = 2  # 2倍の大きさで描いてから縮小し、縁をなめらかにする
SIZE = 1024

STATUE_W, STATUE_X, STATUE_Y = 830, 95, 60
OUTLINE = 14
BAND_TOP = 745
BADGE = (60, 693, 330, 793)  # 左, 上, 右, 下
BADGE_RADIUS = 30

OUT_DIR = "assets"
PREVIEW_DIR = "assets/source/icon-preview"


def font(size: int) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(FONT_PATH, size * SS)
    f.set_variation_by_axes([FONT_WEIGHT])
    return f


def load_statue_upper_half() -> Image.Image:
    """thumbsup の上半身(上から50%)を、元の解像度のまま切り出す"""
    rgba = sheet_to_rgba(Image.open(SRC))
    pose = cut_pose_native(rgba, 1, 1)
    return pose.crop((0, 0, pose.width, pose.height // 2))


def dilate(alpha: Image.Image, radius: int) -> Image.Image:
    """alpha を半径 radius px だけ丸く太らせる(円周上と内側の複数の半径にずらして重ね、最後にぼかして滑らかにする)"""
    out = alpha.copy()
    w, h = alpha.size
    for r in [radius, radius * 0.75, radius * 0.5, radius * 0.25]:
        steps = 72 if r == radius else 48
        for k in range(steps):
            ang = 2 * math.pi * k / steps
            shifted = Image.new("L", (w, h), 0)
            shifted.paste(alpha, (round(r * math.cos(ang)), round(r * math.sin(ang))))
            out = ImageChops.lighter(out, shifted)
    out = out.filter(ImageFilter.GaussianBlur(1.6 * SS))
    # ぼかした縁を、半透明の滑らかな縁に整える
    return out.point(lambda v: 0 if v < 100 else (255 if v > 156 else int((v - 100) * 255 / 56)))


def draw_centered_text(layer: Image.Image, text: str, size: int, center: tuple, fill) -> None:
    """文字のインク(実際に塗られる範囲)の中心が center に来るように描く"""
    f = font(size)
    d = ImageDraw.Draw(layer)
    left, top, right, bottom = d.textbbox((0, 0), text, font=f, anchor="la")
    cx, cy = center[0] * SS, center[1] * SS
    d.text((cx - (left + right) / 2, cy - (top + bottom) / 2), text, font=f, fill=fill, anchor="la")


def build_icon_layers(statue_half: Image.Image):
    """アイコンの各パーツを、透過のレイヤーとして返す(2倍サイズ)。背景は含まない"""
    canvas = (SIZE * SS, SIZE * SS)

    scale = STATUE_W * SS / statue_half.width
    statue = statue_half.resize((STATUE_W * SS, round(statue_half.height * scale)), Image.LANCZOS)
    statue_layer = Image.new("RGBA", canvas, (0, 0, 0, 0))
    statue_layer.paste(statue, (STATUE_X * SS, STATUE_Y * SS))

    # 白い縁取り(ステッカー風): 銅像の輪郭の外側に OUTLINE px
    outline_alpha = dilate(statue_layer.getchannel("A"), OUTLINE * SS)
    outline_layer = Image.new("RGBA", canvas, WHITE)
    outline_layer.putalpha(outline_alpha)

    band_layer = Image.new("RGBA", canvas, (0, 0, 0, 0))
    ImageDraw.Draw(band_layer).rectangle(
        (0, BAND_TOP * SS, SIZE * SS, SIZE * SS), fill=BLACK
    )

    badge_layer = Image.new("RGBA", canvas, (0, 0, 0, 0))
    ImageDraw.Draw(badge_layer).rounded_rectangle(
        tuple(v * SS for v in BADGE), radius=BADGE_RADIUS * SS, fill=LIME
    )

    text_layer = Image.new("RGBA", canvas, (0, 0, 0, 0))
    draw_centered_text(text_layer, "衛生管理者", 160, (SIZE / 2, 925), WHITE)
    badge_center = ((BADGE[0] + BADGE[2]) / 2, (BADGE[1] + BADGE[3]) / 2)
    draw_centered_text(text_layer, "第二種", 64, badge_center, BLACK)
    # バッジの文字は黒、帯の文字は白。上の2回の描画は fill が違うだけで、同じレイヤーに重ねている

    return outline_layer, statue_layer, band_layer, badge_layer, text_layer


def compose(layers, background=None) -> Image.Image:
    base = Image.new("RGBA", layers[0].size, background if background else (0, 0, 0, 0))
    for layer in layers:
        base.alpha_composite(layer)
    return base


def downscale(img: Image.Image, size: int) -> Image.Image:
    return img.resize((size, size), Image.LANCZOS)


def make_icon(layers) -> Image.Image:
    outline, statue, band, badge, text = layers
    # 下から: 背景 → 縁取り → 銅像 → 帯 → バッジ → 文字
    full = compose([outline, statue, band, badge, text], background=LIME)
    return downscale(full, SIZE).convert("RGB")  # 透過なし(RGB)


def make_adaptive(layers) -> Image.Image:
    """銅像・縁取り・バッジ・文字が中心の直径 約680px の円に収まるよう、全体を縮小して中央に置く"""
    outline, statue, band, badge, text = layers
    full = compose([outline, statue, band, badge, text])

    # 円に収める対象(帯は除く): 銅像+縁取り、バッジ、文字
    focus = compose([outline, statue, badge, text])
    small = focus.getchannel("A").resize((SIZE // 2, SIZE // 2), Image.LANCZOS).point(
        lambda v: 255 if v > 40 else 0
    )
    bbox = small.getbbox()
    cx, cy = (bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2
    data = small.load()
    max_r = 0.0
    for y in range(bbox[1], bbox[3]):
        for x in range(bbox[0], bbox[2]):
            if data[x, y]:
                max_r = max(max_r, math.hypot(x - cx, y - cy))
    max_r *= 2  # 縮小した分を元の座標に戻す
    cx, cy = cx * 2, cy * 2  # 1024座標

    target_diameter = 680
    s = (target_diameter / 2) / max_r
    scaled = full.resize((round(SIZE * s), round(SIZE * s)), Image.LANCZOS)
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    # 対象の中心(cx, cy)がキャンバスの中心(512, 512)に来るように貼る(はみ出す部分は切り捨て)
    _paste_clipped(canvas, scaled, round(SIZE / 2 - cx * s), round(SIZE / 2 - cy * s))
    print(f"adaptive: scale={s:.3f}, content radius={max_r * s:.1f}px")
    return canvas


def _paste_clipped(canvas: Image.Image, img: Image.Image, x: int, y: int) -> None:
    """キャンバスからはみ出す部分を切り捨てて貼る"""
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    layer.paste(img, (x, y))
    canvas.alpha_composite(layer)


def make_favicon(statue_half: Image.Image) -> Image.Image:
    """銅像の顔だけを、ライムの背景に置いた 48x48(文字なし)"""
    w, h = statue_half.size
    # 顔(髪の毛から顎まで)。上半身の画像の上部を、中央付近で切り出す
    face = statue_half.crop((round(w * 0.34), 0, round(w * 0.76), round(h * 0.32)))
    box = 256
    canvas = Image.new("RGBA", (box, box), LIME)
    scale = min(box * 0.9 / face.width, box * 0.9 / face.height)
    face = face.resize((round(face.width * scale), round(face.height * scale)), Image.LANCZOS)
    canvas.alpha_composite(face, ((box - face.width) // 2, (box - face.height) // 2))
    return canvas.resize((48, 48), Image.LANCZOS).convert("RGB")


def make_splash(statue_half: Image.Image) -> Image.Image:
    """銅像の上半身だけ(文字・帯・バッジなし)を、透過の1024x1024の中央に置く"""
    width = 760
    scale = width / statue_half.width
    img = statue_half.resize((width, round(statue_half.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(img, ((SIZE - img.width) // 2, (SIZE - img.height) // 2))
    return canvas


def preview_with_mask(img: Image.Image, background) -> Image.Image:
    """adaptive-icon の確認用: ライム背景に載せ、安全領域(直径680の円)と角丸の目安線を描く"""
    base = Image.new("RGBA", img.size, background)
    base.alpha_composite(img)
    d = ImageDraw.Draw(base)
    c = SIZE / 2
    d.ellipse((c - 340, c - 340, c + 340, c + 340), outline=(255, 0, 0, 255), width=3)
    return base.convert("RGB")


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(PREVIEW_DIR, exist_ok=True)

    statue_half = load_statue_upper_half()
    print("statue (native upper half):", statue_half.size)
    layers = build_icon_layers(statue_half)

    icon = make_icon(layers)
    icon.save(f"{OUT_DIR}/icon.png")

    adaptive = make_adaptive(layers)
    adaptive.save(f"{OUT_DIR}/adaptive-icon.png")

    make_favicon(statue_half).save(f"{OUT_DIR}/favicon.png")
    make_splash(statue_half).save(f"{OUT_DIR}/splash-icon.png")

    # 確認用の画像
    preview_with_mask(adaptive, LIME).save(f"{PREVIEW_DIR}/adaptive-on-lime.png")
    icon.resize((60, 60), Image.LANCZOS).save(f"{PREVIEW_DIR}/icon-60.png")
    print("icon mode:", icon.mode, "| adaptive mode:", adaptive.mode)


if __name__ == "__main__":
    main()
