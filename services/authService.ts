
interface UserRecord {
  username: string;
  passwordHash: string; // Hex encoded
  salt: string; // Hex encoded
}

const DB_KEY = 'nutrisnap_users_db';

// --- Crypto Helpers ---

const enc = new TextEncoder();
const dec = new TextDecoder();

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const tokens = hex.match(/.{1,2}/g);
  if (!tokens) return new Uint8Array();
  return new Uint8Array(tokens.map(byte => parseInt(byte, 16)));
}

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256 // 256 bits length
  );

  return bufferToHex(derivedBits);
}

// --- Database Operations ---

function getDatabase(): Record<string, UserRecord> {
  try {
    const stored = localStorage.getItem(DB_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Database corruption detected", e);
    return {};
  }
}

function saveDatabase(db: Record<string, UserRecord>) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// --- Public Auth API ---

export const authService = {
  async register(username: string, password: string): Promise<{ success: boolean; message?: string }> {
    // Simulate DB delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const db = getDatabase();
    
    if (db[username.toLowerCase()]) {
      return { success: false, message: "Username already taken." };
    }

    // Generate Salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Hash Password
    const passwordHash = await hashPassword(password, salt);

    // Save User
    db[username.toLowerCase()] = {
      username: username, // Store original casing for display
      salt: bufferToHex(salt),
      passwordHash: passwordHash
    };

    saveDatabase(db);
    return { success: true };
  },

  async login(username: string, password: string): Promise<{ success: boolean; message?: string }> {
    // Simulate DB delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const db = getDatabase();
    const userRecord = db[username.toLowerCase()];

    if (!userRecord) {
      return { success: false, message: "Invalid username or password." };
    }

    const salt = hexToBuffer(userRecord.salt);
    const attemptHash = await hashPassword(password, salt);

    if (attemptHash === userRecord.passwordHash) {
      return { success: true };
    } else {
      return { success: false, message: "Invalid username or password." };
    }
  }
};
