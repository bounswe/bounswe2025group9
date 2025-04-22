# Affordable and Healthy Eating Hub - Mobile App (Expo)

## Project Overview

This is the mobile application for the "Affordable and Healthy Eating Hub" project. It's built using **Expo** and **React Native** to provide users with access to affordable and healthy food options on iOS and Android devices.

## Environment Setup

To develop and run this project, you need a few key tools:

1.  **Node.js & npm:**
    * **Node.js:** This is a JavaScript runtime required to build and run the project. Download the latest LTS version from [https://nodejs.org/](https://nodejs.org/).
    * **npm (Node Package Manager):** Comes bundled with Node.js. It's used to install and manage the project's libraries (dependencies).
2.  **Expo Go App:**
    * This is a free app for your phone (or simulator/emulator) that lets you run your project during development without needing complex native build setups.
    * Install it from the App Store (iOS) or Google Play Store (Android).

## Getting Started


1.  **Clone the repository:**
    * Clone the main repository containing the `mobile/` directory.
    ```bash
    git clone https://github.com/bounswe/bounswe2025group9.git
    cd bounswe2025group9
    ```

2.  **Navigate to Project Directory:** Go into the mobile app's folder.
    ```bash
    cd mobile/affordable-and-healthy-eating-hub
    ```
3.  **Install Dependencies:** Use **npm** to download and install all the required libraries listed in the `package.json` file.
    ```bash
    npm install
    ```

## Project Setup Explained

This project uses the following core technologies:


* **React Native:** A framework for building native mobile apps. **What it is:** It allows us to write app logic and UI using React and TypeScript/JavaScript. **Why we use it:** To create truly native iOS and Android apps from a single codebase, reusing web development knowledge (React).
* **TypeScript:** A programming language that builds on JavaScript by adding static types. This project uses TypeScript to help catch errors early, improve code readability, and make refactoring safer. Your code will be in `.ts` and `.tsx` files.
* **Expo:** A set of tools and services built around React Native. **What it is:** It provides a development environment, manages the native build process (mostly behind the scenes), and offers the helpful Expo Go app. **Why we use it:** To speed up development, simplify testing across devices via Expo Go, and leverage pre-built modules from the Expo SDK.

## Simulating the App

1.  **Start the Development Server:** Run the following command in the project directory (`mobile/YourExpoAppName`):
    ```bash
    npx expo start
    ```
    * This starts the Expo development server (Metro Bundler).
2.  **Open the App:**
    * On your phone with **Expo Go** installed: Scan the QR code shown in the terminal or browser tab using the Expo Go app.
    * On an iOS Simulator: Press `i` in the terminal.
    * On an Android Emulator: Press `a` in the terminal.

The app will then load and run inside Expo Go or your simulator/emulator. Changes you make to the code will often update live in the app.
> 📚 Learn more about Expo at [https://docs.expo.dev](https://docs.expo.dev)
