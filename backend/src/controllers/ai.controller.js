import { checkAIBudget, incrementAITokenUsage } from "../lib/aiBudget.js";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

/**
 * Sanitizes user input before passing it to the Gemini prompt,
 * removing tags mimicking prompt wrappers.
 * 
 * @param {string} text - The raw input text
 * @returns {string} The sanitized text
 */
function sanitizePrompt(text) {
  if (!text) return "";
  return text
    .replace(/\[\s*system\s*:/gi, "")
    .replace(/\[\s*system\s*prompt\s*:/gi, "")
    .replace(/<\s*system\s*>/gi, "")
    .replace(/<\/\s*system\s*>/gi, "")
    .replace(/\[\s*user\s*message\s*(start|end)\s*\]/gi, "")
    .replace(/<\s*user\s*message\s*(start|end)\s*>/gi, "")
    .replace(/\[\s*transcript\s*(start|end)\s*\]/gi, "")
    .replace(/\[\s*input\s*(start|end)\s*\]/gi, "")
    .trim();
}

/**
 * HTML escapes output strings to prevent potential XSS
 * if the text is inadvertently rendered inside dangerouslySetInnerHTML.
 * 
 * @param {string} text - The raw AI output text
 * @returns {string} The HTML-escaped output
 */
function sanitizeAIOutput(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function systemPrompt() {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
  return `You are TalkSphere AI, a friendly smart assistant built into a real-time chat app called TalkSphere.
Today is ${date}. Current time is approximately ${time}.
You were built by the TalkSphere development team.
Help users with: answering questions, writing messages, coding help, advice, and anything they ask.
Keep replies concise, warm, and conversational. Use plain text only — no markdown headers or bullet spam.`;
}

/**
 * Call the Gemini API and count both the output text and the total token metrics.
 * 
 * @param {string} apiKey - Gemini API Key
 * @param {object[]} contents - API message payload
 * @param {object} generationConfig - optional API generation configuration
 * @returns {Promise<{text: string, totalTokens: number}>}
 */
async function callGemini(apiKey, contents, generationConfig = {}) {
  const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.75, ...generationConfig },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      ],
    }),
  });
  
  const data = await resp.json();
  if (!resp.ok) {
    throw Object.assign(new Error("Gemini error"), { status: resp.status, data });
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const totalTokens = data?.usageMetadata?.totalTokenCount || 0;

  return { text: rawText, totalTokens };
}

// ── Multi-turn AI chat ────────────────────────────────────────────────────

export const sendAIMessage = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || !messages.length)
      return res.status(400).json({ message: "Messages array required." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      return res.status(500).json({ message: "Add GEMINI_API_KEY to your .env. Get a free key at https://aistudio.google.com/app/apikey" });

    // Check Daily Token Budget
    const userId = req.user._id;
    const budgetCheck = await checkAIBudget(userId);
    if (!budgetCheck.allowed) {
      return res.status(429).json({ message: "You have exceeded your daily AI token budget. Please try again tomorrow." });
    }

    const contents = [
      { 
        role: "user", 
        parts: [{ text: `[System: ${systemPrompt()}]\n\nUser says: [User Message Start]\n${sanitizePrompt(messages[0].content)}\n[User Message End]` }] 
      },
      ...messages.slice(1).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: sanitizePrompt(m.content) }],
      })),
    ];

    const { text, totalTokens } = await callGemini(apiKey, messages.length === 1 ? contents.slice(0, 1) : contents);
    
    // Increment User Token Consumption
    await incrementAITokenUsage(userId, totalTokens);

    const reply = sanitizeAIOutput(text.trim());
    res.json({ reply });
  } catch (e) {
    console.error("sendAIMessage error:", e.message);
    if (e.status === 403) return res.status(403).json({ message: "Invalid GEMINI_API_KEY." });
    if (e.status === 429) return res.status(429).json({ message: "Rate limit. Try again shortly." });
    res.status(500).json({ message: "Server error talking to AI." });
  }
};

// ── Smart quick-reply suggestions ─────────────────────────────────────────

export const getSmartReplies = async (req, res) => {
  try {
    const { lastMessage } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.json({ suggestions: ["👍 Got it!", "Thanks!", "Sure!", "On my way!"] });

    // Check Daily Token Budget (fallback gracefully if budget hit)
    const userId = req.user._id;
    const budgetCheck = await checkAIBudget(userId);
    if (!budgetCheck.allowed) {
      return res.json({ suggestions: ["👍 Got it!", "Thanks!", "Sure!", "On my way!"] });
    }

    const sanitizedInput = sanitizePrompt(lastMessage);

    const { text, totalTokens } = await callGemini(apiKey, [{
      role: "user",
      parts: [{ text:
        `Give 4 short quick-reply suggestions for this message: [User Input Start]${sanitizedInput}[User Input End]\n` +
        `Rules: each under 25 characters, casual friendly tone.\n` +
        `Return ONLY a JSON array like: ["Sure!", "On my way!", "Thanks!", "👍"]\nJSON:`
      }]
    }], { maxOutputTokens: 80, temperature: 0.9 });

    await incrementAITokenUsage(userId, totalTokens);

    let suggestions = ["👍", "Thanks!", "Sure!", "Got it!"];
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (Array.isArray(parsed)) suggestions = parsed.slice(0, 4);
    } catch { /* use defaults */ }

    // Output sanitize suggestions
    res.json({ suggestions: suggestions.map(s => sanitizeAIOutput(s)) });
  } catch {
    res.json({ suggestions: ["👍", "Thanks!", "Sure!", "Got it!"] });
  }
};

