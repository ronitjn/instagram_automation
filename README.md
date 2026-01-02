# Instagram OAuth Integration

A complete Instagram OAuth 2.0 integration webapp that allows users to connect their Instagram Business accounts. Built with Node.js, Express, and vanilla JavaScript.

## Features

- Instagram OAuth 2.0 authentication flow
- Automatic short-lived to long-lived token exchange (60-day expiration)
- CSRF protection with state parameter validation
- In-memory token storage (MVP - migrate to DB for production)
- Clean, modern UI
- API endpoints for Instagram integration
- Comprehensive error handling

## Project Structure

```
Instagram/
├── backend/
│   ├── src/
│   │   ├── server.js                 # Express app entry point
│   │   ├── config/
│   │   │   └── oauth.js              # OAuth configuration
│   │   ├── routes/
│   │   │   ├── auth.js               # Authentication routes
│   │   │   └── api.js                # API routes
│   │   ├── services/
│   │   │   ├── instagramOAuth.js     # OAuth logic
│   │   │   └── tokenStorage.js       # Token storage
│   │   └── middleware/
│   │       ├── errorHandler.js       # Error handling
│   │       └── csrfProtection.js     # CSRF protection
│   ├── package.json
│   ├── .env                          # Environment variables (create from .env.example)
│   ├── .env.example                  # Environment template
│   └── .gitignore
├── frontend/
│   └── public/
│       ├── index.html                # Landing page
│       ├── success.html              # Success page
│       ├── error.html                # Error page
│       └── styles.css                # Styles
├── README.md
└── plan.txt                          # Original design specs
```

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v14 or higher) and **npm** installed
2. An **Instagram Business Account** or **Instagram Creator Account**
3. A **Meta (Facebook) Developer Account**
4. A **Meta App** with Instagram API access

## Setup Instructions

### Step 1: Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Business" as the app type
4. Fill in app details and create the app
5. In the app dashboard, add "Instagram" product
6. Navigate to Instagram → Basic Display → Instagram App ID

### Step 2: Configure OAuth Redirect URI

1. In your Meta App dashboard, go to "Instagram" → "Basic Display"
2. Under "Valid OAuth Redirect URIs", add:
   ```
   http://localhost:3000/auth/instagram/callback
   ```
3. Save changes
4. Note your **Instagram App ID** and **Instagram App Secret**

### Step 3: Install Dependencies

```bash
cd backend
npm install
```

This will install:
- express (web framework)
- dotenv (environment variables)
- axios (HTTP client)
- cors (CORS middleware)
- uuid (state parameter generation)
- nodemon (development auto-reload)

### Step 4: Configure Environment Variables

1. Navigate to the `backend` directory
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and fill in your Instagram credentials:
   ```env
   INSTAGRAM_APP_ID=your_app_id_here
   INSTAGRAM_APP_SECRET=your_app_secret_here
   INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback
   PORT=3000
   NODE_ENV=development
   INSTAGRAM_SCOPES=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish
   ```

### Step 5: Start the Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3000`

## Usage

### Connecting an Instagram Account

1. Open your browser to `http://localhost:3000`
2. Click the "Connect Instagram Account" button
3. You'll be redirected to Instagram for authorization
4. Log in with your Instagram Business account
5. Grant the requested permissions
6. You'll be redirected back to the success page

### Testing the API

On the success page, click "Test API Connection" to:
- Verify the access token is working
- Retrieve Instagram user information
- See token expiration details

### Disconnecting an Account

On the success page, click "Disconnect Account" to remove the stored token.

## API Endpoints

### Authentication Routes

- **GET /auth/instagram**
  - Initiates OAuth flow
  - Redirects to Instagram authorization page

- **GET /auth/instagram/callback**
  - Handles OAuth callback from Instagram
  - Exchanges code for access token
  - Redirects to success or error page

### API Routes

- **GET /api/me?userId={userId}**
  - Retrieves Instagram user information
  - Returns user data and token metadata

- **GET /api/health**
  - Health check endpoint
  - Returns server status

- **DELETE /api/logout?userId={userId}**
  - Removes stored token for a user
  - Returns success confirmation

- **GET /api/tokens** (Development only)
  - Lists all stored tokens
  - Only available when `NODE_ENV=development`

## Security Features

### CSRF Protection
- Generates UUID v4 state parameters
- Validates state on callback (one-time use)
- Automatically expires states after 10 minutes

### Secret Management
- All secrets stored in `.env` (gitignored)
- Token exchange happens server-side only
- Client never sees app secret

### Error Handling
- Never exposes internal errors to client
- Detailed logging server-side
- User-friendly error messages

## Token Management

### Short-Lived Tokens
- Valid for 1 hour
- Automatically exchanged for long-lived tokens

### Long-Lived Tokens
- Valid for 60 days
- Stored in-memory (MVP)
- Can be refreshed before expiration

### Storage (MVP)
- In-memory Map (tokens lost on restart)
- For production: migrate to PostgreSQL/MongoDB
- Consider encrypting tokens at rest

## Development

### Run in Development Mode
```bash
cd backend
npm run dev
```

Uses nodemon for automatic reloading on file changes.

### Run in Production Mode
```bash
cd backend
npm start
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `INSTAGRAM_APP_ID` | Your Instagram App ID | `123456789012345` |
| `INSTAGRAM_APP_SECRET` | Your Instagram App Secret | `abcdef1234567890` |
| `INSTAGRAM_REDIRECT_URI` | OAuth callback URL | `http://localhost:3000/auth/instagram/callback` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `INSTAGRAM_SCOPES` | Comma-separated scopes | `instagram_business_basic,instagram_business_manage_messages` |

## Available Scopes

- `instagram_business_basic` - Read basic account info
- `instagram_business_manage_messages` - Manage direct messages
- `instagram_business_manage_comments` - Moderate comments
- `instagram_business_content_publish` - Publish content

## Troubleshooting

### "Invalid OAuth Redirect URI"
- Ensure the redirect URI in `.env` exactly matches what's configured in Meta App Dashboard
- Include the protocol (`http://` or `https://`)

### "Invalid Client ID"
- Verify `INSTAGRAM_APP_ID` in `.env` is correct
- Check you're using the Instagram App ID, not Facebook App ID

### "State validation failed"
- State parameters expire after 10 minutes
- Try the OAuth flow again
- Clear browser cookies if issue persists

### "Token exchange failed"
- Verify `INSTAGRAM_APP_SECRET` is correct
- Ensure you have an Instagram Business or Creator account
- Check app has necessary permissions in Meta Dashboard

### Server won't start
- Ensure port 3000 is not already in use
- Check all required environment variables are set
- Run `npm install` to ensure dependencies are installed

## Future Enhancements

- [ ] Migrate to persistent database (PostgreSQL/MongoDB)
- [ ] Implement automatic token refresh
- [ ] Add Instagram API features (media, comments, messages)
- [ ] Upgrade frontend to React/Vue
- [ ] Add rate limiting
- [ ] Implement user authentication
- [ ] Add webhooks support
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline

## License

ISC

## Support

For Instagram API documentation, visit:
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)

## Contributing

This is a demonstration/MVP project. For production use, consider:
1. Adding persistent database storage
2. Implementing proper user authentication
3. Adding comprehensive error logging
4. Setting up monitoring and alerts
5. Implementing rate limiting
6. Adding automated tests
