import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ConnectionLineProps {
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    onDelete: (id: string) => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ id, startX, startY, endX, endY, onDelete }) => {
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    return (
        <g style={{ pointerEvents: 'none' }}>
            <motion.line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="var(--primary)"
                strokeWidth="3"
                strokeOpacity="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
            />
            {/* Invisible thicker line for easier interaction if needed, but we'll use a button at midpoint */}
            <circle
                cx={midX}
                cy={midY}
                r="12"
                fill="var(--bg-dark)"
                stroke="var(--glass-border)"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(id);
                }}
            />
            <g transform={`translate(${midX - 6}, ${midY - 6})`} style={{ pointerEvents: 'none' }}>
                <X size={12} color="var(--text-muted)" />
            </g>
        </g>
    );
};

export default ConnectionLine;
