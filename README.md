# AppLens 🎨

<div align="center">

*Transform Screenshots into Stunning App Store Visuals*

![last commit](https://img.shields.io/badge/last%20commit-today-blue?style=for-the-badge)
![typescript](https://img.shields.io/badge/typescript-97.4%25-blue?style=for-the-badge)
![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

### Built with Modern Technologies

**Frontend:**

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Konva](https://img.shields.io/badge/Konva-0D83CD?style=for-the-badge&logo=konva&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-FF4154?style=for-the-badge&logo=zustand&logoColor=white)

**Backend:**

![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![Gin](https://img.shields.io/badge/Gin-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=amazon-aws&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [What is AppLens?](#what-is-shotify)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**AppLens** is a full-stack web application designed to help developers and designers create professional app store screenshots and promotional graphics for iOS and Android applications. With an intuitive visual editor, pre-designed templates, and powerful customization options, AppLens streamlines the process of creating stunning visuals for your mobile apps.

---

## 💡 What is AppLens?

AppLens solves the common problem faced by mobile app developers: creating eye-catching, professional screenshots for app stores. Instead of spending hours in complex design tools, AppLens provides:

- **Pre-designed Templates**: Start with beautiful, platform-specific templates for iOS and Android
- **Visual Canvas Editor**: Drag-and-drop interface powered by Konva.js for intuitive editing
- **Multi-slide Projects**: Create complete screenshot sets with consistent styling
- **Layer Management**: Control text, images, shapes, and screenshots with precision
- **Export Options**: Generate multiple sizes for different devices in one click
- **Cloud Storage**: Save your projects and access them from anywhere
- **Template System**: Choose from various categories and platforms

### Perfect For:

- Mobile app developers publishing to App Store / Play Store
- Design teams creating marketing materials
- Indie developers who need professional visuals without design expertise
- Agencies managing multiple app projects

---

## ✨ Key Features

### 🎨 Visual Editor
- **Canvas-based editing** with real-time preview using Konva.js
- **Layer management** with z-index control, locking, and visibility toggles
- **Multi-element support**: Text, images, shapes, and screenshot layers
- **Transform controls**: Position, resize, rotate elements freely
- **Undo/Redo functionality** for safe experimentation
- **Element duplication** for consistent designs

### 📱 Template System
- Pre-designed templates for iOS and Android platforms
- Multiple categories (App, Game, Business, etc.)
- Template browsing with thumbnail previews
- One-click template instantiation into projects
- Customizable template configurations

### 🖼️ Project Management
- Create and manage multiple projects
- Save project state to cloud
- Auto-save functionality
- Project thumbnails for easy identification
- Template-based project initialization

### 📤 Export System
- Generate multiple screenshot sizes simultaneously
- Platform-specific export presets (iPhone, iPad, Android devices)
- Batch export all slides in a project
- High-quality image output
- Download as ZIP for convenience

### 🔐 Authentication & Security
- Email/password authentication with secure hashing
- OAuth integration (Google, GitHub)
- JWT-based session management
- Protected routes and API endpoints
- Secure file upload validation

### ☁️ Cloud Storage
- AWS S3 integration for image storage
- Efficient file handling and CDN delivery
- Automatic image optimization
- Secure presigned URLs for uploads

---

## 🛠️ Technology Stack

### Frontend (`emerald-canvas-main/`)

#### Core Framework
- **React 18.3** - Modern UI library with hooks
- **TypeScript 5.8** - Type-safe development
- **Vite 5.4** - Lightning-fast build tool and dev server
- **React Router DOM 6.30** - Client-side routing

#### UI & Styling
- **TailwindCSS 3.4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Shadcn/ui** - Beautiful, customizable component system
- **Lucide React** - Icon library
- **Framer Motion** - Animation library

#### State Management & Data
- **Zustand 5.0** - Lightweight state management
- **TanStack React Query 5.83** - Server state management and caching
- **Axios 1.13** - HTTP client for API requests

#### Canvas & Graphics
- **Konva 10.0** - HTML5 canvas library for 2D rendering
- **React Konva** - React wrapper for Konva

#### Forms & Validation
- **React Hook Form 7.61** - Performant form library
- **Zod 3.25** - TypeScript-first schema validation
- **@hookform/resolvers** - Integration between RHF and Zod

#### Utilities
- **date-fns 3.6** - Modern date utility library
- **file-saver 2.0** - Client-side file saving
- **JSZip 3.10** - Create and download ZIP files
- **clsx & tailwind-merge** - Conditional CSS class handling
- **class-variance-authority** - Variant-based component styling

### Backend (`backend/`)

#### Core Framework & Language
- **Go 1.21** - High-performance compiled language
- **Gin 1.9** - Fast HTTP web framework

#### Database
- **MongoDB** - NoSQL document database
- **mongo-driver 1.13** - Official MongoDB Go driver

#### Authentication & Security
- **JWT (golang-jwt/jwt v5.2)** - JSON Web Tokens for authentication
- **crypto** - Password hashing and encryption
- **CORS middleware** - Cross-origin resource sharing

#### Cloud Storage
- **AWS SDK v2** - Amazon Web Services integration
- **S3** - Object storage for images and assets

#### Utilities
- **godotenv 1.5** - Environment variable management
- **google/uuid 1.5** - UUID generation

#### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Makefile** - Build automation

### Architecture Patterns

#### Frontend
- **Component-Based Architecture**: Modular, reusable React components
- **State Management**: Zustand stores for global state (auth, editor)
- **Server State**: React Query for API data caching and synchronization
- **Form Handling**: React Hook Form with Zod validation
- **Protected Routes**: Authentication-based route guards
- **Canvas Rendering**: Konva for high-performance 2D graphics

#### Backend
- **Clean Architecture**: Separation of concerns (handlers, services, repositories)
- **Repository Pattern**: Database abstraction layer
- **Middleware Chain**: Auth, CORS, logging
- **RESTful API**: Standard HTTP methods and status codes
- **JWT Authentication**: Stateless authentication tokens
- **Service Layer**: Business logic isolation

---

## 🚀 Getting Started

### Prerequisites

**Frontend:**
- Node.js 16+ or Bun
- npm, yarn, or pnpm

**Backend:**
- Go 1.21+
- MongoDB 4.4+
- AWS account (for S3 storage)
- Docker (optional)

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/shotify.git
cd shotify
```

### 2. Frontend Setup

```bash
cd emerald-canvas-main

# Install dependencies
npm install
# or
yarn install
# or
bun install

# Copy environment file
cp .env.example .env

# Update .env with your backend API URL
# VITE_API_URL=http://localhost:8080/api
```

### 3. Backend Setup

```bash
cd backend

# Install Go dependencies
go mod download

# Copy environment file (create one based on your needs)
cp .env.example .env
```

---

## ⚙️ Configuration

### Frontend Environment Variables (`.env`)

```env
VITE_API_URL=http://localhost:8080/api
```

### Backend Environment Variables (`.env`)

```env
# Server
PORT=8080
ENVIRONMENT=development

# Database
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=shotify

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### MongoDB Setup

**Using Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Using Docker Compose (in backend directory):**
```bash
docker-compose up -d
```

---

## 🎮 Usage

### Development Mode

**Terminal 1 - Start Backend:**
```bash
cd backend
make run
# or
go run cmd/main.go
```

**Terminal 2 - Start Frontend:**
```bash
cd emerald-canvas-main
npm run dev
```

Open your browser at `http://localhost:5173`

### Production Build

**Frontend:**
```bash
cd emerald-canvas-main
npm run build
npm run preview  # Preview production build
```

**Backend:**
```bash
cd backend
make build  # Creates binary in bin/
./bin/shotify
```

### Using Docker

```bash
cd backend
docker-compose up --build
```

---

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register      # Register new user
POST   /api/auth/login         # Login user
GET    /api/auth/me            # Get current user
POST   /api/auth/refresh       # Refresh JWT token
```

### OAuth Endpoints

```
GET    /api/oauth/google       # Initiate Google OAuth
GET    /api/oauth/github       # Initiate GitHub OAuth
GET    /api/oauth/callback     # OAuth callback handler
```

### Template Endpoints

```
GET    /api/templates          # List all templates
GET    /api/templates/:id      # Get template by ID
POST   /api/templates          # Create template (admin)
PUT    /api/templates/:id      # Update template (admin)
DELETE /api/templates/:id      # Delete template (admin)
```

### Project Endpoints (Protected)

```
GET    /api/projects           # List user's projects
GET    /api/projects/:id       # Get project by ID
POST   /api/projects           # Create new project
PUT    /api/projects/:id       # Update project
DELETE /api/projects/:id       # Delete project
```

### Upload Endpoints (Protected)

```
POST   /api/upload/image       # Upload image to S3
GET    /api/upload/presigned   # Get presigned upload URL
```

---

## 🎨 How It Works

### Creating a Screenshot

1. **Choose Template**: Browse templates by platform and category
2. **Create Project**: Instantiate a project from a template
3. **Edit Canvas**: 
   - Add/edit text layers (title, description, features)
   - Upload screenshot images
   - Add shapes and design elements
   - Arrange layers with drag-and-drop
   - Adjust colors, fonts, sizes
4. **Multiple Slides**: Create a series of screenshots with consistent styling
5. **Export**: Generate images for all required device sizes
6. **Download**: Get a ZIP file with all your screenshots

### Editor Features

- **Layers Panel**: View and manage all canvas elements
- **Config Panel**: Edit properties of selected elements
- **Canvas**: Visual preview and direct manipulation
- **Toolbar**: Save, undo, redo, export actions
- **Slide Navigation**: Switch between slides in your project

---

## 🧪 Testing

```bash
# Frontend
cd emerald-canvas-main
npm run lint

# Backend
cd backend
go test ./...
```

---

## 🚢 Deployment

See [backend/Docs/DEPLOYMENT.md](backend/Docs/DEPLOYMENT.md) for detailed deployment instructions.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 📧 Contact & Support

For questions, issues, or contributions, please open an issue on GitHub.

---

<div align="center">

**Made with ❤️ by the AppLens Team**

*Transforming app screenshots into art since 2026*

</div>
