import requests

def send_to_backend(defect_type, confidence, x, y, width, height, track_id):
    url = "http://localhost:5000/api/process-image"
    data = {
        "defect_type": defect_type,
        "confidence_score": float(confidence),
        "object_id": str(track_id)  # <-- eklenen kısım
    }
    try:
        r = requests.post(url, json=data)
        print("Backend response:", r.json())
    except Exception as e:
        print("Backend send error:", e)
