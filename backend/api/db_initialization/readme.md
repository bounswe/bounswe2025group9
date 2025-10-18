# ai-generated food images

## how i generated the images

1. created `config.py` from `config.py.example` and added openai api key
2. ran `python generate_food_images.py` to create png images
3. ran `python convert_to_webp.py` to convert to webp format
4. uploaded webp images to ipfs (web3.storage)
5. ran `python update_food_image_urls.py` to update foods.json with ipfs links

## how to initialize database with new images

to load food data into the database:

```bash
# from project root
python backend/api/db_initialization/load_food_data.py

# or use django migrations (automatic on migrate)
python manage.py migrate
```

## notes

- all food images are now served from ipfs
- images are apple emoji style, transparent background
- webp format for optimal size (~70% reduction from png)

