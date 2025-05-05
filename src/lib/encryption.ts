import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.BARCODE_ENCRYPTION_KEY || 'your-secret-key-32-bytes-long!';

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
} 