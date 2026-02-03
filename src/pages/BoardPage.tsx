import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Type, Link as LinkIcon, Image as ImageIcon, Download, Minus, Plus as PlusIcon, Settings, X, CheckSquare, Upload, Layout, Pencil } from 'lucide-react';
import { useThoughts } from '../hooks/useThoughts';
import ThoughtItem from '../components/ThoughtItem';
import ConnectionLine from '../components/ConnectionLine';
import { COVER_IMAGES, BACKGROUND_IMAGES } from '../constants';
import { fileToDataUrl, isImageFile, isValidSize } from '../utils/file';
import { api } from '../services/api';
import type { Board, ThoughtType } from '../types';

const BoardPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        thoughts,
        connections,
        loading: thoughtsLoading,
        addThought,
        updateThought,
        deleteThought,
        addConnection,
        deleteConnection
    } = useThoughts(id);
    const [board, setBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(true);
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [isDraggingCover, setIsDraggingCover] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const backgroundInputRef = useRef<HTMLInputElement>(null);

    // Pan & Zoom State
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [panningStart, setPanningStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (id) {
            fetchBoard();
        }
    }, [id]);

    const fetchBoard = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const boards = await api.boards.list();
            const current = boards.find((b: Board) => b.id === id);
            if (current) {
                // Adapt field names if necessary (server uses cover_image, frontend uses coverImage)
                setBoard({
                    ...current,
                    coverImage: current.cover_image || current.coverImage,
                    backgroundImage: current.background_image || current.backgroundImage
                });
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error('Failed to fetch board:', err);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const screenToWorld = useCallback((screenX: number, screenY: number) => {
        return {
            x: (screenX - transform.x) / transform.k,
            y: (screenY - transform.y) / transform.k
        };
    }, [transform.x, transform.y, transform.k]);

    const handleWheel = (e: React.WheelEvent) => {
        const delta = -e.deltaY;
        const factor = Math.pow(1.1, delta / 200);
        const newK = Math.min(Math.max(0.1, transform.k * factor), 5);

        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newX = mouseX - (mouseX - transform.x) * (newK / transform.k);
        const newY = mouseY - (mouseY - transform.y) * (newK / transform.k);

        setTransform({ x: newX, y: newY, k: newK });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.target === containerRef.current)) {
            setIsPanning(true);
            setPanningStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setTransform(prev => ({
                ...prev,
                x: e.clientX - panningStart.x,
                y: e.clientY - panningStart.y
            }));
        }
    };

    const handleMouseUp = () => setIsPanning(false);

    const resetTransform = () => setTransform({ x: 0, y: 0, k: 1 });
    const zoomIn = () => setTransform(prev => ({ ...prev, k: Math.min(5, prev.k * 1.2) }));
    const zoomOut = () => setTransform(prev => ({ ...prev, k: Math.max(0.1, prev.k / 1.2) }));

    const handleAddThought = (type: ThoughtType) => {
        const worldPos = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
        addThought(type, worldPos.x - 125, worldPos.y - 75);
    };

    const handleGrowThought = (parentId: string, type: ThoughtType) => {
        const parent = thoughts.find(t => t.id === parentId);
        if (!parent) return;
        const x = parent.x + 350;
        const y = parent.y + (Math.random() * 200 - 100);
        addThought(type, x, y, '', parentId);
    };

    const handleConnect = (thoughtId: string) => {
        if (!connectingId) {
            setConnectingId(thoughtId);
        } else {
            if (connectingId !== thoughtId) {
                addConnection(connectingId, thoughtId);
            }
            setConnectingId(null);
        }
    };

    const updateBoard = async (updates: Partial<Board>) => {
        if (!board || !id) return;

        // Map frontend camelCase to backend snake_case
        const apiUpdates: any = {};
        if (updates.title !== undefined) apiUpdates.title = updates.title;
        if (updates.description !== undefined) apiUpdates.description = updates.description;
        if (updates.coverImage !== undefined) apiUpdates.cover_image = updates.coverImage;
        if (updates.backgroundImage !== undefined) apiUpdates.background_image = updates.backgroundImage;

        // Optimistic update
        setBoard(prev => prev ? { ...prev, ...updates } : null);

        try {
            await api.boards.update(id, apiUpdates);
        } catch (err) {
            console.error('Failed to update board:', err);
            fetchBoard(); // Rollback
        }
    };

    const processFile = async (file: File, type: 'cover' | 'background') => {
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
            if (type === 'cover') {
                updateBoard({ coverImage: dataUrl });
            } else {
                updateBoard({ backgroundImage: dataUrl });
            }
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Error uploading image.');
        }
    };

    const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file, 'cover');
    };

    const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file, 'background');
    };

    const handleCoverDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingCover(true);
    };

    const handleCoverDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingCover(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file, 'cover');
    };

    const updateBoardTitle = (title: string) => updateBoard({ title });
    const updateBoardDescription = (description: string) => updateBoard({ description });

    if (loading || thoughtsLoading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505' }}>
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div
            className="board-view"
            style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#050505',
                overflow: 'hidden'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <header
                className={`glass ${isDraggingCover ? 'drag-over' : ''}`}
                onDragOver={handleCoverDragOver}
                onDragLeave={() => setIsDraggingCover(false)}
                onDrop={handleCoverDrop}
                style={{
                    padding: '0.75rem 2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 100,
                    transition: 'all 0.3s ease',
                    borderBottom: isDraggingCover ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                    background: isDraggingCover ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--glass-bg)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Link to="/" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <input
                        value={board?.title || ''}
                        onChange={(e) => updateBoardTitle(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: 'white',
                            outline: 'none',
                            width: '300px',
                            borderBottom: '1px solid transparent',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderBottomColor = 'var(--primary)'}
                        onBlur={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
                        placeholder="Untitled Board"
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div className="glass" style={{ display: 'flex', borderRadius: '0.75rem', overflow: 'hidden' }}>
                        <button className="btn-icon-sq" onClick={zoomOut}><Minus size={16} /></button>
                        <button className="btn-icon-sq" onClick={resetTransform} style={{ borderLeft: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)' }}>
                            <span style={{ fontSize: '0.7rem' }}>{Math.round(transform.k * 100)}%</span>
                        </button>
                        <button className="btn-icon-sq" onClick={zoomIn}><PlusIcon size={16} /></button>
                    </div>
                    <button className="btn btn-secondary" onClick={() => setShowSettings(true)}>
                        <Settings size={18} />
                        Settings
                    </button>
                    <button className="btn btn-secondary" onClick={() => window.print()}>
                        <Download size={18} />
                        Export
                    </button>
                </div>
            </header>

            <main
                ref={containerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                style={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'radial-gradient(circle at center, #111 0%, #000 100%)',
                    cursor: isPanning ? 'grabbing' : 'crosshair'
                }}
            >
                <div
                    style={{
                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
                        transformOrigin: '0 0',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none'
                    }}
                >
                    {/* Dynamic Background Layer */}
                    <div style={{
                        width: '20000px',
                        height: '20000px',
                        position: 'absolute',
                        top: '-10000px',
                        left: '-10000px',
                        backgroundImage: board?.backgroundImage
                            ? `url(${board.backgroundImage})`
                            : 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
                        //backgroundSize: (board?.backgroundImage && !BACKGROUND_IMAGES.includes(board.backgroundImage))
                        //    ? 'cover' // Custom uploads cover the whole 20kx20k area
                        //    : (board?.backgroundImage ? 'auto' : '40px 40px'),
                        backgroundRepeat: 'repeat',
                        backgroundPosition: 'center',
                        pointerEvents: 'none',
                        opacity: board?.backgroundImage ? 1 : 1,
                        transition: 'background 0.3s ease'
                    }} />

                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                        {connections.map(conn => {
                            const from = thoughts.find(t => t.id === conn.fromId);
                            const to = thoughts.find(t => t.id === conn.toId);
                            if (!from || !to) return null;
                            return (
                                <ConnectionLine
                                    key={conn.id}
                                    id={conn.id}
                                    startX={from.x + 125}
                                    startY={from.y + 75}
                                    endX={to.x + 125}
                                    endY={to.y + 75}
                                    onDelete={deleteConnection}
                                />
                            );
                        })}
                    </svg>

                    <div style={{ pointerEvents: 'auto' }}>
                        {thoughts.map(thought => (
                            <ThoughtItem
                                key={thought.id}
                                thought={thought}
                                onUpdate={updateThought}
                                onDelete={deleteThought}
                                onGrow={handleGrowThought}
                                onConnect={handleConnect}
                                isConnecting={connectingId === thought.id}
                                scale={transform.k}
                            />
                        ))}
                    </div>
                </div>

                {thoughts.length === 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        pointerEvents: 'none',
                        background: 'rgba(0,0,0,0.4)',
                        padding: '2rem',
                        borderRadius: '1.5rem',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <p style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'white' }}>This canvas is empty.</p>
                        <p style={{ fontSize: '0.9rem' }}>Use the toolbar below to start adding thoughts.</p>
                        <p style={{ fontSize: '0.8rem', marginTop: '1rem', opacity: 0.6 }}>Tip: Drag an image onto the header to set board cover</p>
                    </div>
                )}
            </main>

            <div style={{
                position: 'absolute',
                bottom: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '1rem',
                padding: '0.75rem',
                borderRadius: '1.5rem',
                zIndex: 100
            }} className="glass">
                <button className="btn btn-primary" onClick={() => handleAddThought('text')} title="Add Text">
                    <Type size={20} strokeWidth={2.5} />
                    <span>Text</span>
                </button>
                <button className="btn btn-primary" style={{ background: 'var(--accent)' }} onClick={() => handleAddThought('link')} title="Add Link">
                    <LinkIcon size={20} strokeWidth={2.5} />
                    <span>Link</span>
                </button>
                <button className="btn btn-primary" style={{ background: 'var(--secondary)' }} onClick={() => handleAddThought('image')} title="Add Image">
                    <ImageIcon size={20} strokeWidth={2.5} />
                    <span>Image</span>
                </button>
                <button className="btn btn-primary" style={{ background: '#10b981' }} onClick={() => handleAddThought('checklist')} title="Add Checklist">
                    <CheckSquare size={20} strokeWidth={2.5} />
                    <span>List</span>
                </button>
                <button className="btn btn-primary" style={{ background: '#f59e0b' }} onClick={() => handleAddThought('sketch')} title="Add Sketch">
                    <Pencil size={20} strokeWidth={2.5} />
                    <span>Sketch</span>
                </button>
            </div>

            {showSettings && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', borderRadius: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button
                            onClick={() => setShowSettings(false)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Board Settings</h2>

                        {/* Title & Subheading Section */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Board Title</label>
                            <input
                                value={board?.title || ''}
                                onChange={(e) => updateBoardTitle(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '1rem',
                                    padding: '1rem',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                    outline: 'none',
                                    marginBottom: '1.5rem'
                                }}
                            />
                            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Subheading (Shown on Landing Page)</label>
                            <textarea
                                value={board?.description || ''}
                                onChange={(e) => updateBoardDescription(e.target.value)}
                                placeholder="A brief summary of this board..."
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '1rem',
                                    padding: '1rem',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    minHeight: '80px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Cover Image Section */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ImageIcon size={18} className="text-primary" />
                                    <label style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Header Cover Image</label>
                                </div>
                                <button
                                    onClick={() => coverInputRef.current?.click()}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                >
                                    <Upload size={14} style={{ marginRight: '0.4rem' }} />
                                    Upload Custom
                                </button>
                                <input
                                    type="file"
                                    ref={coverInputRef}
                                    onChange={handleCoverFileChange}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                />
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '0.75rem',
                                paddingRight: '0.5rem'
                            }}>
                                {COVER_IMAGES.map(img => (
                                    <div
                                        key={img}
                                        onClick={() => updateBoard({ coverImage: img })}
                                        style={{
                                            aspectRatio: '16/9',
                                            borderRadius: '0.75rem',
                                            backgroundImage: `url(${img})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            cursor: 'pointer',
                                            border: board?.coverImage === img ? '3px solid var(--primary)' : '3px solid transparent',
                                            boxShadow: board?.coverImage === img ? '0 0 15px var(--primary-glow)' : 'none',
                                            transition: 'transform 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Canvas Background Section */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Layout size={18} className="text-secondary" />
                                    <label style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Canvas Background</label>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => updateBoard({ backgroundImage: '' })}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                    >
                                        None
                                    </button>
                                    <button
                                        onClick={() => backgroundInputRef.current?.click()}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                    >
                                        <Upload size={14} style={{ marginRight: '0.4rem' }} />
                                        Upload
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    ref={backgroundInputRef}
                                    onChange={handleBackgroundFileChange}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                />
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '0.75rem',
                                paddingRight: '0.5rem'
                            }}>
                                {BACKGROUND_IMAGES.map(img => (
                                    <div
                                        key={img}
                                        onClick={() => updateBoard({ backgroundImage: img })}
                                        style={{
                                            aspectRatio: '16/9',
                                            borderRadius: '0.75rem',
                                            backgroundImage: `url(${img})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            cursor: 'pointer',
                                            border: board?.backgroundImage === img ? '3px solid var(--secondary)' : '3px solid transparent',
                                            boxShadow: board?.backgroundImage === img ? '0 0 15px rgba(var(--secondary-rgb), 0.4)' : 'none',
                                            transition: 'all 0.2s',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            background: 'rgba(0,0,0,0.6)',
                                            color: 'white',
                                            fontSize: '0.65rem',
                                            textAlign: 'center',
                                            padding: '2px',
                                            borderBottomLeftRadius: '0.5rem',
                                            borderBottomRightRadius: '0.5rem'
                                        }}>
                                            {img.includes('blueprint') ? 'Blueprint' :
                                                img.includes('lined') ? 'Lined Paper' :
                                                    img.includes('wood') ? 'Dark Wood' :
                                                        img.includes('cork') ? 'Cork' :
                                                            img.includes('grid') ? 'Grid' : 'Textured'}
                                        </div>
                                    </div>
                                ))}
                                {board?.backgroundImage && !BACKGROUND_IMAGES.includes(board.backgroundImage) && (
                                    <div
                                        onClick={() => updateBoard({ backgroundImage: board.backgroundImage })}
                                        style={{
                                            aspectRatio: '16/9',
                                            borderRadius: '0.75rem',
                                            backgroundImage: `url(${board.backgroundImage})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            cursor: 'pointer',
                                            border: '3px solid var(--secondary)',
                                            boxShadow: '0 0 15px rgba(var(--secondary-rgb), 0.4)',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            background: 'rgba(0,0,0,0.6)',
                                            color: 'white',
                                            fontSize: '0.65rem',
                                            textAlign: 'center',
                                            padding: '2px',
                                            borderBottomLeftRadius: '0.5rem',
                                            borderBottomRightRadius: '0.5rem'
                                        }}>Custom</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button onClick={() => setShowSettings(false)} className="btn btn-primary" style={{ flex: 1 }}>Done</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .btn-icon-sq {
                    background: transparent;
                    border: none;
                    color: white;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-icon-sq:hover {
                    background: rgba(255,255,255,0.1);
                }
                .text-primary { color: var(--primary); }
                .text-secondary { color: var(--secondary); }
                .loader {
                    border: 3px solid rgba(255,255,255,0.1);
                    border-top: 3px solid var(--primary);
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default BoardPage;
