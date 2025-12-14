import json
import os
import time
import requests
import fal_client
from pathlib import Path

# Configuration
REQUIREMENTS_FILE = Path("food_image_requirements.json")
OUTPUT_DIR = Path("media/food_images")
FAL_MODEL = "fal-ai/gpt-image-1-mini"

def ensure_directories():
    """Ensure output directory exists."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def get_safe_filename(name):
    """Create a safe filename from the food name."""
    return name.lower().replace(" ", "_").replace(",", "").replace("/", "_").replace("(", "").replace(")", "") + ".png"

def generate_image(food_name):
    """Generate an image using Fal.ai."""
    # create a prompt for Apple emoji styled food images
    prompt = f"""Create a high-quality Apple-style emoji of the food item: {food_name}.
The image should depict the food ready to be eaten.
Style: Signature Apple emoji style - 3D, glossy, highly detailed, vibrant colors, smooth vector-like appearance.
Context: Isolated on a completely transparent background with a slight drop shadow.
CRITICAL: It must look appetizing and edible. 
- For animals (e.g., crab, fish, chicken), show it as a PREPARED FOOD DISH or MEAT (e.g., cooked crab legs, grilled fish), NOT as a cute living character or cartoon animal.
- For ingredients (e.g., peanut butter, flour), show it in a natural, appetizing presentation (e.g., peanut butter on a spoon or in a jar, but stylized).
DO NOT include any text, letters, numbers, or labels. The image must contain only the food item itself."""
    
    print(f"Generating image for: {food_name}...")
    try:
        handler = fal_client.submit(
            FAL_MODEL,
            arguments={
                "prompt": prompt,
                "image_size": "1024x1024", 
                "background": "transparent",
                "quality": "high",
                "num_images": 1,
                "output_format": "png"
            },
        )
        
        result = handler.get()
        
        if result and "images" in result and len(result["images"]) > 0:
            image_url = result["images"][0]["url"]
            return image_url
        else:
            print(f"Error: No image returned for {food_name}")
            return None
            
    except Exception as e:
        print(f"Error generating image for {food_name}: {e}")
        return None

def download_image(url, filepath):
    """Download image from URL to file."""
    try:
        response = requests.get(url)
        response.raise_for_status()
        with open(filepath, 'wb') as f:
            f.write(response.content)
        return True
    except Exception as e:
        print(f"Error downloading image: {e}")
        return False

def main():
    # Load environment variables from .env file
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")

    # Check for FAL or FAL_KEY
    if "FAL_KEY" not in os.environ:
        if "FAL" in os.environ:
            os.environ["FAL_KEY"] = os.environ["FAL"]
        else:
            print("Error: FAL_KEY (or FAL) environment variable not set.")
            return

    ensure_directories()
    
    if not REQUIREMENTS_FILE.exists():
        print(f"Error: Requirements file {REQUIREMENTS_FILE} not found.")
        return

    with open(REQUIREMENTS_FILE, 'r') as f:
        requirements = json.load(f)

    print(f"Found {len(requirements)} food groups to process.")
    
    success_count = 0
    skip_count = 0
    fail_count = 0

    for i, item in enumerate(requirements):
        normalized_name = item['normalized_name']
        filename = get_safe_filename(normalized_name)
        filepath = OUTPUT_DIR / filename
        
        if filepath.exists():
            print(f"Skipping {normalized_name} (already exists)")
            skip_count += 1
            continue

        # Use the first example as the prompt subject if the normalized name is too generic?
        # Actually, the normalized name like "carrots" is usually good. 
        # But sometimes "carrots, raw" -> "carrots".
        # Let's use the normalized name for the prompt as requested.
        
        image_url = generate_image(normalized_name)
        
        if image_url:
            if download_image(image_url, filepath):
                print(f"Successfully saved {filename}")
                success_count += 1
            else:
                fail_count += 1
        else:
            fail_count += 1
            
        # Rate limiting / politeness
        time.sleep(1)

    print("\n--- Summary ---")
    print(f"Total processed: {len(requirements)}")
    print(f"Successful: {success_count}")
    print(f"Skipped: {skip_count}")
    print(f"Failed: {fail_count}")

if __name__ == "__main__":
    main()
