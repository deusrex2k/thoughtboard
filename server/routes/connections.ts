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

// Get all connections for a board
router.get('/:boardId', auth, (req: AuthRequest, res) => {
    const { boardId } = req.params;

    if (!checkBoardOwnership(boardId as string, req.userId!)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const stmt = db.prepare('SELECT * FROM connections WHERE board_id = ?');
        const connections = stmt.all(boardId);
        res.json(connections);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a connection
router.post('/', auth, (req: AuthRequest, res) => {
    const { board_id, from_id, to_id } = req.body;

    if (!checkBoardOwnership(board_id, req.userId!)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const newConnection = {
            id: uuidv4(),
            board_id,
            from_id,
            to_id
        };

        const stmt = db.prepare('INSERT INTO connections (id, board_id, from_id, to_id) VALUES (?, ?, ?, ?)');
        stmt.run(newConnection.id, newConnection.board_id, newConnection.from_id, newConnection.to_id);

        res.status(201).json(newConnection);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a connection
router.delete('/:id', auth, (req: AuthRequest, res) => {
    const { id } = req.params;

    try {
        const checkStmt = db.prepare('SELECT board_id FROM connections WHERE id = ?');
        const connection = checkStmt.get(id) as any;
        if (!connection) return res.status(404).json({ error: 'Connection not found' });

        if (!checkBoardOwnership(connection.board_id, req.userId!)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const stmt = db.prepare('DELETE FROM connections WHERE id = ?');
        stmt.run(id);

        res.json({ message: 'Connection deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
