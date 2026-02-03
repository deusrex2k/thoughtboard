import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Eraser } from 'lucide-react';

interface SketchCanvasProps {
    initialData?: string;
    onSave: (dataUrl: string) => void;
    thickness?: number;
}

const PENCIL_COLORS = [
    '#000000', // Black
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#8b5cf6', // Purple
    '#ffffff', // Eraser
];

const SketchCanvas: React.FC<SketchCanvasProps> = ({
    initialData,
    onSave,
    thickness = 3
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [activeColor, setActiveColor] = useState('#000000');

    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fill background with white initially
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (initialData) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = initialData;
        }
    }, [initialData]);

    useEffect(() => {
        initCanvas();
    }, [initCanvas]);

    const getPos = (e: React.PointerEvent | PointerEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.PointerEvent) => {
        e.stopPropagation();
        setIsDrawing(true);
        setLastPos(getPos(e));
    };

    const draw = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        e.stopPropagation();

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const currentPos = getPos(e);

        ctx.beginPath();
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = activeColor === '#ffffff' ? 25 : thickness; // Eraser is thicker
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();

        setLastPos(currentPos);
    };

    const stopDrawing = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        e.stopPropagation();
        setIsDrawing(false);
        saveCanvas();
    };

    const saveCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            onSave(canvas.toDataURL('image/png'));
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveCanvas();
    };

    return (
        <div
            className="block-drag"
            style={{
                position: 'relative',
                width: '100%',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                background: 'white',
                border: '1px solid #ddd'
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => isDrawing && e.stopPropagation()}
        >
            <div style={{
                padding: '0.5rem',
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f9f9f9'
            }}>
                <div style={{ display: 'flex', gap: '0.4rem', pointerEvents: 'auto' }}>
                    {PENCIL_COLORS.map(color => (
                        <button
                            key={color}
                            onClick={(e) => { e.stopPropagation(); setActiveColor(color); }}
                            onPointerDown={(e) => e.stopPropagation()}
                            style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: color,
                                border: activeColor === color ? '2px solid #333' : '1px solid #ddd',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: color === '#ffffff' ? '#666' : 'transparent'
                            }}
                            title={color === '#ffffff' ? 'Eraser' : 'Color'}
                        >
                            {color === '#ffffff' && <Eraser size={12} />}
                        </button>
                    ))}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); clearCanvas(); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                        padding: '0.25rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#666',
                        display: 'flex'
                    }}
                    title="Clear All"
                >
                    <RotateCcw size={16} />
                </button>
            </div>
            <canvas
                ref={canvasRef}
                width={400}
                height={300}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    cursor: 'crosshair',
                    touchAction: 'none'
                }}
            />
        </div>
    );
};

export default SketchCanvas;
