"""
Script to download all food images from foods.json and create 3 optimized versions:
- high quality (original or slightly compressed)
- medium quality (~70% compression)
- low quality (~40% compression)
"""

import json
import os
import requests
from PIL import Image
from io import BytesIO
import hashlib
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm


# Configuration
FOODS_JSON_PATH = "foods.json"
OUTPUT_DIR = "../../static/food_images"
HIGH_QUALITY_DIR = os.path.join(OUTPUT_DIR, "high")
MEDIUM_QUALITY_DIR = os.path.join(OUTPUT_DIR, "medium")
LOW_QUALITY_DIR = os.path.join(OUTPUT_DIR, "low")

# Image quality settings
HIGH_QUALITY = 95
MEDIUM_QUALITY = 70
LOW_QUALITY = 40

# Maximum dimensions to preserve reasonable file sizes
MAX_WIDTH_HIGH = 1200
MAX_WIDTH_MEDIUM = 800
MAX_WIDTH_LOW = 400


def create_directories():
    """Create necessary directories for storing images."""
    for directory in [HIGH_QUALITY_DIR, MEDIUM_QUALITY_DIR, LOW_QUALITY_DIR]:
        Path(directory).mkdir(parents=True, exist_ok=True)
    print(f"✓ Created directories: {OUTPUT_DIR}")


def sanitize_filename(name):
    """Convert food name to a safe filename."""
    # Remove special characters and replace spaces with underscores
    safe_name = "".join(c if c.isalnum() or c in (' ', '-', '_') else '' for c in name)
    safe_name = safe_name.replace(' ', '_').lower()
    return safe_name


def get_image_hash(image_bytes):
    """Generate a hash for the image to create unique filenames."""
    return hashlib.md5(image_bytes).hexdigest()[:8]


def resize_and_compress_image(image, max_width, quality):
    """Resize and compress an image."""
    # Convert RGBA to RGB if necessary
    if image.mode == 'RGBA':
        background = Image.new('RGB', image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[3])
        image = background
    elif image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Resize if necessary
    if image.width > max_width:
        ratio = max_width / image.width
        new_height = int(image.height * ratio)
        image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)
    
    # Compress to WebP
    output = BytesIO()
    image.save(output, format='WEBP', quality=quality, method=6)
    return output.getvalue()


def download_and_process_image(food_item):
    """Download an image and create 3 optimized versions."""
    name = food_item['name']
    image_url = food_item['imageUrl']
    
    try:
        # Download the image
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()
        
        # Open image
        image = Image.open(BytesIO(response.content))
        
        # Create filename
        safe_name = sanitize_filename(name)
        img_hash = get_image_hash(response.content)
        base_filename = f"{safe_name}_{img_hash}.webp"
        
        # Process and save high quality
        high_data = resize_and_compress_image(image, MAX_WIDTH_HIGH, HIGH_QUALITY)
        high_path = os.path.join(HIGH_QUALITY_DIR, base_filename)
        with open(high_path, 'wb') as f:
            f.write(high_data)
        
        # Process and save medium quality
        medium_data = resize_and_compress_image(image, MAX_WIDTH_MEDIUM, MEDIUM_QUALITY)
        medium_path = os.path.join(MEDIUM_QUALITY_DIR, base_filename)
        with open(medium_path, 'wb') as f:
            f.write(medium_data)
        
        # Process and save low quality
        low_data = resize_and_compress_image(image, MAX_WIDTH_LOW, LOW_QUALITY)
        low_path = os.path.join(LOW_QUALITY_DIR, base_filename)
        with open(low_path, 'wb') as f:
            f.write(low_data)
        
        return {
            'name': name,
            'success': True,
            'filename': base_filename,
            'sizes': {
                'high': len(high_data),
                'medium': len(medium_data),
                'low': len(low_data)
            }
        }
    
    except Exception as e:
        return {
            'name': name,
            'success': False,
            'error': str(e)
        }


def main():
    """Main function to download and process all images."""
    print("🚀 Starting image download and optimization...")
    
    # Create directories
    create_directories()
    
    # Load foods data
    print(f"📖 Loading foods data from {FOODS_JSON_PATH}...")
    with open(FOODS_JSON_PATH, 'r') as f:
        foods = json.load(f)
    
    print(f"✓ Found {len(foods)} food items")
    
    # Process images in parallel
    print("⬇️  Downloading and processing images...")
    results = []
    failed = []
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(download_and_process_image, food): food for food in foods}
        
        with tqdm(total=len(foods), desc="Processing images") as pbar:
            for future in as_completed(futures):
                result = future.result()
                results.append(result)
                
                if not result['success']:
                    failed.append(result)
                    print(f"\n❌ Failed: {result['name']} - {result['error']}")
                
                pbar.update(1)
    
    # Generate summary
    successful = [r for r in results if r['success']]
    
    print("\n" + "="*50)
    print("📊 SUMMARY")
    print("="*50)
    print(f"✅ Successfully processed: {len(successful)}/{len(foods)}")
    print(f"❌ Failed: {len(failed)}")
    
    if successful:
        total_high = sum(r['sizes']['high'] for r in successful)
        total_medium = sum(r['sizes']['medium'] for r in successful)
        total_low = sum(r['sizes']['low'] for r in successful)
        
        print(f"\n💾 Total storage:")
        print(f"   High quality:   {total_high / 1024 / 1024:.2f} MB")
        print(f"   Medium quality: {total_medium / 1024 / 1024:.2f} MB")
        print(f"   Low quality:    {total_low / 1024 / 1024:.2f} MB")
        print(f"   TOTAL:          {(total_high + total_medium + total_low) / 1024 / 1024:.2f} MB")
        
        avg_compression_medium = (1 - total_medium / total_high) * 100
        avg_compression_low = (1 - total_low / total_high) * 100
        
        print(f"\n📉 Compression savings:")
        print(f"   Medium vs High: {avg_compression_medium:.1f}% smaller")
        print(f"   Low vs High:    {avg_compression_low:.1f}% smaller")
    
    # Save mapping file
    mapping_file = os.path.join(OUTPUT_DIR, "image_mapping.json")
    with open(mapping_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✓ Saved image mapping to {mapping_file}")
    print("\n🎉 Done!")


if __name__ == "__main__":
    main()

