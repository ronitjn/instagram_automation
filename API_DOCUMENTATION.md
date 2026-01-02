# Instagram OAuth Integration - API Documentation

**Last Updated:** 2025-12-26
**API Version:** Facebook Graph API v21.0
**Project:** Instagram Business API Integration

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication APIs](#authentication-apis)
3. [User & Account APIs](#user--account-apis)
4. [Media APIs](#media-apis)
5. [Insights & Analytics APIs](#insights--analytics-apis)
6. [Discovery & Search APIs](#discovery--search-apis)
7. [Hashtag APIs](#hashtag-apis)
8. [Comments APIs](#comments-apis)
9. [API Endpoints Summary](#api-endpoints-summary)

---

## Overview

This project integrates with **Facebook Graph API v21.0** to access Instagram Business features through OAuth 2.0 authentication. All API calls are made to the Facebook Graph API endpoints, which provide access to Instagram Business Account data.

**Base URL:** `https://graph.facebook.com/v21.0`

**Authentication:** All APIs require a valid access token (either Facebook access token or Page access token depending on the endpoint).

---

## Authentication APIs

### 1. OAuth Authorization URL

**Purpose:** Generate the URL to redirect users to Facebook for authorization.

**Endpoint:** `https://www.facebook.com/v21.0/dialog/oauth`

**Method:** GET

**Function:** `buildAuthorizeUrl(state)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client_id` | string | Yes | Facebook App ID |
| `redirect_uri` | string | Yes | OAuth callback URL |
| `scope` | string | Yes | Comma-separated permissions |
| `response_type` | string | Yes | Always "code" |
| `state` | string | Yes | CSRF protection token |

**Scopes Requested:**
- `instagram_basic`
- `instagram_manage_comments`
- `instagram_manage_insights`
- `instagram_content_publish`
- `pages_show_list`
- `pages_read_engagement`
- `business_management`

**Response:**
- Returns authorization URL string

---

### 2. Exchange Authorization Code for Short-Lived Token

**Purpose:** Exchange the authorization code received from Facebook callback for a short-lived access token.

**Endpoint:** `https://graph.facebook.com/v21.0/oauth/access_token`

**Method:** GET

**Function:** `exchangeCodeForToken(code)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client_id` | string | Yes | Facebook App ID |
| `client_secret` | string | Yes | Facebook App Secret |
| `redirect_uri` | string | Yes | OAuth callback URL |
| `code` | string | Yes | Authorization code from callback |

**Response Variables:**
```javascript
{
  access_token: string,      // Short-lived Facebook access token
  token_type: string,        // "bearer"
  expires_in: number         // Token expiration in seconds (usually ~5183999)
}
```

---

### 3. Exchange Short-Lived Token for Long-Lived Token

**Purpose:** Convert short-lived token (1 hour) to long-lived token (60 days).

**Endpoint:** `https://graph.facebook.com/v21.0/oauth/access_token`

**Method:** GET

**Function:** `exchangeForLongLivedToken(shortLivedToken)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grant_type` | string | Yes | "fb_exchange_token" |
| `client_id` | string | Yes | Facebook App ID |
| `client_secret` | string | Yes | Facebook App Secret |
| `fb_exchange_token` | string | Yes | Short-lived access token |

**Response Variables:**
```javascript
{
  access_token: string,      // Long-lived Facebook access token (60 days)
  token_type: string,        // "bearer"
  expires_in: number         // Token expiration in seconds (5183999 = ~60 days)
}
```

---

### 4. Refresh Long-Lived Token

**Purpose:** Refresh an existing long-lived token to extend its validity.

**Endpoint:** `https://graph.facebook.com/v21.0/oauth/access_token`

**Method:** GET

**Function:** `refreshLongLivedToken(longLivedToken)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grant_type` | string | Yes | "ig_refresh_token" |
| `access_token` | string | Yes | Current long-lived token |

**Response Variables:**
```javascript
{
  access_token: string,      // Refreshed access token (60 days)
  token_type: string,        // "bearer"
  expires_in: number         // Token expiration in seconds
}
```

---

## User & Account APIs

### 5. Get Facebook User Information

**Purpose:** Retrieve basic user information from Facebook.

**Endpoint:** `https://graph.facebook.com/v21.0/me`

**Method:** GET

**Function:** `getInstagramUser(accessToken, fields)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fields` | string | No | Comma-separated fields (default: "id,name") |
| `access_token` | string | Yes | Facebook access token |

**Response Variables:**
```javascript
{
  id: string,               // Facebook user ID
  name: string             // Facebook user's full name
}
```

---

### 6. Get Facebook Pages

**Purpose:** Retrieve all Facebook Pages managed by the user.

**Endpoint:** `https://graph.facebook.com/v21.0/me/accounts`

**Method:** GET

**Function:** `getFacebookPages(accessToken)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fields` | string | Yes | "id,name,access_token,instagram_business_account" |
| `access_token` | string | Yes | Facebook access token |

**Response Variables:**
```javascript
{
  data: [
    {
      id: string,                              // Facebook Page ID
      name: string,                            // Page name
      access_token: string,                    // Page-specific access token
      instagram_business_account: {            // Optional - only if linked
        id: string                             // Instagram Business Account ID
      }
    }
  ]
}
```

---

### 7. Get Instagram Business Account

**Purpose:** Retrieve detailed information about an Instagram Business Account.

**Endpoint:** `https://graph.facebook.com/v21.0/{instagram-business-account-id}`

**Method:** GET

**Function:** `getInstagramBusinessAccount(pageAccessToken, instagramBusinessAccountId)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fields` | string | Yes | Account fields to retrieve |
| `access_token` | string | Yes | Page access token |

**Fields Requested:**
- `id`
- `username`
- `name`
- `profile_picture_url`
- `followers_count`
- `follows_count`
- `media_count`

**Response Variables:**
```javascript
{
  id: string,                      // Instagram Business Account ID
  username: string,                // Instagram username (without @)
  name: string,                    // Account display name
  profile_picture_url: string,     // Profile picture URL
  followers_count: number,         // Number of followers
  follows_count: number,           // Number of accounts followed
  media_count: number             // Total number of posts
}
```

---

## Media APIs

### 8. Get Instagram Media (Posts)

**Purpose:** Retrieve media posts from an Instagram Business Account.

**Endpoint:** `https://graph.facebook.com/v21.0/{ig-user-id}/media`

**Method:** GET

**Function:** `getInstagramMedia(instagramAccountId, pageAccessToken, limit)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fields` | string | Yes | Media fields to retrieve |
| `limit` | number | No | Number of posts (default: 10) |
| `access_token` | string | Yes | Page access token |

**Fields Requested:**
- `id`
- `like_count`

**Available Fields (commented in code):**
- `caption`
- `media_type`
- `media_url`
- `thumbnail_url`
- `permalink`
- `timestamp`
- `comments_count`

**Response Variables:**
```javascript
{
  data: [
    {
      id: string,                  // Media ID
      like_count: number          // Number of likes
    }
  ],
  paging: {
    cursors: {
      before: string,             // Pagination cursor
      after: string               // Pagination cursor
    },
    next: string                  // Next page URL
  }
}
```

---

### 9. Get Instagram Stories

**Purpose:** Retrieve active Instagram Stories.

**Endpoint:** `https://graph.facebook.com/v21.0/{ig-user-id}/stories`

**Method:** GET

**Function:** `getInstagramStories(instagramAccountId, pageAccessToken)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fields` | string | Yes | Story fields to retrieve |
| `access_token` | string | Yes | Page access token |

**Fields Requested:**
- `id`
- `media_type`
- `media_url`
- `permalink`
- `timestamp`

**Response Variables:**
```javascript
{
  data: [
    {
      id: string,                  // Story media ID
      media_type: string,          // "IMAGE" or "VIDEO"
      media_url: string,           // Story media URL
      permalink: string,           // Permalink to story
      timestamp: string           // ISO 8601 timestamp
    }
  ]
}
```

---

### 10. Get Tagged Media

**Purpose:** Retrieve posts where the Instagram account is tagged.

**Endpoint:** `https://graph.facebook.com/v21.0/{ig-user-id}/tags`

**Method:** GET

**Function:** `getTaggedMedia(instagramAccountId, pageAccessToken, limit)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fields` | string | Yes | Media fields to retrieve |
| `limit` | number | No | Number of posts (default: 25) |
| `access_token` | string | Yes | Page access token |

**Fields Requested:**
- `id`
- `caption`
- `media_type`
- `media_url`
- `permalink`
- `timestamp`
- `like_count`
- `comments_count`

**Response Variables:**
```javascript
{
  data: [
    {
      id: string,                  // Media ID
      caption: string,             // Post caption
      media_type: string,          // "IMAGE", "VIDEO", "CAROUSEL_ALBUM"
      media_url: string,           // Media URL
      permalink: string,           // Permalink to post
      timestamp: string,           // ISO 8601 timestamp
      like_count: number,          // Number of likes
      comments_count: number      // Number of comments
    }
  ],
  paging: object                  // Pagination info
}
```

---

### 11. Get Carousel Children

**Purpose:** Retrieve individual items from a carousel post.

**Endpoint:** `https://graph.facebook.com/v21.0/{ig-media-id}/children`

**Method:** GET

**Function:** `getCarouselChildren(mediaId, pageAccessToken)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fields` | string | Yes | Children fields to retrieve |
| `access_token` | string | Yes | Page access token |

**Fields Requested:**
- `id`
- `media_type`
- `media_url`
- `permalink`
- `timestamp`

**Response Variables:**
```javascript
{
  data: [
    {
      id: string,                  // Child media ID
      media_type: string,          // "IMAGE" or "VIDEO"
      media_url: string,           // Child media URL
      permalink: string,           // Permalink
      timestamp: string           // ISO 8601 timestamp
    }
  ]
}
```

---

## Insights & Analytics APIs

### 12. Get Account Insights (Daily)

**Purpose:** Retrieve daily account-level insights and analytics.

**Endpoint:** `https://graph.facebook.com/v21.0/{ig-user-id}/insights`

**Method:** GET

**Function:** `getAccountInsights(instagramAccountId, pageAccessToken)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metric` | string | Yes | Comma-separated metrics |
| `period` | string | Yes | "day" |
| `metric_type` | string | Yes | "total_value" |
| `access_token` | string | Yes | Page access token |

**Metrics Requested:**
- `reach` - Number of unique accounts reached
- `profile_views` - Number of profile views
- `website_clicks` - Number of website clicks
- `accounts_engaged` - Number of unique accounts engaged
- `total_interactions` - Total interactions
- `likes` - Number of likes
- `comments` - Number of comments
- `shares` - Number of shares
- `saves` - Number of saves
- `replies` - Number of replies

**Response Variables:**
```javascript
{
  data: [
    {
      name: string,               // Metric name (e.g., "reach")
      period: string,             // "day"
      values: [
        {
          value: number,          // Metric value
          end_time: string       // ISO 8601 timestamp
        }
      ],
      title: string,              // Human-readable metric title
      description: string,        // Metric description
      id: string                  // Insight ID
    }
  ]
}
```

---

### 13. Get Account Insights with Time Period

**Purpose:** Retrieve account insights for different time periods (day, week, 28 days).

**Endpoint:** `https://graph.facebook.com/v21.0/{ig-user-id}/insights`

**Method:** GET

**Function:** `getAccountInsightsWithPeriod(instagramAccountId, pageAccessToken, period)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metric` | string | Yes | Period-specific metrics |
| `period` | string | Yes | "day", "week", or "days_28" |
| `metric_type` | string | Conditional | "total_value" (day only) |
| `access_token` | string | Yes | Page access token |

**Metrics by Period:**

**Day Period:**
- `reach`
- `profile_views`
- `website_clicks`
- `accounts_engaged`
- `total_interactions`
- `likes`
- `comments`
- `shares`
- `saves`
- `replies`

**Week / Days_28 Period:**
- `reach`
- `follower_count`
- `profile_views`
- `website_clicks`
- `accounts_engaged`
- `total_interactions`
- `likes`
- `comments`
- `shares`
- `saves`
- `replies`

**Note:** ⚠️ `impressions` is NOT supported for week/days_28 periods in 2025 API.

**Response Variables:**
```javascript
{
  data: [
    {
      name: string,               // Metric name
      period: string,             // "day", "week", or "days_28"
      values: [
        {
          value: number,          // Metric value
          end_time: string       // ISO 8601 timestamp
        }
      ],
      title: string,              // Human-readable title
      description: string,        // Metric description
      id: string                  // Insight ID
    }
  ]
}
```

---

### 14. Get Media Insights (Individual Post Analytics)

**Purpose:** Retrieve insights for a specific media post.

**Endpoint:** `https://graph.facebook.com/v21.0/{ig-media-id}/insights`

**Method:** GET

**Function:** `getMediaInsights(mediaId, pageAccessToken, mediaType)`

**⚠️ CRITICAL LIMITATION:** You can ONLY get insights for your own account's media. Media IDs obtained from Business Discovery (other accounts) will fail with a permissions error (Error Code 100, Subcode 33).

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metric` | string | Yes | Media-type-specific metrics |
| `access_token` | string | Yes | Page access token |

**Media Types:**
- `IMAGE` - Photo posts
- `VIDEO` - Video posts
- `CAROUSEL_ALBUM` - Carousel/multi-image posts
- `REELS` - Instagram Reels

**Metrics by Media Type (Graph API v24.0 - 2025):**

**⚠️ Important:** As of 2025, Meta has deprecated several legacy metrics:
- ❌ `impressions` (replaced by `views`)
- ❌ `engagement` (use `total_interactions` instead)
- ❌ `plays` (replaced by `views`)
- ❌ `carousel_album_*` metrics (use standard metrics)

**IMAGE (Photos):**
- `views` - ✅ Total post views (replaces impressions)
- `reach` - Unique accounts reached
- `saves` - Number of saves
- `likes` - Number of likes
- `comments` - Number of comments
- `shares` - Number of shares
- `total_interactions` - Total interactions

**VIDEO / REELS:**
- `views` - ✅ Video/reel views (replaces plays)
- `reach` - Unique accounts reached
- `saves` - Number of saves
- `likes` - Number of likes
- `comments` - Number of comments
- `shares` - Number of shares
- `total_interactions` - Total interactions
- `ig_reels_video_view_total_time` - Total watch time (optional, if available)
- `ig_reels_avg_watch_time` - Average watch time (optional, if available)

**CAROUSEL_ALBUM:**
- `views` - ✅ Total album views (replaces impressions)
- `reach` - Unique accounts reached
- `saves` - Number of saves
- `likes` - Number of likes
- `comments` - Number of comments
- `shares` - Number of shares
- `total_interactions` - Total interactions

**Response Variables:**
```javascript
{
  data: [
    {
      name: string,               // Metric name (e.g., "engagement")
      period: string,             // "lifetime"
      values: [
        {
          value: number          // Metric value
        }
      ],
      title: string,              // Human-readable title
      description: string,        // Metric description
      id: string                  // Insight ID
    }
  ]
}
```

---

### 15. Get Audience Insights (Demographics)

**Purpose:** Retrieve audience demographics and follower insights.

**Endpoint:** `https://graph.facebook.com/v21.0/{ig-user-id}/insights`

**Method:** GET

**Function:** `getAudienceInsights(instagramAccountId, pageAccessToken, period)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metric` | string | Yes | Demographic metrics |
| `period` | string | Yes | "lifetime", "day", "week", "days_28" |
| `breakdown` | string | No | "hour" or "day" (for online_followers) |
| `access_token` | string | Yes | Page access token |

**Requirements:**
- ⚠️ Requires 100+ followers
- ⚠️ Demographic data may have up to 48-hour delay

**⚠️ 2025 API Update:** Old demographic metrics have been replaced:
- ❌ `audience_city` → Use `follower_demographics`
- ❌ `audience_country` → Use `follower_demographics`
- ❌ `audience_gender_age` → Use `follower_demographics`
- ❌ `audience_locale` → Use `follower_demographics`

**Metrics by Period:**

**Lifetime Period:**
- `follower_demographics` - ✅ Unified demographic data (replaces all audience_* metrics)
- `follower_count` - Total follower count
- `online_followers` - When followers are online (with breakdown: day or hour)

**Day Period:**
- `follower_count` - Total follower count
- `engaged_audience_demographics` - Demographics of engaged users
- `reached_audience_demographics` - Demographics of reached users

**Week / Days_28 Period:**
- `follower_count` - Total follower count

**Response Variables:**
```javascript
{
  data: [
    {
      name: string,               // Metric name (e.g., "follower_demographics")
      period: string,             // "lifetime", "day", etc.
      values: [
        {
          value: object,          // Metric breakdown (key-value pairs)
          end_time: string       // ISO 8601 timestamp
        }
      ],
      title: string,              // Human-readable title
      description: string,        // Metric description
      id: string                  // Insight ID
    }
  ]
}

// Example follower_demographics value (combines gender, age, city, country):
{
  "gender_age": {
    "M.13-17": 150,
    "M.18-24": 450,
    "M.25-34": 800,
    "F.18-24": 600,
    "F.25-34": 1200
  },
  "country": {
    "US": 5000,
    "GB": 2000,
    "CA": 1500
  },
  "city": {
    "New York, NY": 2000,
    "London, UK": 1500
  }
}

// Example online_followers value (with breakdown=day):
{
  "0": 500,   // Midnight
  "1": 300,
  ...
  "23": 800
}
```

---

## Discovery & Search APIs

### 16. Business Discovery

**Purpose:** Discover and analyze other Instagram Business/Creator accounts.

**Endpoint:** `https://graph.facebook.com/v21.0/{ig-user-id}`

**Method:** GET

**Function:** `getBusinessDiscovery(instagramAccountId, pageAccessToken, username)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fields` | string | Yes | business_discovery with nested fields |
| `access_token` | string | Yes | Page access token |

**Fields Requested:**
```javascript
business_discovery.username(target_username){
  id,
  username,
  name,
  profile_picture_url,
  followers_count,
  follows_count,
  media_count,
  media{
    id,
    caption,
    media_type,
    media_url,
    permalink,
    timestamp,
    like_count,
    comments_count
  }
}
```

**Response Variables:**
```javascript
{
  business_discovery: {
    id: string,                      // Target account's IG ID
    username: string,                // Target account's username
    name: string,                    // Target account's name
    profile_picture_url: string,     // Profile picture URL
    followers_count: number,         // Follower count
    follows_count: number,           // Following count
    media_count: number,             // Total media count
    media: {
      data: [
        {
          id: string,                // Media ID
          caption: string,           // Post caption
          media_type: string,        // Media type
          media_url: string,         // Media URL
          permalink: string,         // Permalink
          timestamp: string,         // ISO 8601 timestamp
          like_count: number,        // Likes
          comments_count: number    // Comments
        }
      ]
    }
  }
}
```

---

## Hashtag APIs

### 17. Hashtag Search

**Purpose:** Search for hashtags and get hashtag IDs.

**Endpoint:** `https://graph.facebook.com/v21.0/ig_hashtag_search`

**Method:** GET

**Function:** `searchHashtags(instagramAccountId, pageAccessToken, query)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | Instagram Business Account ID |
| `q` | string | Yes | Hashtag to search (without #) |
| `access_token` | string | Yes | Page access token |

**Response Variables:**
```javascript
{
  data: [
    {
      id: string                    // Hashtag ID (used in other hashtag endpoints)
    }
  ]
}
```

---

### 18. Hashtag Top Media

**Purpose:** Get top/popular media posts for a specific hashtag.

**Endpoint:** `https://graph.facebook.com/v21.0/{ig-hashtag-id}/top_media`

**Method:** GET

**Function:** `getHashtagTopMedia(hashtagId, instagramAccountId, pageAccessToken, limit)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | Instagram Business Account ID |
| `fields` | string | Yes | Media fields to retrieve |
| `limit` | number | No | Max 50 (default: 25) |
| `access_token` | string | Yes | Page access token |

**Fields Requested:**
- `id`
- `caption`
- `media_type`
- `media_url`
- `permalink`
- `timestamp`
- `like_count`
- `comments_count`

**Response Variables:**
```javascript
{
  data: [
    {
      id: string,                  // Media ID
      caption: string,             // Post caption
      media_type: string,          // Media type
      media_url: string,           // Media URL
      permalink: string,           // Permalink
      timestamp: string,           // ISO 8601 timestamp
      like_count: number,          // Likes
      comments_count: number      // Comments
    }
  ],
  paging: object                  // Pagination info
}
```

---

### 19. Hashtag Recent Media

**Purpose:** Get recent media posts for a specific hashtag.

**Endpoint:** `https://graph.facebook.com/v21.0/{ig-hashtag-id}/recent_media`

**Method:** GET

**Function:** `getHashtagRecentMedia(hashtagId, instagramAccountId, pageAccessToken, limit)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | Instagram Business Account ID |
| `fields` | string | Yes | Media fields to retrieve |
| `limit` | number | No | Default: 25 |
| `access_token` | string | Yes | Page access token |

**Fields & Response:** Same as Hashtag Top Media (see above)

---

### 20. Recently Searched Hashtags

**Purpose:** Get hashtags recently searched by the account (last 7 days).

**Endpoint:** `https://graph.facebook.com/v21.0/{ig-user-id}/recently_searched_hashtags`

**Method:** GET

**Function:** `getRecentlySearchedHashtags(instagramAccountId, pageAccessToken)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `access_token` | string | Yes | Page access token |

**Response Variables:**
```javascript
{
  data: [
    {
      id: string                    // Hashtag ID
    }
  ]
}
```

---

## Comments APIs

### 21. Get Media Comments

**Purpose:** Retrieve comments on a specific media post.

**Endpoint:** `https://graph.facebook.com/v21.0/{ig-media-id}/comments`

**Method:** GET

**Function:** `getMediaComments(mediaId, pageAccessToken)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fields` | string | Yes | Comment fields to retrieve |
| `access_token` | string | Yes | Page access token |

**Fields Requested:**
- `id`
- `text`
- `username`
- `timestamp`
- `like_count`

**Response Variables:**
```javascript
{
  data: [
    {
      id: string,                  // Comment ID
      text: string,                // Comment text
      username: string,            // Commenter's username
      timestamp: string,           // ISO 8601 timestamp
      like_count: number          // Comment likes
    }
  ],
  paging: object                  // Pagination info
}
```

---

## API Endpoints Summary

### Backend API Endpoints

All backend endpoints are prefixed with `http://localhost:3000`

| Endpoint | Method | Description | Required Parameters |
|----------|--------|-------------|-------------------|
| `/` | GET | Landing page | - |
| `/auth/instagram` | GET | Start OAuth flow | - |
| `/auth/instagram/callback` | GET | OAuth callback | `code`, `state` |
| `/api/health` | GET | Health check | - |
| `/api/me` | GET | Get user info | `userId` |
| `/api/tokens` | GET | Debug: List tokens (dev only) | - |
| `/api/logout` | DELETE | Disconnect account | `userId` |
| `/api/instagram/media` | GET | Fetch posts | `userId`, `limit`* |
| `/api/instagram/stories` | GET | Get stories | `userId` |
| `/api/instagram/tagged` | GET | Get tagged media | `userId`, `limit`* |
| `/api/instagram/insights` | GET | Account insights (day) | `userId` |
| `/api/instagram/insights/period` | GET | Account insights with period | `userId`, `period` |
| `/api/instagram/media/insights` | GET | Media insights | `userId`, `mediaId`, `mediaType`* |
| `/api/instagram/audience/insights` | GET | Audience demographics | `userId`, `period`* |
| `/api/instagram/business-discovery` | GET | Discover accounts | `userId`, `username` |
| `/api/instagram/hashtag/search` | GET | Search hashtags | `userId`, `query` |
| `/api/instagram/hashtag/top-media` | GET | Hashtag top posts | `userId`, `hashtagId`, `limit`* |
| `/api/instagram/hashtag/recent-media` | GET | Hashtag recent posts | `userId`, `hashtagId`, `limit`* |
| `/api/instagram/media/comments` | GET | Media comments | `userId`, `mediaId` |

**\* = Optional parameter**

---

## Variable Reference Quick Guide

### Token Variables
```javascript
{
  access_token: string,           // Access token
  token_type: string,             // "bearer"
  expires_in: number,             // Seconds until expiration
  userId: string,                 // Facebook user ID
  instagramAccountId: string,     // Instagram Business Account ID
  instagramUsername: string,      // Instagram username
  pageAccessToken: string,        // Page-specific token
  expiresAt: number,             // Token expiration timestamp
  createdAt: number,             // Token creation timestamp
  permissions: string[]          // Granted permissions
}
```

### Account Variables
```javascript
{
  id: string,                     // Account ID
  username: string,               // Instagram username
  name: string,                   // Display name
  profile_picture_url: string,    // Profile picture URL
  followers_count: number,        // Follower count
  follows_count: number,          // Following count
  media_count: number            // Total posts
}
```

### Media Variables
```javascript
{
  id: string,                     // Media ID
  caption: string,                // Post caption
  media_type: string,             // "IMAGE", "VIDEO", "CAROUSEL_ALBUM", "REELS"
  media_url: string,              // Media URL
  thumbnail_url: string,          // Thumbnail (videos)
  permalink: string,              // Permalink URL
  timestamp: string,              // ISO 8601 timestamp
  like_count: number,             // Likes
  comments_count: number         // Comments
}
```

### Insights Variables
```javascript
{
  name: string,                   // Metric name
  period: string,                 // Time period
  title: string,                  // Human-readable title
  description: string,            // Metric description
  id: string,                     // Insight ID
  values: [
    {
      value: number | object,     // Metric value
      end_time: string           // ISO 8601 timestamp
    }
  ]
}
```

---

## Notes & Important Information

### 2025 API Changes
- ⚠️ **Deprecated Metrics:** `video_views` (non-Reels), `email_contacts`, `profile_views` (time-series), `website_clicks`, `phone_call_clicks`, `text_message_clicks`
- ✅ **Valid Metrics:** Using only 2025-compliant metrics
- ⚠️ **Week/Days_28:** `impressions` not supported for these periods
- ⏱️ **Demographic Delays:** Up to 48-hour delay for audience insights
- 👥 **Follower Requirement:** 100+ followers needed for demographic insights

### Rate Limits
- Facebook Graph API has rate limits per app and per user
- Default: 200 calls per hour per user
- Monitor headers: `X-Business-Use-Case-Usage`, `X-App-Usage`

### Token Expiration
- Short-lived tokens: ~1 hour
- Long-lived tokens: 60 days
- Tokens can be refreshed before expiration

---

## Common Errors & Limitations

### Permission Errors

#### Error Code 100, Subcode 33
```
"Unsupported get request. Object with ID 'XXXXX' does not exist, cannot be loaded
due to missing permissions, or does not support this operation."
```

**Common Causes:**
1. **Media Insights for Other Accounts** - You tried to get insights for a media ID from Business Discovery (another account)
   - ❌ **Won't Work:** Getting insights for competitors' posts
   - ✅ **Will Work:** Getting insights only for YOUR OWN posts

2. **Solution:** Only use media IDs from your own account's `/media` endpoint, not from Business Discovery

### API Scope Limitations

| What You CAN Do | What You CANNOT Do |
|-----------------|-------------------|
| ✅ View other accounts via Business Discovery | ❌ Get insights/analytics for other accounts |
| ✅ See other accounts' posts, followers, media count | ❌ Get detailed metrics for competitors' posts |
| ✅ Get insights for YOUR OWN posts | ❌ Access private account data |
| ✅ Analyze YOUR OWN audience demographics | ❌ See other accounts' audience demographics |
| ✅ View public hashtag top/recent media | ❌ Get insights for hashtag posts (not yours) |

### Business Discovery vs Media Insights

**Business Discovery** (`/business_discovery`):
- ✅ Returns: Account info, followers, media list, engagement counts (likes/comments)
- ❌ Does NOT provide: Detailed insights, impressions, reach, saves, plays
- 🎯 Use for: Competitor research, finding content inspiration

**Media Insights** (`/{media-id}/insights`):
- ✅ Returns: Detailed analytics (impressions, reach, saves, plays, engagement)
- ⚠️ **YOUR POSTS ONLY** - Cannot be used on other accounts' media IDs
- 🎯 Use for: Analyzing your own post performance

### Workflow for Analytics

**Correct Workflow:**
1. Use **Business Discovery** → Get competitor's username, followers, basic post data
2. Use **Fetch Instagram Posts** → Get YOUR OWN media IDs
3. Use **Media Insights** → Analyze YOUR posts using media IDs from step 2

**Incorrect Workflow (Will Fail):**
1. Use Business Discovery → Get competitor's media ID
2. Use Media Insights with that ID → ❌ **Error 100/33** - No permissions

---

**End of API Documentation**
