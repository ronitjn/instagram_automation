const express = require('express');
const router = express.Router();
const instagramOAuth = require('../services/instagramOAuth');
const tokenStorage = require('../services/tokenStorage');
const oauthConfig = require('../config/oauth');

/**
 * API Routes
 *
 * Protected endpoints for interacting with Instagram API:
 * - /api/me - Get Instagram user information
 * - /api/tokens - List all stored tokens (development only)
 * - /api/logout - Delete stored token
 */

/**
 * GET /api/me
 * Fetch Instagram user information using stored access token
 *
 * Query parameters:
 * - userId: Instagram user ID (required)
 */
router.get('/me', async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required parameter: userId'
      });
    }

    // Retrieve stored token
    const tokenData = tokenStorage.getToken(userId);

    if (!tokenData) {
      return res.status(401).json({
        error: 'No valid token found. Please connect your Instagram account.'
      });
    }

    // Fetch user information from Facebook Graph API
    const userInfo = await instagramOAuth.getInstagramUser(tokenData.accessToken);

    // Helper function to safely convert timestamp to ISO string
    const toISOStringSafe = (timestamp) => {
      try {
        if (!timestamp || isNaN(timestamp)) return 'Invalid date';
        return new Date(timestamp).toISOString();
      } catch (e) {
        return 'Invalid date';
      }
    };

    // Return user info with token metadata
    res.json({
      success: true,
      user: userInfo,
      tokenInfo: {
        expiresAt: toISOStringSafe(tokenData.expiresAt),
        permissions: tokenData.permissions,
        createdAt: toISOStringSafe(tokenData.createdAt),
        instagramUsername: tokenData.instagramUsername || 'Not connected',
        instagramAccountId: tokenData.instagramAccountId || 'Not connected'
      }
    });
  } catch (error) {
    console.error('Error in /api/me:', error);
    next(error);
  }
});

/**
 * GET /api/instagram/media
 * Get Instagram media (posts) for the connected Instagram Business Account
 *
 * Query parameters:
 * - userId: Facebook user ID (required)
 * - limit: Number of media items to retrieve (optional, default: 10)
 */
router.get('/instagram/media', async (req, res, next) => {
  try {
    const { userId, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required parameter: userId'
      });
    }

    // Retrieve stored token
    const tokenData = tokenStorage.getToken(userId);

    if (!tokenData) {
      return res.status(401).json({
        error: 'No valid token found. Please connect your Instagram account.'
      });
    }

    // Check if Instagram Business Account is connected
    if (!tokenData.instagramAccountId || !tokenData.pageAccessToken) {
      return res.status(404).json({
        error: 'No Instagram Business Account connected. Make sure your Instagram is linked to a Facebook Page.',
        help: 'Visit https://www.facebook.com/business/help/898752960195806 to learn how to connect your Instagram Business Account to a Facebook Page.'
      });
    }

    // Fetch Instagram media
    const mediaData = await instagramOAuth.getInstagramMedia(
      tokenData.instagramAccountId,
      tokenData.pageAccessToken,
      parseInt(limit)
    );

    res.json({
      success: true,
      instagramUsername: tokenData.instagramUsername,
      instagramAccountId: tokenData.instagramAccountId,
      media: mediaData.data || [],
      paging: mediaData.paging
    });
  } catch (error) {
    console.error('Error in /api/instagram/media:', error);
    next(error);
  }
});

/**
 * GET /api/tokens
 * List all stored tokens (development/debugging only)
 *
 * This endpoint should be disabled or protected in production
 */
router.get('/tokens', (req, res) => {
  // Only allow in development mode
  if (oauthConfig.nodeEnv !== 'development') {
    return res.status(403).json({
      error: 'This endpoint is only available in development mode'
    });
  }

  try {
    const tokens = tokenStorage.getAllTokens();

    res.json({
      success: true,
      count: tokens.length,
      tokens: tokens.map(token => ({
        userId: token.userId,
        instagramUserId: token.instagramUserId,
        permissions: token.permissions,
        expiresAt: new Date(token.expiresAt).toISOString(),
        createdAt: new Date(token.createdAt).toISOString(),
        isExpired: token.isExpired
      }))
    });
  } catch (error) {
    console.error('Error in /api/tokens:', error);
    res.status(500).json({
      error: 'Failed to retrieve tokens'
    });
  }
});

/**
 * DELETE /api/logout
 * Remove stored token for a user
 *
 * Query parameters:
 * - userId: Instagram user ID (required)
 */
router.delete('/logout', (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required parameter: userId'
      });
    }

    const deleted = tokenStorage.deleteToken(userId);

    if (deleted) {
      res.json({
        success: true,
        message: 'Successfully logged out'
      });
    } else {
      res.status(404).json({
        error: 'No token found for this user'
      });
    }
  } catch (error) {
    console.error('Error in /api/logout:', error);
    res.status(500).json({
      error: 'Failed to logout'
    });
  }
});

