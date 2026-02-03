import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Layout, Clock, Trash2, ArrowRight, X, Upload, User as UserIcon, Lock, LogOut } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Board } from '../types';
import { COVER_IMAGES } from '../constants';
import { fileToDataUrl, isImageFile, isValidSize } from '../utils/file';

const LandingPage: React.FC = () => {
    const { user, token, login, signup, logout, loading: authLoading } = useAuth();
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [selectedCover, setSelectedCover] = useState(COVER_IMAGES[0]);
    const [dragOverBoardId, setDragOverBoardId] = useState<string | null>(null);
    const createFileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Auth Form State
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        if (token) {
            fetchBoards();
        }
    }, [token]);

    const fetchBoards = async () => {
        setLoading(true);
        try {
            const data = await api.boards.list();
            setBoards(data);
        } catch (err) {
            console.error('Failed to fetch boards:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        try {
            if (isLogin) {
                await login(username, password);
            } else {
                await signup(username, password);
            }
        } catch (err: any) {
            setAuthError(err.message);
        }
    };

    const createNewBoard = async () => {
        try {
            const data = await api.boards.create({
                title: newBoardTitle || 'Untitled Board',
                description: 'A new canvas for ideas',
                cover_image: selectedCover,
            });
            navigate(`/board/${data.id}`);
        } catch (err) {
            console.error('Failed to create board:', err);
        }
    };

    const deleteBoard = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this board?')) {
            try {
                await api.boards.delete(id);
                setBoards(prev => prev.filter(b => b.id !== id));
            } catch (err) {
                console.error('Failed to delete board:', err);
            }
        }
    };

    const handleCreateFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!isImageFile(file)) {
                alert('Please select an image file.');
                return;
            }
            if (!isValidSize(file)) {
                alert('File too large. Max is 2MB.');
                return;
            }
            try {
                const dataUrl = await fileToDataUrl(file);
                setSelectedCover(dataUrl);
            } catch (err) {
                console.error('Error uploading image:', err);
            }
        }
    };

    const handleBoardDrop = async (e: React.DragEvent, boardId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverBoardId(null);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (!isImageFile(file)) return;
            if (!isValidSize(file)) {
                alert('File too large. Max is 2MB.');
                return;
            }
            try {
                const dataUrl = await fileToDataUrl(file);
                await api.boards.update(boardId, { cover_image: dataUrl });
                setBoards(prev => prev.map(b => b.id === boardId ? { ...b, coverImage: dataUrl, updatedAt: Date.now() } : b));
            } catch (err) {
                console.error('Error uploading image:', err);
            }
        }
    };

    if (authLoading) return null;

    if (!token) {
        return (
            <div className="fade-in" style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at top right, #1a1a2e 0%, #0a0a0a 100%)',
                padding: '2rem'
            }}>
                <div className="glass" style={{ width: '100%', maxWidth: '450px', padding: '3rem', borderRadius: '2.5rem', textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        borderRadius: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem',
                        boxShadow: '0 10px 30px rgba(var(--primary-rgb), 0.3)'
                    }}>
                        <Layout size={40} color="white" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Thought.Click</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
                        {isLogin ? 'Welcome back! Please login to continue.' : 'Create an account to start your vision.'}
                    </p>

                    <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ position: 'relative' }}>
                            <UserIcon size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '1.25rem',
                                    padding: '1.1rem 1.1rem 1.1rem 3.5rem',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '1.25rem',
                                    padding: '1.1rem 1.1rem 1.1rem 3.5rem',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {authError && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{authError}</p>}

                        <button type="submit" className="btn btn-primary" style={{ padding: '1.1rem', fontSize: '1.1rem', borderRadius: '1.25rem', marginTop: '0.5rem' }}>
                            {isLogin ? 'Login' : 'Sign Up'}
                            <ArrowRight size={20} />
                        </button>
                    </form>

                    <p style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setAuthError(''); }}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, marginLeft: '0.5rem', cursor: 'pointer' }}
                        >
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ width: '100%', maxWidth: '100%', padding: '4rem' }}>
            <header style={{ textAlign: 'center', marginBottom: '4rem', position: 'relative' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <img
                        src="/logo.png"
                        alt="Thought.Click Logo"
                        style={{
                            width: '120px',
                            height: '120px',
                            margin: '0 auto',
                            display: 'block',
                            filter: 'drop-shadow(0 0 20px rgba(var(--primary-rgb), 0.3))',
                            animation: 'pulse 4s ease-in-out infinite'
                        }}
                    />
                </div>
                <h1 style={{
                    fontSize: '4.5rem',
                    fontWeight: 800,
                    marginBottom: '1rem',
                    background: 'linear-gradient(to right, var(--primary), var(--secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.04em'
                }}>
                    Thought.Click
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
                    Capture and Organize your Thoughts with Clicks.
                </p>

                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.1rem', color: 'white', opacity: 0.8 }}>Welcome back, <strong style={{ color: 'var(--primary)' }}>{user?.username}</strong></span>
                    <button
                        onClick={logout}
                        title="Logout"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '6px 12px',
                            borderRadius: '2rem',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.borderColor = 'var(--glass-border)';
                        }}
                    >
                        <LogOut size={14} />
                        Logout
                    </button>
                </div>

                <button onClick={() => setIsCreating(true)} className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1.1rem 2.5rem', borderRadius: '1.5rem', boxShadow: '0 10px 30px rgba(var(--primary-rgb), 0.2)' }}>
                    <Plus size={24} />
                    New Thought Board
                </button>
            </header >

            {isCreating && (
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
                    <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', borderRadius: '2rem', position: 'relative' }}>
                        <button
                            onClick={() => setIsCreating(false)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Create Board</h2>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Board Title</label>
                            <input
                                autoFocus
                                value={newBoardTitle}
                                onChange={(e) => setNewBoardTitle(e.target.value)}
                                placeholder="E.g. Branding Project"
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '1rem',
                                    padding: '1rem',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Choose Cover Image</label>
                                <button
                                    onClick={() => createFileInputRef.current?.click()}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                >
                                    <Upload size={12} style={{ marginRight: '0.3rem' }} />
                                    Upload Custom
                                </button>
                                <input
                                    type="file"
                                    ref={createFileInputRef}
                                    onChange={handleCreateFileUpload}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                />
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '0.75rem'
                            }}>
                                {COVER_IMAGES.map(img => (
                                    <div
                                        key={img}
                                        onClick={() => setSelectedCover(img)}
                                        style={{
                                            aspectRatio: '16/9',
                                            borderRadius: '0.75rem',
                                            backgroundImage: `url(${img})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            cursor: 'pointer',
                                            border: selectedCover === img ? '3px solid var(--primary)' : '3px solid transparent',
                                            boxShadow: selectedCover === img ? '0 0 15px var(--primary-glow)' : 'none',
                                            transition: 'transform 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    />
                                ))}
                                {selectedCover && !COVER_IMAGES.includes(selectedCover) && (
                                    <div
                                        style={{
                                            aspectRatio: '16/9',
                                            borderRadius: '0.75rem',
                                            backgroundImage: `url(${selectedCover})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            border: '3px solid var(--primary)',
                                            boxShadow: '0 0 15px var(--primary-glow)',
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setIsCreating(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                            <button onClick={createNewBoard} className="btn btn-primary" style={{ flex: 1 }}>Create Canvas</button>
                        </div>
                    </div>
                </div>
            )}

            <section>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Layout size={24} style={{ color: 'var(--primary)' }} />
                        Your Thought Boards
                    </h2>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                        <div className="loader" style={{ margin: '0 auto' }}></div>
                    </div>
                ) : boards.length === 0 ? (
                    <div className="glass" style={{ padding: '6rem 4rem', textAlign: 'center', borderRadius: '2rem' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>You haven't created any boards yet.</p>
                        <button onClick={() => setIsCreating(true)} className="btn btn-secondary">
                            Get Started
                            <ArrowRight size={18} />
                        </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        gap: '1.5rem',
                        overflowX: 'auto',
                        padding: '1rem 0.5rem 2rem',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'var(--glass-border) transparent'
                    }} className="horizontal-scroll">
                        {boards.map(board => (
                            <div key={board.id} style={{ flex: '0 0 280px' }}>
                                <Link
                                    to={`/board/${board.id}`}
                                    className={`glass board-card ${dragOverBoardId === board.id ? 'drag-over' : ''}`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOverBoardId(board.id);
                                    }}
                                    onDragLeave={() => setDragOverBoardId(null)}
                                    onDrop={(e) => handleBoardDrop(e, board.id)}
                                    style={{
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        borderRadius: '2rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        cursor: 'pointer',
                                        border: dragOverBoardId === board.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                        transform: dragOverBoardId === board.id ? 'scale(1.02)' : 'scale(1)',
                                    }}
                                >
                                    <div style={{
                                        height: '140px',
                                        backgroundImage: `url(${board.coverImage || COVER_IMAGES[0]})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        position: 'relative'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
                                        }} />
                                        {dragOverBoardId === board.id && (
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'rgba(var(--primary-rgb), 0.2)',
                                                backdropFilter: 'blur(4px)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 600,
                                                zIndex: 5
                                            }}>
                                                Drop
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => deleteBoard(board.id, e)}
                                            className="delete-btn-corner"
                                            style={{
                                                position: 'absolute',
                                                top: '0.75rem',
                                                right: '0.75rem',
                                                background: 'rgba(255,255,255,0.1)',
                                                backdropFilter: 'blur(4px)',
                                                border: 'none',
                                                color: 'white',
                                                cursor: 'pointer',
                                                padding: '6px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                transition: 'all 0.2s',
                                                zIndex: 10
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div style={{ padding: '1.25rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>{board.title}</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {board.description}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            <Clock size={12} />
                                            {new Date(board.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <style>{`
                .board-card:hover {
                    transform: translateY(-8px);
                    border-color: var(--primary);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                }
                .delete-btn-corner:hover {
                    background: #ef4444 !important;
                    transform: scale(1.1);
                }
                .board-card.drag-over {
                    border-color: var(--primary) !important;
                    box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.4) !important;
                }
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
                .glass-card {
                    background: var(--glass-bg);
                    backdrop-filter: blur(12px);
                    border: 1px solid var(--glass-border);
                    padding: 0.75rem 1.25rem;
                    border-radius: 1.5rem;
                }
                .horizontal-scroll::-webkit-scrollbar {
                    height: 6px;
                }
                .horizontal-scroll::-webkit-scrollbar-thumb {
                    background: var(--glass-border);
                    border-radius: 3px;
                }
                .horizontal-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
            `}</style>
        </div >
    );
};

export default LandingPage;
