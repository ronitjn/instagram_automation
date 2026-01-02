/**
 * In-memory token storage service
 *
 * NOTE: This is a simple in-memory implementation for MVP/testing.
 * Tokens will be lost when the server restarts.
 * For production, migrate to a persistent database (PostgreSQL, MongoDB, etc.)
 * and encrypt tokens at rest.
 */

// In-memory Map to store tokens
// Structure: { userId: { accessToken, tokenType, expiresAt, permissions, instagramUserId } }
const tokenStore = new Map();

/**
 * Save token data for a user
 * @param {string} userId - Unique identifier for the user
 * @param {Object} tokenData - Token information
 * @param {string} tokenData.accessToken - Instagram access token
 * @param {string} tokenData.tokenType - Token type (usually 'bearer')
 * @param {number} tokenData.expiresIn - Token expiration in seconds
 * @param {Array<string>} tokenData.permissions - Granted permissions
 * @param {string} tokenData.instagramUserId - Instagram user ID
 */
function saveToken(userId, tokenData) {
  // Validate and calculate expiration time
  // Default to 60 days (5184000 seconds) if expiresIn is not provided or invalid
  const expiresInSeconds = typeof tokenData.expiresIn === 'number' && tokenData.expiresIn > 0
    ? tokenData.expiresIn
    : 60 * 24 * 60 * 60; // 60 days in seconds

  const expiresAt = Date.now() + (expiresInSeconds * 1000);

  tokenStore.set(userId, {
    accessToken: tokenData.accessToken,
    tokenType: tokenData.tokenType || 'bearer',
    expiresAt,
    permissions: tokenData.permissions || [],
    instagramUserId: tokenData.instagramUserId,
    instagramAccountId: tokenData.instagramAccountId || null,
    instagramUsername: tokenData.instagramUsername || null,
    pageAccessToken: tokenData.pageAccessToken || null,
    createdAt: Date.now()
  });

  console.log(`Token saved for user: ${userId} (expires in ${Math.floor(expiresInSeconds / (24 * 60 * 60))} days)`);
  return tokenStore.get(userId);
}

/**
 * Retrieve token data for a user
 * @param {string} userId - Unique identifier for the user
 * @returns {Object|null} Token data or null if not found
 */
function getToken(userId) {
  const tokenData = tokenStore.get(userId);

  if (!tokenData) {
    return null;
  }

  // Check if token has expired
  if (Date.now() > tokenData.expiresAt) {
    console.log(`Token expired for user: ${userId}`);
    tokenStore.delete(userId);
    return null;
  }

  return tokenData;
}

/**
 * Delete token data for a user
 * @param {string} userId - Unique identifier for the user
 * @returns {boolean} True if deleted, false if not found
 */
function deleteToken(userId) {
  const deleted = tokenStore.delete(userId);
  if (deleted) {
    console.log(`Token deleted for user: ${userId}`);
  }
  return deleted;
}

/**
 * Get all stored tokens (for debugging purposes)
 * @returns {Array} Array of all token data with user IDs
 */
function getAllTokens() {
  const tokens = [];
  for (const [userId, tokenData] of tokenStore.entries()) {
    tokens.push({
      userId,
      ...tokenData,
      isExpired: Date.now() > tokenData.expiresAt
    });
  }
  return tokens;
}

/**
 * Get count of stored tokens
 * @returns {number} Number of tokens in storage
 */
function getTokenCount() {
  return tokenStore.size;
}

/**
 * Clear all tokens (for testing/debugging)
 */
function clearAllTokens() {
  const count = tokenStore.size;
  tokenStore.clear();
  console.log(`Cleared ${count} tokens from storage`);
}

module.exports = {
  saveToken,
  getToken,
  deleteToken,
  getAllTokens,
  getTokenCount,
  clearAllTokens
};
