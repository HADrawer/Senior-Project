# Alsaeh.bh

AI-powered tourism recommender system for Bahrain.

Alsaeh.bh is a smart web application that helps users plan trips in Bahrain through personalized recommendations and AI-generated itineraries. The system collects user preferences such as interests, budget, trip duration, travel style, and constraints, then uses Gemini to generate a structured tourism plan that can later be refined manually or through chatbot-based editing.

## Overview

Tourists visiting Bahrain often rely on static websites or generic recommendations that do not adapt to individual preferences, budgets, or time limits. Alsaeh.bh addresses this gap by providing:

- personalized tourism preferences collection
- AI-generated travel plans and itineraries
- structured day-by-day plans with time slots
- real-time editing through chatbot and manual interaction
- saved plans management
- admin reporting for usage insights

## Objectives

- Build a user-friendly tourism recommendation web application for Bahrain
- Analyze user preferences and generate personalized travel plans
- Provide recommendations for attractions, food, and activities
- Allow users to modify generated plans
- Deliver structured itineraries with scheduling and organized activities

## Main Features

### User features
- User registration and login
- Google sign-in support
- Password reset and email change
- Profile management
- Tourism preference setup, including:
  - interests
  - budget range
  - trip duration
  - travel style
  - accessibility or other special constraints
  - location
  - free-text customization
- AI-generated personalized itinerary using Gemini API
- Structured output including:
  - day breakdown
  - time slots
  - recommended locations
  - opening hours
  - average prices
- Hybrid plan editing:
  - manual editing
  - chatbot-based editing
- Save plans
- View saved plans in My Plans
- Delete saved plans
- Export saved plans as PDF or image

### Admin features
- Admin authentication with elevated privileges
- Usage reporting, including:
  - number of generated plans
  - popular categories
  - user activity trends

## Non-Functional Requirements

- Works on desktop and mobile web browsers
- Secure storage of user data
- Arabic localization support
- Clear and user-friendly interface
- Graceful error handling and reliability

## Tech Stack

### Frontend
- Next.js

### Backend
- FastAPI
- Python

### Database and Auth
- PostgreSQL via Supabase
- Supabase Authentication

### AI Integration
- Gemini API

## Proposed Architecture

The project follows a modern web application architecture with a clear separation between frontend, backend, data, and external AI services.

### Client-side
Built with Next.js and responsible for:
- authentication screens
- preference forms
- itinerary display
- chatbot UI
- My Plans page
- admin dashboard and reports
- Arabic and English localization

### Server-side
Built with FastAPI and responsible for:
- authentication and authorization logic
- user profile and preferences management
- itinerary generation orchestration
- chatbot interactions
- plan storage and retrieval
- admin reporting and analytics

### Data layer
Supabase PostgreSQL is used to store:
- user profiles
- user roles
- tourism preferences
- generated itineraries
- saved plans
- usage logs and analytics-related data

### External services
- Gemini API for itinerary generation, recommendations, and chatbot responses
- Supabase for authentication and persistent storage

## Core Backend Modules

Suggested FastAPI service breakdown:

- **auth**: registration, login, logout, session handling, role checks
- **users**: profile management and account updates
- **preferences**: tourism preferences CRUD
- **itineraries**: generate, save, view, delete, export plans
- **chatbot**: plan refinement and conversational recommendation updates
- **reports**: admin metrics and usage reports
- **ai**: Gemini prompt construction, response validation, formatting

## Example User Flow

1. User signs up or logs in
2. User sets tourism preferences
3. User requests an itinerary
4. Backend sends structured prompt and context to Gemini
5. Gemini returns a personalized plan
6. User reviews the generated itinerary
7. User edits the plan manually or through chatbot interaction
8. User saves or exports the plan

## Setup

> This section is a practical starting point for the repo. Adjust commands to match the final implementation.

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase project
- Gemini API key

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd alsaeh-bh
```

### 2. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Backend setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 4. Environment variables
Create a `.env` file for each app as needed.

#### Frontend
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

#### Backend
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url
GEMINI_API_KEY=your_gemini_api_key
APP_ENV=development
```

## Planned Pages

### Public
- Landing page
- Login
- Register

### User
- Dashboard
- Profile
- Preferences
- Generate Plan
- Itinerary Details
- Chatbot Editor
- My Plans

### Admin
- Admin Login
- Admin Dashboard
- Reports

## Notes

- The system is intended for Bahrain tourism recommendations specifically
- Real-time information such as opening hours is considered important by the requirement analysis
- Arabic and English support is a key requirement
- The system focuses on personalized planning rather than generic recommendations

## Team

- Ammar Osama Ali
- Ahmed Taha
- Hashem Ahmed

Supervisor: Dr. Amal Ghanim
