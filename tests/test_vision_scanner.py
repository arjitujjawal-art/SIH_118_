import io
import pytest
import numpy as np
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from backend.main import app
from backend.engine.vision_scanner import vision_scanner, VisionScanner

client = TestClient(app)

def create_synthetic_badge_image(spot_rgb=(235, 115, 30), bg_rgb=(240, 240, 240), spot_radius=18, blue_wristband=True):
    """
    Generates a realistic test badge image with blue wristband substrate
    and reactive central spot.
    """
    # 128x128 image
    if blue_wristband:
        # Blue wristband substrate: (2, 132, 199)
        img = Image.new("RGB", (128, 128), color=(2, 132, 199))
        draw = ImageDraw.Draw(img)
        # Inner white patch
        draw.rectangle([20, 20, 108, 108], fill=bg_rgb)
    else:
        # Generic non-badge skin/room tone: (210, 160, 130)
        img = Image.new("RGB", (128, 128), color=(210, 160, 130))
        draw = ImageDraw.Draw(img)

    cx, cy = 64, 64
    for y in range(cy - spot_radius, cy + spot_radius):
        for x in range(cx - spot_radius, cx + spot_radius):
            if (x - cx) ** 2 + (y - cy) ** 2 <= spot_radius ** 2:
                img.putpixel((x, y), spot_rgb)
                
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_vision_scanner_model_loaded():
    assert vision_scanner.model_loaded is True
    assert vision_scanner.w1.shape == (2, 12)
    assert vision_scanner.w2.shape == (12, 6)
    assert vision_scanner.w3.shape == (6, 1)

def test_cielab_conversion_neutral():
    rgb = np.array([[[255, 255, 255]]], dtype=np.float64)
    lab = vision_scanner.rgb_to_lab(rgb)
    assert round(lab[0, 0, 0], 0) >= 99.0
    assert abs(lab[0, 0, 1]) < 2.0
    assert abs(lab[0, 0, 2]) < 2.0

def test_mlp_forward_pass():
    seconds, log10_s = vision_scanner.predict_exposure_seconds(0.4, 8.5)
    assert seconds > 0.0
    assert np.log10(8.0) <= log10_s <= np.log10(43200.0)

def test_photo_quality_grading():
    normal_img = np.full((128, 128, 3), 150, dtype=np.float64)
    normal_img[::2, ::2] = 170
    q = vision_scanner.inspect_photo_quality(normal_img)
    assert q["is_usable"] is True
    assert q["quality_rating"] in ["EXCELLENT", "GOOD"]

    glare_img = np.full((128, 128, 3), 250, dtype=np.float64)
    q_glare = vision_scanner.inspect_photo_quality(glare_img)
    assert "Excessive glare on strip surface" in q_glare["quality_issues"] or q_glare["glare_percentage"] > 10.0

def test_reject_non_blue_strip():
    # Image with no blue substrate (e.g. human face / skin tones)
    non_badge_bytes = create_synthetic_badge_image(blue_wristband=False)
    res = vision_scanner.analyze_badge_image(non_badge_bytes)
    assert res["success"] is False
    assert res["strip_detected"] is False
    assert "No valid STRELA dosimeter strip detected" in res["error"] or "No valid Rakshak dosimeter strip detected" in res["error"]

def test_accept_blue_badge_image():
    # Valid blue dosimeter strip image
    badge_bytes = create_synthetic_badge_image(blue_wristband=True, spot_radius=18)
    res = vision_scanner.analyze_badge_image(badge_bytes)
    assert res["success"] is True
    assert res["strip_detected"] is True
    assert res["delta_e"] > 10.0
    assert res["orange_area_fraction"] > 0.05
    assert "predicted_seconds" in res
    assert "predicted_exposure_human" in res
    assert res["confidence"] in ["HIGH", "MEDIUM", "LOW"]

def test_analyze_image_api_endpoint_with_blue_badge():
    badge_bytes = create_synthetic_badge_image(blue_wristband=True)
    files = {"file": ("blue_badge.png", badge_bytes, "image/png")}
    response = client.post("/api/scan/analyze-image", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["strip_detected"] is True
    assert "delta_e" in data
    assert "quality_scorecard" in data

def test_analyze_image_api_endpoint_with_invalid_photo():
    non_badge_bytes = create_synthetic_badge_image(blue_wristband=False)
    files = {"file": ("face_photo.png", non_badge_bytes, "image/png")}
    response = client.post("/api/scan/analyze-image", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["strip_detected"] is False
    assert "No valid STRELA dosimeter strip detected" in data["error"]
