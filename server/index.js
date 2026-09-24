import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { PrismaClient } = pkg;
dotenv.config();

const app = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hoot_key';

app.use(cors());
app.use(express.json());

// Set up local file storage for testing (before S3 is added)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Initialize S3 Client (if keys are present)
let s3Client = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });
  console.log("AWS S3 Client Initialized - Secure Mode Active");
}

// Seed default categories
const seedCategories = async () => {
  const defaults = [
    { slug: 'content-books', name: 'Hoot Content Books', icon: 'BookOpen', allowDownload: false },
    { slug: 'planners', name: 'Learning Planners', icon: 'Calendar', allowDownload: false },
    { slug: 'letters', name: 'Monthly Letters', icon: 'Mail', allowDownload: true },
    { slug: 'operations', name: 'School Operations Partner', icon: 'Briefcase', allowDownload: true },
    { slug: 'videos', name: 'Hoot Videos', icon: 'Video', allowDownload: false },
    { slug: 'training', name: 'Teacher Training', icon: 'GraduationCap', allowDownload: false },
  ];
  
  for (const c of defaults) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { allowDownload: c.allowDownload, icon: c.icon },
      create: c
    });
  }
};
/* if (process.env.NODE_ENV !== 'test') {
  seedCategories().catch(console.error);
} */


// --- 1. AUTHENTICATION ROUTES ---

// Admin Login Route
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, message: 'Logged in successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student/Teacher Login Route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Check expiration immediately on login
    if (new Date() > new Date(user.expiresAt)) {
      return res.status(403).json({ error: 'Your access has expired. Please contact the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, message: 'Logged in successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- 2. MIDDLEWARES ---

// Middleware to protect admin routes
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error();
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired admin token' });
  }
};

// Middleware to protect student/user routes
const requireUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // If admin, let them through (Admin can test user views)
    if (decoded.role === 'admin') {
      req.user = decoded;
      return next();
    }
    
    if (decoded.role !== 'user') throw new Error();
    
    // Validate that the user hasn't expired in the database since the token was issued
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    
    if (new Date() > new Date(user.expiresAt)) {
      return res.status(403).json({ error: 'Your access has expired. Please contact the administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to optionally attach user if token exists (for public resources view)
const optionalUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'admin') {
      req.user = decoded;
      return next();
    }
    if (decoded.role === 'user') {
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (user && new Date() <= new Date(user.expiresAt)) {
        req.user = user;
      }
    }
    next();
  } catch (err) {
    next();
  }
};

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// --- 3. STRUCTURE ROUTES (CATEGORIES & FOLDERS) ---

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create Category
app.post('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const { name, icon, allowDownload } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const category = await prisma.category.create({
      data: { slug, name, icon: icon || 'Folder', allowDownload: allowDownload || false }
    });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete Category
app.delete('/api/admin/categories/:slug', requireAdmin, async (req, res) => {
  try {
    await prisma.category.delete({ where: { slug: req.params.slug } });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get folders for a category (or all)
app.get('/api/folders', async (req, res) => {
  try {
    const { categorySlug } = req.query;
    const folders = await prisma.folder.findMany({
      where: categorySlug ? { categorySlug } : undefined,
      orderBy: { createdAt: 'asc' }
    });
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create Folder
app.post('/api/admin/folders', requireAdmin, async (req, res) => {
  try {
    const { name, categorySlug } = req.body;
    const folder = await prisma.folder.create({
      data: { name, categorySlug }
    });
    res.json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete Folder
app.delete('/api/admin/folders/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.folder.delete({ where: { id: req.params.id } });
    res.json({ message: 'Folder deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const signedUrlCache = new Map();

// GET all resources (Publicly visible metadata, but protected URLs)
app.get('/api/resources', optionalUser, async (req, res) => {
  try {
    let resources = await prisma.resource.findMany({
      include: { folder: true },
      orderBy: { createdAt: 'desc' }
    });

    // If user is NOT logged in, strip the secure URLs
    if (!req.user) {
      const publicResources = resources.map(r => {
        const publicR = { ...r };
        publicR.fileUrl = null;
        return publicR;
      });
      return res.json(publicResources);
    }

    // If S3 is active and user IS logged in, replace S3 keys with temporary pre-signed URLs
    if (s3Client) {
      const now = Date.now();
      resources = await Promise.all(resources.map(async (resItem) => {
        if (resItem.fileUrl && !resItem.fileUrl.startsWith('http')) {
          const cached = signedUrlCache.get(resItem.fileUrl);
          
          if (cached && cached.expiresAt > now) {
            resItem.fileUrl = cached.url;
          } else {
            const command = new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: resItem.fileUrl
            });
            const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 90000 }); // 25 hours
            
            // Cache it for 24 hours (86400000 ms) to be safe
            signedUrlCache.set(resItem.fileUrl, {
              url: signedUrl,
              expiresAt: now + 86400000
            });
            
            resItem.fileUrl = signedUrl;
          }
        }
        return resItem;
      }));
    }

    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new resource (Admin only)
app.post('/api/resources', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const { title, category, actionType, cover, folderId } = req.body;
    let finalFileUrl = null;
    
    if (req.file) {
      if (s3Client) {
        // Upload to S3
        const fileContent = fs.readFileSync(req.file.path);
        const s3Key = req.file.filename;
        
        const command = new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Key,
          Body: fileContent,
          ContentType: req.file.mimetype,
        });
        
        await s3Client.send(command);
        finalFileUrl = s3Key;
        fs.unlinkSync(req.file.path);
      } else {
        finalFileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      }
    }
    
    const resource = await prisma.resource.create({
      data: {
        title,
        category,
        folderId: folderId || null,
        actionType,
        cover: cover || 'gradient-blue',
        fileUrl: finalFileUrl
      },
      include: { folder: true }
    });
    
    res.json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE a resource (Admin only)
app.delete('/api/resources/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await prisma.resource.findUnique({ where: { id } });
    
    if (resource && resource.fileUrl) {
      if (resource.fileUrl.startsWith('http')) {
        const filename = resource.fileUrl.split('/').pop();
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } else if (s3Client) {
        const command = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: resource.fileUrl
        });
        await s3Client.send(command);
      }
    }

    await prisma.resource.delete({ where: { id } });
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- 4. ADMIN USER MANAGEMENT ROUTES ---

// GET all users
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, expiresAt: true, createdAt: true } // Don't send passwords back
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new user
app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { email, password, expiryMonths, customExpiryDate } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Calculate expiry date
    let expiresAt;
    if (expiryMonths === 'custom' && customExpiryDate) {
      expiresAt = new Date(customExpiryDate);
    } else {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + parseInt(expiryMonths, 10));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        expiresAt
      },
      select: { id: true, email: true, expiresAt: true } // Don't send back password
    });

    res.json(user);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE a user
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- 5. PUBLIC / HEALTH ROUTES ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hoot Backend is running!' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export { app };
