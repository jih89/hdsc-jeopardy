# Database Implementation Game Plan

## Overview
Implement a database-backed question system for the Jeopardy Quiz application, allowing organizers to manage questions through a password-protected admin interface.

## ⚠️ Important: Vercel & SQLite Compatibility

**Critical Issue**: Vercel is a serverless platform that doesn't support traditional SQLite because:
- SQLite requires a persistent file system
- Vercel functions are stateless and ephemeral
- SQLite files cannot be written to in serverless environments

### Recommended Solutions:

**Option 1: Turso (libSQL) - SQLite-compatible cloud database** ⭐ RECOMMENDED
- SQLite-compatible API
- Serverless-friendly
- Free tier available
- Easy migration path

**Option 2: Supabase (PostgreSQL)**
- Full-featured PostgreSQL
- Free tier available
- Built-in auth and APIs

**Option 3: PlanetScale (MySQL)**
- Serverless MySQL
- Free tier available
- Branching workflow

**Option 4: Vercel Postgres**
- Native Vercel integration
- Serverless PostgreSQL

---

## Implementation Plan

### Phase 1: Project Structure & Setup

#### 1.1 Update Project Structure
```
/Jeopardy-Quiz---HDSC-main
├── /api                    # Vercel serverless functions
│   ├── /questions          # GET/POST questions endpoints
│   ├── /auth               # Authentication endpoint
│   └── /admin              # Admin endpoints
├── /admin                  # Admin edit page (frontend)
│   ├── index.html
│   ├── admin.js
│   └── admin.css
├── /lib                    # Shared utilities
│   └── db.js              # Database connection/helpers
├── /public                 # Static files (current files)
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── ...
└── vercel.json            # Vercel configuration
```

#### 1.2 Install Dependencies
```bash
npm install better-sqlite3  # For local dev (if using SQLite)
# OR
npm install @libsql/client # For Turso/libSQL
# OR
npm install @supabase/supabase-js # For Supabase
```

#### 1.3 Environment Variables
Create `.env.local`:
```
DATABASE_URL=your_database_connection_string
ADMIN_PASSCODE=your_secure_passcode_hash
JWT_SECRET=your_jwt_secret_key
```

---

### Phase 2: Database Schema Design

#### 2.1 Database Tables

**Categories Table**
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Questions Table**
```sql
CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    point_value INTEGER NOT NULL,  -- 10, 20, 30, etc.
    question_index INTEGER NOT NULL, -- 0, 1, 2 (which question in the set)
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE(category_id, point_value, question_index)
);
```

**Admin Sessions Table** (for passcode management)
```sql
CREATE TABLE admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2 Initial Data Setup
- Insert 3 categories: "Matematika Dasar", "Biologi", "Kedokteran Gigi Dasar"
- Seed with dummy questions matching current structure

---

### Phase 3: Backend API (Vercel Serverless Functions)

#### 3.1 `/api/questions` - GET endpoint
**Purpose**: Fetch all questions for the game board
**Response Format**:
```json
{
  "0": {
    "0": [
      {"q": "Question 1", "a": "Answer 1"},
      {"q": "Question 2", "a": "Answer 2"},
      {"q": "Question 3", "a": "Answer 3"}
    ],
    "1": [...],
    ...
  },
  "1": {...},
  "2": {...}
}
```
**Fallback**: If DB fails, return empty object (script.js will use dummy data)

#### 3.2 `/api/questions` - POST endpoint
**Purpose**: Update/create questions (admin only)
**Auth**: Require valid session token
**Request Body**:
```json
{
  "categoryId": 0,
  "pointValue": 10,
  "questionIndex": 0,
  "questionText": "New question",
  "answerText": "New answer"
}
```

#### 3.3 `/api/auth/login` - POST endpoint
**Purpose**: Authenticate admin with passcode
**Request Body**:
```json
{
  "passcode": "user_entered_passcode"
}
```
**Response**:
```json
{
  "success": true,
  "sessionToken": "jwt_token_here",
  "expiresAt": "2024-01-01T00:00:00Z"
}
```

#### 3.4 `/api/auth/verify` - GET endpoint
**Purpose**: Verify if session token is valid
**Headers**: `Authorization: Bearer <token>`

---

### Phase 4: Frontend - Admin Edit Page

#### 4.1 Admin Page Structure (`/admin/index.html`)
- Password-protected login screen
- Grid layout matching game board (3 categories × 10 point values)
- Each cell shows current question count or "Edit" button
- Clicking opens modal to edit all 3 questions for that cell
- Save button to update database

#### 4.2 Admin Features
- **Login Screen**: Simple passcode input
- **Question Editor**: 
  - Category selector
  - Point value selector
  - 3 question/answer pairs per cell
  - Preview mode
  - Save/Cancel buttons
- **Session Management**: Store JWT in localStorage, auto-logout on expiry

#### 4.3 Admin Styling (`admin.css`)
- Match game board visual style
- Clear admin indicators
- Form validation feedback

---

### Phase 5: Frontend - Main Game Integration

#### 5.1 Update `script.js`
**Changes needed**:

1. **Add data fetching function**:
```javascript
async function fetchQuestionsFromDB() {
    try {
        const response = await fetch('/api/questions');
        if (response.ok) {
            const dbQuestions = await response.json();
            return dbQuestions;
        }
    } catch (error) {
        console.error('Failed to fetch questions from DB:', error);
    }
    return null; // Fallback to dummy data
}
```

2. **Modify questionData initialization**:
```javascript
let questionData = {
    // Keep dummy data as fallback
    0: { /* ... existing dummy data ... */ },
    1: { /* ... existing dummy data ... */ },
    2: { /* ... existing dummy data ... */ }
};

