import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';

export interface DrawingCanvasRef {
  clearCanvas: () => void;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, {}>((props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const parent = canvas.parentElement;
        if (!parent) return;

        const setCanvasSize = () => {
            const { width } = parent.getBoundingClientRect();
            canvas.width = width * 2; // for retina display
            canvas.height = (width / 2) * 2; // 2:1 aspect ratio
            canvas.style.width = `${width}px`;
            canvas.style.height = `${width / 2}px`;

            const context = canvas.getContext('2d');
            if (context) {
                context.scale(2, 2);
                context.lineCap = 'round';
                context.strokeStyle = '#E4E4E7'; // zinc-200
                context.lineWidth = 4;
                contextRef.current = context;
            }
        };

        setCanvasSize();

        const resizeObserver = new ResizeObserver(setCanvasSize);
        resizeObserver.observe(parent);

        return () => resizeObserver.unobserve(parent);

    }, []);

    const getCoords = (event: MouseEvent | Touch) => {
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'clientX' in event ? event.clientX : 0;
        const clientY = 'clientY' in event ? event.clientY : 0;
        return {
          offsetX: clientX - rect.left,
          offsetY: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const nativeEvent = e.nativeEvent;
        const event = 'touches' in nativeEvent ? nativeEvent.touches[0] : nativeEvent;
        if (!event) return;
        const { offsetX, offsetY } = getCoords(event);
        contextRef.current?.beginPath();
        contextRef.current?.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        contextRef.current?.closePath();
        setIsDrawing(false);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const nativeEvent = e.nativeEvent;
        const event = 'touches' in nativeEvent ? nativeEvent.touches[0] : nativeEvent;
        if (!event) return;
        const { offsetX, offsetY } = getCoords(event);
        contextRef.current?.lineTo(offsetX, offsetY);
        contextRef.current?.stroke();
    };

    useImperativeHandle(ref, () => ({
        clearCanvas() {
            const canvas = canvasRef.current;
            const context = contextRef.current;
            if (canvas && context) {
                context.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }));
    
    return (
        <div className="w-full flex flex-col items-center gap-2">
            <div className="flex justify-end w-full">
                <button
                    onClick={() => ref && 'current' in ref && ref.current?.clearCanvas()}
                    className="flex items-center text-sm font-medium py-1 px-3 rounded-lg transition-colors bg-zinc-700/50 hover:bg-zinc-700/80 text-zinc-300"
                    aria-label="Zeichenbereich leeren"
                >
                    <span className="material-symbols-outlined mr-1 text-base">delete_sweep</span>
                    <span>Leeren</span>
                </button>
            </div>
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                onMouseLeave={finishDrawing}
                onTouchStart={startDrawing}
                onTouchEnd={finishDrawing}
                onTouchMove={draw}
                className="bg-zinc-800 rounded-lg cursor-crosshair"
            />
        </div>
    );
});

export default DrawingCanvas;