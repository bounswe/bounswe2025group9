"""
AI Image Generation Service for Food Proposals

This module provides functionality to:
1. Generate AI images using Fal AI (gpt-image-1-mini model)
2. Upload generated images to Cloudinary
3. Return the Cloudinary URL for storage in the database

Usage:
    from foods.image_generation import generate_food_image_async
    
    # Generate image in background (non-blocking)
    generate_food_image_async(food_entry_id=123, food_name="Apple Pie")
"""

import os
import logging
import requests
import threading
from io import BytesIO
from typing import Optional

from django.conf import settings

logger = logging.getLogger(__name__)


def _get_fal_client():
    """
    Lazily import and configure fal_client.
    Returns None if FAL_KEY is not configured.
    """
    fal_key = getattr(settings, 'FAL_KEY', None) or os.environ.get('FAL_KEY')
    if not fal_key:
        logger.warning("FAL_KEY not configured. AI image generation is disabled.")
        return None
    
    # Set the environment variable for fal_client
    os.environ['FAL_KEY'] = fal_key
    
    try:
        import fal_client
        return fal_client
    except ImportError:
        logger.error("fal_client not installed. Run: pip install fal-client")
        return None


def _get_cloudinary():
    """
    Lazily import and configure cloudinary.
    Returns None if Cloudinary is not configured.
    """
    cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME', None) or os.environ.get('CLOUDINARY_CLOUD_NAME')
    api_key = getattr(settings, 'CLOUDINARY_API_KEY', None) or os.environ.get('CLOUDINARY_API_KEY')
    api_secret = getattr(settings, 'CLOUDINARY_API_SECRET', None) or os.environ.get('CLOUDINARY_API_SECRET')
    
    if not all([cloud_name, api_key, api_secret]):
        logger.warning("Cloudinary not fully configured. Image upload is disabled.")
        return None
    
    try:
        import cloudinary
        import cloudinary.uploader
        
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret
        )
        return cloudinary
    except ImportError:
        logger.error("cloudinary not installed. Run: pip install cloudinary")
        return None


def _generate_image_with_fal(food_name: str) -> Optional[str]:
    """
    Generate an Apple-style emoji food image using Fal AI.
    
    Args:
        food_name: The name of the food to generate an image for
        
    Returns:
        URL of the generated image from Fal, or None if generation fails
    """
    import time
    import httpx
    
    fal_key = os.environ.get('FAL_KEY')
    if not fal_key:
        return None
    
    # Apple emoji-style prompt for consistent, appetizing food images
    prompt = f"""Create a high-quality Apple-style emoji of the food item: {food_name}.
The image should depict the food ready to be eaten.
Style: Signature Apple emoji style - 3D, glossy, highly detailed, vibrant colors, smooth vector-like appearance.
Context: Isolated on a completely transparent background with a slight drop shadow.
CRITICAL: It must look appetizing and edible. 
- For animals (e.g., crab, fish, chicken), show it as a PREPARED FOOD DISH or MEAT (e.g., cooked crab legs, grilled fish), NOT as a cute living character or cartoon animal.
- For ingredients (e.g., peanut butter, flour), show it in a natural, appetizing presentation (e.g., peanut butter on a spoon or in a jar, but stylized).
DO NOT include any text, letters, numbers, or labels. The image must contain only the food item itself."""

    try:
        logger.info(f"Generating AI image for: {food_name}")
        print(f"[AI Image] Submitting request to Fal AI for: {food_name}")
        
        headers = {
            "Authorization": f"Key {fal_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "prompt": prompt,
            "image_size": "1024x1024",
            "background": "transparent",
            "quality": "high",
            "num_images": 1,
            "output_format": "png"
        }
        
        # Submit the request
        with httpx.Client(timeout=30) as client:
            submit_response = client.post(
                "https://queue.fal.run/fal-ai/gpt-image-1-mini",
                headers=headers,
                json=payload
            )
            submit_response.raise_for_status()
            submit_data = submit_response.json()
            
            request_id = submit_data.get("request_id")
            status_url = submit_data.get("status_url") or f"https://queue.fal.run/fal-ai/gpt-image-1-mini/requests/{request_id}/status"
            
            print(f"[AI Image] Request submitted, ID: {request_id}")
        
        # Poll with 1 second interval (instead of default ~250ms)
        max_attempts = 120  # Max 2 minutes
        result = None
        
        with httpx.Client(timeout=30) as client:
            for attempt in range(max_attempts):
                time.sleep(1)  # Wait 1 second between polls
                
                status_response = client.get(status_url, headers=headers)
                status_data = status_response.json()
                status = status_data.get("status", "UNKNOWN")
                
                print(f"[AI Image] Poll #{attempt + 1}: {status}")
                
                if status == "COMPLETED":
                    # Fetch the result
                    result_url = f"https://queue.fal.run/fal-ai/gpt-image-1-mini/requests/{request_id}"
                    result_response = client.get(result_url, headers=headers)
                    result = result_response.json()
                    break
                elif status in ("FAILED", "CANCELLED"):
                    print(f"[AI Image] Request failed with status: {status}")
                    return None
        
        if result and "images" in result and len(result["images"]) > 0:
            image_url = result["images"][0]["url"]
            print(f"[AI Image] Successfully generated image: {image_url[:80]}...")
            logger.info(f"Successfully generated image for {food_name}")
            return image_url
        else:
            print(f"[AI Image] No image in result for {food_name}")
            logger.error(f"No image returned from Fal for {food_name}")
            return None
            
    except Exception as e:
        print(f"[AI Image] Error: {e}")
        logger.error(f"Error generating image for {food_name}: {e}")
        return None


