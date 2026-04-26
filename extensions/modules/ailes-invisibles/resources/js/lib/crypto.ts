// E2E Encryption utilities using Web Crypto API
// AES-256-GCM for message encryption + RSA-OAEP for key wrapping

const RSA_KEY_SIZE = 2048;
const AES_KEY_SIZE = 256;
const IV_LENGTH = 12;

export interface KeyPair {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
}

export interface EncryptedMessage {
    encryptedContent: string; // base64
    iv: string; // base64
}

export interface EncryptedKeyForParticipant {
    participantType: string;
    participantId: number;
    encryptedKey: string; // base64
}

// Generate a new RSA-OAEP key pair for a user
export async function generateKeyPair(): Promise<KeyPair> {
    return await crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: RSA_KEY_SIZE,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
    );
}

// Export public key to base64 string (for storage on server)
export async function exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('spki', key);
    return arrayBufferToBase64(exported);
}

// Import public key from base64 string
export async function importPublicKey(base64: string): Promise<CryptoKey> {
    const buffer = base64ToArrayBuffer(base64);
    return await crypto.subtle.importKey(
        'spki',
        buffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['encrypt']
    );
}

// Import private key from base64 string
export async function importPrivateKey(base64: string): Promise<CryptoKey> {
    const buffer = base64ToArrayBuffer(base64);
    return await crypto.subtle.importKey(
        'pkcs8',
        buffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['decrypt']
    );
}

// Generate a random AES-256 key
async function generateAesKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: AES_KEY_SIZE },
        true,
        ['encrypt', 'decrypt']
    );
}

// Encrypt a message with AES-256-GCM
export async function encryptMessage(
    plaintext: string,
    aesKey: CryptoKey
): Promise<EncryptedMessage> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoded = new TextEncoder().encode(plaintext);

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        encoded
    );

    return {
        encryptedContent: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv.buffer),
    };
}

// Decrypt a message with AES-256-GCM
export async function decryptMessage(
    encryptedContent: string,
    iv: string,
    aesKey: CryptoKey
): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: new Uint8Array(base64ToArrayBuffer(iv)),
        },
        aesKey,
        base64ToArrayBuffer(encryptedContent)
    );

    return new TextDecoder().decode(decrypted);
}

// Wrap (encrypt) an AES key with a participant's RSA public key
export async function wrapAesKey(
    aesKey: CryptoKey,
    publicKey: CryptoKey
): Promise<string> {
    const rawKey = await crypto.subtle.exportKey('raw', aesKey);
    const encrypted = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        rawKey
    );
    return arrayBufferToBase64(encrypted);
}

// Unwrap (decrypt) an AES key with the user's RSA private key
export async function unwrapAesKey(
    encryptedKey: string,
    privateKey: CryptoKey
): Promise<CryptoKey> {
    const rawKey = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        base64ToArrayBuffer(encryptedKey)
    );

    return await crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: 'AES-GCM', length: AES_KEY_SIZE },
        true,
        ['encrypt', 'decrypt']
    );
}

// Full encrypt flow: encrypt message for multiple participants
export async function encryptForParticipants(
    plaintext: string,
    participantPublicKeys: Array<{ type: string; id: number; publicKey: string }>
): Promise<{
    encryptedContent: string;
    iv: string;
    encryptedKeys: EncryptedKeyForParticipant[];
}> {
    const aesKey = await generateAesKey();
    const { encryptedContent, iv } = await encryptMessage(plaintext, aesKey);

    const encryptedKeys: EncryptedKeyForParticipant[] = [];
    for (const participant of participantPublicKeys) {
        const pubKey = await importPublicKey(participant.publicKey);
        const wrappedKey = await wrapAesKey(aesKey, pubKey);
        encryptedKeys.push({
            participantType: participant.type,
            participantId: participant.id,
            encryptedKey: wrappedKey,
        });
    }

    return { encryptedContent, iv, encryptedKeys };
}

// Helper: ArrayBuffer <-> Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
