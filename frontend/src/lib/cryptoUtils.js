/**
 * TalkSphere End-to-End Encryption
 * Uses Web Crypto API: ECDH P-256 key exchange + AES-GCM-256 encryption.
 * Private keys never leave the browser. Shared key stays in memory only.
 * Each message uses a unique 96-bit random IV (AES-GCM authenticated).
 */

export async function generateKeyPair() {
  return window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
}

export async function exportPublicKey(keyPair) {
  const jwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  return JSON.stringify(jwk);
}

export async function importPublicKey(jwkString) {
  const jwk = JSON.parse(jwkString);
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

export async function deriveSharedKey(myPrivateKey, theirPublicKey) {
  return window.crypto.subtle.deriveKey(
    { name: "ECDH", public: theirPublicKey },
    myPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(sharedKey, plaintext) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    encoded
  );
  return {
    iv:   Array.from(iv),
    data: Array.from(new Uint8Array(ciphertext)),
  };
}

export async function decryptMessage(sharedKey, envelope) {
  try {
    const { iv, data } = envelope;
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      sharedKey,
      new Uint8Array(data)
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

export function isE2EESupported() {
  return (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.subtle &&
    typeof window.crypto.subtle.generateKey === "function"
  );
}
