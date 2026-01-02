require('dotenv').config();

// Facebook OAuth URLs (for Instagram Business API via Facebook Login)
// Using Facebook Login to access Instagram Business features
const FB_API_VERSION = 'v21.0';
const FACEBOOK_AUTHORIZE_URL = `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth`;
const FACEBOOK_TOKEN_URL = `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token`;
const FACEBOOK_GRAPH_API_URL = 'https://graph.facebook.com';
const INSTAGRAM_GRAPH_API_URL = 'https://graph.instagram.com';
const FACEBOOK_LONG_LIVED_TOKEN_URL = `${FACEBOOK_GRAPH_API_URL}/${FB_API_VERSION}/oauth/access_token`;
const INSTAGRAM_REFRESH_TOKEN_URL = `${INSTAGRAM_GRAPH_API_URL}/refresh_access_token`;

// Validate required environment variables
const requiredEnvVars = [
  'INSTAGRAM_APP_ID',
  'INSTAGRAM_APP_SECRET',
  'INSTAGRAM_REDIRECT_URI',
  'INSTAGRAM_SCOPES'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// OAuth configuration
const oauthConfig = {
  appId: process.env.INSTAGRAM_APP_ID,
  appSecret: process.env.INSTAGRAM_APP_SECRET,
  redirectUri: process.env.INSTAGRAM_REDIRECT_URI,
  scopes: process.env.INSTAGRAM_SCOPES.split(',').map(scope => scope.trim()),

  // URLs (Using Facebook Login for Instagram Business API)
  authorizeUrl: FACEBOOK_AUTHORIZE_URL,
  tokenUrl: FACEBOOK_TOKEN_URL,
  longLivedTokenUrl: FACEBOOK_LONG_LIVED_TOKEN_URL,
  refreshTokenUrl: INSTAGRAM_REFRESH_TOKEN_URL,
  graphApiUrl: FACEBOOK_GRAPH_API_URL,
  instagramGraphApiUrl: INSTAGRAM_GRAPH_API_URL,

  // Server config
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = oauthConfig;
