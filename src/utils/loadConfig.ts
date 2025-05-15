import { config } from 'dotenv';

export function loadConfig() {
  config(); // Load .env file
  const requiredVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_BUCKET_NAME',
    'REDIS_URL',
  ];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing environment variable: ${varName}`);
    }
  }
}