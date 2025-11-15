from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from foods.models import ImageCache
import os


class Command(BaseCommand):
    help = "Cleanup old and unused cached images"

    def add_arguments(self, parser):
        parser.add_argument(
            "--days-unused",
            type=int,
            default=30,
            help="Delete images not accessed for this many days (default: 30)",
        )
        parser.add_argument(
            "--days-zero-access",
            type=int,
            default=7,
            help="Delete images with 0 access count older than this many days (default: 7)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without actually deleting",
        )

    def handle(self, *args, **options):
        days_unused = options["days_unused"]
        days_zero_access = options["days_zero_access"]
        dry_run = options["dry_run"]

        now = timezone.now()
        cutoff_date = now - timedelta(days=days_unused)
        zero_access_cutoff = now - timedelta(days=days_zero_access)

        # Find images to delete based on last access
        old_images = ImageCache.objects.filter(last_accessed__lt=cutoff_date)

        # Find images never accessed and older than threshold
        never_accessed = ImageCache.objects.filter(
            access_count=0, created_at__lt=zero_access_cutoff
        )

        # Combine querysets
        to_delete = old_images | never_accessed
        to_delete = to_delete.distinct()

        if to_delete.count() == 0:
            self.stdout.write(self.style.SUCCESS("No images to cleanup"))
            return

        # Calculate statistics
        total_count = to_delete.count()
        total_size = sum(img.file_size for img in to_delete)
        total_size_mb = total_size / (1024 * 1024)

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"DRY RUN: Would delete {total_count} images ({total_size_mb:.2f} MB)"
                )
            )
            self.stdout.write("\nImages that would be deleted:")
            for img in to_delete[:10]:  # Show first 10
                last_accessed_days = (now - img.last_accessed).days
                self.stdout.write(
                    f"  - {img.original_url[:50]}... "
                    f"(Last accessed: {last_accessed_days} days ago, "
                    f"Access count: {img.access_count}, "
                    f"Size: {img.file_size / 1024:.1f} KB)"
                )
            if to_delete.count() > 10:
                self.stdout.write(f"  ... and {to_delete.count() - 10} more")
        else:
            # Delete files and database records
            deleted_count = 0
            for img in to_delete:
                try:
                    # Delete the file
                    if img.cached_file and os.path.exists(img.cached_file.path):
                        os.remove(img.cached_file.path)
                    # Delete the database record
                    img.delete()
                    deleted_count += 1
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(
                            f"Error deleting {img.original_url[:50]}...: {str(e)}"
                        )
                    )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully deleted {deleted_count} images ({total_size_mb:.2f} MB)"
                )
            )

        # Show cache statistics
        remaining_images = ImageCache.objects.all()
        remaining_count = remaining_images.count()
        remaining_size = sum(img.file_size for img in remaining_images)
        remaining_size_mb = remaining_size / (1024 * 1024) if remaining_size > 0 else 0

        self.stdout.write("\nCache Statistics:")
        self.stdout.write(f"  Remaining images: {remaining_count}")
        self.stdout.write(f"  Total cache size: {remaining_size_mb:.2f} MB")

        if remaining_count > 0:
            avg_access = (
                sum(img.access_count for img in remaining_images) / remaining_count
            )
            self.stdout.write(f"  Average access count: {avg_access:.1f}")
