# Minimal Dockerfile for Expo React Native dev
FROM node:20

# Install watchman (optional but recommended for RN)
RUN apt-get update && apt-get install -y \
    watchman \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy the rest of the project
COPY . .

# Expose Metro + Expo ports
EXPOSE 19000 19001 19002 8081

CMD ["npx", "expo", "start", "--host", "localhost"]
