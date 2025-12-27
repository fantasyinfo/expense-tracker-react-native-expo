# Google Drive API Setup Guide

This guide will help you set up Google Drive API integration for automatic backups in your Kharcha expense tracker app.

## Prerequisites

- Google Cloud Platform account
- Expo project configured
- Basic understanding of OAuth 2.0

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project"
3. Enter project name: "Kharcha Expense Tracker"
4. Click "Create"

## Step 2: Enable Google Drive API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on it and press "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: External (for testing) or Internal (for organization)
   - App name: "Kharcha"
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Add `https://www.googleapis.com/auth/drive.file`
   - Click "Save and Continue"
   - Test users: Add your email (for testing)
   - Click "Save and Continue"
4. Application type: Select "Web application"
5. Name: "Kharcha Web Client"
6. Authorized redirect URIs: 
   - For Expo: `https://auth.expo.io/@your-username/your-app-slug`
   - Or use: `http://localhost:19006` for development
7. Click "Create"
8. **Save the Client ID and Client Secret** (you'll need these)

## Step 4: Install Required Packages

```bash
npm install expo-auth-session expo-crypto
```

## Step 5: Configure app.json/app.config.js

Add to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "scheme": "kharcha",
    "android": {
      "package": "com.yourcompany.kharcha"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.kharcha"
    }
  }
}
```

## Step 6: Environment Variables

Create a `.env` file (add to .gitignore):

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Step 7: Implementation Files

The following files need to be created:

1. `src/utils/googleDriveUtils.js` - Google Drive API functions
2. `src/components/GoogleDriveAuthModal.js` - OAuth authentication modal
3. Update `src/utils/backupUtils.js` - Add Google Drive backup functions
4. Update `src/components/BackupSettingsModal.js` - Enable Google Drive option

## Step 8: OAuth Scopes Required

- `https://www.googleapis.com/auth/drive.file` - Access to files created by the app

## Step 9: Testing

1. Run your app in development mode
2. Go to Settings > Backup & Restore > Backup Settings
3. Select "Google Drive"
4. Authenticate with Google
5. Test backup and restore functionality

## Important Notes

- **Free Tier**: Google Drive API is free, but uses your Google Drive storage (15GB free)
- **Quota Limits**: 
  - 1,000 requests per 100 seconds per user
  - 10,000 requests per 100 seconds
- **Security**: Never commit Client Secret to version control
- **Production**: For production, complete OAuth consent screen verification

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Check redirect URI matches exactly in Google Cloud Console
- Ensure OAuth consent screen is configured

### "redirect_uri_mismatch"
- Verify redirect URI in Google Cloud Console matches your app scheme

### "insufficient permissions"
- Check that Google Drive API is enabled
- Verify OAuth scopes are correct

## Next Steps

Once setup is complete, you can:
1. Implement automatic scheduled backups
2. Add backup versioning
3. Implement incremental backups
4. Add backup encryption (optional)

## Support

For issues, check:
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Expo AuthSession Documentation](https://docs.expo.dev/guides/authentication/#google)

