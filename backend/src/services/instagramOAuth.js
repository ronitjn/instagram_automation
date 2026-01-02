const axios = require('axios');
const oauthConfig = require('../config/oauth');

/**
 * Instagram OAuth Service
 *
 * Handles Instagram OAuth 2.0 authorization flow:
 * - Building authorization URLs
 * - Exchanging authorization codes for access tokens
 * - Converting short-lived tokens to long-lived tokens
 * - Refreshing long-lived tokens
 */

/**
 * Build Instagram authorization URL
 * @param {string} state - CSRF protection state parameter
 * @returns {string} Complete authorization URL
 */
function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: oauthConfig.appId,
    redirect_uri: oauthConfig.redirectUri,
    scope: oauthConfig.scopes.join(','),
    response_type: 'code',
    state: state
  });

  const authorizeUrl = `${oauthConfig.authorizeUrl}?${params.toString()}`;
  console.log('Built authorization URL');
  return authorizeUrl;
}

/**
 * Exchange authorization code for short-lived access token (Facebook Login)
 * @param {string} code - Authorization code from Facebook callback
 * @returns {Promise<Object>} Token response with access_token
 * @throws {Error} If token exchange fails
 */
async function exchangeCodeForToken(code) {
  try {
    console.log('Exchanging authorization code for short-lived Facebook token');

    const params = new URLSearchParams({
      client_id: oauthConfig.appId,
      client_secret: oauthConfig.appSecret,
      redirect_uri: oauthConfig.redirectUri,
      code: code
    });

    const url = `${oauthConfig.tokenUrl}?${params.toString()}`;
    const response = await axios.get(url);

    console.log('Successfully obtained short-lived Facebook access token');
    return response.data;
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    throw new Error(`Failed to exchange authorization code: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Exchange short-lived Facebook token for long-lived token (60 days)
 * @param {string} shortLivedToken - Short-lived access token from initial exchange
 * @returns {Promise<Object>} Response with long-lived access_token, token_type, expires_in
 * @throws {Error} If exchange fails
 */
async function exchangeForLongLivedToken(shortLivedToken) {
  try {
    console.log('Exchanging short-lived Facebook token for long-lived token');

    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: oauthConfig.appId,
      client_secret: oauthConfig.appSecret,
      fb_exchange_token: shortLivedToken
    });

    const url = `${oauthConfig.longLivedTokenUrl}?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Successfully obtained long-lived Facebook token (expires in ${response.data.expires_in} seconds)`);
    return response.data;
  } catch (error) {
    console.error('Error exchanging for long-lived token:', error.response?.data || error.message);
    throw new Error(`Failed to get long-lived token: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Refresh a long-lived access token
 * Long-lived tokens are valid for 60 days and can be refreshed
 * @param {string} longLivedToken - Current long-lived access token
 * @returns {Promise<Object>} Response with refreshed access_token, token_type, expires_in
 * @throws {Error} If refresh fails
 */
async function refreshLongLivedToken(longLivedToken) {
  try {
    console.log('Refreshing long-lived token');

    const params = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: longLivedToken
    });

    const url = `${oauthConfig.refreshTokenUrl}?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Successfully refreshed token (expires in ${response.data.expires_in} seconds)`);
    return response.data;
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    throw new Error(`Failed to refresh token: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get user information using Facebook access token
 * @param {string} accessToken - Valid Facebook access token
 * @param {string} fields - Comma-separated list of fields to retrieve (default: id,name)
 * @returns {Promise<Object>} User information
 * @throws {Error} If API call fails
 */
async function getInstagramUser(accessToken, fields = 'id,name') {
  try {
    console.log('Fetching user information from Facebook Graph API');

    const params = new URLSearchParams({
      fields: fields,
      access_token: accessToken
    });

    const url = `${oauthConfig.graphApiUrl}/me?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Successfully retrieved user information: ${JSON.stringify(response.data)}`);
    return response.data;

  } catch (error) {
    console.error('Error fetching user info:', error.response?.data || error.message);
    throw new Error(`Failed to get user info: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get Facebook Pages that the user manages
 * @param {string} accessToken - Valid Facebook access token
 * @returns {Promise<Array>} List of Facebook Pages
 * @throws {Error} If API call fails
 */
async function getFacebookPages(accessToken) {
  try {
    console.log('Fetching Facebook Pages');

    const params = new URLSearchParams({
      fields: 'id,name,access_token,instagram_business_account',
      access_token: accessToken
    });

    const url = `${oauthConfig.graphApiUrl}/me/accounts?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Found ${response.data.data?.length || 0} Facebook Pages`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching Facebook Pages:', error.response?.data || error.message);
    throw new Error(`Failed to get Facebook Pages: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get Instagram Business Account connected to a Facebook Page
 * @param {string} pageAccessToken - Page access token
 * @param {string} instagramBusinessAccountId - Instagram Business Account ID from the page
 * @returns {Promise<Object>} Instagram Business Account information
 * @throws {Error} If API call fails
 */
async function getInstagramBusinessAccount(pageAccessToken, instagramBusinessAccountId) {
  try {
    console.log(`Fetching Instagram Business Account: ${instagramBusinessAccountId}`);

    const params = new URLSearchParams({
      fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count',
      access_token: pageAccessToken
    });

    const url = `${oauthConfig.graphApiUrl}/${instagramBusinessAccountId}?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Instagram Business Account: @${response.data.username}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Instagram Business Account:', error.response?.data || error.message);
    throw new Error(`Failed to get Instagram Business Account: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get Instagram media (posts) for an Instagram Business Account
 * @param {string} instagramAccountId - Instagram Business Account ID
 * @param {string} pageAccessToken - Page access token
 * @param {number} limit - Number of media items to retrieve (default: 10)
 * @returns {Promise<Object>} Media data
 * @throws {Error} If API call fails
 */
async function getInstagramMedia(instagramAccountId, pageAccessToken, limit = 10) {
  try {
    console.log(`Fetching Instagram media for account: ${instagramAccountId}`);

    const params = new URLSearchParams({
      fields: 'id, like_count',//caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments_count',
      limit: limit.toString(),
      access_token: pageAccessToken
    });

    const url = `${oauthConfig.graphApiUrl}/${instagramAccountId}/media?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Retrieved ${response.data.data?.length || 0} media items`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Instagram media:', error.response?.data || error.message);
    throw new Error(`Failed to get Instagram media: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Business Discovery - Get other professional account metadata
 * GET /{ig-user-id}/business_discovery
 * @param {string} instagramAccountId - Your Instagram Business Account ID
 * @param {string} pageAccessToken - Page access token
 * @param {string} username - Username to discover (without @)
 * @returns {Promise<Object>} Business account data
 */
async function getBusinessDiscovery(instagramAccountId, pageAccessToken, username) {
  try {
    console.log(`Business discovery for username: ${username}`);

    const params = new URLSearchParams({
      fields: `business_discovery.username(${username}){id,username,name,profile_picture_url,followers_count,follows_count,media_count,media{id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count}}`,
      access_token: pageAccessToken
    });

    const url = `${oauthConfig.graphApiUrl}/${instagramAccountId}?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Retrieved business discovery data for @${username}`);
    return response.data.business_discovery;
  } catch (error) {
    console.error('Error in business discovery:', error.response?.data || error.message);
    throw new Error(`Failed to get business discovery: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Hashtag Search - Get hashtag node ID
 * GET /ig_hashtag_search
 * @param {string} instagramAccountId - Instagram Business Account ID
 * @param {string} pageAccessToken - Page access token
 * @param {string} query - Hashtag to search (without # symbol)
 * @returns {Promise<Object>} Hashtag search results with IDs
 */
async function searchHashtags(instagramAccountId, pageAccessToken, query) {
  try {
    console.log(`Searching hashtags for: ${query}`);

    const params = new URLSearchParams({
      user_id: instagramAccountId,
      q: query,
      access_token: pageAccessToken
    });

    const url = `${oauthConfig.graphApiUrl}/ig_hashtag_search?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Found ${response.data.data?.length || 0} hashtags`);
    return response.data;
  } catch (error) {
    console.error('Error searching hashtags:', error.response?.data || error.message);
    throw new Error(`Failed to search hashtags: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get hashtag top media
 * GET /{ig-hashtag-id}/top_media
 * @param {string} hashtagId - Hashtag ID from search
 * @param {string} instagramAccountId - Instagram Business Account ID
 * @param {string} pageAccessToken - Page access token
 * @param {number} limit - Number of posts (max 50)
 * @returns {Promise<Object>} Top media posts
 */
async function getHashtagTopMedia(hashtagId, instagramAccountId, pageAccessToken, limit = 25) {
  try {
    console.log(`Fetching top media for hashtag ID: ${hashtagId}`);

    const params = new URLSearchParams({
      user_id: instagramAccountId,
      fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
      limit: limit.toString(),
      access_token: pageAccessToken
    });

    const url = `${oauthConfig.graphApiUrl}/${hashtagId}/top_media?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Retrieved ${response.data.data?.length || 0} top media posts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching hashtag top media:', error.response?.data || error.message);
    throw new Error(`Failed to get hashtag top media: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get hashtag recent media
 * GET /{ig-hashtag-id}/recent_media
 * @param {string} hashtagId - Hashtag ID from search
 * @param {string} instagramAccountId - Instagram Business Account ID
 * @param {string} pageAccessToken - Page access token
 * @param {number} limit - Number of posts
 * @returns {Promise<Object>} Recent media posts
 */
async function getHashtagRecentMedia(hashtagId, instagramAccountId, pageAccessToken, limit = 25) {
  try {
    console.log(`Fetching recent media for hashtag ID: ${hashtagId}`);

    const params = new URLSearchParams({
      user_id: instagramAccountId,
      fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
      limit: limit.toString(),
      access_token: pageAccessToken
    });

    const url = `${oauthConfig.graphApiUrl}/${hashtagId}/recent_media?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Retrieved ${response.data.data?.length || 0} recent media posts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching hashtag recent media:', error.response?.data || error.message);
    throw new Error(`Failed to get hashtag recent media: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get recently searched hashtags
 * GET /{ig-user-id}/recently_searched_hashtags
 * @param {string} instagramAccountId - Instagram Business Account ID
 * @param {string} pageAccessToken - Page access token
 * @returns {Promise<Object>} Recently searched hashtags (last 7 days)
 */
async function getRecentlySearchedHashtags(instagramAccountId, pageAccessToken) {
  try {
    console.log(`Fetching recently searched hashtags`);

    const params = new URLSearchParams({
      access_token: pageAccessToken
    });

    const url = `${oauthConfig.graphApiUrl}/${instagramAccountId}/recently_searched_hashtags?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Retrieved ${response.data.data?.length || 0} recently searched hashtags`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recently searched hashtags:', error.response?.data || error.message);
    throw new Error(`Failed to get recently searched hashtags: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get media where account is tagged
 * GET /{ig-user-id}/tags
 * @param {string} instagramAccountId - Instagram Business Account ID
 * @param {string} pageAccessToken - Page access token
 * @param {number} limit - Number of posts
 * @returns {Promise<Object>} Tagged media
 */
async function getTaggedMedia(instagramAccountId, pageAccessToken, limit = 25) {
  try {
    console.log(`Fetching tagged media for account: ${instagramAccountId}`);

    const params = new URLSearchParams({
      fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
      limit: limit.toString(),
      access_token: pageAccessToken
    });

    const url = `${oauthConfig.graphApiUrl}/${instagramAccountId}/tags?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Retrieved ${response.data.data?.length || 0} tagged media posts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tagged media:', error.response?.data || error.message);
    throw new Error(`Failed to get tagged media: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get media comments
 * GET /{ig-media-id}/comments
 * @param {string} mediaId - Instagram media ID
 * @param {string} pageAccessToken - Page access token
 * @returns {Promise<Object>} Media comments
 */
async function getMediaComments(mediaId, pageAccessToken) {
  try {
    console.log(`Fetching comments for media: ${mediaId}`);

    const params = new URLSearchParams({
      fields: 'id,text,username,timestamp,like_count',
      access_token: pageAccessToken
    });

    const url = `${oauthConfig.graphApiUrl}/${mediaId}/comments?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Retrieved ${response.data.data?.length || 0} comments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching media comments:', error.response?.data || error.message);
    throw new Error(`Failed to get media comments: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get carousel media children
 * GET /{ig-media-id}/children
 * @param {string} mediaId - Instagram carousel media ID
 * @param {string} pageAccessToken - Page access token
 * @returns {Promise<Object>} Carousel children
 */
async function getCarouselChildren(mediaId, pageAccessToken) {
  try {
    console.log(`Fetching carousel children for media: ${mediaId}`);

    const params = new URLSearchParams({
      fields: 'id,media_type,media_url,permalink,timestamp',
      access_token: pageAccessToken
    });

    const url = `${oauthConfig.graphApiUrl}/${mediaId}/children?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Retrieved ${response.data.data?.length || 0} carousel items`);
    return response.data;
  } catch (error) {
    console.error('Error fetching carousel children:', error.response?.data || error.message);
    throw new Error(`Failed to get carousel children: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get Instagram account insights
 * GET /{ig-user-id}/insights
 * @param {string} instagramAccountId - Instagram Business Account ID
 * @param {string} pageAccessToken - Page access token
 * @returns {Promise<Object>} Account insights
 */
async function getAccountInsights(instagramAccountId, pageAccessToken) {
  try {
    console.log(`Fetching account insights`);

    // Valid metrics according to Instagram Graph API
    // Metrics with 'day' period: reach, profile_views, website_clicks, accounts_engaged, total_interactions, likes, comments, shares, saves, replies
    // These metrics require metric_type=total_value parameter
    const params = new URLSearchParams({
      metric: 'reach,profile_views,website_clicks,accounts_engaged,total_interactions,likes,comments,shares,saves,replies',
      period: 'day',
      metric_type: 'total_value',
      access_token: pageAccessToken
    });

    const url = `${oauthConfig.graphApiUrl}/${instagramAccountId}/insights?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Retrieved account insights`);
    return response.data;
  } catch (error) {
    console.error('Error fetching account insights:', error.response?.data || error.message);
    throw new Error(`Failed to get account insights: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get Instagram Stories
 * GET /{ig-user-id}/stories
 * @param {string} instagramAccountId - Instagram Business Account ID
 * @param {string} pageAccessToken - Page access token
 * @returns {Promise<Object>} Stories data
 */
async function getInstagramStories(instagramAccountId, pageAccessToken) {
  try {
    console.log(`Fetching Instagram stories`);

    const params = new URLSearchParams({
      fields: 'id,media_type,media_url,permalink,timestamp',
      access_token: pageAccessToken
    });

    const url = `${oauthConfig.graphApiUrl}/${instagramAccountId}/stories?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Retrieved ${response.data.data?.length || 0} stories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stories:', error.response?.data || error.message);
    throw new Error(`Failed to get stories: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get Media Insights (Individual Post Analytics)
 * GET /{ig-media-id}/insights
 * @param {string} mediaId - Instagram Media ID
 * @param {string} pageAccessToken - Page access token
 * @param {string} mediaType - Media type (IMAGE, VIDEO, CAROUSEL_ALBUM, REELS)
 * @returns {Promise<Object>} Media insights data
 *
 * Note: Updated for Graph API v24.0 (2025) - using non-deprecated metrics
 * - All types: views, reach, saves, likes, comments, shares, total_interactions
 * - Deprecated metrics removed: impressions, engagement, plays, carousel_album_*
 * - "views" is the new unified metric replacing impressions/plays
 * - Stories: Different endpoint, not covered here
 */
async function getMediaInsights(mediaId, pageAccessToken, mediaType = 'photo') {
  try {
    console.log(`Fetching media insights for media ID: ${mediaId}, type: ${mediaType}`);

    // Define metrics based on media type
    // Updated for Graph API v24.0 (late 2025) - using non-deprecated metrics only
    // Deprecated metrics removed: impressions, engagement, plays, carousel_album_* metrics
    // New primary metric: "views" replaces legacy impressions/plays
    let metrics;
    if (mediaType === 'VIDEO' || mediaType === 'REELS') {
      // For videos and reels
      // Safe metrics: views, reach, likes, comments, shares, saves, total_interactions
      // Optional (if available): ig_reels_video_view_total_time, ig_reels_avg_watch_time
      metrics = 'views,reach,likes,comments,shares,saved,total_interactions';
    } else if (mediaType === 'CAROUSEL_ALBUM') {
      // For carousel posts
      // Safe metrics: views, reach, likes, comments, shares, saves, total_interactions
      // Deprecated: carousel_album_impressions and carousel-specific legacy metrics
      metrics = 'views,reach,likes,comments,shares,saved,total_interactions';
    } else {
      // For photos (IMAGE) and default
      // Safe metrics: views, reach, likes, comments, shares, saves, total_interactions
      // Deprecated: impressions (replaced by views)
      metrics = 'views,reach,likes,comments,shares,saved,total_interactions';
    }

    const params = new URLSearchParams({
      metric: metrics,
      access_token: pageAccessToken
    });

    const url = `${oauthConfig.graphApiUrl}/${mediaId}/insights?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Retrieved media insights for ${mediaId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching media insights:', error.response?.data || error.message);
    throw new Error(`Failed to get media insights: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get Audience Demographics and Insights
 * GET /{ig-user-id}/insights with audience metrics
 * @param {string} instagramAccountId - Instagram Business Account ID
 * @param {string} pageAccessToken - Page access token
 * @param {string} period - Time period (day, week, days_28, lifetime)
 * @returns {Promise<Object>} Audience insights data
 *
 * Note: Updated for Graph API v24.0 (2025)
 * - Requires 100+ followers. Demographic data may have up to 48-hour delay.
 * - New 2025 metrics: follower_demographics, engaged_audience_demographics, reached_audience_demographics
 * - Deprecated: audience_city, audience_country, audience_gender_age, audience_locale
 */
async function getAudienceInsights(instagramAccountId, pageAccessToken, period = 'lifetime') {
  try {
    console.log(`Fetching audience insights for period: ${period}`);

    let metrics;
    let breakdown = undefined;

    if (period === 'lifetime') {
      // Lifetime metrics - Updated for 2025 API
      // follower_demographics replaces: audience_city, audience_country, audience_gender_age, audience_locale
      metrics = 'follower_demographics,follower_count,online_followers';
      // online_followers works with lifetime period
      breakdown = 'day'; // or 'hour' for hourly breakdown
    } else if (period === 'day') {
      // Daily metrics - follower count and engagement demographics
      metrics = 'follower_count,engaged_audience_demographics,reached_audience_demographics';
    } else {
      // For week or days_28
      metrics = 'follower_count';
    }

    const params = new URLSearchParams({
      metric: metrics,
      period: period,
      access_token: pageAccessToken
    });

    // Add breakdown if specified
    if (breakdown) {
      params.append('breakdown', breakdown);
    }

    const url = `${oauthConfig.graphApiUrl}/${instagramAccountId}/insights?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Retrieved audience insights for period: ${period}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching audience insights:', error.response?.data || error.message);
    throw new Error(`Failed to get audience insights: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get Account Insights with Time Period Support
 * GET /{ig-user-id}/insights
 * @param {string} instagramAccountId - Instagram Business Account ID
 * @param {string} pageAccessToken - Page access token
 * @param {string} period - Time period (day, week, days_28)
 * @returns {Promise<Object>} Account insights for specified period
 */
async function getAccountInsightsWithPeriod(instagramAccountId, pageAccessToken, period = 'day') {
  try {
    console.log(`Fetching account insights for period: ${period}`);

    // Different metrics available for different periods
    let metrics;

    if (period === 'day') {
      // Day metrics - require metric_type=total_value
      metrics = 'reach,profile_views,website_clicks,accounts_engaged,total_interactions,likes,comments,shares,saves,replies';
    } else if (period === 'week') {
      // Week metrics - impressions NOT supported for week period in 2025 API
      // Valid: reach, follower_count, website_clicks, profile_views, accounts_engaged, total_interactions, likes, comments, shares, saves, replies
      metrics = 'reach,follower_count,profile_views,website_clicks,accounts_engaged,total_interactions,likes,comments,shares,saves,replies';
    } else if (period === 'days_28') {
      // 28-day metrics - same as week
      metrics = 'reach,follower_count,profile_views,website_clicks,accounts_engaged,total_interactions,likes,comments,shares,saves,replies';
    } else {
      throw new Error(`Invalid period: ${period}. Must be 'day', 'week', or 'days_28'`);
    }

    const params = new URLSearchParams({
      metric: metrics,
      period: period,
      access_token: pageAccessToken
    });

    // Add metric_type for day period
    if (period === 'day') {
      params.append('metric_type', 'total_value');
    }

    const url = `${oauthConfig.graphApiUrl}/${instagramAccountId}/insights?${params.toString()}`;
    const response = await axios.get(url);

    console.log(`Retrieved account insights for period: ${period}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching account insights:', error.response?.data || error.message);
    throw new Error(`Failed to get account insights: ${error.response?.data?.error?.message || error.message}`);
  }
}

module.exports = {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  refreshLongLivedToken,
  getInstagramUser,
  getFacebookPages,
  getInstagramBusinessAccount,
  getInstagramMedia,
  getBusinessDiscovery,
  searchHashtags,
  getHashtagTopMedia,
  getHashtagRecentMedia,
  getRecentlySearchedHashtags,
  getTaggedMedia,
  getMediaComments,
  getCarouselChildren,
  getAccountInsights,
  getInstagramStories,
  getMediaInsights,
  getAudienceInsights,
  getAccountInsightsWithPeriod
};