/**
 * GET /api/instagram/insights
 * Get account insights/analytics
 */
router.get('/instagram/insights', async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const tokenData = tokenStorage.getToken(userId);
    if (!tokenData || !tokenData.instagramAccountId || !tokenData.pageAccessToken) {
      return res.status(404).json({ error: 'No Instagram Business Account connected' });
    }

    const insights = await instagramOAuth.getAccountInsights(
      tokenData.instagramAccountId,
      tokenData.pageAccessToken
    );

    res.json({ success: true, insights: insights.data });
  } catch (error) {
    console.error('Error in /api/instagram/insights:', error);
    next(error);
  }
});

/**
 * GET /api/instagram/stories
 * Get Instagram Stories
 */
router.get('/instagram/stories', async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const tokenData = tokenStorage.getToken(userId);
    if (!tokenData || !tokenData.instagramAccountId || !tokenData.pageAccessToken) {
      return res.status(404).json({ error: 'No Instagram Business Account connected' });
    }

    const stories = await instagramOAuth.getInstagramStories(
      tokenData.instagramAccountId,
      tokenData.pageAccessToken
    );

    res.json({ success: true, stories: stories.data || [] });
  } catch (error) {
    console.error('Error in /api/instagram/stories:', error);
    next(error);
  }
});

/**
 * GET /api/instagram/tagged
 * Get media where user is tagged
 */
