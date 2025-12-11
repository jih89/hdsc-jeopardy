import { getDbClient } from '../lib/db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getDbClient();

  if (req.method === 'GET') {
    try {
      // Fetch all questions grouped by category and point value
      const result = await db.execute(`
        SELECT 
          c.id as category_id,
          q.point_value,
          q.question_index,
          q.question_text,
          q.answer_text
        FROM questions q
        JOIN categories c ON q.category_id = c.id
        ORDER BY c.display_order, q.point_value, q.question_index
      `);

      // Transform into the format expected by script.js
      // script.js uses point indices (0-9) not point values (10, 20, 30, etc.)
      const points = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const questionData = {};
      
      result.rows.forEach(row => {
        const dbCatId = row.category_id; // Database ID (1, 2, 3)
        const pointValue = row.point_value;
        const qIndex = row.question_index;
        
        // Convert database category ID to array index (1->0, 2->1, 3->2)
        const catIndex = dbCatId - 1;
        if (catIndex < 0 || catIndex > 2) return; // Skip invalid category IDs
        
        // Convert point value to index (10 -> 0, 20 -> 1, etc.)
        const pointIndex = points.indexOf(pointValue);
        if (pointIndex === -1) return; // Skip invalid point values
        
        if (!questionData[catIndex]) {
          questionData[catIndex] = {};
        }
        
        if (!questionData[catIndex][pointIndex]) {
          questionData[catIndex][pointIndex] = [];
        }
        
        // Ensure array is large enough
        while (questionData[catIndex][pointIndex].length <= qIndex) {
          questionData[catIndex][pointIndex].push({ q: '', a: '' });
        }
        
        questionData[catIndex][pointIndex][qIndex] = {
          q: row.question_text,
          a: row.answer_text
        };
      });

      return res.status(200).json(questionData);
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Return empty object on error - script.js will use dummy data
      return res.status(200).json({});
    }
  }

  if (req.method === 'POST') {
    try {
      // Verify authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      
      // Verify session token
      const sessionResult = await db.execute(
        'SELECT * FROM admin_sessions WHERE session_token = ? AND expires_at > datetime("now")',
        [token]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }

      // Extract question data from request
      const { categoryId, pointValue, questionIndex, questionText, answerText } = req.body;

      if (categoryId === undefined || pointValue === undefined || questionIndex === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Upsert question (insert or update)
      await db.execute(`
        INSERT INTO questions (category_id, point_value, question_index, question_text, answer_text, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime("now"))
        ON CONFLICT(category_id, point_value, question_index) 
        DO UPDATE SET 
          question_text = excluded.question_text,
          answer_text = excluded.answer_text,
          updated_at = datetime("now")
      `, [categoryId, pointValue, questionIndex, questionText || '', answerText || '']);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving question:', error);
      return res.status(500).json({ error: 'Failed to save question' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

