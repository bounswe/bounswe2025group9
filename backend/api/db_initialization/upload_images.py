import os
import json
import cloudinary
import cloudinary.uploader
from pathlib import Path
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent / ".env")

# Configuration
INPUT_DIR = Path("media/food_images")
MAPPING_FILE = Path(__file__).parent.parent.parent / "foods/migrations/docs/image_mapping.json"

def setup_cloudinary():
    if "CLOUDINARY_URL" not in os.environ:
        print("Error: CLOUDINARY_URL not found in environment variables.")
        return False
    
    # Explicitly configure cloudinary
    cloudinary.config(
        cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
        api_key=os.environ.get("CLOUDINARY_API_KEY"),
        api_secret=os.environ.get("CLOUDINARY_API_SECRET")
    )
    
    # Or if using CLOUDINARY_URL, it should be auto-configured if the env var is set.
    # But let's print debug info (masking secret)
    print(f"Configuring Cloudinary with Cloud Name: {os.environ.get('CLOUDINARY_CLOUD_NAME')}")
    return True

def convert_to_webp(image_path):
    """Convert image to WebP format in memory."""
    with Image.open(image_path) as img:
        # Convert to RGBA if not already (to preserve transparency)
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        
        output = BytesIO()
        img.save(output, format="WEBP", quality=80)
        output.seek(0)
        return output

def upload_image(file_obj, public_id):
    """Upload image to Cloudinary."""
    try:
        response = cloudinary.uploader.upload(
            file_obj,
            public_id=public_id,
            folder="food_images",
            overwrite=True,
            resource_type="image"
        )
        return response.get("secure_url")
    except Exception as e:
        print(f"Error uploading {public_id}: {e}")
        return None

def main():
    if not setup_cloudinary():
        return

    if not INPUT_DIR.exists():
        print(f"Error: Input directory {INPUT_DIR} does not exist.")
        return

    # Load existing mapping if present
    mapping = {}
    if MAPPING_FILE.exists():
        with open(MAPPING_FILE, 'r') as f:
            mapping = json.load(f)

    # Get list of png files
    files = list(INPUT_DIR.glob("*.png"))
    print(f"Found {len(files)} images to process.")

    success_count = 0
    skip_count = 0
    fail_count = 0

    for file_path in files:
        # Create a public_id from the filename (without extension)
        public_id = file_path.stem
        
        # Check if already uploaded (optional, but good for resuming)
        if public_id in mapping:
            print(f"Skipping {public_id} (already mapped)")
            skip_count += 1
            continue

        print(f"Processing {file_path.name}...")
        
        # Convert to WebP
        webp_data = convert_to_webp(file_path)
        
        # Upload
        url = upload_image(webp_data, public_id)
        
        if url:
            print(f"✓ Uploaded: {url}")
            mapping[public_id] = url
            success_count += 1
            
            # Save mapping incrementally
            with open(MAPPING_FILE, 'w') as f:
                json.dump(mapping, f, indent=2)
        else:
            print(f"✗ Failed to upload {file_path.name}")
            fail_count += 1

    print("\n--- Upload Summary ---")
    print(f"Total processed: {len(files)}")
    print(f"Successful: {success_count}")
    print(f"Failed: {fail_count}")
    print(f"Mapping saved to {MAPPING_FILE}")

if __name__ == "__main__":
    main()
