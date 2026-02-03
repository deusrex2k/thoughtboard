import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Helper to check board ownership
const checkBoardOwnership = (boardId: string, userId: string): boolean => {
    const stmt = db.prepare('SELECT user_id FROM boards WHERE id = ?');
    const board = stmt.get(boardId) as any;
    return board && board.user_id === userId;
};

// Get all thoughts for a board
router.get('/:boardId', auth, (req: AuthRequest, res) => {
    const { boardId } = req.params;

    if (!checkBoardOwnership(boardId as string, req.userId!)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const stmt = db.prepare('SELECT * FROM thoughts WHERE board_id = ?');
        const thoughts = stmt.all(boardId);
        res.json(thoughts.map((t: any) => ({
            ...t,
            metadata: JSON.parse(t.metadata || '{}')
        })));
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a thought
router.post('/', auth, (req: AuthRequest, res) => {
    const { board_id, type, content, x, y, color, width, height, metadata } = req.body;

    if (!checkBoardOwnership(board_id, req.userId!)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const newThought = {
            id: uuidv4(),
            board_id,
            type,
            content,
            x,
            y,
            color,
            width,
            height,
            metadata: JSON.stringify(metadata || {}),
            created_at: Date.now()
        };

        const stmt = db.prepare(`
            INSERT INTO thoughts (id, board_id, type, content, x, y, color, width, height, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            newThought.id,
            newThought.board_id,
            newThought.type,
            newThought.content,
            newThought.x,
            newThought.y,
            newThought.color,
            newThought.width,
            newThought.height,
            newThought.metadata,
            newThought.created_at
        );

        res.status(201).json({ ...newThought, metadata: JSON.parse(newThought.metadata) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update a thought
router.patch('/:id', auth, (req: AuthRequest, res) => {
    const { id } = req.params;
    const { content, x, y, color, width, height, metadata } = req.body;

    try {
        const checkStmt = db.prepare('SELECT board_id FROM thoughts WHERE id = ?');
        const thought = checkStmt.get(id) as any;
        if (!thought) return res.status(404).json({ error: 'Thought not found' });

        if (!checkBoardOwnership(thought.board_id, req.userId!)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const stmt = db.prepare(`
            UPDATE thoughts 
            SET content = COALESCE(?, content),
                x = COALESCE(?, x),
                y = COALESCE(?, y),
                color = COALESCE(?, color),
                width = COALESCE(?, width),
                height = COALESCE(?, height),
                metadata = COALESCE(?, metadata)
            WHERE id = ?
        `);
        stmt.run(content, x, y, color, width, height, metadata ? JSON.stringify(metadata) : null, id);

        res.json({ message: 'Thought updated' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a thought
router.delete('/:id', auth, (req: AuthRequest, res) => {
    const { id } = req.params;

    try {
        const checkStmt = db.prepare('SELECT board_id FROM thoughts WHERE id = ?');
        const thought = checkStmt.get(id) as any;
        if (!thought) return res.status(404).json({ error: 'Thought not found' });

        if (!checkBoardOwnership(thought.board_id, req.userId!)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const stmt = db.prepare('DELETE FROM thoughts WHERE id = ?');
        stmt.run(id);

        res.json({ message: 'Thought deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
