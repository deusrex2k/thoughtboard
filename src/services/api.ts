const API_URL = 'http://localhost:3001/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('thought_click_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Transformation helpers
const transformBoard = (b: any) => ({
    ...b,
    coverImage: b.cover_image || b.coverImage,
    backgroundImage: b.background_image || b.backgroundImage,
    createdAt: b.created_at || b.createdAt,
    updatedAt: b.updated_at || b.updatedAt
});

const transformThought = (t: any) => ({
    ...t,
    boardId: t.board_id || t.boardId,
    createdAt: t.created_at || t.createdAt,
    metadata: typeof t.metadata === 'string' ? JSON.parse(t.metadata) : t.metadata
});

const transformConnection = (c: any) => ({
    ...c,
    boardId: c.board_id || c.boardId,
    fromId: c.from_id || c.fromId,
    toId: c.to_id || c.toId
});

export const api = {
    async request(endpoint: string, options: RequestInit = {}) {
        const headers: any = {
            'Content-Type': 'application/json',
            ...(getAuthHeader() as any),
            ...(options.headers as any),
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Something went wrong');
        }

        return response.json();
    },

    auth: {
        signup: (data: any) => api.request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
        login: (data: any) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    },

    boards: {
        list: async () => {
            const data = await api.request('/boards');
            return data.map(transformBoard);
        },
        create: async (data: any) => {
            const res = await api.request('/boards', { method: 'POST', body: JSON.stringify(data) });
            return transformBoard(res);
        },
        update: (id: string, data: any) => api.request(`/boards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: string) => api.request(`/boards/${id}`, { method: 'DELETE' }),
    },

    thoughts: {
        list: async (boardId: string) => {
            const data = await api.request(`/thoughts/${boardId}`);
            return data.map(transformThought);
        },
        create: async (data: any) => {
            const res = await api.request('/thoughts', { method: 'POST', body: JSON.stringify(data) });
            return transformThought(res);
        },
        update: (id: string, data: any) => api.request(`/thoughts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: string) => api.request(`/thoughts/${id}`, { method: 'DELETE' }),
    },

    connections: {
        list: async (boardId: string) => {
            const data = await api.request(`/connections/${boardId}`);
            return data.map(transformConnection);
        },
        create: async (data: any) => {
            const res = await api.request('/connections', { method: 'POST', body: JSON.stringify(data) });
            return transformConnection(res);
        },
        delete: (id: string) => api.request(`/connections/${id}`, { method: 'DELETE' }),
    }
};
