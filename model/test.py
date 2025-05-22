import cv2
import numpy as np
import pyautogui
from ultralytics import YOLO

# YOLO modeli yükle
model = YOLO("best.pt")  # Modelini kendi yoluna göre ayarla

CONF_THRESHOLD = 0.5  # İstenirse oynayabilirsin

while True:
    # Ekranın ekran görüntüsünü al (screenshot)
    img = pyautogui.screenshot(region=(100, 100, 800, 600))

    frame = np.array(img)
    frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)  # OpenCV için BGR'a çevir

    # YOLO ile tahmin
    results = model(frame, conf=CONF_THRESHOLD, verbose=False)
    annotated_frame = frame.copy()

    # Sonuçları çiz
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        confidences = result.boxes.conf.cpu().numpy()
        classes = result.boxes.cls.cpu().numpy()

        for box, confidence, cls in zip(boxes, confidences, classes):
            x1, y1, x2, y2 = map(int, box)
            label = f"{result.names[int(cls)]}: {confidence:.2f}"
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(annotated_frame, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

    cv2.imshow("Screen Detection", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cv2.destroyAllWindows()
