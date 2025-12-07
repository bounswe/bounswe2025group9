from django.db import migrations
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import os

MAX_WORKERS = 32
CACHE_FILE = "broken_link_cache.json"


def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_cache(cache):
    tmp = CACHE_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(cache, f, indent=2)
    os.replace(tmp, CACHE_FILE)


def check_url(url):
    try:
        r = requests.head(url, timeout=5, allow_redirects=True)
        return (url, r.status_code == 200, None)
    except Exception as e:
        return (url, False, e)


def remove_broken_links(apps, schema_editor):
    FoodEntry = apps.get_model("foods", "FoodEntry")

    qs = (
        FoodEntry.objects.exclude(imageUrl="")
        .exclude(imageUrl__startswith="/media/")
        .exclude(imageUrl__startswith="/static/")
    )

    foods = list(qs)
    print(f"\nChecking {len(foods)} external links...")

    # Load cache: url -> True/False
    cache = load_cache()

    # Filter URLs that need querying
    to_query = [f for f in foods if f.imageUrl not in cache]

    print(f"{len(to_query)} URLs not in cache; querying them...")

    # Parallel requests
    new_results = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(check_url, f.imageUrl): f for f in to_query}
        for fut in as_completed(futures):
            url, ok, _ = fut.result()
            # ok=True means NOT broken
            broken = not ok
            new_results[url] = broken

    # Merge new results into the cache
    cache.update(new_results)

    # Persist cache
    save_cache(cache)

    # Apply DB changes sequentially
    removed_count = 0
    for f in foods:
        url = f.imageUrl
        broken = cache.get(url, False)
        if broken:
            print(f"Removing broken link: {url[:50]}", end="\r")
            f.imageUrl = ""
            f.save()
            removed_count += 1

    print(f"Removed {removed_count} broken links.")


def reverse_remove_broken_links(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("foods", "0011_foodproposal_is_private"),
    ]

    operations = [
        migrations.RunPython(remove_broken_links, reverse_remove_broken_links),
    ]
