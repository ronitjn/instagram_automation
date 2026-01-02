const { v4: uuidv4 } = require('uuid');

/**
 * CSRF Protection Middleware
 *
 * Implements state parameter generation and validation to prevent
 * Cross-Site Request Forgery (CSRF) attacks during OAuth flow.
 */

// In-memory Map to store state values with timestamps
// Structure: { state: timestamp }
const stateStore = new Map();

// State expiration time in milliseconds (10 minutes)
const STATE_EXPIRATION_MS = 10 * 60 * 1000;

/**
 * Generate a secure state parameter
 * @returns {string} UUID v4 state parameter
 */
function generateState() {
  const state = uuidv4();
  const timestamp = Date.now();

  stateStore.set(state, timestamp);
  console.log(`Generated state parameter: ${state}`);

  return state;
}

/**
 * Validate a state parameter
 * @param {string} state - State parameter to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateState(state) {
  if (!state) {
    console.log('State validation failed: No state provided');
    return false;
  }

  const timestamp = stateStore.get(state);

  if (!timestamp) {
    console.log(`State validation failed: State not found - ${state}`);
    return false;
  }

  // Check if state has expired
  const age = Date.now() - timestamp;
  if (age > STATE_EXPIRATION_MS) {
    console.log(`State validation failed: State expired - ${state}`);
    stateStore.delete(state);
    return false;
  }

  // State is valid - delete it (one-time use)
  stateStore.delete(state);
  console.log(`State validated successfully: ${state}`);
  return true;
}

/**
 * Clean up expired state parameters
 * Removes states that have exceeded the expiration time
 */
function cleanupExpiredStates() {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [state, timestamp] of stateStore.entries()) {
    const age = now - timestamp;
    if (age > STATE_EXPIRATION_MS) {
      stateStore.delete(state);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired state parameters`);
  }
}

/**
 * Get count of active states (for debugging)
 * @returns {number} Number of states in storage
 */
function getStateCount() {
  return stateStore.size;
}

/**
 * Clear all states (for testing/debugging)
 */
function clearAllStates() {
  const count = stateStore.size;
  stateStore.clear();
  console.log(`Cleared ${count} state parameters from storage`);
}

// Run cleanup every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(cleanupExpiredStates, CLEANUP_INTERVAL_MS);

module.exports = {
  generateState,
  validateState,
  cleanupExpiredStates,
  getStateCount,
  clearAllStates
};
