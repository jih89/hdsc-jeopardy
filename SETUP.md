# Setup Instructions

## Prerequisites

1. Node.js installed
2. Turso database created (you already have this!)
3. Vercel account (for deployment)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get Your Turso Auth Token

1. Go to your Turso dashboard
2. Navigate to your database settings
3. Copy the **Auth Token**

## Step 3: Create Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Your Turso database URL
DATABASE_URL=libsql://hdsc-jih89.aws-ap-northeast-1.turso.io

# Your Turso Auth Token (get from Turso dashboard)
TURSO_AUTH_TOKEN=your-auth-token-here

# Generate a passcode hash (see Step 4)
ADMIN_PASSCODE_HASH=your-sha256-hash-here
```

## Step 4: Generate Passcode Hash

Run the hash script to generate a secure hash for your admin passcode:

```bash
npm run hash-passcode
```

Enter your desired passcode when prompted. Copy the generated hash and add it to `.env.local` as `ADMIN_PASSCODE_HASH`.

## Step 5: Initialize Database

Run the setup script to create tables and seed initial categories:

```bash
npm run setup-db
```

This will:
- Create the `categories`, `questions`, and `admin_sessions` tables
- Insert the 3 default categories

## Step 6: Test Locally (Optional)

You can test the setup locally using Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

Then visit:
- Main game: http://localhost:3000
- Admin panel: http://localhost:3000/admin

## Step 7: Deploy to Vercel

1. Push your code to GitHub (or your preferred Git provider)

2. Connect your repository to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository

3. Add Environment Variables in Vercel:
   - Go to Project Settings → Environment Variables
   - Add the same variables from `.env.local`:
     - `DATABASE_URL`
     - `TURSO_AUTH_TOKEN`
     - `ADMIN_PASSCODE_HASH`

4. Deploy!

## Step 8: Access Admin Panel

After deployment, visit:
- `https://your-app.vercel.app/admin`
- Enter your passcode to start editing questions

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Verify `TURSO_AUTH_TOKEN` is set correctly
- Check Turso dashboard to ensure database is active

### Admin Login Not Working
- Verify `ADMIN_PASSCODE_HASH` matches the hash of your passcode
- Regenerate hash if needed: `npm run hash-passcode`

### Questions Not Loading
- Check browser console for errors
- Verify API endpoints are accessible
- Check Vercel function logs for errors

## File Structure

```
/Jeopardy-Quiz---HDSC-main
├── /api              # Vercel serverless functions
│   ├── /auth         # Authentication endpoints
│   └── questions.js  # Questions API
├── /admin            # Admin edit page
│   ├── index.html
│   ├── admin.js
│   └── admin.css
├── /lib              # Database utilities
│   └── db.js
├── /scripts          # Setup scripts
│   ├── setup-db.js
│   └── hash-passcode.js
├── index.html        # Main game page
├── script.js         # Game logic (updated to fetch from API)
└── vercel.json       # Vercel configuration
```

