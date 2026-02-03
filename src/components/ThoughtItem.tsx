import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Trash2, ExternalLink, Plus, Link2, Palette, CheckSquare, Square, X, Type, Image as ImageIcon, Link as LinkIcon, Upload, Pencil } from 'lucide-react';
import SketchCanvas from './SketchCanvas';
import type { Thought, ThoughtType } from '../types';
import { fileToDataUrl, isImageFile, isValidSize } from '../utils/file';

interface ThoughtItemProps {
    thought: Thought;
    onUpdate: (id: string, updates: Partial<Thought>) => void;
    onDelete: (id: string) => void;
    onGrow: (parentId: string, type: ThoughtType) => void;
    onConnect: (id: string) => void;
    isConnecting?: boolean;
    scale: number;
}

interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

const PRESET_COLORS = [
    '#fde047', // Yellow (Default)
    '#93c5fd', // Blue
    '#86efac', // Green
    '#fda4af', // Pink
    '#c4b5fd', // Purple
    '#fdba74', // Orange
    '#ffffff', // White
];

const ThoughtItem: React.FC<ThoughtItemProps> = ({
    thought,
    onUpdate,
    onDelete,
    onGrow,
    onConnect,
    isConnecting,
    scale
}) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showGrowMenu, setShowGrowMenu] = useState(false);
    const dragControls = useDragControls();
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const resizeRef = useRef<{ startX: number, startY: number, startWidth: number, startHeight: number } | null>(null);

    const isText = thought.type === 'text';
    const isLink = thought.type === 'link';
    const isImage = thought.type === 'image';
    const isChecklist = thought.type === 'checklist';
    const isSketch = thought.type === 'sketch';

    // Parse checklist items
    let items: ChecklistItem[] = [];
    if (isChecklist) {
        try {
            items = thought.content ? JSON.parse(thought.content) : [];
        } catch (e) {
            items = [];
        }
    }

    const updateChecklist = (newItems: ChecklistItem[]) => {
        onUpdate(thought.id, { content: JSON.stringify(newItems) });
    };

    const toggleItem = (itemId: string) => {
        const newItems = items.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        updateChecklist(newItems);
    };

    const addItem = () => {
        const newItem: ChecklistItem = {
            id: Math.random().toString(36).substr(2, 9),
            text: '',
            completed: false
        };
        updateChecklist([...items, newItem]);
    };

    const removeItem = (itemId: string) => {
        updateChecklist(items.filter(i => i.id !== itemId));
    };

    const updateItemText = (itemId: string, text: string) => {
        const newItems = items.map(item =>
            item.id === itemId ? { ...item, text } : item
        );
        updateChecklist(newItems);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await processFile(file);
        }
    };

    const processFile = async (file: File) => {
        if (!isImageFile(file)) {
            alert('Please select an image file.');
            return;
        }
        if (!isValidSize(file)) {
            alert('File is too large. Max size is 2MB.');
            return;
        }
        try {
            const dataUrl = await fileToDataUrl(file);
            onUpdate(thought.id, { content: dataUrl });
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Error uploading image.');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (isImage) {
            e.preventDefault();
            setIsDraggingOver(true);
        }
    };

    const handleDragLeave = () => {
        setIsDraggingOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        if (isImage) {
            e.preventDefault();
            setIsDraggingOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
                await processFile(file);
            }
        }
    };

    const handleResizeStart = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const card = (e.target as HTMLElement).closest('.thought-card-content') as HTMLElement;
        if (card) {
            resizeRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                startWidth: card.offsetWidth,
                startHeight: card.offsetHeight
            };
        }
    };

    const handleResizeMove = (e: PointerEvent) => {
        if (!isResizing || !resizeRef.current) return;

        const deltaX = (e.clientX - resizeRef.current.startX) / scale;
        const deltaY = (e.clientY - resizeRef.current.startY) / scale;

        const newWidth = Math.max(220, resizeRef.current.startWidth + deltaX);
        const newHeight = Math.max(100, resizeRef.current.startHeight + deltaY);

        // We update local style directly for performance during resize
        const card = document.querySelector(`[data-thought-id="${thought.id}"] .thought-card-content`) as HTMLElement;
        if (card) {
            card.style.width = `${newWidth}px`;
            card.style.height = `${newHeight}px`;
        }
    };

    const handleResizeEnd = () => {
        if (!isResizing) return;
        setIsResizing(false);

        const card = document.querySelector(`[data-thought-id="${thought.id}"] .thought-card-content`) as HTMLElement;
        if (card) {
            onUpdate(thought.id, {
                width: Math.round(card.offsetWidth),
                height: Math.round(card.offsetHeight)
            });
        }
        resizeRef.current = null;
    };

    React.useEffect(() => {
        if (isResizing) {
            window.addEventListener('pointermove', handleResizeMove);
            window.addEventListener('pointerup', handleResizeEnd);
        } else {
            window.removeEventListener('pointermove', handleResizeMove);
            window.removeEventListener('pointerup', handleResizeEnd);
        }
        return () => {
            window.removeEventListener('pointermove', handleResizeMove);
            window.removeEventListener('pointerup', handleResizeEnd);
        };
    }, [isResizing, scale]);

    return (
        <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            data-thought-id={thought.id}
            onDragEnd={(_, info) => {
                onUpdate(thought.id, {
                    x: thought.x + info.offset.x / scale,
                    y: thought.y + info.offset.y / scale
                });
            }}
            initial={{ x: thought.x, y: thought.y, opacity: 0, scale: 0.8 }}
            animate={{ x: thought.x, y: thought.y, opacity: 1, scale: 1 }}
            style={{
                position: 'absolute',
                cursor: 'grab',
                zIndex: isConnecting ? 20 : (showGrowMenu || showColorPicker ? 100 : 5),
            }}
            onPointerDown={(e) => {
                // Only start drag if not clicking an interactive element
                const target = e.target as HTMLElement;
                if (!target.closest('.block-drag') && !target.closest('.resize-handle') && !target.closest('button') && !target.closest('input') && !target.closest('textarea')) {
                    dragControls.start(e);
                }
            }}
            whileDrag={{ scale: 1.05 / scale, zIndex: 10, cursor: 'grabbing' }}
        >
            <div
                className={`glass thought-card-content ${isDraggingOver ? 'drag-over' : ''} ${isResizing ? 'resizing' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    width: thought.width ? `${thought.width}px` : ((isText || isChecklist) ? '220px' : '250px'),
                    height: thought.height ? `${thought.height}px` : undefined,
                    minWidth: (isText || isChecklist) ? '220px' : '250px',
                    minHeight: isSketch ? '350px' : 'auto',
                    padding: '1.25rem',
                    borderRadius: '1rem',
                    backgroundColor: (isText || isChecklist) ? (thought.color || '#fde047') : 'var(--bg-card)',
                    color: (isText || isChecklist) ? '#1a1a1a' : 'inherit',
                    position: 'relative',
                    boxShadow: isConnecting ? '0 0 20px var(--primary)' : 'var(--shadow-lg)',
                    border: isConnecting ? '2px solid var(--primary)' : ((isText || isChecklist) ? 'none' : '1px solid var(--glass-border)'),
                    transition: isResizing ? 'none' : 'all 0.3s ease',
                    transform: isDraggingOver ? 'scale(1.02)' : 'scale(1)',
                }}
            >
                <div
                    className="resize-handle"
                    onPointerDown={handleResizeStart}
                    style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '20px',
                        height: '20px',
                        cursor: 'nwse-resize',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'end',
                        justifyContent: 'end',
                        padding: '4px'
                    }}
                >
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRight: `2px solid ${(isText || isChecklist) ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}`,
                        borderBottom: `2px solid ${(isText || isChecklist) ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: '1px'
                    }} />
                </div>
                <div
                    className="action-toolbar"
                    style={{
                        position: 'absolute',
                        top: '-40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '0.4rem',
                        padding: '0.4rem',
                        borderRadius: '0.75rem',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        zIndex: 100
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => {
                                setShowGrowMenu(!showGrowMenu);
                                setShowColorPicker(false);
                            }}
                            className="btn-icon"
                            title="Grow Connection"
                            style={{ color: showGrowMenu ? 'var(--primary)' : 'white' }}
                        >
                            <Plus size={16} strokeWidth={2.5} />
                        </button>
                        <AnimatePresence>
                            {showGrowMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%) translateY(-10px)',
                                        background: 'rgba(0,0,0,0.85)',
                                        backdropFilter: 'blur(12px)',
                                        padding: '0.5rem',
                                        borderRadius: '1rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px',
                                        border: '1px solid var(--glass-border)',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                                        minWidth: '140px'
                                    }}
                                >
                                    <button
                                        onClick={() => { onGrow(thought.id, 'text'); setShowGrowMenu(false); }}
                                        className="menu-item"
                                    >
                                        <Type size={14} /> Text
                                    </button>
                                    <button
                                        onClick={() => { onGrow(thought.id, 'link'); setShowGrowMenu(false); }}
                                        className="menu-item"
                                    >
                                        <LinkIcon size={14} /> Link
                                    </button>
                                    <button
                                        onClick={() => { onGrow(thought.id, 'image'); setShowGrowMenu(false); }}
                                        className="menu-item"
                                    >
                                        <ImageIcon size={14} /> Image
                                    </button>
                                    <button
                                        onClick={() => { onGrow(thought.id, 'checklist'); setShowGrowMenu(false); }}
                                        className="menu-item"
                                    >
                                        <CheckSquare size={14} /> Checklist
                                    </button>
                                    <button
                                        onClick={() => { onGrow(thought.id, 'sketch'); setShowGrowMenu(false); }}
                                        className="menu-item"
                                    >
                                        <Pencil size={14} /> Sketch
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {(isText || isChecklist) && (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => {
                                    setShowColorPicker(!showColorPicker);
                                    setShowGrowMenu(false);
                                }}
                                className="btn-icon"
                                title="Change Color"
                                style={{ color: showColorPicker ? 'var(--primary)' : 'white' }}
                            >
                                <Palette size={16} strokeWidth={2.5} />
                            </button>
                            <AnimatePresence>
                                {showColorPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: '50%',
                                            transform: 'translateX(-50%) translateY(-10px)',
                                            background: 'rgba(0,0,0,0.85)',
                                            backdropFilter: 'blur(12px)',
                                            padding: '8px',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            gap: '6px',
                                            border: '1px solid var(--glass-border)',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
                                        }}
                                    >
                                        {PRESET_COLORS.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => {
                                                    onUpdate(thought.id, { color });
                                                    setShowColorPicker(false);
                                                }}
                                                style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    background: color,
                                                    border: thought.color === color ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                                                    cursor: 'pointer',
                                                    padding: 0
                                                }}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {isImage && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-icon"
                            title="Upload Image"
                        >
                            <Upload size={16} strokeWidth={2.5} />
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept="image/*"
                            />
                        </button>
                    )}

                    <button
                        onClick={() => {
                            onConnect(thought.id);
                            setShowGrowMenu(false);
                            setShowColorPicker(false);
                        }}
                        className="btn-icon"
                        title="Connect to another"
                        style={{ color: isConnecting ? 'var(--primary)' : 'white' }}
                    >
                        <Link2 size={16} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => onDelete(thought.id)}
                        className="btn-icon delete"
                        title="Delete"
                    >
                        <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                </div>

                {isText && (
                    <textarea
                        value={thought.content}
                        onChange={(e) => onUpdate(thought.id, { content: e.target.value })}
                        placeholder="Type your thought..."
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            resize: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 500,
                            fontFamily: 'inherit',
                            color: 'inherit',
                            outline: 'none',
                            minHeight: '100px',
                            height: thought.height ? '100%' : 'auto',
                        }}
                    />
                )}

                {isChecklist && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: thought.height ? '100%' : 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem' }}>
                            <CheckSquare size={16} />
                            <input
                                value={thought.metadata?.title || 'Checklist'}
                                onChange={(e) => onUpdate(thought.id, {
                                    metadata: { ...thought.metadata, title: e.target.value }
                                })}
                                style={{
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'inherit',
                                    outline: 'none',
                                    width: '100%',
                                }}
                                placeholder="Checklist Title"
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {items.map(item => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => toggleItem(item.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            color: item.completed ? '#10b981' : 'rgba(0,0,0,0.4)'
                                        }}
                                    >
                                        {item.completed ? <CheckSquare size={18} strokeWidth={2.5} /> : <Square size={18} strokeWidth={2.5} />}
                                    </button>
                                    <input
                                        value={item.text}
                                        onChange={(e) => updateItemText(item.id, e.target.value)}
                                        placeholder="Add item..."
                                        style={{
                                            flex: 1,
                                            background: 'transparent',
                                            border: 'none',
                                            fontSize: '1rem',
                                            color: 'inherit',
                                            textDecoration: item.completed ? 'line-through' : 'none',
                                            opacity: item.completed ? 0.6 : 1,
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', opacity: 0.3 }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addItem}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                marginTop: '0.5rem',
                                background: 'rgba(0,0,0,0.05)',
                                border: '1px dashed rgba(0,0,0,0.2)',
                                borderRadius: '0.5rem',
                                padding: '0.4rem 0.8rem',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 500
                            }}
                        >
                            <Plus size={14} /> Add Item
                        </button>
                    </div>
                )}

                {isLink && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: thought.height ? '100%' : 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                            <ExternalLink size={14} />
                            LINK
                        </div>
                        <input
                            value={thought.content}
                            onChange={(e) => onUpdate(thought.id, { content: e.target.value })}
                            placeholder="Paste URL here..."
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '0.5rem',
                                padding: '0.5rem',
                                color: 'white',
                                fontSize: '0.9rem',
                            }}
                        />
                        {thought.content && (
                            <a
                                href={thought.content.startsWith('http') ? thought.content : `https://${thought.content}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: 'var(--accent)',
                                    fontSize: '0.8rem',
                                    textDecoration: 'none',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Visit Link
                            </a>
                        )}
                    </div>
                )}

                {isImage && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                        {thought.content ? (
                            <img
                                src={thought.content}
                                alt="Thought"
                                style={{ width: '100%', borderRadius: '0.5rem', display: 'block' }}
                                draggable={false}
                            />
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    aspectRatio: '16/9',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    border: '2px dashed var(--glass-border)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                            >
                                <Upload size={24} style={{ marginBottom: '0.5rem' }} />
                                <span style={{ fontSize: '0.8rem' }}>Click or Drop Image</span>
                            </div>
                        )}
                        {isDraggingOver && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(var(--primary-rgb), 0.2)',
                                backdropFilter: 'blur(4px)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid var(--primary)',
                                zIndex: 10
                            }}>
                                <span style={{ color: 'white', fontWeight: 600 }}>Drop to Upload</span>
                            </div>
                        )}
                    </div>
                )}

                {isSketch && (
                    <div
                        className="block-drag"
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                            <Pencil size={14} />
                            SKETCH PAD
                        </div>
                        <SketchCanvas
                            initialData={thought.content}
                            onSave={(dataUrl) => onUpdate(thought.id, { content: dataUrl })}
                        />
                    </div>
                )}
            </div>

            <style>{`
                div:hover .action-toolbar {
                    opacity: 1 !important;
                    background: rgba(0,0,0,0.3);
                    backdrop-filter: blur(8px);
                    border: 1px solid var(--glass-border);
                }
                .btn-icon {
                    background: transparent;
                    border: none;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .btn-icon:hover {
                    background: rgba(255,255,255,0.1);
                }
                .btn-icon.delete:hover {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                }
                .menu-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.6rem 1rem;
                    background: transparent;
                    border: none;
                    color: #e2e8f0;
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    white-space: nowrap;
                    border-radius: 0.5rem;
                    transition: all 0.2s;
                    text-align: left;
                }
                .menu-item:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                    transform: translateX(4px);
                }
                .menu-item svg {
                    color: var(--primary);
                }
                .glass.drag-over {
                    border-color: var(--primary) !important;
                    box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.3) !important;
                }
            `}</style>
        </motion.div>
    );
};

export default ThoughtItem;