def _download_image(url: str) -> Optional[BytesIO]:
    """
    Download an image from a URL into memory.
    
    Args:
        url: The URL to download from
        
    Returns:
        BytesIO object containing the image data, or None if download fails
    """
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return BytesIO(response.content)
    except Exception as e:
        logger.error(f"Error downloading image from {url}: {e}")
        return None


def _convert_to_webp(image_data: BytesIO) -> Optional[BytesIO]:
    """
    Convert image data to WebP format for optimal file size.
    
    Args:
        image_data: BytesIO containing the original image
        
    Returns:
        BytesIO containing the WebP image, or None if conversion fails
    """
    try:
        from PIL import Image
        
        with Image.open(image_data) as img:
            # Convert to RGBA to preserve transparency
            if img.mode != "RGBA":
                img = img.convert("RGBA")
            
            output = BytesIO()
            img.save(output, format="WEBP", quality=85)
            output.seek(0)
            return output
    except Exception as e:
        logger.error(f"Error converting image to WebP: {e}")
        return None


def _upload_to_cloudinary(image_data: BytesIO, food_name: str) -> Optional[str]:
    """
    Upload an image to Cloudinary.
    
    Args:
        image_data: BytesIO containing the image data
        food_name: The food name (used to generate public_id)
        
    Returns:
        The secure URL of the uploaded image, or None if upload fails
    """
    cloudinary = _get_cloudinary()
    if not cloudinary:
        return None
    
    # Create a safe public_id from the food name
    public_id = food_name.lower()
    for char in [" ", ",", "/", "(", ")", "'", '"', "&"]:
        public_id = public_id.replace(char, "_")
    public_id = "_".join(filter(None, public_id.split("_")))  # Remove consecutive underscores
    
    try:
        response = cloudinary.uploader.upload(
            image_data,
            public_id=public_id,
            folder="food_images/proposals",
            overwrite=True,
            resource_type="image"
        )
        url = response.get("secure_url")
        logger.info(f"Successfully uploaded image to Cloudinary: {url}")
        return url
    except Exception as e:
        logger.error(f"Error uploading to Cloudinary: {e}")
        return None


def generate_food_image(food_name: str) -> Optional[str]:
    """
    Generate an AI image for a food item and upload it to Cloudinary.
    
    This is the main entry point for the image generation service.
    It handles the full pipeline:
    1. Generate image using Fal AI
    2. Download the generated image
    3. Convert to WebP format
    4. Upload to Cloudinary
    5. Return the Cloudinary URL
    
    Args:
        food_name: The name of the food to generate an image for
        
    Returns:
        The Cloudinary URL of the generated image, or None if any step fails
        
    Example:
        >>> url = generate_food_image("Grilled Salmon")
        >>> print(url)
        'https://res.cloudinary.com/your-cloud/image/upload/v.../food_images/proposals/grilled_salmon.webp'
    """
    if not food_name or not food_name.strip():
        logger.warning("Empty food name provided for image generation")
        return None
    
    food_name = food_name.strip()
    
    # Step 1: Generate image with Fal AI
    fal_url = _generate_image_with_fal(food_name)
    if not fal_url:
        logger.warning(f"Failed to generate AI image for: {food_name}")
        return None
    
    # Step 2: Download the generated image
    image_data = _download_image(fal_url)
    if not image_data:
        logger.warning(f"Failed to download generated image for: {food_name}")
        return None
    
    # Step 3: Convert to WebP for optimal size
    webp_data = _convert_to_webp(image_data)
    if not webp_data:
        # Fall back to original PNG if WebP conversion fails
        logger.warning(f"WebP conversion failed for {food_name}, using original PNG")
        image_data.seek(0)
        webp_data = image_data
    
    # Step 4: Upload to Cloudinary
    cloudinary_url = _upload_to_cloudinary(webp_data, food_name)
    if not cloudinary_url:
        logger.warning(f"Failed to upload image to Cloudinary for: {food_name}")
        return None
    
    return cloudinary_url


