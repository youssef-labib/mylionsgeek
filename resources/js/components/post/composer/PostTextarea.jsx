const PostTextarea = ({ id, value, onChange, placeholder, disabled = false }) => (
    <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[120px] w-full resize-none rounded-xl bg-transparent p-4 text-lg whitespace-pre-wrap text-[var(--color-beta)] placeholder-[var(--color-dark_gray)] transition-all duration-200 outline-none hover:bg-[var(--color-light)]/40 focus:bg-[var(--color-light)] disabled:opacity-60 dark:text-[var(--color-light)] dark:placeholder-[var(--color-light)]/50 dark:hover:bg-[var(--color-dark_gray)]/40 dark:focus:bg-[var(--color-dark_gray)]"
        rows={4}
    />
);

export default PostTextarea;
