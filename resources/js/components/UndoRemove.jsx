const UndoRemove = ({ state, onUndo }) => {
    if (!state) return null;

    return (
        <>
            <div
                className={`fixed ${state ? 'bottom-10' : '-bottom-50'} left-1/2 z-50 flex w-[260px] -translate-x-1/2 items-center justify-between gap-4 rounded-xl border border-dark/10 bg-alpha px-4 py-3 text-black shadow-lg backdrop-blur-sm dark:border-light/10 dark:text-black`}
            >
                <p className="text-sm font-medium">Post Removed</p>

                <button onClick={onUndo} className="cursor-pointer text-sm font-semibold underline transition hover:text-beta/70">
                    Undo
                </button>
            </div>
        </>
    );
};

export default UndoRemove;
