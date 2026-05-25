import User from "../models/User.js";

const DAILY_TOKEN_BUDGET = 50000; // Limit to 50k tokens per user per day

/**
 * Checks if a user has remaining AI token budget.
 * Resets the budget if the last reset was more than 24 hours ago.
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<{allowed: boolean, remaining: number}>}
 */
export const checkAIBudget = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    return { allowed: false, remaining: 0 };
  }

  let tokensUsed = user.aiUsage?.tokensUsed ?? 0;
  let lastReset = user.aiUsage?.lastReset ?? new Date();

  const timeDiff = Date.now() - new Date(lastReset).getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (timeDiff > oneDay) {
    // Reset budget
    tokensUsed = 0;
    lastReset = new Date();
    await User.findByIdAndUpdate(userId, {
      $set: {
        "aiUsage.tokensUsed": tokensUsed,
        "aiUsage.lastReset": lastReset,
      },
    });
  }

  if (tokensUsed >= DAILY_TOKEN_BUDGET) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: DAILY_TOKEN_BUDGET - tokensUsed };
};

/**
 * Increments the user's AI token usage in the database.
 * 
 * @param {string} userId - The user ID
 * @param {number} tokens - The number of tokens consumed
 * @returns {Promise<void>}
 */
export const incrementAITokenUsage = async (userId, tokens) => {
  if (tokens <= 0) return;
  
  await User.findByIdAndUpdate(userId, {
    $inc: { "aiUsage.tokensUsed": tokens },
    $setOnInsert: { "aiUsage.lastReset": new Date() }
  }, { new: true });
};