router.get('/instagram/tagged', async (req, res, next) => {
  try {
    const { userId, limit = 25 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const tokenData = tokenStorage.getToken(userId);
    if (!tokenData || !tokenData.instagramAccountId || !tokenData.pageAccessToken) {
      return res.status(404).json({ error: 'No Instagram Business Account connected' });
    }

    const tagged = await instagramOAuth.getTaggedMedia(
      tokenData.instagramAccountId,
      tokenData.pageAccessToken,
      parseInt(limit)
    );

    res.json({ success: true, tagged: tagged.data || [], paging: tagged.paging });
  } catch (error) {
    console.error('Error in /api/instagram/tagged:', error);
    next(error);
  }
});

/**
 * GET /api/instagram/business-discovery
 * Discover other Instagram Business accounts
 */
router.get('/instagram/business-discovery', async (req, res, next) => {
  try {
    const { userId, username } = req.query;

    if (!userId || !username) {
      return res.status(400).json({ error: 'Missing required parameters: userId and username' });
    }

    const tokenData = tokenStorage.getToken(userId);
    if (!tokenData || !tokenData.instagramAccountId || !tokenData.pageAccessToken) {
      return res.status(404).json({ error: 'No Instagram Business Account connected' });
    }

    const discovery = await instagramOAuth.getBusinessDiscovery(
      tokenData.instagramAccountId,
      tokenData.pageAccessToken,
      username
    );

    res.json({ success: true, account: discovery });
  } catch (error) {
    console.error('Error in /api/instagram/business-discovery:', error);
    next(error);
  }
});

/**
 * GET /api/instagram/hashtag/search
 * Search for hashtags
 */
router.get('/instagram/hashtag/search', async (req, res, next) => {
  try {
    const { userId, query } = req.query;

    if (!userId || !query) {
      return res.status(400).json({ error: 'Missing required parameters: userId and query' });
    }

    const tokenData = tokenStorage.getToken(userId);
    if (!tokenData || !tokenData.instagramAccountId || !tokenData.pageAccessToken) {
      return res.status(404).json({ error: 'No Instagram Business Account connected' });
    }

    const results = await instagramOAuth.searchHashtags(
      tokenData.instagramAccountId,
      tokenData.pageAccessToken,
      query
    );

    res.json({ success: true, hashtags: results.data || [] });
  } catch (error) {
    console.error('Error in /api/instagram/hashtag/search:', error);
    next(error);
  }
});

/**
 * GET /api/instagram/hashtag/top-media
 * Get top media for a hashtag
 */
router.get('/instagram/hashtag/top-media', async (req, res, next) => {
  try {
    const { userId, hashtagId, limit = 25 } = req.query;

    if (!userId || !hashtagId) {
      return res.status(400).json({ error: 'Missing required parameters: userId and hashtagId' });
    }

    const tokenData = tokenStorage.getToken(userId);
    if (!tokenData || !tokenData.instagramAccountId || !tokenData.pageAccessToken) {
      return res.status(404).json({ error: 'No Instagram Business Account connected' });
    }

    const media = await instagramOAuth.getHashtagTopMedia(
      hashtagId,
      tokenData.instagramAccountId,
      tokenData.pageAccessToken,
      parseInt(limit)
    );

    res.json({ success: true, media: media.data || [], paging: media.paging });
  } catch (error) {
    console.error('Error in /api/instagram/hashtag/top-media:', error);
    next(error);
  }
});

/**
 * GET /api/instagram/hashtag/recent-media
 * Get recent media for a hashtag
 */
router.get('/instagram/hashtag/recent-media', async (req, res, next) => {
  try {
    const { userId, hashtagId, limit = 25 } = req.query;

    if (!userId || !hashtagId) {
      return res.status(400).json({ error: 'Missing required parameters: userId and hashtagId' });
    }

    const tokenData = tokenStorage.getToken(userId);
    if (!tokenData || !tokenData.instagramAccountId || !tokenData.pageAccessToken) {
      return res.status(404).json({ error: 'No Instagram Business Account connected' });
    }

    const media = await instagramOAuth.getHashtagRecentMedia(
      hashtagId,
      tokenData.instagramAccountId,
      tokenData.pageAccessToken,
      parseInt(limit)
    );

    res.json({ success: true, media: media.data || [], paging: media.paging });
  } catch (error) {
    console.error('Error in /api/instagram/hashtag/recent-media:', error);
    next(error);
  }
});

/**
 * GET /api/instagram/media/comments
 * Get comments for a specific media
 */
router.get('/instagram/media/comments', async (req, res, next) => {
  try {
    const { userId, mediaId } = req.query;

    if (!userId || !mediaId) {
      return res.status(400).json({ error: 'Missing required parameters: userId and mediaId' });
    }

    const tokenData = tokenStorage.getToken(userId);
    if (!tokenData || !tokenData.pageAccessToken) {
      return res.status(404).json({ error: 'No Instagram Business Account connected' });
    }

    const comments = await instagramOAuth.getMediaComments(
      mediaId,
      tokenData.pageAccessToken
    );

    res.json({ success: true, comments: comments.data || [], paging: comments.paging });
  } catch (error) {
    console.error('Error in /api/instagram/media/comments:', error);
    next(error);
  }
});

/**
 * GET /api/instagram/media/insights
 * Get insights for a specific media post (individual post analytics)
 */
router.get('/instagram/media/insights', async (req, res, next) => {
  try {
    const { userId, mediaId, mediaType = 'IMAGE' } = req.query;

    if (!userId || !mediaId) {
      return res.status(400).json({ error: 'Missing required parameters: userId and mediaId' });
    }

    const tokenData = tokenStorage.getToken(userId);
    if (!tokenData || !tokenData.pageAccessToken) {
      return res.status(404).json({ error: 'No Instagram Business Account connected' });
    }

    const insights = await instagramOAuth.getMediaInsights(
      mediaId,
      tokenData.pageAccessToken,
      mediaType
    );

    res.json({ success: true, mediaId, mediaType, insights: insights.data || [] });
  } catch (error) {
    console.error('Error in /api/instagram/media/insights:', error);
    next(error);
  }
});

/**
 * GET /api/instagram/audience/insights
 * Get audience demographics and follower insights
 */
router.get('/instagram/audience/insights', async (req, res, next) => {
  try {
    const { userId, period = 'lifetime' } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const tokenData = tokenStorage.getToken(userId);
    if (!tokenData || !tokenData.instagramAccountId || !tokenData.pageAccessToken) {
      return res.status(404).json({ error: 'No Instagram Business Account connected' });
    }

    const insights = await instagramOAuth.getAudienceInsights(
      tokenData.instagramAccountId,
      tokenData.pageAccessToken,
      period
    );

    res.json({
      success: true,
      period,
      note: 'Requires 100+ followers. Demographic data may have up to 48-hour delay.',
      insights: insights.data || []
    });
  } catch (error) {
    console.error('Error in /api/instagram/audience/insights:', error);
    next(error);
  }
});

/**
 * GET /api/instagram/insights/period
 * Get account insights for different time periods (day, week, days_28)
 */
router.get('/instagram/insights/period', async (req, res, next) => {
  try {
    const { userId, period = 'day' } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    if (!['day', 'week', 'days_28'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Must be: day, week, or days_28' });
    }

    const tokenData = tokenStorage.getToken(userId);
    if (!tokenData || !tokenData.instagramAccountId || !tokenData.pageAccessToken) {
      return res.status(404).json({ error: 'No Instagram Business Account connected' });
    }

    const insights = await instagramOAuth.getAccountInsightsWithPeriod(
      tokenData.instagramAccountId,
      tokenData.pageAccessToken,
      period
    );

    res.json({ success: true, period, insights: insights.data || [] });
  } catch (error) {
    console.error('Error in /api/instagram/insights/period:', error);
    next(error);
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: oauthConfig.nodeEnv
  });
});

module.exports = router;
