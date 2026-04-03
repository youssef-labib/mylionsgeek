/** Shared layout class names for PostCommentsSection variants. */

export function getSectionShellClass(isFacebookEmbed, embedded) {
    if (isFacebookEmbed) {
        return 'border-t border-border/50 px-3 pt-3 sm:px-4 dark:border-white/10';
    }
    if (embedded) {
        return 'border-t border-beta/10 px-3 pt-4 sm:px-4 dark:border-light/10';
    }
    return 'relative mx-auto flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-alpha/30 bg-white px-3 shadow-2xl dark:border-alpha/20 dark:bg-[#1b1d20] sm:px-4';
}

export function getTitleRowClass(isFacebookEmbed, embedded) {
    if (isFacebookEmbed) return 'mb-2';
    if (embedded) return 'mb-3 border-b border-beta/10 pb-2 dark:border-light/10';
    return 'border-b border-alpha/30 bg-gradient-to-r from-alpha/10 to-alpha/20 pt-6 pb-3 dark:border-alpha/30';
}

export function getTitleTextClass(isFacebookEmbed, embedded) {
    if (isFacebookEmbed) {
        return 'text-xs font-semibold tracking-wide text-muted-foreground uppercase dark:text-light/50';
    }
    if (embedded) return 'text-sm font-semibold text-beta dark:text-light';
    return 'text-lg font-bold tracking-wide text-alpha uppercase sm:text-base';
}

export function getComposerFormClass(isFacebookEmbed, embedded) {
    if (isFacebookEmbed) {
        return 'mb-3 flex items-end gap-2 border-b border-border/50 pb-3 dark:border-white/10';
    }
    if (embedded) {
        return 'mb-3 flex items-end gap-3 border-b border-beta/10 bg-light/80 pb-3 dark:border-light/10 dark:bg-dark/30';
    }
    return 'flex items-end gap-3 border-b border-alpha/20 bg-neutral-100/60 py-4 dark:bg-[#1b1d20]';
}

export function getListScrollBaseClass(isFacebookEmbed, embedded) {
    if (isFacebookEmbed) return 'space-y-2 py-1';
    if (embedded) return 'space-y-4 py-2';
    return 'scrollbar-thin scrollbar-thumb-alpha/30 dark:scrollbar-thumb-alpha/20 scrollbar-track-transparent flex-1 space-y-4 overflow-y-auto py-4';
}

export function getListWrapperClass(isFacebookEmbed, embedded, listScrollClass) {
    if (isFacebookEmbed) return listScrollClass;
    if (embedded) return `${listScrollClass} max-h-[min(50vh,420px)] overflow-y-auto`;
    return `${listScrollClass} min-h-0`;
}
