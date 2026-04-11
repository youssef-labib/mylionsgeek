import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Mic, Paperclip, Send, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import AudioRecorder from './AudioRecorder';

// Component dial input dial message
export default function MessageInput({
    newMessage,
    setNewMessage,
    sending,
    isRecording,
    recordingTime,
    attachment,
    setAttachment,
    audioBlob,
    audioURL,
    setAudioBlob,
    setAudioURL,
    mediaRecorderRef,
    fileInputRef,
    handleFileSelect,
    startRecording,
    stopRecording,
    cancelRecording,
    handleSendMessage,
    isExpanded,
    audioDuration,
    onTypingStart,
    onTypingStop,
    isPaused,
    onPause,
    onResume,
}) {
    // Typing indicator management
    const typingTimeoutRef = useRef(null);
    const hasTypedRef = useRef(false);
    const lastTypingTimeRef = useRef(0);

    // Handle typing events on input change - triggers typing indicator
    const handleInputChange = (e) => {
        const value = e.target.value;
        setNewMessage(value);

        if (!onTypingStart || !onTypingStop) return;

        // Only trigger if user is actually typing (has content)
        if (value.trim().length > 0) {
            const now = Date.now();

            // Debounce typing start - only trigger every 1 second max
            if (!hasTypedRef.current || now - lastTypingTimeRef.current > 1000) {
                onTypingStart();
                hasTypedRef.current = true;
                lastTypingTimeRef.current = now;
            }

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                onTypingStop();
                hasTypedRef.current = false;
            }, 2000);
        } else {
            // Stop typing if input is cleared
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            onTypingStop();
            hasTypedRef.current = false;
        }
    };

    // Stop typing when message is sent or component unmounts
    useEffect(() => {
        if (!newMessage.trim() && hasTypedRef.current && onTypingStop) {
            onTypingStop();
            hasTypedRef.current = false;
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (hasTypedRef.current && onTypingStop) {
                onTypingStop();
            }
        };
    }, [newMessage, onTypingStop]);

    // Format audio duration
    const formatAudioDuration = (seconds) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    return (
        <form onSubmit={handleSendMessage} className="shrink-0 border-t bg-alpha/5 p-4">
            {/* Attachment Preview */}
            {attachment && (
                <div className="mb-2 flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                    {attachment.type.startsWith('image/') ? (
                        <span className="text-xs">📷 Image selected</span>
                    ) : (
                        <span className="text-xs">📎 {attachment.name}</span>
                    )}
                    <Button type="button" variant="ghost" size="sm" onClick={() => setAttachment(null)} className="ml-auto h-6 w-6">
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Audio Preview */}
            {audioURL && audioBlob && (
                <div className="mb-2 flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    <span className="flex-1 text-xs">Voice message ready</span>
                    {audioDuration && <span className="text-xs text-muted-foreground tabular-nums">{formatAudioDuration(audioDuration)}</span>}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setAudioBlob(null);
                            setAudioURL(null);
                        }}
                        className="h-6 w-6"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Recording Indicator - Instagram Style */}
            {isRecording && (
                <div className="mb-2">
                    <AudioRecorder
                        onSend={() => {
                            stopRecording();
                            // Wait a bit bach audio blob ykon ready
                            setTimeout(() => {
                                if (audioBlob) {
                                    handleSendMessage(new Event('submit'));
                                }
                            }, 100);
                        }}
                        onCancel={cancelRecording}
                        isRecording={isRecording}
                        isPaused={isPaused}
                        onPause={onPause}
                        onResume={onResume}
                        recordingTime={recordingTime}
                    />
                </div>
            )}

            <div className="flex items-end gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 w-9 shrink-0 hover:bg-alpha/10"
                    title="Attach file"
                >
                    <Paperclip className="h-4 w-4" />
                </Button>

                <div className="relative flex-1">
                    <Input
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        className={cn('h-9 pr-12 text-sm', isExpanded && 'h-10 text-base')}
                        disabled={sending || isRecording}
                    />
                </div>

                {!isRecording ? (
                    <>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.preventDefault();
                                startRecording();
                            }}
                            className="h-9 w-9 shrink-0 hover:bg-alpha/10"
                            title="Record audio"
                        >
                            <Mic className="h-4 w-4" />
                        </Button>
                        <Button
                            type="submit"
                            size="icon"
                            disabled={sending || (!newMessage.trim() && !attachment && !audioBlob)}
                            className="h-9 w-9 shrink-0 bg-alpha text-black hover:bg-alpha/90 disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </>
                ) : null}
            </div>
        </form>
    );
}
