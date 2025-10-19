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

# Installation
## Project Overview
NutriHub is a comprehensive platform that helps users discover and manage affordable and healthy food options. The project consists of three main components:
- Frontend (React + TypeScript)
- Backend (Django)
- Mobile App (React Native)

## Prerequisites
- Docker and Docker Compose
- Node.js (v20 or later)
- Python (3.11 or later)
- MySQL (8.0)

## Quick Start with Docker

The easiest way to run the entire project is using Docker Compose:

1. Clone the repository:
```bash
git clone https://github.com/bounswe/bounswe2025group9.git
cd bounswe2025group9
```

2. Start all services:
```bash
docker-compose up --build -d
```

This will start:
- Frontend at http://localhost:8080
- Backend API at http://localhost:8080/api/
- MySQL database

## FatSecret API Integration

To use the food data features, you need to set up FatSecret API credentials:

1. Go to [FatSecret Platform API](https://platform.fatsecret.com/api/)
2. Create a new account to get your API credentials
3. Add the following environment variables to your environment variables in the backend directory:
   ```
   FATSECRET_CONSUMER_KEY=your_consumer_key
   FATSECRET_CONSUMER_SECRET=your_consumer_secret
   ```

Note: The API credentials are required for:
- Food search functionality
- Nutritional information retrieval
- Food database integration

## Manual Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements-dev.txt
```

4. Set up environment variables:
```bash
source setup.sh  # On Windows: .\setup.sh
```

5. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Start the development server:
```bash
python manage.py runserver 9000
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

### Mobile App Setup

1. Navigate to the mobile directory:
```bash
cd mobile/nutrihub
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Database Setup

The project uses MySQL as the database. When running with Docker, the database is automatically configured. For manual setup:

1. Create a MySQL database named `mydb`
2. Create a user with the following credentials:
   - Username: django
   - Password: djangopass

## Running Tests

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Mobile App Tests
```bash
cd mobile/nutrihub
npm test
```

## Development Tools

### Code Formatting
The project uses Black for Python code formatting:
```bash
cd backend
black .
```

### Pre-commit Hooks
Pre-commit hooks are set up for the backend:
```bash
cd backend
pre-commit install
```

## Project Structure

```
bounswe2025group9/
├── backend/           # Django backend
├── frontend/         # React frontend
├── mobile/           # React Native mobile app
└── docker-compose.yml
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests
4. Submit a pull request

## License

This project is part of the CmpE 451 course at Boğaziçi University. 
