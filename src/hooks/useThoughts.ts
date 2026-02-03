import { useState, useEffect, useCallback } from 'react';
import type { Thought, ThoughtType, Connection } from '../types';
import { api } from '../services/api';

export const useThoughts = (boardId: string | undefined) => {
    const [thoughts, setThoughts] = useState<Thought[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!boardId) return;
        setLoading(true);
        try {
            const [thoughtsData, connectionsData] = await Promise.all([
                api.thoughts.list(boardId),
                api.connections.list(boardId)
            ]);
            setThoughts(thoughtsData);
            setConnections(connectionsData);
        } catch (err) {
            console.error('Failed to fetch thoughts or connections:', err);
        } finally {
            setLoading(false);
        }
    }, [boardId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addThought = async (type: ThoughtType, x: number, y: number, content: string = '', parentId?: string) => {
        if (!boardId) return;

        let finalContent = content;
        if (type === 'image' && !content) {
            const randomId = Math.floor(Math.random() * 3) + 1;
            finalContent = `/demo/${randomId}.png`;
        }

        try {
            const newThought = await api.thoughts.create({
                board_id: boardId,
                type,
                content: finalContent,
                x,
                y,
                color: type === 'text' ? '#fde047' : undefined,
                metadata: {}
            });

            setThoughts(prev => [...prev, newThought]);

            if (parentId) {
                await addConnection(parentId, newThought.id);
            }

            return newThought;
        } catch (err) {
            console.error('Failed to add thought:', err);
        }
    };

    const updateThought = async (id: string, updates: Partial<Thought>) => {
        // Optimistic update
        setThoughts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

        try {
            await api.thoughts.update(id, updates);
        } catch (err) {
            console.error('Failed to update thought:', err);
            // Revert on error if needed, but for now just log
        }
    };

    const deleteThought = async (id: string) => {
        // Optimistic update
        setThoughts(prev => prev.filter(t => t.id !== id));
        setConnections(prev => prev.filter(c => c.fromId !== id && c.toId !== id));

        try {
            await api.thoughts.delete(id);
        } catch (err) {
            console.error('Failed to delete thought:', err);
            fetchData(); // Rollback
        }
    };

    const addConnection = async (fromId: string, toId: string) => {
        if (!boardId) return;

        // Prevent duplicate connections
        if (connections.some(c => (c.fromId === fromId && c.toId === toId) || (c.fromId === toId && c.toId === fromId))) {
            return;
        }

        try {
            const newConnection = await api.connections.create({
                board_id: boardId,
                from_id: fromId,
                to_id: toId
            });
            setConnections(prev => [...prev, newConnection]);
        } catch (err) {
            console.error('Failed to add connection:', err);
        }
    };

    const deleteConnection = async (id: string) => {
        // Optimistic update
        setConnections(prev => prev.filter(c => c.id !== id));

        try {
            await api.connections.delete(id);
        } catch (err) {
            console.error('Failed to delete connection:', err);
            fetchData(); // Rollback
        }
    };

    return {
        thoughts,
        connections,
        loading,
        addThought,
        updateThought,
        deleteThought,
        addConnection,
        deleteConnection,
        refresh: fetchData
    };
};
