# 💊 MedsBuddy - Medication Management System

**Live Demo:** [https://meds-buddy.vercel.app/](https://meds-buddy.vercel.app/)

A comprehensive medication management platform designed to help patients track their medications and enable caretakers to monitor adherence in real-time. Built with Next.js, TypeScript, Supabase, and modern web technologies.

---

## ✨ Features

### 🔐 **Authentication System**
- Secure user registration and login
- Role-based access control (Patient/Caretaker)
- Email verification and password reset
- Profile management with image upload

### 💊 **Medication Management**
- **Create Medications**: Add detailed medication information with dosage, frequency, and instructions
- **Edit & Delete**: Full CRUD operations for medication management
- **Image Upload**: Upload medication photos for easy identification
- **Smart Scheduling**: Automatic dose time calculations based on frequency

### 📊 **Adherence Tracking**
- **Real-time Monitoring**: Track medication intake in real-time
- **Adherence Statistics**: Detailed analytics on medication compliance
- **Progress Visualization**: Charts and graphs showing adherence trends
- **Missed Dose Alerts**: Notifications for missed medications

### 📅 **Calendar Integration**
- **Patient Calendar**: Personal medication schedule with visual indicators
- **Caretaker Calendar**: Monitor multiple patients' medication schedules
- **Color-coded Status**: Easy identification of taken, missed, and upcoming doses
- **Monthly/Weekly Views**: Flexible calendar navigation

### 👥 **Multi-User Support**
- **Patient Dashboard**: Personal medication tracking interface
- **Caretaker Dashboard**: Monitor multiple patients simultaneously
- **Patient Search**: Find and manage assigned patients

---

## 🚀 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: React Context + Custom Hooks
- **UI Components**: shadcn/ui
- **Testing**: Vitest, React Testing Library
- **Deployment**: Vercel

---

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm package manager
- A Supabase account
- Git for version control

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/1008surajshaw/meds-buddy.git
cd meds-buddy

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🗄️ Supabase Setup

### 1. Create a New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in your project details
4. Wait for the project to be ready

### 2. Database Schema Setup
Run the following SQL scripts in your Supabase SQL Editor:

#### Users and Profiles Table
```sql
create table user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text check (role in ('patient', 'caretaker')),
  onboarded boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

#### Medications Table
```sql
create table medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(user_id) on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  scheduled_time time,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

#### Medication Activity Table
```sql
create table medication_activity (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid references public.medications(id) on delete cascade,
  user_id uuid references public.user_profiles(user_id) on delete cascade,
  date date not null,
  taken boolean default false,
  taken_time time,
  proof_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique (medication_id, date)
);
```

#### Caretaker-Patient Relationship Table
```sql
create table caretaker_patients (
  id uuid primary key default gen_random_uuid(),
  caretaker_id uuid references public.user_profiles(user_id) on delete cascade,
  patient_id uuid references public.user_profiles(user_id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique (caretaker_id, patient_id)
);
```

### 3. Enable Row Level Security (RLS)
Enable RLS on all tables and create appropriate policies for your security requirements.

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
# or
yarn dev
```
Visit [http://localhost:8080](http://localhost:3000) to see the application.

### Build for Production
```bash
npm run build
npm start
# or
yarn build
yarn start
```

### Run Tests
```bash
npm run test
# or
yarn test
```

## 📁 Project Structure
```
src/
├── components/
│   ├── auth/                 # Authentication components
│   ├── caretaker/            # Caretaker-specific components
│   ├── medication/           # Medication management components
│   ├── patient/              # Patient-specific components
│   └── shared/               # Reusable components
├── contexts/                 # React contexts
├── hooks/                    # Custom React hooks
├── lib/                      # Library functions
├── pages/                    # Next.js pages
│   ├── api/                  # API routes
│   ├── auth/                 # Authentication pages
│   ├── caretaker/            # Caretaker pages
│   ├── patient/              # Patient pages
│   └── _app.tsx              # Main app component
├── styles/                   # Global styles
├── types/                    # TypeScript type definitions
├── utils/                    # Utility functions
└── __tests__/                    # Test files
```

## 🔧 Configuration

### Supabase Configuration
The app uses Supabase for:
- **Authentication**: User registration, login, and session management
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Storage**: File uploads for medication images and avatars
- **Real-time**: Live updates for medication tracking

### Environment Variables
- `VITE_SUPABASE_URLL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key


## 🚀 Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables in Vercel
Add the same environment variables from your `.env` file to your Vercel project settings.

## 🧪 Testing
The project includes comprehensive tests:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```


**Made with ❤️ for better medication management**


