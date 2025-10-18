import json
import os
import time
import base64
import requests
from pathlib import Path
from openai import OpenAI
from config import OPENAI_API_KEY, OPENAI_ORG_ID

# configuration
INPUT_FILE = "500_common_foods.json"
OUTPUT_DIR = "food_images"
QUALITY = "low"  # Changed to low to reduce API costs
SIZE = "1024x1024"  # Smallest supported size for gpt-image-1
SAMPLE_COUNT = 5  # number of sample images to generate first
USE_GPT_IMAGE = True  # Set to True to use gpt-image-1, False to use dall-e-3

# create output directory if it doesn't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

# initialize openai client with API key from config
client = OpenAI(api_key=OPENAI_API_KEY, organization=OPENAI_ORG_ID)


def normalize_food_name(name):
    """
    Normalize a food name for comparison by removing extra spaces, punctuation, etc.
    """
    # Convert to lowercase and remove common punctuation
    normalized = name.lower()
    normalized = (
        normalized.replace(",", "").replace(".", "").replace("(", "").replace(")", "")
    )
    normalized = normalized.replace("-", " ").replace("_", " ").replace("/", " ")
    # Replace multiple spaces with a single space
    normalized = " ".join(normalized.split())
    return normalized


def get_full_food_name(simple_name):
    """
    Get the full food name from foods.json
    """
    foods_json_path = Path("foods.json")
    if not foods_json_path.exists():
        return simple_name

    with open(foods_json_path, "r", encoding="utf-8") as f:
        foods = json.load(f)

    # Convert simple_name to normalized form for comparison
    simple_name_norm = normalize_food_name(simple_name)

    # First try exact match
    for food in foods:
        food_name_norm = normalize_food_name(food["name"])
        if simple_name_norm == food_name_norm:
            return food["name"]

    # Then try substring match
    for food in foods:
        food_name_norm = normalize_food_name(food["name"])
        if simple_name_norm in food_name_norm or food_name_norm in simple_name_norm:
            return food["name"]

    return simple_name


def get_safe_filename(food_name):
    """
    Create a consistent safe filename from a food name
    """
    # Create safe filename from the food name
    return (
        food_name.lower()
        .replace(" ", "_")
        .replace("/", "_")
        .replace("(", "")
        .replace(")", "")
        .replace(",", "")
    )


def generate_food_image(food_name, food_category):
    """
    Generate an image for a food item using OpenAI's models and save it locally
    """
    # Get the full name from foods.json for a better prompt
    full_food_name = get_full_food_name(food_name)

    # Create safe filename from the full food name
    safe_filename = get_safe_filename(full_food_name)
    local_path = os.path.join(OUTPUT_DIR, f"{safe_filename}.png")

    # Create URL that will be used for frontend access
    relative_url = f"/media/food_images/{safe_filename}.png"

    # check if file already exists
    if os.path.exists(local_path):
        print(
            f"✓ Image for {full_food_name} already exists at {local_path}, skipping generation"
        )
        return full_food_name, relative_url

    # create a prompt for Apple emoji styled food images
    prompt = f"""Create an Apple-style emoji of {full_food_name} on a transparent background.
The image should be in the signature Apple emoji style: highly detailed, slightly glossy, with a cheerful and friendly appearance.
Use bright, vibrant colors with subtle gradients and highlights to create a 3D effect.
Clean vector-like quality with smooth edges and a slight drop shadow.
The {food_category} should be isolated on a completely transparent background with no additional elements.
Make it instantly recognizable as an Apple emoji, with the same level of detail and polish as official Apple emojis.
DO NOT include any text, letters, numbers, or labels in the image. The image must contain only the food item itself with no textual elements of any kind."""

    if not USE_GPT_IMAGE:
        # Add extra transparency instructions for DALL-E 3
        prompt += "\nThe background MUST be 100% transparent (alpha channel). DO NOT include any white or colored background."
        prompt += "\nAGAIN: Do not include ANY text in the image. No text, no labels, no words of any kind."

    try:
        if USE_GPT_IMAGE:
            # Use gpt-image-1 with built-in transparency support
            response = client.images.generate(
                model="gpt-image-1",
                prompt=prompt,
                n=1,
                quality=QUALITY,
                size=SIZE,
                background="transparent",
            )

            # GPT-image-1 returns base64 data directly
            if hasattr(response.data[0], "b64_json") and response.data[0].b64_json:
                # Save the base64 data as a local image file
                image_base64 = response.data[0].b64_json
                image_data = base64.b64decode(image_base64)
                with open(local_path, "wb") as f:
                    f.write(image_data)
                print(
                    f"✓ Generated image for {full_food_name} and saved to {local_path}"
                )

                # Return the relative URL for the frontend to access
                return full_food_name, relative_url
            else:
                print(f"✗ No image data returned for {full_food_name}")
                return full_food_name, ""
        else:
            # Use DALL-E 3 as fallback - this returns a URL
            response = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                n=1,
                quality="standard"
                if QUALITY == "high"
                else "standard",  # DALL-E 3 only supports "standard" and "hd"
                size=SIZE,
                response_format="url",  # Explicitly request URL format for DALL-E 3
            )

            # Get the image URL and download it
            image_url = response.data[0].url
            img_response = requests.get(image_url)
            if img_response.status_code == 200:
                with open(local_path, "wb") as f:
                    f.write(img_response.content)

                print(
                    f"✓ Generated image for {full_food_name} and saved to {local_path}"
                )
                # For DALL-E 3, we can return the direct public URL
                return full_food_name, image_url
            else:
                print(
                    f"✗ Failed to download image for {full_food_name}: {img_response.status_code}"
                )
                return full_food_name, ""
    except Exception as e:
        print(f"✗ Error generating image for {full_food_name}: {str(e)}")
        return full_food_name, ""


