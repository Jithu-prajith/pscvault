/**
 * Generates a RFC 9562 compliant UUIDv7 string.
 * UUIDv7 combines a 48-bit UNIX timestamp (milliseconds) with 74 bits of cryptographically
 * random data, ensuring global uniqueness while maintaining strict time ordering for database indexing.
 */
export function generateUUIDv7(): string {
  const timestamp = Date.now();
  
  // 48-bit timestamp hex string (12 chars)
  const timeHex = timestamp.toString(16).padStart(12, '0');
  
  // Random bytes for the remaining bits
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);
  
  // Set version 7 (0111) in byte 6
  randomBytes[0] = (randomBytes[0] & 0x0f) | 0x70;
  
  // Set variant 1 (10xx) in byte 8
  randomBytes[2] = (randomBytes[2] & 0x3f) | 0x80;
  
  const randHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-${randHex.slice(0, 4)}-${randHex.slice(4, 8)}-${randHex.slice(8, 20)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
