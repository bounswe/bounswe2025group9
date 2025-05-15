import json
import requests
import time
import os
from typing import List, Dict, Any

UNSPLASH_ACCESS_KEY = "YOUR UNSPLASH ACCESS KEY"


def load_food_data(filename: str) -> List[Dict[str, Any]]:
    """Load food data from a JSON file."""
    with open(filename, "r", encoding="utf-8") as file:
        return json.load(file)


def save_food_data(data: List[Dict[str, Any]], filename: str) -> None:
    """Save food data to a JSON file."""
    with open(filename, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)


def search_unsplash_image(query: str) -> str:
    """
    Search for an image on Unsplash and return the URL.
    Returns empty string if no image found.
    """
    url = f"https://api.unsplash.com/search/photos"
    params = {"query": f"{query} food", "per_page": 1, "client_id": UNSPLASH_ACCESS_KEY}

    try:
        response = requests.get(url, params=params)
        data = response.json()

        if (
            response.status_code == 200
            and "results" in data
            and len(data["results"]) > 0
        ):
            return data["results"][0]["urls"]["regular"]
        else:
            print(f"No images found for '{query}'")
            return ""
    except Exception as e:
        print(f"Error searching for '{query}': {e}")
        return ""


def update_food_images(
    foods: List[Dict[str, Any]], limit: int = None
) -> List[Dict[str, Any]]:
    """
    Update foods that don't have image URLs by searching for images.
    Optional limit parameter to restrict the number of API calls.
    """
    count = 0
    updated_count = 0

    for food in foods:
        if not food["imageUrl"] or food["imageUrl"] == "":
            count += 1
            if limit and count > limit:
                break

            print(f"Searching image for: {food['name']}")
            # Combine name and category for better search results
            search_query = f"{food['name']} {food['category']}"

            # Get image URL from Unsplash API
            image_url = search_unsplash_image(search_query)

            if image_url:
                food["imageUrl"] = image_url
                updated_count += 1
                # Be nice to the API by not sending too many requests at once
                time.sleep(1)  # Add a delay between requests
    return foods


def main():
    input_file = "foods.json"
    output_file = "foods.json"

    foods = load_food_data(input_file)
    without_images = [
        food for food in foods if not food["imageUrl"] or food["imageUrl"] == ""
    ]

    if without_images:
        # Allow limiting the number of API calls to avoid rate limit
        api_limit = int(
            input("Enter maximum number of foods to update (or 0 for all): ")
        )
        limit = api_limit if api_limit > 0 else None

        # Update the foods with missing images
        updated_foods = update_food_images(foods, limit)

        # Save updated data
        save_food_data(updated_foods, output_file)


if __name__ == "__main__":
    main()