def update_single_food(food_name, image_url):
    """
    Update a single food entry in foods.json with the image URL
    Returns True if the food was found and updated
    """
    # read existing foods.json
    foods_json_path = Path("foods.json")
    if not foods_json_path.exists():
        print(f"✗ foods.json not found, cannot update {food_name}")
        return False

    with open(foods_json_path, "r", encoding="utf-8") as f:
        foods = json.load(f)

    # search for the food in the existing foods.json
    food_name_norm = normalize_food_name(food_name)
    found = False

    # First try exact match
    for food in foods:
        existing_name_norm = normalize_food_name(food["name"])
        if food_name_norm == existing_name_norm:
            food["imageUrl"] = image_url
            found = True
            print(f"✓ Updated imageUrl for {food['name']} (exact match)")
            break

    # Then try substring match if not found
    if not found:
        for food in foods:
            existing_name_norm = normalize_food_name(food["name"])
            if (
                food_name_norm in existing_name_norm
                or existing_name_norm in food_name_norm
            ):
                food["imageUrl"] = image_url
                found = True
                print(f"✓ Updated imageUrl for {food['name']} (partial match)")
                break

    if not found:
        print(f"✗ Could not find matching entry for {food_name}")
        return False

    # save the updated foods.json
    with open(foods_json_path, "w", encoding="utf-8") as f:
        json.dump(foods, f, indent=2, ensure_ascii=False)

    return True


