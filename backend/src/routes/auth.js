const express = require('express');
const router = express.Router();
const { generateState, validateState } = require('../middleware/csrfProtection');
const instagramOAuth = require('../services/instagramOAuth');
const tokenStorage = require('../services/tokenStorage');

/**
 * Authentication Routes
 *
 * Handles Instagram Business API OAuth flow via Facebook Login:
 * - /auth/instagram - Initiates OAuth by redirecting to Facebook
 * - /auth/instagram/callback - Handles OAuth callback and token exchange
 */

/**
 * GET /auth/instagram
 * Initiates Instagram Business OAuth flow via Facebook Login
 */
router.get('/instagram', (req, res) => {
  try {
    console.log('Initiating Instagram Business OAuth flow via Facebook Login');

    // Generate CSRF protection state parameter
    const state = generateState();

    // Build Facebook authorization URL with Instagram permissions
    const authorizeUrl = instagramOAuth.buildAuthorizeUrl(state);

    // Redirect user to Facebook authorization page
    res.redirect(authorizeUrl);
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    res.redirect(`/error.html?error=${encodeURIComponent('Failed to start Instagram connection')}`);
  }
});

/**
 * GET /auth/instagram/callback
 * Handles OAuth callback from Facebook (for Instagram Business API)
 */
router.get('/instagram/callback', async (req, res) => {
  const { code, state, error, error_reason, error_description } = req.query;

  try {
    // Check if user denied permissions
    if (error) {
      console.log(`OAuth error: ${error} - ${error_description}`);
      const errorMessage = error_description || error_reason || 'Authorization failed';
      return res.redirect(`/error.html?error=${encodeURIComponent(errorMessage)}`);
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('Missing code or state parameter in callback');
      return res.redirect(`/error.html?error=${encodeURIComponent('Invalid callback parameters')}`);
    }

    // Validate state parameter (CSRF protection)
    if (!validateState(state)) {
      console.error('State validation failed - possible CSRF attack');
      return res.redirect(`/error.html?error=${encodeURIComponent('Security validation failed')}`);
    }

    console.log('State validated successfully, exchanging code for token');

    // Exchange authorization code for short-lived Facebook access token
    const shortLivedTokenData = await instagramOAuth.exchangeCodeForToken(code);

    console.log('Obtained short-lived Facebook token');

    // Exchange short-lived token for long-lived token (60 days)
    const longLivedTokenData = await instagramOAuth.exchangeForLongLivedToken(shortLivedTokenData.access_token);

    console.log('Successfully obtained long-lived Facebook access token');

    // Get Facebook user info to get the user ID
    const userInfo = await instagramOAuth.getInstagramUser(longLivedTokenData.access_token, 'id,name');
    const userId = userInfo.id;
    const userName = userInfo.name || 'Unknown';

    console.log(`User authenticated: ${userName} (ID: ${userId})`);

    // Get Facebook Pages to find connected Instagram Business Account
    const pages = await instagramOAuth.getFacebookPages(longLivedTokenData.access_token);

    // Find the first page with an Instagram Business Account
    let instagramAccountId = null;
    let instagramUsername = null;
    let pageAccessToken = null;

    for (const page of pages) {
      if (page.instagram_business_account) {
        instagramAccountId = page.instagram_business_account.id;
        pageAccessToken = page.access_token;

        // Get Instagram Business Account details
        const igAccount = await instagramOAuth.getInstagramBusinessAccount(
          pageAccessToken,
          instagramAccountId
        );

        instagramUsername = igAccount.username;
        console.log(`Found Instagram Business Account: @${instagramUsername} (ID: ${instagramAccountId})`);
        break;
      }
    }

    if (!instagramAccountId) {
      console.log('No Instagram Business Account found on any Facebook Page');
    }

    // Store the long-lived token with Instagram Account info
    // Using Facebook user ID as the storage key for this MVP
    const tokenData = tokenStorage.saveToken(userId, {
      accessToken: longLivedTokenData.access_token,
      tokenType: longLivedTokenData.token_type || 'bearer',
      expiresIn: longLivedTokenData.expires_in,
      permissions: [],
      instagramUserId: userId,
      instagramAccountId: instagramAccountId,
      instagramUsername: instagramUsername,
      pageAccessToken: pageAccessToken
    });

    // Redirect to success page with user info
    const successParams = new URLSearchParams({
      userId: userId,
      instagramUsername: instagramUsername || 'Not connected',
      instagramAccountId: instagramAccountId || 'none',
      permissions: 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish',
      expiresIn: longLivedTokenData.expires_in
    });

    res.redirect(`/success.html?${successParams.toString()}`);
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    const errorMessage = error.message || 'Failed to complete Instagram connection';
    res.redirect(`/error.html?error=${encodeURIComponent(errorMessage)}`);
  }
});

module.exports = router;
