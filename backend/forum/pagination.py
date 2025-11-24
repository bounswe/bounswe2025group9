from rest_framework.pagination import PageNumberPagination


class ForumPostPagination(PageNumberPagination):
    """
    Custom pagination class for forum posts.
    Supports optional page_size parameter for backward compatibility.
    If page_size is not provided, uses default PAGE_SIZE from settings.
    """
    page_size = 12  # Default page size (backward compatible)
    page_size_query_param = 'page_size'  # Allow client to override page size
    page_query_param = 'page'  # Explicitly set page query parameter
    max_page_size = 1000  # Maximum page size to prevent abuse

