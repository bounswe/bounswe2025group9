import time
import uuid
import hmac
import hashlib
import base64
import urllib.parse
import requests
import re

# Your FatSecret credentials


def get_oauth_params():
    return {
        "oauth_consumer_key": CONSUMER_KEY,
        "oauth_nonce": str(uuid.uuid4().hex),
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_version": "1.0",
    }


def sign_request(base_url, params):
    sorted_params = sorted((k, v) for k, v in params.items())
    encoded_params = urllib.parse.urlencode(sorted_params, quote_via=urllib.parse.quote)
    base_string = f"GET&{urllib.parse.quote(base_url, safe='')}&{urllib.parse.quote(encoded_params, safe='')}"
    signing_key = f"{CONSUMER_SECRET}&"
    hashed = hmac.new(signing_key.encode(), base_string.encode(), hashlib.sha1)
    signature = base64.b64encode(hashed.digest()).decode()
    return signature


def make_request(method_name, extra_params):
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
    print("STATUS:", response.status_code)
    print("TEXT:", response.text[:300])
    return response.json()


def parse_food_description(description: str):
    """
    Parses food_description string from 'foods.search' as a fallback.
    Format example: "Per 1 serving - Calories: 300kcal | Fat: 13.00g | Carbs: 32.00g | Protein: 15.00g"
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
    Extracts required structured data from FatSecret API's 'food.get' response.
    Chooses per 100g serving if available, else uses the first one.
    """
    food_data = details.get("food", {})
    food_name = food_data.get("food_name")
    food_category = food_data.get("food_type", "Generic")
    servings = food_data.get("servings", {}).get("serving", [])

    if not isinstance(servings, list):
        servings = [servings]  # sometimes it's a single dict

    serving_100g = None
    for s in servings:
        if s.get("metric_serving_amount") == "100.000":
            serving_100g = s
            break
    if not serving_100g and servings:
        serving_100g = servings[0]

    if not serving_100g:
        print(f" No valid serving found for {food_name}")
        return None

    def get_float(val):
        try:
            return float(val)
        except (ValueError, TypeError):
            return 0.0

    return {
        "food_name": food_name,
        "food_category": food_category,
        "calories": get_float(serving_100g.get("calories")),
        "carbohydrates": get_float(serving_100g.get("carbohydrate")),
        "protein": get_float(serving_100g.get("protein")),
        "fat": get_float(serving_100g.get("fat")),
        "micronutrients": {
            "vitamin_a": get_float(serving_100g.get("vitamin_a")),
            "vitamin_c": get_float(serving_100g.get("vitamin_c")),
            "iron": get_float(serving_100g.get("iron")),
            "calcium": get_float(serving_100g.get("calcium")),
            "potassium": get_float(serving_100g.get("potassium")),
            "sodium": get_float(serving_100g.get("sodium")),
        },
        "serving_description": serving_100g.get("serving_description"),
        "serving_amount": get_float(serving_100g.get("metric_serving_amount")),
        "serving_unit": serving_100g.get("metric_serving_unit"),
    }


if __name__ == "__main__":
    keyword = "tomato"  # can be changed later or looped from a list
    result = make_request("foods.search", {"search_expression": keyword})

    if "foods" not in result:
        print("API ERROR:", result.get("error", "Unknown"))
        exit()

    food_entry = result["foods"]["food"]
    if isinstance(food_entry, list):
        food_entry = food_entry[0]

    print("Found:", food_entry["food_name"], "- ID:", food_entry["food_id"])
    print(
        "Description preview:",
        parse_food_description(food_entry.get("food_description", "")),
    )

    details = make_request("food.get", {"food_id": food_entry["food_id"]})
    food_info = extract_food_info(details)
    print("Parsed Food from food.get:", food_info)
