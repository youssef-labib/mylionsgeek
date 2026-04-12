import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { router, usePage } from '@inertiajs/react';
import { Info, X } from 'lucide-react';

// Header dial chatbox m3a 3amaliyet toolbox
export default function ChatHeader({ conversation, onClose, onBack, onToolboxToggle }) {
    const { auth } = usePage().props;
    const roles = Array.isArray(auth?.user?.role) ? auth.user.role : auth?.user?.role ? [auth.user.role] : [];
    const isRecruiter = roles.includes('recruiter');

    const openPeerProfile = () => {
        if (isRecruiter) {
            return;
        }
        router.visit(`/students/${conversation.other_user.id}`);
    };

    return (
        <div className="flex shrink-0 items-center gap-3 border-b bg-background px-5 py-4">
            {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 h-10 w-10 md:hidden">
                    <X className="h-5 w-5" />
                </Button>
            )}
            <button
                type="button"
                onClick={openPeerProfile}
                className={`flex min-w-0 flex-1 items-center gap-3 ${isRecruiter ? 'cursor-default' : 'cursor-pointer transition-opacity hover:opacity-80'}`}
            >
                <Avatar
                    className="h-11 w-11 flex-shrink-0 cursor-pointer ring-2 ring-primary/10"
                    image={conversation.other_user.image}
                    name={conversation.other_user.name}
                />
                <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-base font-semibold">{conversation.other_user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">Active now</p>
                </div>
            </button>
            <Button variant="ghost" size="icon" onClick={onToolboxToggle} className="h-10 w-10 hover:bg-alpha/10" title="Toolbox">
                <Info className="h-5 w-5 text-alpha" />
            </Button>
            {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10">
                    <X className="h-5 w-5" />
                </Button>
            )}
        </div>
    );
}
