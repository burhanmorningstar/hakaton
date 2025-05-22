# Üretim Hattı Hata Tespit Sistemi
#ttg5hackathon2025

Bu proje, YOLOv8 tabanlı bir görüntü işleme modeli ile üretim hattında hata tespiti yapar. Sistem iki ana bileşenden oluşur:
- **Backend:** Flask tabanlı REST API (Python)
- **Frontend:** React Native (Expo) tabanlı mobil/web arayüzü

---

## İçindekiler
- [Genel Bakış](#genel-bakış)
- [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
  - [Backend Kurulumu](#backend-kurulumu)
  - [Frontend Kurulumu](#frontend-kurulumu)
- [API Endpointleri](#api-endpointleri)
- [Kullanılan Kütüphaneler](#kullanılan-kütüphaneler)
- [Model Karmaşıklık Analizi (YOLOv8)](#model-karmaşıklık-analizi-yolov8)
- [Lisans](#lisans)

---

## Genel Bakış

- **Amaç:** Üretim hattında oluşan ürün hatalarını otomatik olarak tespit etmek ve istatistiksel olarak raporlamak.
- **Model:** YOLOv8 custom model (PyTorch/Ultralytics)
- **Veritabanı:** SQLite
- **Arayüz:** Mobil ve web uyumlu (React Native + Expo)

---

## Kurulum ve Çalıştırma

### Backend Kurulumu

1. **Dizine geç:**
   ```bash
   cd backend
   ```
2. **Sanal ortam oluştur ve etkinleştir:**
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. **Gereksinimleri yükle:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Veritabanı ve model dosyasını kontrol et:**
   - `db.sqlite` dosyası backend klasöründe olmalı (ilk çalıştırmada otomatik oluşur)
   - `best.pt` (YOLOv8 model dosyası) backend klasöründe olmalı
5. **Backend'i başlat:**
   ```bash
   python run.py
   ```
   - Sunucu varsayılan olarak `http://localhost:5000` adresinde çalışır.

### Frontend Kurulumu

1. **Dizine geç:**
   ```bash
   cd hakaton
   ```
2. **Gereksinimleri yükle:**
   ```bash
   npm install
   ```
3. **Frontend'i başlat:**
   ```bash
   npm start
   # veya Expo ile:
   npx expo start
   ```
   - Expo arayüzünden Android/iOS/Web platformunda uygulamayı başlatabilirsiniz.

#### Notlar
- Backend ve frontend aynı makinede çalışıyorsa, arayüz otomatik olarak `localhost:5000`'e bağlanır.
- Farklı cihazlarda test için backend IP adresini frontend kodunda güncellemeniz gerekebilir.

---

## API Endpointleri

- `POST /upload_from_unity` : Görüntü yükle ve analiz et
- `GET /api/image-results` : Son tespit sonuçları
- `GET /api/statistics` : Genel istatistikler
- `GET /api/product` : Üretim hattı istatistikleri
- `GET /api/products/by-threshold` : Hatasız ve hatalı ürünler (sadece iki kategori)
- `GET/POST /api/threshold` : Eşik değeri oku/güncelle

---

## Kullanılan Kütüphaneler

### Backend (backend/requirements.txt)
```
flask
flask_sqlalchemy
flask_cors
ultralytics
opencv-python
numpy
```

### Frontend (hakaton/package.json'dan önemli bağımlılıklar)
```
react
react-native
expo
expo-linear-gradient
react-native-gesture-handler
react-native-reanimated
react-native-safe-area-context
react-native-screens
```

---

## Model Karmaşıklık Analizi – YOLOv8 Custom

### 🔢 Toplam Parametre Sayısı:
- **48.4M parametre** ≈ 103.44 MB

### ⚙ İşlem Karmaşıklığı (FLOPs):
- **39.35 GFLOPs** @ 640×640 input

### 🧠 Zaman Karmaşıklığı (Big-O):
- Her bir Conv2D katmanı:  
  `O(H·W·K²·Cin·Cout)`
- Tüm model:  
  `O(H·W·D) = O(n)`  
  (n: piksel × derinlik; örn. 640×640×100)

### 💾 Bellek Karmaşıklığı:
- `O(p+n)` → Parametre + Ara Çıktı ≈ **867 MB**

### 📈 Çalışma Senaryoları:

| Durum      | Girdi Boyutu | Nesne Sayısı | Karmaşıklık   |
|------------|--------------|--------------|---------------|
| En İyi     | 320x320      | 1            | O(n)          |
| Ortalama   | 640x640      | 2–3          | O(n)          |
| En Kötü    | 1280x1280    | 10+          | O(n log n)    |

#### MODELE AİT GERÇEK VERİLER

| Özellik                  | Değer                        |
|--------------------------|------------------------------|
| Toplam Parametre Sayısı  | 48,439,385 (~48.4M)          |
| FLOPs (İşlem Sayısı)     | 39.35 GFLOPs (640x640 input) |
| Model Boyutu (Parametre) | ~103.44 MB                   |
| Input Boyutu             | 640 × 640 × 3 (~4.92 MB)     |
| Forward/Backward RAM     | ~758.77 MB                   |
| Toplam Bellek Kullanımı  | ~867.13 MB                   |

#### BIG-O ANALİZİ – TEORİK TEMELLİ

- Zaman Karmaşıklığı:  
  `O(H·W·D) = O(n)`
- Bellek Karmaşıklığı:  
  `O(p+n)`

#### EN İYİ / ORTALAMA / EN KÖTÜ DURUM
- **En İyi:** Küçük girdi (320x320), tek nesne, O(n)
- **Ortalama:** 640x640, 2–3 nesne, O(n)
- **En Kötü:** 1280x1280, çok nesne, NMS O(n log n)

---

## Lisans
MIT

---

Her türlü soru ve katkı için iletişime geçebilirsiniz. 