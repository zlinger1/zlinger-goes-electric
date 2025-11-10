import express from 'express';
import pool from '../db/connection.js';
import { generateDigest } from '../services/claude.js';

const router = express.Router();

/**
 * POST /api/digests/generate - Generate a new digest
 */
router.post('/generate', async (req, res) => {
  try {
    const userId = 1;
    const { startDate, endDate } = req.body;

    // Default to last 7 days if not specified
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch tabs in the date range
    const tabsResult = await pool.query(
      `SELECT id, url, title, summary, saved_at
       FROM tabs
       WHERE user_id = $1 AND saved_at >= $2 AND saved_at <= $3
       ORDER BY saved_at ASC`,
      [userId, start, end]
    );

    const tabs = tabsResult.rows;

    if (tabs.length === 0) {
      return res.status(400).json({ error: 'No tabs found in the specified date range' });
    }

    // Generate digest
    console.log(`Generating digest for ${tabs.length} tabs...`);
    const digestContent = await generateDigest(tabs, start, end);

    // Save digest
    const result = await pool.query(
      `INSERT INTO digests (user_id, start_date, end_date, content, tab_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, start, end, digestContent, tabs.length]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error generating digest:', error);
    res.status(500).json({ error: 'Failed to generate digest' });
  }
});

/**
 * GET /api/digests - Get all digests
 */
router.get('/', async (req, res) => {
  try {
    const userId = 1;

    const result = await pool.query(
      `SELECT id, start_date, end_date, tab_count, created_at
       FROM digests
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching digests:', error);
    res.status(500).json({ error: 'Failed to fetch digests' });
  }
});

/**
 * GET /api/digests/:id - Get a specific digest
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = 1;

    const result = await pool.query(
      `SELECT * FROM digests WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Digest not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching digest:', error);
    res.status(500).json({ error: 'Failed to fetch digest' });
  }
});

/**
 * DELETE /api/digests/:id - Delete a digest
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = 1;

    const result = await pool.query(
      'DELETE FROM digests WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Digest not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting digest:', error);
    res.status(500).json({ error: 'Failed to delete digest' });
  }
});

export default router;