def is_image_generation_enabled() -> bool:
    """
    Check if AI image generation is properly configured and available.
    
    Returns:
        True if both Fal AI and Cloudinary are configured, False otherwise
    """
    fal_key = getattr(settings, 'FAL_KEY', None) or os.environ.get('FAL_KEY')
    cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME', None) or os.environ.get('CLOUDINARY_CLOUD_NAME')
    api_key = getattr(settings, 'CLOUDINARY_API_KEY', None) or os.environ.get('CLOUDINARY_API_KEY')
    api_secret = getattr(settings, 'CLOUDINARY_API_SECRET', None) or os.environ.get('CLOUDINARY_API_SECRET')
    
    return bool(fal_key and cloud_name and api_key and api_secret)


def _background_image_generation_task(food_entry_id: int, food_name: str):
    """
    Background task to generate and update food image.
    This runs in a separate thread to avoid blocking the request.
    
    Args:
        food_entry_id: The ID of the FoodEntry to update
        food_name: The name of the food to generate an image for
    """
    import django
    django.setup()
    
    from django.db import connection
    
    try:
        print(f"[AI Image Background] Starting for FoodEntry {food_entry_id}: {food_name}")
        logger.info(f"[Background] Starting image generation for FoodEntry {food_entry_id}: {food_name}")
        
        # Generate the image
        image_url = generate_food_image(food_name)
        
        if image_url:
            print(f"[AI Image Background] Generated URL: {image_url}")
            # Import here to avoid circular imports
            from foods.models import FoodEntry
            
            # Close any stale connections before querying
            connection.close()
            
            # Update the FoodEntry with the generated image URL
            updated = FoodEntry.objects.filter(id=food_entry_id).update(imageUrl=image_url)
            
            if updated:
                print(f"[AI Image Background] SUCCESS - Updated FoodEntry {food_entry_id}")
                logger.info(f"[Background] Successfully updated FoodEntry {food_entry_id} with image: {image_url}")
            else:
                print(f"[AI Image Background] WARNING - FoodEntry {food_entry_id} not found")
                logger.warning(f"[Background] FoodEntry {food_entry_id} not found for image update")
        else:
            print(f"[AI Image Background] FAILED - No image generated for {food_name}")
            logger.warning(f"[Background] Failed to generate image for FoodEntry {food_entry_id}: {food_name}")
            
    except Exception as e:
        print(f"[AI Image Background] ERROR: {e}")
        logger.error(f"[Background] Error in image generation task for FoodEntry {food_entry_id}: {e}")
    finally:
        # Clean up database connection
        connection.close()
        print(f"[AI Image Background] Task completed for FoodEntry {food_entry_id}")


def generate_food_image_async(food_entry_id: int, food_name: str) -> None:
    """
    Generate an AI image for a food item in the background (non-blocking).
    
    This spawns a background thread to handle the image generation,
    allowing the API to return immediately to the user.
    
    Args:
        food_entry_id: The ID of the FoodEntry to update with the generated image
        food_name: The name of the food to generate an image for
        
    Example:
        >>> generate_food_image_async(food_entry_id=123, food_name="Grilled Salmon")
        # Returns immediately, image will be generated and saved in background
    """
    print(f"[AI Image] generate_food_image_async called for: {food_name} (ID: {food_entry_id})")
    
    if not is_image_generation_enabled():
        print("[AI Image] Image generation is NOT configured - missing FAL_KEY or Cloudinary credentials")
        logger.info("AI image generation is not configured, skipping async generation")
        return
    
    if not food_name or not food_name.strip():
        print("[AI Image] Empty food name provided")
        logger.warning("Empty food name provided for async image generation")
        return
    
    print(f"[AI Image] Spawning background thread for: {food_name}")
    logger.info(f"Spawning background thread for image generation: FoodEntry {food_entry_id}, {food_name}")
    
    # Create and start background thread
    thread = threading.Thread(
        target=_background_image_generation_task,
        args=(food_entry_id, food_name.strip()),
        daemon=True  # Daemon thread won't prevent process exit
    )
    thread.start()
    print(f"[AI Image] Background thread started for: {food_name}")

