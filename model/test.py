import cv2
import numpy as np
import pyautogui
from ultralytics import YOLO
from sort import Sort  # sort.py dosyan ile aynı klasörde olmalı
import send_request

# YOLO modeli yükle
model = YOLO("best.pt")

CONF_THRESHOLD = 0.5

# Tracker başlat
tracker = Sort()

# Her takip edilen objenin bir defa gönderildiğini tutmak için:
sent_ids = set()

while True:
    img = pyautogui.screenshot(region=(100, 100, 800, 600))
    frame = np.array(img)
    frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

    results = model(frame, conf=CONF_THRESHOLD, verbose=False)

    boxes = []
    for result in results:
        # Her tespit edilen nesne için bbox ve confidence bilgisi al
        for box, conf in zip(result.boxes.xyxy.cpu().numpy(), result.boxes.conf.cpu().numpy()):
            x1, y1, x2, y2 = map(int, box)
            boxes.append([x1, y1, x2, y2, conf])

    # Tracker input formatı: [[x1, y1, x2, y2, conf], ...]
    if boxes:
        dets = np.array(boxes)
    else:
        dets = np.empty((0, 5))

    # Takip edilen nesneleri al
    tracks = tracker.update(dets)

    for track in tracks:
        x1, y1, x2, y2, track_id = map(int, track[:5])
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, f"ID: {track_id}", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        # Sadece ilk defa gördüğümüzde backend'e gönderelim
        if track_id not in sent_ids:
            sent_ids.add(track_id)
            send_request.send_to_backend(
                defect_type="object",  # Örnek türü
                confidence=track[4],
                track_id=track_id
            )
            print(f"Yeni nesne: ID={track_id} | Koordinatlar=({x1},{y1})-({x2},{y2})")
            # send_to_backend(defect_type, confidence, x1, y1, x2-x1, y2-y1, track_id)

    cv2.imshow("Screen Detection + Tracking", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cv2.destroyAllWindows()
