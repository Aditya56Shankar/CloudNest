# ☁️ CloudNest

CloudNest is a cloud-based file management system built using the **MERN stack**, enhanced with **AI-powered PDF summarization**.  
It allows users to upload, organize, manage, and summarize files securely, similar to Google Drive, with added AI capabilities.

---

## 🚀 Features

- 🔐 User Authentication (JWT-based)
- ☁️ Cloud File Upload & Storage (Cloudinary)
- 📂 File Management
  - Upload, Download, Rename
  - Star / Unstar files
  - Trash & Restore
- 🔍 Search & Filter files
- 📄 **AI-powered PDF Summarization**
- 📊 Storage usage tracking
- 🧾 Grid & List views
- 🔒 Secure backend with environment variables

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- React Router
- Fetch API

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Multer (file handling)
- Cloudinary (cloud storage)
- OpenAI API (PDF summarization)

---

## 📁 Project Structure

CloudNest/
├─ client/ # React frontend
│ ├─ src/
│ └─ package.json
│
├─ server/ # Node.js backend
│ ├─ src/
│ │ ├─ controllers/
│ │ ├─ routes/
│ │ ├─ models/
│ │ ├─ utils/
│ │ └─ index.js
│ ├─ .env # Environment variables (NOT committed)
│ └─ package.json
│
├─ README.md
└─ .gitignore

Create a `.env` file in the **server root directory**.

> ⚠️ **Do NOT commit `.env` to GitHub**

### 📄 `.env` Example

```env
# =========================
# Server
# =========================

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# =========================
# Client
# =========================
CLIENT_URL=

# =========================
# Authentication
# =========================
JWT_SECRET=

# =========================
# Database
# =========================
DATABASE_URL=mongodb://localhost:27017/cloudnest

# =========================
# AI / PDF Summarization
# =========================
OPENAI_API_KEY=