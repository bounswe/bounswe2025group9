<p align="center">
Visit our website 👇
</p>

<a href="https://nutrihub.fit">
  <img src="https://github.com/user-attachments/assets/f44d84fe-ac8d-44e2-b643-bbebab4e09ef" alt="Nutrihub Logo" width="800"/>
</a>  

Or watch our [website](https://www.youtube.com/watch?v=Uglpcuw_Zg0) and [mobile](https://drive.google.com/file/d/1FJ-BgY_uusbCjsC7Lncxc12e4Ob1NKFR/view?usp=sharing) demos.

---

# About Us

We are Computer Engineering students studying at Boğaziçi University.  
We are taking the course [**CmpE 451: Introduction to Software Engineering**](https://www.cmpe.boun.edu.tr/tr/courses/cmpe451) together.  
To learn more about the team and the project, visit our [Wiki Page](https://github.com/bounswe/bounswe2025group9/wiki).

<img src="https://github.com/user-attachments/assets/0f7b63a5-9fbc-40f5-a1ee-cf4cfe666c2e" alt="bounswe2025group9" width="800"/>

[CmpE 352 Codebase](https://github.com/bounswe/bounswe2025group9/tree/cmpe352-main)

---

# Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Web Application](#web-application)
  - [Quick Start (Development)](#quick-start-development)
  - [Environment Configuration](#environment-configuration)
  - [Database Population](#database-population)
  - [Default Credentials](#default-credentials)
  - [Production Deployment](#production-deployment)
- [Mobile Application](#mobile-application)
  - [Environment Configuration](#mobile-environment-configuration)
  - [Development Build](#development-build)
  - [Production APK Build](#production-apk-build)
  - [Network Configuration](#network-configuration)
  - [Release Artifact](#release-artifact)
- [Manual Development Setup](#manual-development-setup)
- [Running Tests](#running-tests)
- [Contributing](#contributing)

---

# Project Overview

NutriHub is a comprehensive platform that helps users discover and manage affordable and healthy food options. The project consists of three main components:

- **Frontend**: React + TypeScript + Vite
- **Backend**: Django REST Framework + MySQL
- **Mobile App**: React Native + Expo

---

# Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (20.10+) and **Docker Compose** (2.0+)
  - For APK builds: Allocate at least **8GB RAM** to Docker (Gradle build fails with OOM otherwise)
  - macOS: Docker Desktop → Settings → Resources → Memory
  - Windows: Docker Desktop → Settings → Resources → Memory

**Optional** (for manual development without Docker):
- Node.js (v20 or later)
- Python (3.11 or later)
- MySQL (8.0)

---

# Web Application

## Quick Start (Development)

The easiest way to run the entire web application is using Docker Compose:

### 1. Clone the Repository

```bash
git clone https://github.com/bounswe/bounswe2025group9.git
cd bounswe2025group9
```

### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
# Edit .env if needed (defaults work for local development)
```

The provided `.env.example` contains sensible defaults for local development.

### 3. Start All Services

```bash
docker-compose up --build -d
```

This will start:
- **Frontend** at http://localhost:8080
- **Backend API** at http://localhost:8080/api/
- **MySQL database** (internal, port 3306)

### 4. Populate the Database

See [Database Population](#database-population) section below for two options to seed data.

### 5. Access the Application

- Open http://localhost:8080 in your browser
- Log in with [default credentials](#default-credentials)

---

## Environment Configuration

The web application uses environment variables defined in `.env` at the project root. Here's what each variable does:

### Web Hosting Options

| Variable | Default | Description |
|----------|---------|-------------|
| `BUILD` | `DEV` | Build mode: `DEV` (http only) or `PROD` (https with redirect) |
| `PORT` | `8080` | Port for web hosting. Use `80` for production to enable http→https redirect |

### Database Secrets

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `MYSQL_PASSWORD` | `djangopass` | ✓ | Password for MySQL user `django` |
| `MYSQL_ROOT_PASSWORD` | `rootpass` | ✓ | Password for MySQL root user |

> [!WARNING]
> **Production Security**: Use strong passwords in production! Change these defaults.

### Application Secret

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `DJANGO_SECRET_KEY` | `super-secret-key` | ✓ | Django secret key for cryptographic signing |

> [!WARNING]
> **Production Security**: Generate a unique secret key for production deployments.

### External API Keys (Optional)

These are optional for basic functionality but required for specific features:

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `FATSECRET_CONSUMER_KEY` | _(empty)_ | ✗ | FatSecret API key (for external food database) |
| `FATSECRET_CONSUMER_SECRET` | _(empty)_ | ✗ | FatSecret API secret |
| `FAL_KEY` | _(empty)_ | ✗ | Fal AI key (for AI image generation) |
| `CLOUDINARY_CLOUD_NAME` | _(empty)_ | ✗ | Cloudinary cloud name (for image storage) |
| `CLOUDINARY_API_KEY` | _(empty)_ | ✗ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | _(empty)_ | ✗ | Cloudinary API secret |

**FatSecret API Setup** (optional):
1. Create an account at [FatSecret Platform API](https://platform.fatsecret.com/api/)
2. Get your consumer key and secret
3. Add to `.env` or `backend/.env.example`

See `backend/.env.example` for additional backend-specific configuration options.

---

## Database Population

After starting the services, you need to populate the database. Choose one of two options:

### Option A: Restore from Backup (Fastest, Recommended)

The repository includes a complete database backup with users, foods, recipes, and posts.

**Location**: `backup/nutrihub-db-backup.zip`

**Restore steps**:

```bash
# 1. Unzip the backup file
cd backup
unzip nutrihub-db-backup.zip

# 2. Restore using docker exec (pipe SQL into container)
docker exec -i mysql-db mysql -udjango -pdjangopass mydb < nutrihub-db-backup.sql
```

**Alternative using root user**:
```bash
docker exec -i mysql-db mysql -uroot -prootpass mydb < nutrihub-db-backup.sql
```

> [!NOTE]
> This is a **destructive restore** - existing tables in `mydb` will be dropped and recreated.

For more restore options, see [`backup/README.md`](backup/README.md).

### Option B: Seed from Scratch

Django migrations automatically create the schema and seed essential data:

```bash
# Migrations run automatically when backend container starts
# To run manually:
docker exec -it django-app python manage.py migrate
```

**What gets seeded automatically**:
- ✓ Database schema (all tables)
- ✓ Default forum tags (Dietary tip, Recipe, Meal plan)
- ✓ Sample recipes with ingredients
- ✓ **Default users** (admin + demo user)

**Loading additional food data** (optional):

The database backup already contains ~500 foods. To load more from JSON:

```bash
# Load foods from JSON file
docker exec -it django-app python api/db_initialization/load_food_from_json.py \
  api/db_initialization/NewFoodDatabase.json --limit 1000 --skip-errors
```

See [`backend/api/db_initialization/readme.md`](backend/api/db_initialization/readme.md) for more details.

---

## Default Credentials

After seeding (either via backup or migrations), you can log in with these pre-created users:

| Role | Username | Password | Email | Capabilities |
|------|----------|----------|-------|--------------|
| **Admin** | `admin` | `admin123` | admin@nutrihub.fit | Full access, staff privileges, food moderation |
| **Regular User** | `demo` | `demo123` | demo@nutrihub.fit | Standard user access |

> [!TIP]
> Use the **admin** account to access the admin panel at http://localhost:8080/api/admin/ and moderate food proposals, manage users, etc.

---

## Production Deployment

For production deployment with HTTPS:

### 1. Update Environment Variables

Edit `.env`:

```bash
export BUILD=PROD          # Use production nginx config (https)
export PORT=80             # Allow http→https redirect
export MYSQL_PASSWORD="your-strong-password"
export MYSQL_ROOT_PASSWORD="your-strong-root-password"
export DJANGO_SECRET_KEY="your-random-secret-key-generate-this"
```

> [!CAUTION]
> **Security Critical**: Always use strong, random passwords and secret keys in production!

### 2. Obtain SSL Certificates

NutriHub uses Let's Encrypt for free SSL certificates via Certbot.

**First, start the app in development mode** to expose port 80:

```bash
# Temporarily use DEV mode with PORT=80
BUILD=DEV PORT=80 docker-compose up --build -d
```

**Run Certbot to obtain certificates**:

```bash
sudo docker run --rm \
    -v $(pwd)/certbot/www:/var/www/certbot \
    -v $(pwd)/certbot/conf:/etc/letsencrypt \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d nutrihub.fit \
    -d www.nutrihub.fit
```

> [!NOTE]
> Replace `your-email@example.com` and domain names with your actual values.

Certificates will be stored in `certbot/conf/`.

### 3. Restart with Production Settings

```bash
# Update .env: BUILD=PROD, PORT=80
docker-compose down
docker-compose up --build -d
```

Your application is now running with HTTPS! 🎉

---

# Mobile Application

## Mobile Environment Configuration

The mobile app needs to know where your backend API is located.

### 1. Create Environment File

```bash
cd mobile/nutrihub
cp .env.example .env
```

### 2. Configure API Endpoint

Edit `mobile/nutrihub/.env` and set `API_BASE_URL`:

**For production** (deployed server):
```bash
API_BASE_URL=https://nutrihub.fit/api
```

**For local development** (Docker backend on your machine):
```bash
# Replace YOUR_LOCAL_IP with your computer's local network IP
API_BASE_URL=http://192.168.1.100:8080/api
```

> [!IMPORTANT]
> **Finding your local IP**:
> - **macOS**: System Preferences → Network, or run `ipconfig getifaddr en0`
> - **Windows**: Run `ipconfig` and look for IPv4 Address
> - **Linux**: Run `hostname -I` or `ip addr show`

See [Network Configuration](#network-configuration) below for detailed guidance.

---

## Development Build

### 1. Install Dependencies

```bash
cd mobile/nutrihub
npm install
```

### 2. Configure API Endpoint

Make sure `.env` points to your backend (see above).

### 3. Start Development Server

```bash
npm run dev
```

### 4. Run on Device/Emulator

- **Android Emulator**: Press `a` in the Expo terminal
- **iOS Simulator** (macOS only): Press `i` in the Expo terminal
- **Physical Device**: Scan QR code with Expo Go app

> [!TIP]
> Your device/emulator must be able to reach the backend API. See [Network Configuration](#network-configuration).

---

## Production APK Build

### Using Docker (Recommended)

Docker ensures a consistent build environment and handles all dependencies.

**Prerequisites**: Docker with **8GB+ RAM** allocated

```bash
cd mobile/nutrihub

# Build the Docker image
docker build -t nutrihub-apk .

# Create a temporary container
docker create --name nutrihub-temp nutrihub-apk

# Extract the APK
docker cp nutrihub-temp:/app/android/app/build/outputs/apk/release/app-release.apk ./nutrihub.apk

# Clean up
docker rm nutrihub-temp
```

**Troubleshooting**:
- If build fails with "Gradle daemon disappeared", increase Docker memory to 8GB+
- Restart Docker Desktop after changing memory allocation

---

### Without Docker (Manual Build)

If you can't use Docker, you can build manually:

**Prerequisites**:
- Node.js 20+
- Java JDK 17+
- Android SDK (via Android Studio)

```bash
cd mobile/nutrihub

# Install dependencies
npm install

# Generate native Android project
npx expo prebuild --platform android --clean

# Configure Gradle memory settings
cd android
echo "org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m" >> gradle.properties
echo "org.gradle.daemon=false" >> gradle.properties
echo "org.gradle.parallel=false" >> gradle.properties

# Build release APK
./gradlew assembleRelease --stacktrace

# APK output location:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## Release Artifact

> [!TIP]
> **Pre-built APK Available**: Download the compiled `.apk` file directly from GitHub Releases!

### Download Pre-built APK

1. Go to [Releases](https://github.com/bounswe/bounswe2025group9/releases)
2. Find the release tagged **`customer-milestone-3`**
3. Download `nutrihub.apk` from the release assets
4. Install on your Android device

### Installing on Android Device

1. Enable "Install from Unknown Sources" in Android settings
2. Transfer the APK to your device
3. Open the APK file to install
4. Launch NutriHub!

---

# Manual Development Setup

If you prefer to run components individually without Docker:

## Backend Setup

> [!NOTE]
> Assumes MySQL database is available and running with `django@localhost` user and `mydb` database.

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements-dev.txt

# Set up environment variables
source setup.sh  # On Windows: .\setup.sh

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Start development server
python manage.py runserver 9000
```

Backend API will be available at http://localhost:9000/api/

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will be available at http://localhost:5173/ (or similar Vite port).

**Configure API endpoint**:
Set `VITE_API_BASE_URL` environment variable:
```bash
export VITE_API_BASE_URL="http://localhost:9000/api"
npm start
```

---

## Mobile App Setup

```bash
cd mobile/nutrihub

# Install dependencies
npm install

# Configure backend URL in .env
echo "API_BASE_URL=http://YOUR_LOCAL_IP:9000/api" > .env

# Start development server
npm run dev
```

---

# Running Tests

## Backend Tests

```bash
cd backend
python manage.py test
```

## Frontend Tests

```bash
cd frontend
npm test
```

## Mobile App Tests

```bash
cd mobile/nutrihub
npm test
```

---

# Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests to ensure everything works
4. Submit a pull request

See our [Wiki](https://github.com/bounswe/bounswe2025group9/wiki) for contribution guidelines.

---

# License

This project is part of the CmpE 451 course at Boğaziçi University.
