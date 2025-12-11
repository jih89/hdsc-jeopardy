# Quick Start Guide

## What's Been Set Up

✅ Database connection to Turso  
✅ API endpoints for questions and authentication  
✅ Admin edit page with passcode protection  
✅ Main game updated to fetch from database  
✅ Fallback to dummy data if database fails  

## Next Steps

### 1. Get Your Turso Auth Token

1. Go to [Turso Dashboard](https://turso.tech)
2. Select your database: `hdsc-jih89`
3. Go to Settings/Overview
4. Copy the **Auth Token**

### 2. Set Up Environment Variables

Create `.env.local` file:

```bash
DATABASE_URL=libsql://hdsc-jih89.aws-ap-northeast-1.turso.io
TURSO_AUTH_TOKEN=paste-your-token-here
ADMIN_PASSCODE_HASH=generate-this-next
```

### 3. Generate Admin Passcode Hash

```bash
npm install
npm run hash-passcode
```

Enter your desired passcode, then copy the hash to `.env.local`

### 4. Initialize Database

```bash
npm run setup-db
```

This creates the tables and seeds the 3 categories.

### 5. Test Locally (Optional)

```bash
npm install -g vercel
vercel dev
```

Visit:
- Game: http://localhost:3000
- Admin: http://localhost:3000/admin

### 6. Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## File Structure

```
/api
  /auth
    login.js      # Admin login endpoint
    verify.js     # Session verification
  questions.js    # GET/POST questions

/admin
  index.html     # Admin edit page
  admin.js       # Admin page logic
  admin.css      # Admin styles

/lib
  db.js          # Database connection

/scripts
  setup-db.js    # Initialize database
  hash-passcode.js # Generate passcode hash
```

## Important Notes

- **Database URL**: Already set to your Turso database
- **Point Values**: Database stores actual values (10, 20, 30...), API maps to indices (0-9) for script.js
- **Fallback**: If database fails, game uses dummy questions from script.js
- **Sessions**: Admin sessions expire after 24 hours

## Troubleshooting

**Can't connect to database?**
- Check `TURSO_AUTH_TOKEN` is correct
- Verify database is active in Turso dashboard

**Admin login not working?**
- Regenerate passcode hash: `npm run hash-passcode`
- Make sure hash in `.env.local` matches

**Questions not showing?**
- Check browser console for errors
- Verify API endpoint is accessible
- Database might be empty (add questions via admin panel)

