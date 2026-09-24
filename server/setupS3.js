import dotenv from 'dotenv';
import { S3Client, CreateBucketCommand, PutBucketCorsCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const bucketName = process.env.AWS_BUCKET_NAME || 'hoot-secure-vault-2026';

async function setupS3() {
  try {
    // 1. Check if bucket exists
    console.log(`Checking if bucket ${bucketName} exists...`);
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      console.log('Bucket already exists. Proceeding to configure CORS...');
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        // 2. Create Bucket
        console.log('Bucket not found. Creating new bucket...');
        await s3Client.send(new CreateBucketCommand({
          Bucket: bucketName,
          CreateBucketConfiguration: {
            LocationConstraint: process.env.AWS_REGION || 'ap-south-1'
          }
        }));
        console.log('Bucket created successfully!');
      } else {
        throw error;
      }
    }

    // 3. Configure CORS (Required for the React frontend to stream PDFs via Signed URLs)
    console.log('Configuring CORS policy...');
    await s3Client.send(new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "HEAD"],
            AllowedOrigins: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3000
          }
        ]
      }
    }));
    console.log('CORS configured successfully!');
    
    // Note: Since your backend uses `getSignedUrl`, we do NOT need to make the bucket public!
    // The files will remain 100% private and secure in AWS, and the backend will generate temporary access tokens.
    console.log('Setup Complete! Your secure vault is ready.');
    
  } catch (error) {
    console.error("Error setting up S3:", error);
  }
}

setupS3();
