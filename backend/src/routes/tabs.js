import express from 'express';
import pool from '../db/connection.js';
import { summarizeTab } from '../services/claude.js';

const router = express.Router();

/**
 * POST /api/tabs - Save tabs and generate summaries
 */
router.post('/', async (req, res) => {
  try {
    const { tabs } = req.body;
    const userId = 1; // Default user for now

    if (!tabs || !Array.isArray(tabs)) {
      return res.status(400).json({ error: 'Invalid tabs data' });
    }

    const savedTabs = [];

    // Insert tabs and generate summaries asynchronously
    for (const tab of tabs) {
      // Insert tab first
      const result = await pool.query(
        `INSERT INTO tabs (user_id, url, title, fav_icon_url, content, description, saved_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          userId,
          tab.url,
          tab.title,
          tab.favIconUrl || null,
          tab.content?.text || null,
          tab.content?.description || null,
          tab.savedAt || new Date().toISOString()
        ]
      );

      const tabId = result.rows[0].id;
      savedTabs.push({ id: tabId, ...tab });

      // Generate summary asynchronously (don't wait)
      if (tab.content?.text) {
        summarizeTab({
          title: tab.title,
          url: tab.url,
          content: tab.content.text,
          description: tab.content.description
        }).then(async (summary) => {
          await pool.query(
            'UPDATE tabs SET summary = $1, summary_generated_at = $2 WHERE id = $3',
            [summary, new Date(), tabId]
          );
          console.log(`✓ Generated summary for tab ${tabId}: ${tab.title}`);
        }).catch(error => {
          console.error(`Error generating summary for tab ${tabId}:`, error);
        });
      }
    }

    res.json({
      success: true,
      count: savedTabs.length,
      tabs: savedTabs
    });
  } catch (error) {
    console.error('Error saving tabs:', error);
    res.status(500).json({ error: 'Failed to save tabs' });
  }
});

/**
 * GET /api/tabs - Get all saved tabs
 */
router.get('/', async (req, res) => {
  try {
    const userId = 1;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT id, url, title, fav_icon_url, summary, saved_at, summary_generated_at
       FROM tabs
       WHERE user_id = $1
       ORDER BY saved_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM tabs WHERE user_id = $1',
      [userId]
    );

    res.json({
      tabs: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching tabs:', error);
    res.status(500).json({ error: 'Failed to fetch tabs' });
  }
});

/**
 * GET /api/tabs/:id - Get a specific tab
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = 1;

    const result = await pool.query(
      `SELECT * FROM tabs WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tab not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching tab:', error);
    res.status(500).json({ error: 'Failed to fetch tab' });
  }
});

/**
 * DELETE /api/tabs/:id - Delete a tab
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = 1;

    const result = await pool.query(
      'DELETE FROM tabs WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tab not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tab:', error);
    res.status(500).json({ error: 'Failed to delete tab' });
  }
});

export default router;
