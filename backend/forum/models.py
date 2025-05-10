from typing import Any
from django.db import models
from django.conf import settings


class Tag(models.Model):
    objects: Any
    name = models.CharField(max_length=64, unique=True)

    def __str__(self) -> str:
        return str(self.name)


class Post(models.Model):
    objects: Any
    title = models.CharField(max_length=200)
    body = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    tags = models.ManyToManyField(Tag, blank=True)

    def __str__(self):
        return f"{self.title} by {self.author}"
