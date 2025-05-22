import random
import requests
import json
import time

BASE_URL = 'http://localhost:5000/api'

def post_image_result(defect_type, confidence_score, location_x=0, location_y=0, width=0, height=0):
    """Post an image processing result to API"""
    data = {
        "defect_type": defect_type,
        "confidence_score": confidence_score,
        "location_x": location_x,
        "location_y": location_y,
        "width": width,
        "height": height
    }
    
    try:
        response = requests.post(f"{BASE_URL}/image-processing", json=data, timeout=5)
        if response.status_code == 201:
            print(f"POST successful: {defect_type}, confidence: {confidence_score:.2f}")
            return True
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            return False
    except requests.exceptions.RequestException as e:
        print(f"Network error: {e}")
        return False

def generate_defective_part():
    """Generate data for a defective part"""
    defect_types = ["scratch", "crack", "hole", "deformation"]
    defect_type = random.choice(defect_types)
    # High confidence score for defects (0.5 to 0.98)
    confidence_score = random.uniform(0.5, 0.98)
    location_x = random.randint(0, 1000)
    location_y = random.randint(0, 1000)
    width = random.randint(5, 100)
    height = random.randint(5, 100)
    
    return post_image_result(
        defect_type, 
        confidence_score, 
        location_x, 
        location_y, 
        width, 
        height
    )

def generate_non_defective_part():
    """Generate data for a non-defective part (good part)"""
    # Low confidence score for non-defects (0.01 to 0.15)
    confidence_score = random.uniform(0.01, 0.15)
    
    return post_image_result(
        "no_defect",
        confidence_score
    )

def clear_existing_data():
    """Clear existing data from database"""
    try:
        response = requests.post(f"{BASE_URL}/clear-results", timeout=5)
        if response.status_code == 200:
            print("All previous records cleared successfully")
            return True
        else:
            print(f"Failed to clear data: {response.status_code}")
            print(response.text)
            return False
    except requests.exceptions.RequestException as e:
        print(f"Network error when clearing data: {e}")
        return False

def main():
    # Ask if existing data should be cleared
    clear_data = input("Clear existing data? (y/n): ").lower() == 'y'
    if clear_data:
        if not clear_existing_data():
            print("Failed to clear data, stopping.")
            return
    
    # How many records to generate
    total_parts = int(input("How many total parts to simulate? (default: 100): ") or "100")
    
    # Defect ratio (percentage of parts that have defects)
    defect_ratio = float(input("What percentage of parts should have defects? (1-100, default: 20): ") or "20")
    defect_ratio = max(1, min(100, defect_ratio)) / 100
    
    print(f"\nGenerating data for {total_parts} parts ({defect_ratio*100:.1f}% defective)...\n")
    
    success_count = 0
    defect_count = 0
    non_defect_count = 0
    
    for i in range(total_parts):
        # Determine if this part is defective based on the ratio
        is_defective = random.random() < defect_ratio
        
        if is_defective:
            if generate_defective_part():
                success_count += 1
                defect_count += 1
        else:
            if generate_non_defective_part():
                success_count += 1
                non_defect_count += 1
                
        # Small delay to avoid overwhelming the server
        time.sleep(0.1)
    
    print("\nData generation complete!")
    print(f"Successfully added: {success_count}/{total_parts} parts")
    print(f"Defective parts: {defect_count}")
    print(f"Non-defective parts: {non_defect_count}")

if __name__ == "__main__":
    main()