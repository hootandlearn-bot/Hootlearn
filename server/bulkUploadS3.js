import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();
const prisma = new PrismaClient();
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const bucketName = process.env.AWS_BUCKET_NAME;
const uploadDir = path.join(process.cwd(), 'bulk-uploads');

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function uploadFileToS3(filePath, key) {
  const fileContent = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  let contentType = 'application/octet-stream';
  if (ext === '.pdf') contentType = 'application/pdf';
  if (ext === '.mp4') contentType = 'video/mp4';
  if (ext === '.png') contentType = 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
  });
  
  await s3Client.send(command);
  return key;
}

function getActionType(ext) {
  if (ext === '.pdf') return 'Read PDF';
  if (ext === '.mp4' || ext === '.mov') return 'Watch Video';
  return 'View';
}

async function processCategory(categoryPath, categoryName) {
  let slug = generateSlug(categoryName);
  
  // Find if category exists by slug, or try to find by matching name
  let dbCategory = await prisma.category.findUnique({ where: { slug } });
  if (!dbCategory) {
    // try to find by name just in case the slug is different (like 'training' for 'Teacher Training')
    const allCats = await prisma.category.findMany();
    dbCategory = allCats.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
  }
  
  if (!dbCategory) {
    console.log(`Creating category: ${categoryName}`);
    dbCategory = await prisma.category.create({
      data: { slug, name: categoryName, icon: 'Folder', allowDownload: true }
    });
  } else {
    slug = dbCategory.slug;
  }
  
  const items = fs.readdirSync(categoryPath, { withFileTypes: true });
  for (const item of items) {
    const itemPath = path.join(categoryPath, item.name);
    
    if (item.isDirectory()) {
      await processFolder(itemPath, item.name, slug);
    } else {
      // It's a file directly under the category
      await processFile(itemPath, item.name, slug, null);
    }
  }
}

async function processFolder(folderPath, folderName, categorySlug) {
  // Check if folder exists
  let dbFolder = await prisma.folder.findFirst({
    where: { name: folderName, categorySlug }
  });
  
  if (!dbFolder) {
    console.log(`Creating folder: ${folderName} under ${categorySlug}`);
    dbFolder = await prisma.folder.create({
      data: { name: folderName, categorySlug }
    });
  }
  
  const items = fs.readdirSync(folderPath, { withFileTypes: true });
  for (const item of items) {
    const itemPath = path.join(folderPath, item.name);
    if (item.isDirectory()) {
      await processSubFolderFiles(itemPath, dbFolder.id, categorySlug);
    } else {
      await processFile(itemPath, item.name, categorySlug, dbFolder.id);
    }
  }
}

async function processSubFolderFiles(dirPath, folderId, categorySlug) {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const item of items) {
    const itemPath = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      await processSubFolderFiles(itemPath, folderId, categorySlug);
    } else {
      await processFile(itemPath, item.name, categorySlug, folderId);
    }
  }
}

async function processFile(filePath, fileName, categorySlug, folderId) {
  // Skip hidden files or unsupported extensions if needed, but let's just skip hidden
  if (fileName.startsWith('.')) return;
  
  console.log(`Uploading file: ${fileName}...`);
  const uniqueKey = Date.now() + '-' + fileName.replace(/[^a-zA-Z0-9.\-]/g, '_');
  const fileUrl = await uploadFileToS3(filePath, uniqueKey);
  
  const ext = path.extname(fileName).toLowerCase();
  const title = path.basename(fileName, ext);
  
  await prisma.resource.create({
    data: {
      title,
      category: categorySlug,
      folderId,
      actionType: getActionType(ext),
      cover: 'gradient-blue',
      fileUrl
    }
  });
  console.log(`Successfully added resource: ${title}`);
}

async function main() {
  if (!fs.existsSync(uploadDir)) {
    console.log('No bulk-uploads folder found.');
    return;
  }
  
  const categories = fs.readdirSync(uploadDir, { withFileTypes: true });
  for (const category of categories) {
    if (category.isDirectory()) {
      const categoryPath = path.join(uploadDir, category.name);
      await processCategory(categoryPath, category.name);
    }
  }
  
  console.log('Bulk upload complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
