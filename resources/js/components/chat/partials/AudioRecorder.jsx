import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pause, Play, Send, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

// Component dial audio recording style Instagram m3a waves animation w timer
export default function AudioRecorder({ onSend, onCancel, isRecording, recordingTime, isPaused, onPause, onResume }) {
    const animationRef = useRef(null);
    const barsRef = useRef([]);

    // Animation dial waves bach tban b7al real audio
    useEffect(() => {
        if (!isRecording) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            return;
        }

        const animate = () => {
            barsRef.current.forEach((bar, index) => {
                if (bar) {
                    const level = Math.random() * 0.8 + 0.2;
                    const height = (Math.sin(Date.now() / 100 + index * 0.5) * 0.5 + 0.5) * 100 * level;
                    bar.style.height = `${Math.max(10, height)}%`;
                }
            });
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isRecording]);

    // Format dial time (MM:SS)
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-2 rounded-lg border border-alpha/20 bg-alpha/10 p-2">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="h-8 w-8 text-alpha hover:bg-alpha/20"
                title="Cancel recording"
            >
                <X className="h-4 w-4" />
            </Button>

            {/* Pause/Resume Button */}
            {isPaused ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onResume}
                    className="h-8 w-8 text-alpha hover:bg-alpha/20"
                    title="Resume recording"
                >
                    <Play className="h-4 w-4" />
                </Button>
            ) : (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onPause}
                    className="h-8 w-8 text-alpha hover:bg-alpha/20"
                    title="Pause recording"
                >
                    <Pause className="h-4 w-4" />
                </Button>
            )}

            <div className="flex flex-1 items-center gap-2">
                <div className={cn('h-3 w-3 rounded-full bg-alpha', isPaused ? '' : 'animate-pulse')} />
                <span className="min-w-[3rem] text-sm font-medium text-foreground tabular-nums">{formatTime(recordingTime)}</span>
                <div className="flex h-8 flex-1 items-center justify-center gap-0.5 overflow-hidden">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            ref={(el) => (barsRef.current[i] = el)}
                            className={cn(
                                'w-0.5 rounded-full bg-alpha transition-all duration-100 ease-out',
                                isRecording && !isPaused ? 'opacity-100' : 'opacity-30',
                            )}
                            style={{ height: '10%' }}
                        />
                    ))}
                </div>
            </div>

            <Button
                type="button"
                size="icon"
                onClick={onSend}
                className="h-9 w-9 shrink-0 bg-alpha text-black hover:bg-alpha/90 disabled:opacity-50"
                title="Send audio"
            >
                <Send className="h-4 w-4" />
            </Button>
        </div>
    );
}
