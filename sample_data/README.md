# 🧪 Rakshak Sample Scans & Printable QR Badges

This directory provides real test data for judges, evaluators, and developers to test the **Rakshak AI Optical Dosimeter Scanner**.

---

## 📂 Directory Structure

```
sample_data/
├── printable_qr_badges/
│   ├── WRISTBAND_QR_EMP-1042_BAND-1042-01.png   # Printable QR badge for Sumedh Kulkarni (CDU-1)
│   └── WRISTBAND_QR_EMP-1043_BAND-1043-03.png   # Printable QR badge for Sunil Verma (DHDS)
└── test_wristband_scans/
    ├── WhatsApp Image 2026-09-02 at 12.44.24.jpeg  # High exposure shifted badge
    ├── WhatsApp Image 2026-09-02 at 13.05.51.jpeg  # Low exposure / baseline badge
    ├── WhatsApp Image 2026-09-02 at 13.05.52.jpeg  # Moderate exposure badge
    └── ...
```

---

## 🚀 How to Test the AI Optical Scanner

### Method 1: Upload via UI (Easiest)
1. Open the locally hosted or deployed app at: **`/manager/scan`**
2. In the bottom section under **"Upload Badge Photo"**, click **"Select Image File"**.
3. Choose any image from `sample_data/test_wristband_scans/`.
4. The custom OpenCV pipeline will automatically:
   - Identify the blue silicone substrate and purple anthocyanin matrix (anti-spoofing gating).
   - Evaluate lighting, glare, and blur sharpness.
   - Measure the CIELAB color distance ($\Delta E$).
   - Run the onboard 3-layer neural network forward pass to estimate exposure duration!

### Method 2: Scan with Real Camera / Phone
1. Print or open one of the files in `sample_data/printable_qr_badges/` on a second screen.
2. Launch the camera on `/manager/scan` or on the `/manager` supervisor dashboard.
3. Aim your camera at the QR code. The system will lock on, auto-detect the worker ID (`EMP-1042`), and trigger optical evaluation.
