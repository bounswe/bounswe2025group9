import json
import os
from pathlib import Path

# configuration
WEBP_DIR = "food_images_webp"
FOODS_JSON_PATH = "foods.json"
MEDIA_PATH_PREFIX = "/media/food_images_webp/"
IPFS_LINK = (
    "https://bafybeidyss4dualqhr6s2hrrfvgdou2isyoye5j34dur4gsdalthl4bkqi.ipfs.w3s.link"
)


def normalize_food_name(name):
    """
    Create consistent safe filename from a food name
    """
    return (
        name.lower()
        .replace(" ", "_")
        .replace("/", "_")
        .replace("(", "")
        .replace(")", "")
        .replace(",", "")
    )


def main():
    """
    Update all image URLs in foods.json to use IPFS links with WebP format
    """
    # check if foods.json exists
    if not os.path.exists(FOODS_JSON_PATH):
        print(f"Error: {FOODS_JSON_PATH} not found")
        return

    # load foods.json
    with open(FOODS_JSON_PATH, "r", encoding="utf-8") as f:
        foods = json.load(f)

    # get list of all webp files if local directory exists
    local_images = []
    if os.path.exists(WEBP_DIR):
        local_images = [f for f in os.listdir(WEBP_DIR) if f.endswith(".webp")]
        print(f"Found {len(local_images)} local WebP files in {WEBP_DIR}/")

    # counters for updates
    updates = 0
    foods_with_images = 0
    foods_missing_images = 0

    # update each food's imageUrl using the IPFS link with WebP format
    for food in foods:
        food_name = food["name"]

        # Create safe filename using the same logic as in convert_to_webp.py
        safe_name = normalize_food_name(food_name)

        # check if corresponding webp file exists locally
        webp_file = f"{safe_name}.webp"
        has_local_file = webp_file in local_images

        # create the IPFS URL for the food with WebP extension
        ipfs_url = f"{IPFS_LINK}/{safe_name}.webp"

        # update food entry with IPFS URL regardless of current value
        previous_url = food.get("imageUrl", "")
        food["imageUrl"] = ipfs_url
        updates += 1

        if has_local_file:
            foods_with_images += 1
            print(f"✓ Updated {food['name']} with WebP IPFS link: {ipfs_url}")
        else:
            foods_missing_images += 1
            print(
                f"! Warning: No local WebP file for {food['name']}, but updated URL anyway: {ipfs_url}"
            )

    # save the updated foods.json
    with open(FOODS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(foods, f, indent=2, ensure_ascii=False)

    print(f"\nSummary:")
    print(f"- Total foods: {len(foods)}")
    print(f"- Foods with corresponding local WebP images: {foods_with_images}")
    print(f"- Foods missing local WebP images: {foods_missing_images}")
    print(f"- Total URL updates made: {updates}")
    print(f"- Updated foods.json saved to {FOODS_JSON_PATH}")


if __name__ == "__main__":
    main()
