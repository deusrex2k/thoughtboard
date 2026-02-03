export type ThoughtType = 'text' | 'link' | 'image' | 'checklist' | 'sketch';

export interface Connection {
    id: string;
    fromId: string;
    toId: string;
}

export interface Thought {
    id: string;
    boardId: string;
    type: ThoughtType;
    content: string; // Text content, URL, or image path
    x: number;
    y: number;
    color?: string;
    width?: number;
    height?: number;
    metadata?: {
        title?: string;
        description?: string;
        thumbnail?: string;
    };
    createdAt: number;
}

export interface Board {
    id: string;
    title: string;
    description: string;
    coverImage?: string;
    cover_image?: string; // Backend compatibility
    backgroundImage?: string;
    background_image?: string; // Backend compatibility
    createdAt: number;
    created_at?: number; // Backend compatibility
    updatedAt: number;
    updated_at?: number; // Backend compatibility
}

