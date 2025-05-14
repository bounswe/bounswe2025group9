import os
import json
from pathlib import Path
from PIL import Image

# configuration
PNG_DIR = "food_images"
WEBP_DIR = "food_images_webp"
QUALITY = 90  # WebP quality (0-100)

# create output directory if it doesn't exist
os.makedirs(WEBP_DIR, exist_ok=True)


def convert_png_to_webp(png_path, webp_path, quality=90):
    """
    Convert a PNG image to WebP format
    """
    try:
        img = Image.open(png_path)
        # Convert transparent PNG with alpha channel
        if img.mode in ("RGBA", "LA") or (
            img.mode == "P" and "transparency" in img.info
        ):
            img = img.convert("RGBA")
        else:
            img = img.convert("RGB")

        img.save(webp_path, "WEBP", quality=quality)
        print(f"✓ Converted {png_path} to {webp_path}")
        return True
    except Exception as e:
        print(f"✗ Error converting {png_path}: {str(e)}")
        return False


def update_database_urls():
    """
    Update foods.json with new WebP URLs
    """
    foods_json_path = Path("foods.json")
    if not foods_json_path.exists():
        print("✗ foods.json not found, cannot update URLs")
        return

    with open(foods_json_path, "r", encoding="utf-8") as f:
        foods = json.load(f)

    update_count = 0

    for food in foods:
        if food["imageUrl"] and food["imageUrl"].startswith("/media/food_images/"):
            # Extract filename from URL
            filename = os.path.basename(food["imageUrl"])
            filename_without_ext = os.path.splitext(filename)[0]

            # Create new WebP URL
            new_url = f"/media/food_images_webp/{filename_without_ext}.webp"

            # Update the URL
            food["imageUrl"] = new_url
            update_count += 1

    # Save the updated foods.json
    with open(foods_json_path, "w", encoding="utf-8") as f:
        json.dump(foods, f, indent=2, ensure_ascii=False)

    print(f"\nUpdated {update_count} food entries with WebP URLs")


def main():
    """
    Main function to convert all PNG images to WebP
    """
    print(f"Converting PNG images from {PNG_DIR} to WebP in {WEBP_DIR}...")

    # Get list of all PNG files
    png_files = [f for f in os.listdir(PNG_DIR) if f.endswith(".png")]
    total_files = len(png_files)

    if total_files == 0:
        print("No PNG files found in the directory")
        return

    print(f"Found {total_files} PNG files to convert")

    # Convert each file
    success_count = 0

    for i, png_file in enumerate(png_files):
        png_path = os.path.join(PNG_DIR, png_file)
        filename_without_ext = os.path.splitext(png_file)[0]
        webp_path = os.path.join(WEBP_DIR, f"{filename_without_ext}.webp")

        print(f"[{i+1}/{total_files}] Converting {png_file} to WebP...")
        if convert_png_to_webp(png_path, webp_path, QUALITY):
            success_count += 1

    print(f"\nDone! Converted {success_count}/{total_files} PNG files to WebP")

    # Calculate size difference
    png_size = sum(os.path.getsize(os.path.join(PNG_DIR, f)) for f in png_files)
    webp_files = [f for f in os.listdir(WEBP_DIR) if f.endswith(".webp")]
    webp_size = sum(os.path.getsize(os.path.join(WEBP_DIR, f)) for f in webp_files)

    png_size_mb = png_size / (1024 * 1024)
    webp_size_mb = webp_size / (1024 * 1024)
    reduction = (1 - (webp_size / png_size)) * 100 if png_size > 0 else 0

    print(f"Original PNG size: {png_size_mb:.2f} MB")
    print(f"WebP size: {webp_size_mb:.2f} MB")
    print(f"Size reduction: {reduction:.2f}%")

    # Update the database
    update_database_urls()

    print(
        f"\nAll food images have been converted to WebP and stored in the {WEBP_DIR}/ directory"
    )
    print(f"The foods.json database has been updated to use WebP URLs")


if __name__ == "__main__":
    main()
