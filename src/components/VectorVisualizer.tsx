import { useRef, useEffect } from 'react';
import './VectorVisualizer.css';

interface VectorVisualizerProps {
    data: number[];
    compareTo?: number[];
}

export function VectorVisualizer({ data, compareTo }: VectorVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        drawVisualization();
    }, [data, compareTo]);

    const calculateMagnitude = (vec: number[]) => {
        return Math.sqrt(vec.reduce((acc, val) => acc + val * val, 0));
    };

    const calculateDotProduct = (vecA: number[], vecB: number[]) => {
        return vecA.reduce((acc, val, i) => acc + val * (vecB[i] || 0), 0);
    };

    const drawVisualization = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width;
        const height = canvas.height;
        const barWidth = width / data.length;

        // Auto-scale
        let maxVal = 0;
        data.forEach(v => maxVal = Math.max(maxVal, Math.abs(v)));
        if (compareTo) {
            compareTo.forEach(v => maxVal = Math.max(maxVal, Math.abs(v)));
        }

        const scale = maxVal > 0 ? 1 / maxVal : 1;

        data.forEach((value, index) => {
            const x = index * barWidth;
            const normalizedValue = value * scale;

            // Draw current vector (solid)
            if (value > 0) {
                const intensity = Math.min(1, Math.abs(normalizedValue));
                ctx.fillStyle = `rgba(59, 130, 246, ${intensity})`; // Blue
                const barHeight = (height / 2) * intensity;
                ctx.fillRect(x, height / 2 - barHeight, barWidth, barHeight);
            } else {
                const intensity = Math.min(1, Math.abs(normalizedValue));
                ctx.fillStyle = `rgba(239, 68, 68, ${intensity})`; // Red
                const barHeight = (height / 2) * intensity;
                ctx.fillRect(x, height / 2, barWidth, barHeight);
            }

            // Draw comparison vector (outline/overlay)
            if (compareTo && compareTo[index] !== undefined) {
                const compVal = compareTo[index];
                const normalizedComp = compVal * scale;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 1;

                if (compVal > 0) {
                    const barHeight = (height / 2) * Math.min(1, Math.abs(normalizedComp));
                    ctx.strokeRect(x, height / 2 - barHeight, barWidth, barHeight);
                } else {
                    const barHeight = (height / 2) * Math.min(1, Math.abs(normalizedComp));
                    ctx.strokeRect(x, height / 2, barWidth, barHeight);
                }
            }
        });

        // Draw center line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
    };

    const magA = calculateMagnitude(data);
    const magB = compareTo ? calculateMagnitude(compareTo) : 0;
    const dotProduct = compareTo ? calculateDotProduct(data, compareTo) : 0;
    const cosineSim = (magA > 0 && magB > 0) ? dotProduct / (magA * magB) : 0;

    return (
        <div className="vector-visualizer">
            <div className="viz-canvas-container">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={60}
                    style={{ width: '100%', height: '60px', display: 'block' }}
                />
            </div>

            <div className="vector-info">
                <span>Dim: {data.length}</span>
                <span className="vector-legend">
                    <span className="legend-item"><span className="dot negative"></span> Neg</span>
                    <span className="legend-item"><span className="dot positive"></span> Pos</span>
                    {compareTo && <span className="legend-item"><span className="dot compare"></span> Prev</span>}
                </span>
            </div>

            {compareTo && (
                <div className="vector-math">
                    <div className="math-row">
                        <span className="math-label">Cosine Similarity:</span>
                        <span className="math-value highlight">{cosineSim.toFixed(4)}</span>
                    </div>
                    <div className="math-details">
                        <div className="math-item">
                            <span>Dot Product:</span>
                            <span>{dotProduct.toFixed(2)}</span>
                        </div>
                        <div className="math-item">
                            <span>||A||:</span>
                            <span>{magA.toFixed(2)}</span>
                        </div>
                        <div className="math-item">
                            <span>||B||:</span>
                            <span>{magB.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="math-formula">
                        (A · B) / (||A|| * ||B||) = {dotProduct.toFixed(2)} / ({magA.toFixed(2)} * {magB.toFixed(2)})
                    </div>
                </div>
            )}
        </div>
    );
}