// On page load, try to fetch from DB
(async function init() {
    const dbQuestions = await fetchQuestionsFromDB();
    if (dbQuestions && Object.keys(dbQuestions).length > 0) {
        // Merge DB questions with dummy data (DB takes priority)
        questionData = { ...questionData, ...dbQuestions };
    }
    initBoard(); // Initialize board after data is ready
})();
```

3. **Update openQuestion function**:
- Already has fallback logic, will work with merged data

---

### Phase 6: Security Implementation

#### 6.1 Passcode Protection
- Hash passcode using bcrypt or similar
- Store hash in environment variable
- Compare on login endpoint

#### 6.2 Session Management
- Use JWT tokens for admin sessions
- Set expiration (e.g., 24 hours)
- Validate on every admin API call
- Store sessions in database for revocation

#### 6.3 API Security
- CORS configuration for allowed origins
- Rate limiting on auth endpoints
- Input validation and sanitization
- SQL injection prevention (use parameterized queries)

---

### Phase 7: Deployment Configuration

#### 7.1 Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/admin/(.*)",
      "dest": "/admin/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

#### 7.2 Environment Variables in Vercel
- Set `DATABASE_URL` in Vercel dashboard
- Set `ADMIN_PASSCODE_HASH` in Vercel dashboard
- Set `JWT_SECRET` in Vercel dashboard

---

### Phase 8: Testing & Validation

#### 8.1 Test Scenarios
1. **Database Connection**: Verify DB connection works in Vercel
2. **Question Fetching**: Test GET /api/questions returns correct format
3. **Question Updating**: Test POST /api/questions with valid auth
4. **Fallback Logic**: Test behavior when DB is unavailable
5. **Admin Login**: Test passcode authentication
6. **Session Expiry**: Test token expiration handling
7. **Data Merging**: Verify DB questions override dummy data correctly

#### 8.2 Edge Cases
- Empty database (should use dummy data)
- Partial data (some categories missing)
- Network failures
- Invalid session tokens
- Malformed request data

---

## Implementation Order

1. ✅ **Phase 1**: Project structure & dependencies
2. ✅ **Phase 2**: Database schema & setup
3. ✅ **Phase 3**: Backend API endpoints
4. ✅ **Phase 4**: Admin edit page
5. ✅ **Phase 5**: Main game integration
6. ✅ **Phase 6**: Security implementation
7. ✅ **Phase 7**: Vercel deployment config
8. ✅ **Phase 8**: Testing & validation

---

## Technology Stack Recommendations

### Database Options (Choose One):

**Option A: Turso (libSQL)** ⭐
- Package: `@libsql/client`
- Pros: SQLite-compatible, serverless, easy migration
- Cons: Requires Turso account

**Option B: Supabase**
- Package: `@supabase/supabase-js`
- Pros: Full PostgreSQL, built-in features
- Cons: Different SQL syntax from SQLite

**Option C: Vercel Postgres**
- Package: `@vercel/postgres`
- Pros: Native Vercel integration
- Cons: Vendor lock-in

---

## Next Steps

1. **Decide on database solution** (recommend Turso for SQLite compatibility)
2. **Set up database** and get connection string
3. **Create database schema** and seed initial data
4. **Implement API endpoints** in `/api` folder
5. **Build admin page** for question management
6. **Update script.js** to fetch from API
7. **Test locally** before deploying
8. **Deploy to Vercel** and configure environment variables

---

## Notes

- Keep dummy questions in `script.js` as fallback for reliability
- Admin page should be accessible at `/admin` route
- Consider adding question preview before saving
- May want to add "Reset Board" functionality for admin
- Consider adding question validation (max length, required fields)