def update_food_data(food_list, image_urls):
    """
    Update the foods.json file with the image URLs (batch update)
    """
    # read existing foods.json if it exists
    foods_json_path = Path("foods.json")
    if foods_json_path.exists():
        with open(foods_json_path, "r", encoding="utf-8") as f:
            foods = json.load(f)
    else:
        # create a new list if foods.json doesn't exist
        foods = []
        for food in food_list:
            foods.append(
                {
                    "name": food["food_name"],
                    "category": food["food_category"],
                    "servingSize": 100.0,
                    "caloriesPerServing": 0.0,
                    "proteinContent": 0.0,
                    "fatContent": 0.0,
                    "carbohydrateContent": 0.0,
                    "allergens": [],
                    "dietaryOptions": [],
                    "nutritionScore": 0.0,
                    "imageUrl": "",
                }
            )

    # Create a lookup dictionary with normalized food names as keys
    food_name_map = {}
    for food in food_list:
        normalized_name = normalize_food_name(food["food_name"])
        food_name_map[normalized_name] = food["food_name"]

    # update the imageUrl for each food
    updates_count = 0
    for food_name, image_url in image_urls.items():
        # Normalize the food name
        food_name_norm = normalize_food_name(food_name)

        # Search for the food in the existing foods.json
        found = False

        # First try exact match
        for food in foods:
            existing_name_norm = normalize_food_name(food["name"])
            if food_name_norm == existing_name_norm:
                food["imageUrl"] = image_url
                updates_count += 1
                found = True
                print(f"✓ Updated imageUrl for {food['name']} (exact match)")
                break

        # Then try substring match if not found
        if not found:
            for food in foods:
                existing_name_norm = normalize_food_name(food["name"])
                if (
                    food_name_norm in existing_name_norm
                    or existing_name_norm in food_name_norm
                ):
                    food["imageUrl"] = image_url
                    updates_count += 1
                    found = True
                    print(f"✓ Updated imageUrl for {food['name']} (partial match)")
                    break

        if not found:
            print(f"✗ Could not find matching entry for {food_name}")

    # save the updated foods.json
    with open(foods_json_path, "w", encoding="utf-8") as f:
        json.dump(foods, f, indent=2, ensure_ascii=False)

    print(f"\nUpdated foods.json with {updates_count} image URLs")


def generate_sample_images():
    """
    Generate a small sample of food images first
    """
    # load the food list
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        food_list = json.load(f)

    # select a sample of foods (first 5 by default)
    sample_foods = food_list[:SAMPLE_COUNT]

    print(f"Generating {SAMPLE_COUNT} sample food images...")

    # dictionary to store image URLs
    image_urls = {}

    for i, food in enumerate(sample_foods):
        food_name = food["food_name"]
        food_category = food["food_category"]

        # Get the full name
        full_food_name = get_full_food_name(food_name)
        safe_filename = get_safe_filename(full_food_name)
        local_path = os.path.join(OUTPUT_DIR, f"{safe_filename}.png")

        # check if local file already exists
        if os.path.exists(local_path):
            relative_url = f"/media/food_images/{safe_filename}.png"
            print(
                f"[{i+1}/{SAMPLE_COUNT}] Image for {full_food_name} already exists at {local_path}, skipping generation"
            )
            image_urls[food_name.lower()] = relative_url
            update_single_food(food_name, relative_url)
            continue

        print(f"[{i+1}/{SAMPLE_COUNT}] Generating image for {food_name}...")

        # generate the image and get URL
        _, image_url = generate_food_image(food_name, food_category)

        if image_url:
            # Store with simple name as key
            safe_name = food_name.lower()
            image_urls[safe_name] = image_url

            # Update foods.json immediately
            update_single_food(food_name, image_url)

        # sleep to avoid rate limiting (adjust as needed)
        time.sleep(3)

    print(f"\nSample complete! Generated {len(image_urls)} images")
    return image_urls


def download_external_image(url, local_path):
    """
    Download an image from an external URL and save it locally
    """
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            with open(local_path, "wb") as f:
                f.write(response.content)
            print(f"✓ Downloaded image from {url} to {local_path}")
            return True
        else:
            print(f"✗ Failed to download image from {url}: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error downloading image from {url}: {str(e)}")
        return False


