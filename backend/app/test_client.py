import json
import requests

# API endpoint
BASE_URL = 'http://localhost:5000/api'

def test_get_product():
    """Test getting product data"""
    response = requests.get(f"{BASE_URL}/product")
    if response.status_code == 200:
        print("GET /product success!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

def test_update_production():
    """Test updating production count"""
    data = {"count": 5}
    response = requests.post(f"{BASE_URL}/product/update-production", json=data)
    if response.status_code == 200:
        print("POST /product/update-production success!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

def test_get_statistics():
    """Test getting statistics"""
    response = requests.get(f"{BASE_URL}/statistics")
    if response.status_code == 200:
        print("GET /statistics success!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

def test_post_image_processing():
    """Test posting image processing result"""
    data = {
        "defect_type": "scratch",
        "confidence_score": 0.95,
        "location_x": 100,
        "location_y": 150,
        "width": 50,
        "height": 30
    }
    
    response = requests.post(f"{BASE_URL}/image-processing", json=data)
    if response.status_code == 201:
        print("POST /image-processing success!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

def test_get_image_results():
    """Test getting image processing results"""
    response = requests.get(f"{BASE_URL}/image-results")
    if response.status_code == 200:
        print("GET /image-results success!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

def test_reset_all():
    """Test resetting all data"""
    response = requests.post(f"{BASE_URL}/product/reset")
    if response.status_code == 200:
        print("POST /product/reset success!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    # Run tests
    print("Testing API endpoints...")
    
    # Uncomment tests to run
    test_get_product()
    # test_update_production()
    # test_get_statistics()
    # test_post_image_processing()
    # test_get_image_results()
    # test_reset_all() 