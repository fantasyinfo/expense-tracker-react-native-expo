# Setting Up Your Own Expo Account

## Step 1: Create Expo Account (If you don't have one)

1. Go to **https://expo.dev**
2. Click **"Sign Up"** or **"Get Started"**
3. Sign up with:
   - Your email (or GitHub/Google account)
   - Choose a username (e.g., `gauravsharma` or `gauravsharmadev`)
   - Set a password

## Step 2: Login to Your Account

After creating your account, login in terminal:

```bash
eas login
```

You'll be prompted to:
- Enter your email/username
- Enter your password
- Or use browser authentication

## Step 3: Verify You're Logged In

Check which account you're using:

```bash
eas whoami
```

Should show YOUR username, not "thenewjeweller"

## Step 4: Build APK with Your Account

Once logged in with your account:

```bash
npm run build:apk
```

## Important Notes

- **Free Account**: Expo offers free tier with limited builds
- **Account Name**: Choose a username that represents you (e.g., `gauravsharma`, `gauravsharmadev`)
- **Project**: The project will be created under YOUR account when you build

## Alternative: Use GitHub/Google Login

You can also login using:
- GitHub account
- Google account

Just use: `eas login` and choose the option when prompted.

