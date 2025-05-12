# Deploying to DigitalOcean with Docker

This guide explains how to deploy this application to DigitalOcean using Docker and Docker Compose.

## Prerequisites

1. A DigitalOcean account
2. Docker and Docker Compose installed on your local machine
3. Git repository with your project code

## Step 1: Create a Droplet on DigitalOcean

1. Log in to your DigitalOcean account
2. Click on "Create" and select "Droplets"
3. Choose the "Marketplace" tab and select "Docker" to create a Droplet with Docker pre-installed
4. Select your preferred plan (Recommended: Basic Plan with at least 2GB RAM)
5. Choose a datacenter region close to your target users
6. Add your SSH keys or create a password
7. Click "Create Droplet"

## Step 2: Connect to Your Droplet

```bash
ssh root@your_droplet_ip
```

## Step 3: Clone Your Repository

```bash
git clone https://github.com/yourusername/bounswe2025group9.git
cd bounswe2025group9
```

## Step 4: Configure Environment Variables (Optional)

If you need to customize environment variables for production:

1. Create a `.env` file in the root directory
2. Add your production environment variables

## Step 5: Build and Run with Docker Compose

```bash
docker-compose up -d
```

This command will:
- Build the Docker images for frontend and backend
- Start the MySQL database
- Start the backend Django application
- Start the frontend React application with Nginx

## Step 6: Verify the Deployment

Your application should now be running at:
- Frontend: http://your_droplet_ip
- Backend API: http://your_droplet_ip:8081

## Step 7: Set Up Domain Name (Optional)

1. Purchase a domain name from a domain registrar
2. Add an A record pointing to your Droplet's IP address
3. Update the `server_name` in `frontend/nginx.conf` to your domain name
4. Rebuild and restart the containers:

```bash
docker-compose down
docker-compose up -d
```

## Step 8: Set Up SSL with Let's Encrypt (Optional)

For HTTPS support:

1. Install Certbot on your Droplet
2. Obtain SSL certificates for your domain
3. Update the Nginx configuration to use SSL
4. Rebuild and restart the containers

## Maintenance

### Viewing Logs

```bash
# View logs for all services
docker-compose logs

# View logs for a specific service
docker-compose logs frontend
docker-compose logs backend
docker-compose logs db
```

### Updating the Application

When you need to update your application:

```bash
# Pull the latest code
git pull

# Rebuild and restart the containers
docker-compose down
docker-compose up -d --build
```

### Backup Database

To backup the MySQL database:

```bash
docker exec mysql-db mysqldump -u django -pdjangopass mydb > backup.sql
```

### Restore Database

To restore the MySQL database:

```bash
docker exec -i mysql-db mysql -u django -pdjangopass mydb < backup.sql
``` 