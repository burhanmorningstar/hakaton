# Üretim Hattı Hata Tespit API Dokümantasyonu

Bu belge, üretim hattı hata tespit uygulamasının tüm API endpoint'lerini ve bunların nasıl kullanılacağını açıklar.

## Baz URL

API'nın baz URL'i şudur:

- Geliştirme ortamı: `http://localhost:5000`
- Android Emulator: `http://10.0.2.2:5000`

## Bağlantı Testi

### `GET /test`

Sunucu bağlantısını test etmek için kullanılır.

**Cevap:**

```json
{
  "message": "API is working!",
  "status": "success"
}
```

**Kullanım Örneği:**

```javascript
fetch('http://localhost:5000/test')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Bağlantı hatası:', error));
```

## Ürün İşlemleri

### `GET /api/product`

Üretim hattı bilgilerini döndürür.

**Cevap:**

```json
{
  "id": 1,
  "name": "Üretim Hattı",
  "error_rate": 1.5,
  "production_count": 1000,
  "error_count": 15
}
```

**Kullanım Örneği:**

```javascript
fetch('http://localhost:5000/api/product')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Hata:', error));
```

### `POST /api/product/update-production`

Üretim sayısını günceller ve hata oranını yeniden hesaplar.

**İstek Gövdesi:**

```json
{
  "count": 1
}
```

**Parametreler:**

- `count` (isteğe bağlı): Artırılacak üretim sayısı. Varsayılan: 1

**Cevap:**

```json
{
  "message": "Production count updated successfully"
}
```

**Kullanım Örneği:**

```javascript
fetch('http://localhost:5000/api/product/update-production', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ count: 5 })
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Hata:', error));
```

### `POST /api/product/repair-error-rates`

Veritabanındaki NULL error_rate değerlerini hesaplayarak düzeltir.

**Cevap:**

```json
{
  "message": "Error rates repaired successfully"
}
```

**Kullanım Örneği:**

```javascript
fetch('http://localhost:5000/api/product/repair-error-rates', {
  method: 'POST'
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Hata:', error));
```

### `POST /api/product/reset`

Ürün istatistiklerini sıfırlar ve görüntü işleme sonuçlarını temizler.

**Cevap:**

```json
{
  "message": "Product statistics reset successfully"
}
```

**Kullanım Örneği:**

```javascript
fetch('http://localhost:5000/api/product/reset', {
  method: 'POST'
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Hata:', error));
```

## İstatistik İşlemleri

### `GET /api/statistics`

Sistem istatistiklerini döndürür.

**Cevap:**

```json
{
  "total_production": 1000,
  "total_errors": 15,
  "error_rate": 1.5,
  "error_by_type": {
    "scratch": 5,
    "dent": 3,
    "color_mismatch": 7
  }
}
```

**Kullanım Örneği:**

```javascript
fetch('http://localhost:5000/api/statistics')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Hata:', error));
```

## Görüntü İşleme Sonuçları

### `GET /api/image-results`

Görüntü işleme sonuçlarını döndürür.

**Parametreler:**

- `limit` (isteğe bağlı): Döndürülecek maksimum sonuç sayısı
- `offset` (isteğe bağlı): Atlama sayısı (sayfalama için)

**Cevap:**

```json
[
  {
    "id": 1,
    "timestamp": "2023-07-15T10:30:45",
    "defect_type": "scratch",
    "confidence_score": 0.85,
    "location_x": 120,
    "location_y": 240,
    "width": 30,
    "height": 10
  },
  {
    "id": 2,
    "timestamp": "2023-07-15T10:31:20",
    "defect_type": "dent",
    "confidence_score": 0.92,
    "location_x": 320,
    "location_y": 150,
    "width": 25,
    "height": 25
  }
]
```

**Kullanım Örneği:**

```javascript
fetch('http://localhost:5000/api/image-results?limit=10')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Hata:', error));
```

### `POST /api/process-image`

Görüntü işleme işlemini tetikler ve sonuçları kaydeder.

**İstek Gövdesi:**

```json
{
  "defect_type": "scratch",
  "confidence_score": 0.85,
  "location_x": 120,
  "location_y": 240,
  "width": 30,
  "height": 10
}
```

**Parametreler:**

- `defect_type` (zorunlu): Hata tipi (örn. "scratch", "dent", "color_mismatch")
- `confidence_score` (zorunlu): Tespit güvenilirlik skoru (0-1 arasında)
- `location_x` (zorunlu): Hatanın x koordinatı
- `location_y` (zorunlu): Hatanın y koordinatı
- `width` (zorunlu): Hata genişliği
- `height` (zorunlu): Hata yüksekliği

**Cevap:**

```json
{
  "id": 3,
  "message": "Image processing result saved successfully"
}
```

**Kullanım Örneği:**

```javascript
fetch('http://localhost:5000/api/process-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "defect_type": "scratch",
    "confidence_score": 0.85,
    "location_x": 120,
    "location_y": 240,
    "width": 30,
    "height": 10
  })
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Hata:', error));
```

## Hata Eşik Değeri Kullanımı (Frontend)

Uygulama, belirli bir hata güvenilirlik eşik değeri üzerinde olan tespitleri filtrelemeye olanak tanır.

### Eşik Değeri Nasıl Kullanılır

1. Eşik değeri giriş alanına istenen yüzde değerini girin (örneğin "2.0")
2. "Uygula" butonuna tıklayın
3. Belirtilen eşik değeri üzerinde güvenilirlik skoruna sahip hata tespitleri filtrelenerek görüntülenecektir
4. Bu değer, confidence_score değeri eşik değerinden büyük veya eşit olan sonuçları filtrelemek için kullanılır

## Geliştirici Notları

### Hata Oranı (error_rate) Hesaplama

Hata oranı, aşağıdaki formül kullanılarak hesaplanır:

```
error_rate = (error_count * 100.0) / production_count
```

- `error_count`: Tespit edilen toplam hata sayısı
- `production_count`: Toplam üretim sayısı

### Hata Oranı Düzeltme Mekanizması

Veritabanında NULL error_rate değerleri olması durumunda:

1. Uygulama başlatıldığında otomatik olarak repair işlemi çalıştırılır
2. Gerektiğinde `/api/product/repair-error-rates` endpoint'i çağrılabilir
3. Frontend, NULL değerleri algılar ve gerektiğinde istemci tarafında hesaplama yapar

## Güvenlik ve Hata İşleme

Tüm API istekleri için önerilen hata işleme:

```javascript
fetch('http://localhost:5000/api/endpoint')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => console.log(data))
  .catch(error => {
    console.error('API error:', error);
    // Kullanıcıya uygun hata mesajı göster
  });
``` 