def generate_all_images():
    """
    Generate images for all foods in the list
    """
    # load the food list
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        food_list = json.load(f)

    print(f"Generating images for all {len(food_list)} foods...")

    # dictionary to store image URLs
    image_urls = {}
    generated_count = 0
    downloaded_count = 0
    skipped_count = 0

    # Load foods.json to check for existing entries
    foods_json_path = Path("foods.json")
    foods = []
    if foods_json_path.exists():
        with open(foods_json_path, "r", encoding="utf-8") as f:
            foods = json.load(f)

    # rate limiting to avoid API limits
    for i, food in enumerate(food_list):
        food_name = food["food_name"]
        food_category = food["food_category"]

        # Get the full name
        full_food_name = get_full_food_name(food_name)
        safe_filename = get_safe_filename(full_food_name)
        local_path = os.path.join(OUTPUT_DIR, f"{safe_filename}.png")
        relative_url = f"/media/food_images/{safe_filename}.png"

        # check if local file already exists
        if os.path.exists(local_path):
            print(
                f"[{i+1}/{len(food_list)}] Image for {full_food_name} already exists at {local_path}, skipping generation"
            )
            image_urls[normalize_food_name(food_name)] = relative_url
            update_single_food(food_name, relative_url)
            skipped_count += 1
            continue

        # Normalize the food name for comparison
        food_name_norm = normalize_food_name(food_name)

        # Check if we have an external URL for this food in foods.json
        external_url = None
        for existing_food in foods:
            existing_name_norm = normalize_food_name(existing_food["name"])
            # Check for exact or partial match
            if (
                (food_name_norm == existing_name_norm)
                or (
                    food_name_norm in existing_name_norm
                    or existing_name_norm in food_name_norm
                )
            ) and existing_food["imageUrl"]:
                if existing_food["imageUrl"].startswith("http"):
                    # This is an external URL, we'll try to download it
                    external_url = existing_food["imageUrl"]
                    print(
                        f"[{i+1}/{len(food_list)}] Food {food_name} has external URL, downloading..."
                    )
                    break

        # If we found an external URL, try to download it
        if external_url:
            if download_external_image(external_url, local_path):
                image_urls[food_name_norm] = relative_url
                update_single_food(food_name, relative_url)
                downloaded_count += 1
                # Add delay to avoid overwhelming the server
                time.sleep(1)
                continue
            else:
                # If download failed, we'll generate a new image
                print(
                    f"[{i+1}/{len(food_list)}] Failed to download external image, generating new one..."
                )

        print(f"[{i+1}/{len(food_list)}] Generating image for {food_name}...")

        # generate the image
        _, image_url = generate_food_image(food_name, food_category)

        if image_url:
            image_urls[food_name_norm] = image_url
            generated_count += 1

            # Update foods.json immediately
            update_single_food(food_name, image_url)

        # sleep to avoid rate limiting (adjust as needed)
        time.sleep(3)

    print(f"\nDone! Summary:")
    print(f"- Generated {generated_count} new images")
    print(f"- Downloaded {downloaded_count} images from external URLs")
    print(f"- Skipped {skipped_count} existing images")
    print(
        f"- Total: {generated_count + downloaded_count + skipped_count} images processed"
    )

    # Count the actual files in the directory
    png_files = len([f for f in os.listdir(OUTPUT_DIR) if f.endswith(".png")])
    print(f"- Current files in {OUTPUT_DIR}: {png_files}")


def main():
    """
    Main function to run the script
    """
    # first generate sample images
    sample_urls = generate_sample_images()

    # ask user if they want to continue with all images
    while True:
        response = input(
            "\nDo you want to continue generating images for all foods? (y/n): "
        )
        if response.lower() in ["y", "yes"]:
            generate_all_images()
            break
        elif response.lower() in ["n", "no"]:
            print("Exiting without generating all images.")
            break
        else:
            print("Please enter 'y' or 'n'.")

    # Verify final counts
    foods_json_path = Path("foods.json")
    if foods_json_path.exists():
        with open(foods_json_path, "r", encoding="utf-8") as f:
            foods = json.load(f)

        # Count URLs by type
        local_urls = 0
        external_urls = 0
        empty_urls = 0

        for food in foods:
            if not food["imageUrl"]:
                empty_urls += 1
            elif food["imageUrl"].startswith("http"):
                external_urls += 1
            else:
                local_urls += 1

        print("\nImage URL statistics in foods.json:")
        print(f"- Local URLs: {local_urls}")
        print(f"- External URLs: {external_urls}")
        print(f"- Empty URLs: {empty_urls}")
        print(f"- Total foods: {len(foods)}")

    # Now foods.json has been updated with image URLs
    print("\nFood images have been generated and URLs stored in foods.json.")
    print(
        "You can now load this data into your Django database using the load_food_data.py script."
    )
    print(f"Local images are saved in the {OUTPUT_DIR}/ directory")


if __name__ == "__main__":
    main()
