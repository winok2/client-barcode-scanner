/**
 * Generates a unique ID for patient cards
 * Format: 16-character hexadecimal string
 */
export function generateUniqueId(): string {
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).substring(2);
  return (timestamp + random).substring(0, 16).padEnd(16, '0');
}

/**
 * Validates a barcode value
 * @param barcode The barcode to validate
 * @returns true if valid, false otherwise
 */
export function isValidBarcode(barcode: string): boolean {
  return /^[0-9a-f]{16}$/.test(barcode);
} 