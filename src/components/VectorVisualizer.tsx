import { useRef, useEffect } from 'react';

interface VectorVisualizerProps {
    data: number[];
}

export function VectorVisualizer({ data }: VectorVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        drawVisualization();
    }, [data]);

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

        // Normalize data for visualization (assuming values between -0.2 and 0.2 approx, scale to 0-1)
        // Find min/max for better scaling
        let min = 0;
        let max = 0;
        data.forEach(v => {
            if (v < min) min = v;
            if (v > max) max = v;
        });

        const range = Math.max(Math.abs(min), Math.abs(max));
        const scale = range > 0 ? 1 / range : 1;

        data.forEach((value, index) => {
            const x = index * barWidth;
            const normalizedValue = value * scale; // -1 to 1 conversation

            // Map -1..1 to hue (0..240 or similar)
            // Or use opacity/brightness on a single color
            // Let's use Red for negative, Blue for positive

            if (value > 0) {
                // Positive: Blue-ish
                const intensity = Math.min(1, Math.abs(normalizedValue));
                ctx.fillStyle = `rgba(59, 130, 246, ${intensity})`; // Tailwind blue-500
                const barHeight = (height / 2) * intensity;
                ctx.fillRect(x, height / 2 - barHeight, barWidth, barHeight);
            } else {
                // Negative: Red-ish
                const intensity = Math.min(1, Math.abs(normalizedValue));
                ctx.fillStyle = `rgba(239, 68, 68, ${intensity})`; // Tailwind red-500
                const barHeight = (height / 2) * intensity;
                ctx.fillRect(x, height / 2, barWidth, barHeight);
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

    return (
        <div className="vector-visualizer">
            <canvas
                ref={canvasRef}
                width={800}
                height={60}
                style={{ width: '100%', height: '60px', display: 'block' }}
            />
            <div className="vector-info">
                <span>Dimension: {data.length}</span>
                <span className="vector-legend">
                    <span className="legend-item"><span className="dot negative"></span> Negative</span>
                    <span className="legend-item"><span className="dot positive"></span> Positive</span>
                </span>
            </div>
        </div>
    );
}
