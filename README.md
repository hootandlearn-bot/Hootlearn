# Hoot Portal 🦉

Hoot Portal is a secure, full-stack educational resource and document management system. It is designed to host, manage, and securely serve digital library resources (PDFs, images) to students while robustly protecting against piracy (screenshots, right-clicking, and text selection). 

## 🚀 Features

- **Public & Private Library**: Visitors can browse the library's folder structure, while students must log in to actually open and read documents.
- **Admin Dashboard**: A comprehensive admin panel to manage users, upload files directly to AWS S3, and organize documents into dynamic Folders and Categories.
- **Secure PDF Viewer**: Integrated custom PDF viewer built with `react-pdf`, fully optimized for both desktop and mobile devices.
- **Anti-Piracy Shield**: Global event listeners block right-clicking, common screenshot keyboard shortcuts, text selection, and drag-and-drop to protect copyrighted materials.
- **Fully Responsive**: Beautiful, modern UI optimized for all screen sizes from large desktops to small smartphones.

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- React Router DOM
- React-PDF (PDF.js)
- Lucide React (Icons)
- Vanilla CSS with responsive media queries

**Backend**
- Node.js & Express.js
- Prisma (ORM)
- PostgreSQL (via AWS RDS)
- AWS SDK (S3 for secure file storage)
- JWT (Authentication) & Bcrypt (Password Hashing)
- Multer (File upload handling)

## 📦 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- A PostgreSQL Database (e.g., AWS RDS)
- An AWS S3 Bucket

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/hoot-portal.git
   cd hoot-portal
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd ../server
   npm install
   ```

### Environment Variables

**Backend (`server/.env`):**
Create a `.env` file in the `server` directory and add your credentials:
```env
DATABASE_URL="postgresql://postgres:password@database-name.region.rds.amazonaws.com:5432/postgres?schema=public"
PORT=5000
JWT_SECRET="your_super_secret_jwt_key"

AWS_REGION="your-aws-region"
AWS_BUCKET_NAME="your-s3-bucket-name"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
```

**Frontend (`frontend/.env`):**
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000
```

### Database Setup

Run the following commands inside the `server` directory to set up your PostgreSQL database schema and seed the initial Admin user.

```bash
# Push Prisma schema to your live database
npx prisma db push

# Seed the database with the default Admin user
node seed.js
```
*(Default Admin Login: `admin` / `password123`)*

### Running Locally

You will need two terminal windows to run both the frontend and backend simultaneously.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🚢 Deployment

**1. Frontend (Vercel)**
- Import the repository into Vercel.
- The `vercel.json` file is already included to handle React Router client-side routing.
- Set the `VITE_API_URL` environment variable to point to your secure backend URL (e.g., `https://api.yourdomain.com`).

**2. Backend (AWS EC2)**
- Deploy the Express server to an AWS EC2 instance.
- Configure Nginx as a reverse proxy to forward traffic to `localhost:5000`.
- Secure the API with an SSL certificate using Certbot (HTTPS is strictly required for Vercel to communicate with the backend).
- Ensure `DATABASE_URL` (AWS RDS) and all `AWS_*` (S3) variables are set in a `.env` file on the EC2 instance.

## 🔒 Security Notes
The portal includes client-side security measures to discourage piracy. To test or use Chrome DevTools during local development without triggering the anti-piracy blur shield, you may temporarily disable the `handleBlur` and `handleVisibilityChange` event listeners inside `Dashboard.jsx`.
