import time
import uuid
import hmac
import hashlib
import base64
import urllib.parse
import requests
import json
import re
from bs4 import BeautifulSoup


# FatSecret API credentials
CONSUMER_KEY = ""
CONSUMER_SECRET = ""

INPUT_FILE = "500_common_foods.json"
OUTPUT_FILE = "enriched_foods.json"
RATE_LIMIT_DELAY = 1.2  # seconds between calls


def get_oauth_params():
    """
    Fatsecret API v1.0 requires OAuth 1.0a authentication.
    Free and basic version.
    """
    return {
        "oauth_consumer_key": CONSUMER_KEY,
        "oauth_nonce": str(uuid.uuid4().hex),
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_version": "1.0",
    }


def sign_request(base_url, params):
    """
    Sign the request using HMAC-SHA1. For authentication.
    """
    sorted_params = sorted((k, v) for k, v in params.items())
    encoded_params = urllib.parse.urlencode(sorted_params, quote_via=urllib.parse.quote)
    base_string = f"GET&{urllib.parse.quote(base_url, safe='')}&{urllib.parse.quote(encoded_params, safe='')}"
    signing_key = f"{CONSUMER_SECRET}&"
    hashed = hmac.new(signing_key.encode(), base_string.encode(), hashlib.sha1)
    signature = base64.b64encode(hashed.digest()).decode()
    return signature


def make_request(method_name, extra_params):
    """
    Make a request to the FatSecret API.
    """
    base_url = "https://platform.fatsecret.com/rest/server.api"
    oauth_params = get_oauth_params()
    all_params = {
        **oauth_params,
        "method": method_name,
        "format": "json",
        **extra_params,
    }
    signature = sign_request(base_url, all_params)
    all_params["oauth_signature"] = signature

    response = requests.get(base_url, params=all_params)
    if response.status_code != 200:
        raise Exception(f"API Error: {response.status_code} - {response.text}")
    return response.json()


def get_fatsecret_image_url(food_url: str) -> str:
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    response = requests.get(food_url, headers=headers)

    if response.status_code != 200:
        print(f"Failed to fetch page: {response.status_code}")
        return None

    soup = BeautifulSoup(response.text, "html.parser")
    img = [
        img["src"]
        for td in soup.find_all("td")
        for a in td.find_all("a")
        for img in a.find_all("img", src=True)
    ]
    if len(img) <= 1:
        return ""
    return img[1]


# ------------------- Parsing Helpers ------------------- #


def parse_food_description(description: str):
    """
    API provides a food description for nutritional information.
    This function extracts calories, fat, carbs, and protein from it.
    """
    pattern = r"Calories:\s*([\d.]+)kcal\s*\|\s*Fat:\s*([\d.]+)g\s*\|\s*Carbs:\s*([\d.]+)g\s*\|\s*Protein:\s*([\d.]+)g"
    match = re.search(pattern, description)
    if not match:
        return None
    return {
        "calories": float(match.group(1)),
        "fat": float(match.group(2)),
        "carbohydrates": float(match.group(3)),
        "protein": float(match.group(4)),
    }


def extract_food_info(details):
    """
    Extract food information from the API response.
    """
    food_data = details.get("food", {})
    food_name = food_data.get("food_name")
    servings = food_data.get("servings", {}).get("serving", [])

    if not isinstance(servings, list):
        servings = [servings]

    serving_100g = None
    for s in servings:
        if s.get("metric_serving_amount") == "100.000":
            serving_100g = s
            break
    if not serving_100g and servings:
        serving_100g = servings[0]

    if not serving_100g:
        return None

    def get_float(val):
        try:
            return float(val)
        except (ValueError, TypeError):
            return 0.0

    return {
        "food_name": food_name,
        "calories": get_float(serving_100g.get("calories")),
        "carbohydrates": get_float(serving_100g.get("carbohydrate")),
        "protein": get_float(serving_100g.get("protein")),
        "fat": get_float(serving_100g.get("fat")),
        "serving_amount": get_float(serving_100g.get("metric_serving_amount")),
        "serving_unit": serving_100g.get("metric_serving_unit"),
        "micronutrients": {
            "vitamin_a": get_float(serving_100g.get("vitamin_a")),
            "vitamin_c": get_float(serving_100g.get("vitamin_c")),
            "iron": get_float(serving_100g.get("iron")),
            "calcium": get_float(serving_100g.get("calcium")),
            "potassium": get_float(serving_100g.get("potassium")),
            "sodium": get_float(serving_100g.get("sodium")),
        },
    }


# ------------------- Main Processing ------------------- #


def enrich_food_list():
    """
    Sends API requests to FatSecret for each food in the input file.
    Input file is 500_common_foods.json with food names and categories, since categories are not available in the API.
    Output file is enriched_foods.json with detailed food information. This file will be used to populate the database with food entries.
    Input file is not guaranteed to contain all foods, and currently it only has ~250 foods.
    """
    enriched_data = []

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        food_list = json.load(f)

    for entry in food_list:
        food_name = entry["food_name"]
        category = entry["food_category"]
        print(f"Searching: {food_name}")

        try:
            search = make_request("foods.search", {"search_expression": food_name})
            foods = search.get("foods", {}).get("food", [])
            if not foods:
                print(f"Not found: {food_name}")
                continue

            food_id = foods[0]["food_id"]
            details = make_request("food.get", {"food_id": food_id})
            image_url = get_fatsecret_image_url(details["food"]["food_url"])
            parsed = extract_food_info(details)

            if not parsed:
                print(f"No valid data: {food_name}")
                continue

            enriched_data.append(
                {
                    "name": parsed["food_name"],
                    "category": category,
                    "servingSize": parsed.get("serving_amount", 100.0),
                    "caloriesPerServing": parsed.get("calories", 0.0),
                    "proteinContent": parsed.get("protein", 0.0),
                    "fatContent": parsed.get("fat", 0.0),
                    "carbohydrateContent": parsed.get("carbohydrates", 0.0),
                    "allergens": [],
                    "dietaryOptions": [],
                    "nutritionScore": 0.0,
                    "imageUrl": image_url,
                }
            )

            print(f"Added: {food_name}")
        except Exception as e:
            print(f"Error for {food_name}: {e}")

        time.sleep(RATE_LIMIT_DELAY)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(enriched_data, f, indent=2, ensure_ascii=False)

    print(f"\n Done. {len(enriched_data)} foods saved to {OUTPUT_FILE}")


# ------------------- Run ------------------- #

if __name__ == "__main__":
    enrich_food_list()
