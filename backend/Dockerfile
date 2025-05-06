# Use official Python base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /project

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    libssl-dev \
    libffi-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirement files
COPY requirements-dev.txt requirements.txt ./

# Install Python dependencies
RUN pip install --upgrade pip && pip install -r requirements-dev.txt

# Copy project files
COPY . .

# Run Django dev server
CMD ["python", "manage.py", "runserver", "0.0.0.0:9000"]
