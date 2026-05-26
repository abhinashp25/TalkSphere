/**
 * Express middleware to validate request body using a Zod schema.
 * 
 * @param {import("zod").ZodSchema} schema - The Zod schema to validate against
 * @returns {import("express").RequestHandler}
 */
export const validateSchema = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    const errorDetails = Array.isArray(error.errors)
      ? error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ")
      : error.message || String(error);
      
    console.warn(
      `[Validation Failed] ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip} - Error: ${errorDetails}`
    );
    
    return res.status(400).json({ message: `Validation failed: ${errorDetails}` });
  }
};