// ── Tone Advisor ──────────────────────────────────────────────────────────

export const analyzeTone = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim() || text.length < 12)
      return res.json({ score: "neutral", suggestion: null });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.json({ score: "neutral", suggestion: null });

    // Check Token Budget
    const userId = req.user._id;
    const budgetCheck = await checkAIBudget(userId);
    if (!budgetCheck.allowed) return res.json({ score: "neutral", suggestion: null });

    const sanitizedInput = sanitizePrompt(text);

    const { text: raw, totalTokens } = await callGemini(apiKey, [{
      role: "user",
      parts: [{ text:
        `You are a communication tone analyzer.\n` +
        `Rate the tone of this message: [User Input Start]${sanitizedInput}[User Input End]\n` +
        `Respond with ONLY valid JSON, no markdown:\n` +
        `{"score":"warm"|"neutral"|"cold"|"aggressive","suggestion":"one short improvement tip or null"}\n` +
        `Definitions: warm=friendly/kind, neutral=professional/flat, cold=distant/abrupt, aggressive=harsh/rude\n` +
        `JSON:`
      }]
    }], { maxOutputTokens: 100, temperature: 0.2 });

    await incrementAITokenUsage(userId, totalTokens);

    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json({ 
      score: sanitizeAIOutput(parsed.score) || "neutral", 
      suggestion: parsed.suggestion ? sanitizeAIOutput(parsed.suggestion) : null 
    });
  } catch {
    res.json({ score: "neutral", suggestion: null });
  }
};

// ── Conversation Digest ───────────────────────────────────────────────────

export const generateDigest = async (req, res) => {
  try {
    const { messages, contactName, isGroup } = req.body;
    if (!Array.isArray(messages) || messages.length < 5)
      return res.json({ summary: null, actions: [], topics: [] });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      return res.json({ summary: "Configure GEMINI_API_KEY to enable AI summaries.", actions: [], topics: [] });

    // Check Token Budget
    const userId = req.user._id;
    const budgetCheck = await checkAIBudget(userId);
    if (!budgetCheck.allowed) {
      return res.json({ summary: "Daily AI token budget exceeded. Cannot generate digest.", actions: [], topics: [] });
    }

    const transcript = messages
      .filter(m => m.text && !m.isDeletedForAll)
      .slice(-50)
      .map(m => `${m.senderName || "User"}: ${sanitizePrompt(m.text)}`)
      .join("\n");

    const context = isGroup
      ? `group chat called "${contactName}"`
      : `conversation with ${contactName}`;

    const { text: raw, totalTokens } = await callGemini(apiKey, [{
      role: "user",
      parts: [{ text:
        `Summarize this ${context} briefly and clearly.\n\nChat transcript:\n[Transcript Start]\n${transcript}\n[Transcript End]\n\n` +
        `Respond ONLY with valid JSON, no markdown:\n` +
        `{"summary":"2-3 sentence summary","actions":["task or decision 1"],"topics":["theme 1","theme 2"]}\n` +
        `actions = concrete decisions or tasks mentioned (max 3). topics = key themes (max 4).\nJSON:`
      }]
    }], { maxOutputTokens: 300, temperature: 0.4 });

    await incrementAITokenUsage(userId, totalTokens);

    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json({
      summary: sanitizeAIOutput(parsed.summary) || null,
      actions: Array.isArray(parsed.actions) ? parsed.actions.map(a => sanitizeAIOutput(a)) : [],
      topics:  Array.isArray(parsed.topics) ? parsed.topics.map(t => sanitizeAIOutput(t)) : [],
    });
  } catch (e) {
    console.error("digest error:", e.message);
    res.json({ summary: null, actions: [], topics: [] });
  }
};

// ── In-message Translation ────────────────────────────────────────────────

export const translateMessage = async (req, res) => {
  try {
    const { text, targetLang = "English" } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Text required." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: "AI not configured." });

    // Check Token Budget
    const userId = req.user._id;
    const budgetCheck = await checkAIBudget(userId);
    if (!budgetCheck.allowed) {
      return res.status(429).json({ message: "Daily AI token budget exceeded. Please try again tomorrow." });
    }

    const sanitizedInput = sanitizePrompt(text);

    const { text: translation, totalTokens } = await callGemini(apiKey, [{
      role: "user",
      parts: [{ text: `Translate this to ${targetLang}. Return ONLY the translated text, nothing else:\n[Input Start]\n"${sanitizedInput}"\n[Input End]` }]
    }], { maxOutputTokens: 300, temperature: 0.1 });

    await incrementAITokenUsage(userId, totalTokens);

    const reply = sanitizeAIOutput(translation.trim());
    res.json({ translation: reply });
  } catch (e) {
    console.error("translate error:", e.message);
    res.json({ translation: sanitizeAIOutput(req.body.text) });
  }
};
