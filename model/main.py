from ultralytics import YOLO
import cv2

# Modeli indir/yükle (ilk çalıştırmada otomatik indirir)
model = YOLO('runs/detect/train/weights/best.pt')  # 'n' = nano (en hızlısı), 's' küçük, 'm' orta, 'l' büyük

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Kamera açılamadı!")
    exit()

print("YOLOv8 ile gerçek zamanlı nesne tespiti başlatıldı. Çıkmak için 'q'.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame)  # Frame'i doğrudan modele ver

    # Tespit edilen kutuları ve isimleri çiz
    annotated_frame = results[0].plot()  # Tüm kutular otomatik çiziliyor

    # Konsola nesne isimleri ve skorları yaz
    for box in results[0].boxes:
        cls_id = int(box.cls[0])
        class_name = model.model.names[cls_id]
        score = float(box.conf[0])
        print(f"Nesne: {class_name}, Skor: {score:.2f}")

    cv2.imshow("YOLOv8 Nesne Tespiti", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("Çıkış yapıldı.")
        break

cap.release()
cv2.destroyAllWindows()
