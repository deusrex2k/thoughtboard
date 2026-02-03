import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all boards for a user
router.get('/', auth, (req: AuthRequest, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM boards WHERE user_id = ? ORDER BY created_at DESC');
        const boards = stmt.all(req.userId);
        res.json(boards);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a board
router.post('/', auth, (req: AuthRequest, res) => {
    const { title, description, cover_image, background_image } = req.body;

    try {
        const newBoard = {
            id: uuidv4(),
            user_id: req.userId,
            title: title || 'Untitled Board',
            description: description || '',
            cover_image: cover_image || null,
            background_image: background_image || null,
            created_at: Date.now(),
            updated_at: Date.now()
        };

        const stmt = db.prepare(`
            INSERT INTO boards (id, user_id, title, description, cover_image, background_image, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            newBoard.id,
            newBoard.user_id,
            newBoard.title,
            newBoard.description,
            newBoard.cover_image,
            newBoard.background_image,
            newBoard.created_at,
            newBoard.updated_at
        );

        res.status(201).json(newBoard);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update a board
router.patch('/:id', auth, (req: AuthRequest, res) => {
    const { id } = req.params;
    const { title, description, cover_image, background_image } = req.body;

    try {
        const checkStmt = db.prepare('SELECT user_id FROM boards WHERE id = ?');
        const board = checkStmt.get(id) as any;

        if (!board) return res.status(404).json({ error: 'Board not found' });
        if (board.user_id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

        const now = Date.now();
        const stmt = db.prepare(`
            UPDATE boards 
            SET title = COALESCE(?, title),
                description = COALESCE(?, description),
                cover_image = COALESCE(?, cover_image),
                background_image = COALESCE(?, background_image),
                updated_at = ?
            WHERE id = ?
        `);
        stmt.run(title, description, cover_image, background_image, now, id);

        res.json({ id, title, description, cover_image, background_image, updated_at: now });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a board
router.delete('/:id', auth, (req: AuthRequest, res) => {
    const { id } = req.params;

    try {
        const checkStmt = db.prepare('SELECT user_id FROM boards WHERE id = ?');
        const board = checkStmt.get(id) as any;

        if (!board) return res.status(404).json({ error: 'Board not found' });
        if (board.user_id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

        const stmt = db.prepare('DELETE FROM boards WHERE id = ?');
        stmt.run(id);

        res.json({ message: 'Board deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
