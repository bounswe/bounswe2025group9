FROM --platform=linux/amd64 mobiledevops/android-sdk-image:latest

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

COPY . .
RUN npm install


# Generate native Android code
RUN npx expo prebuild --platform android --clean

# Configure Gradle memory settings
WORKDIR /app/android
RUN echo "org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError" >> gradle.properties && \
    echo "org.gradle.daemon=false" >> gradle.properties && \
    echo "org.gradle.parallel=false" >> gradle.properties

# Build the release APK
RUN ./gradlew assembleRelease --stacktrace

# APK will be at: /app/android/app/build/outputs/apk/release/app-release.apk
CMD ["echo", "APK built successfully at /app/android/app/build/outputs/apk/release/app-release.apk"]
