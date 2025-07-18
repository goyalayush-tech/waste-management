import React, { useRef, useEffect } from 'react';
import { Card, Typography } from 'antd';
import { ContaminationLocation } from '../../store/slices/contaminationSlice';

const { Title } = Typography;

interface ContaminationVisualizerProps {
    imageUrl: string;
    contaminationLocations: ContaminationLocation[];
}

const ContaminationVisualizer: React.FC<ContaminationVisualizerProps> = ({
    imageUrl,
    contaminationLocations
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!imageUrl || !contaminationLocations.length) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Create a new image element
        const image = new Image();
        imageRef.current = image;

        image.onload = () => {
            // Set canvas dimensions to match the image
            canvas.width = image.width;
            canvas.height = image.height;

            // Draw the image on the canvas
            ctx.drawImage(image, 0, 0);

            // Draw contamination bounding boxes
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 3;

            contaminationLocations.forEach((location) => {
                ctx.strokeRect(location.x, location.y, location.width, location.height);

                // Add semi-transparent fill
                ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
                ctx.fillRect(location.x, location.y, location.width, location.height);

                // Add label
                ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.font = '14px Arial';
                ctx.fillText('Contamination', location.x, location.y - 5);
            });
        };

        image.src = imageUrl;

        // Cleanup
        return () => {
            if (imageRef.current) {
                imageRef.current.onload = null;
            }
        };
    }, [imageUrl, contaminationLocations]);

    return (
        <Card title="Contamination Visualization" className="visualization-card">
            <div className="canvas-container" style={{ overflow: 'auto', maxHeight: '500px' }}>
                <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
            </div>
            <div className="visualization-legend" style={{ marginTop: '16px' }}>
                <div className="legend-item">
                    <div className="color-box" style={{
                        display: 'inline-block',
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'rgba(255, 0, 0, 0.2)',
                        border: '2px solid rgba(255, 0, 0, 0.8)',
                        marginRight: '8px'
                    }}></div>
                    <span>Detected Contamination Area</span>
                </div>
            </div>
        </Card>
    );
};

export default ContaminationVisualizer;