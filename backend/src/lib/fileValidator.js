/**
 * Validates a base64 data URI string for file type and size.
 * 
 * @param {string} base64Str - The base64 data URI string (e.g. data:image/png;base64,...)
 * @param {string[]} allowedMimeTypes - List of permitted MIME types
 * @param {number} maxSizeInBytes - Maximum allowed size in bytes
 * @returns {{isValid: boolean, message?: string, mimeType?: string}}
 */
export const validateBase64File = (base64Str, allowedMimeTypes, maxSizeInBytes) => {
  if (!base64Str) {
    return { isValid: false, message: "File content is empty." };
  }

  const match = base64Str.match(/^data:([^,]+);base64,/);
  if (!match) {
    return { isValid: false, message: "Invalid file format. Must be a valid base64 data URI." };
  }

  const mimeType = match[1];
  const baseMimeType = mimeType.split(";")[0].trim();
  if (!allowedMimeTypes.includes(baseMimeType)) {
    return { isValid: false, message: `Unsupported file type: ${baseMimeType}` };
  }

  // Extract actual base64 content to calculate size
  const parts = base64Str.split(",");
  if (parts.length < 2) {
    return { isValid: false, message: "Invalid base64 data payload." };
  }
  
  const base64Data = parts[1];
  const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);

  if (sizeInBytes > maxSizeInBytes) {
    const sizeInMB = (maxSizeInBytes / (1024 * 1024)).toFixed(1);
    return { isValid: false, message: `File size exceeds the limit of ${sizeInMB}MB.` };
  }

  return { isValid: true, mimeType };
};
