// src/components/inline-rename-row.tsx
import { useState, useEffect, type KeyboardEvent } from 'react';

type InlineRenameRowProps = {
    label: string;
    onOpen: () => void;
    onRename: (name: string) => void | Promise<void>;
};

export function InlineRenameRow({
    label,
    onOpen,
    onRename,
}: InlineRenameRowProps) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(label);

    // Sync when label changes externally
    useEffect(() => {
        if (!editing) setVal(label);
    }, [label, editing]);

    function finishRename() {
        const next = val.trim();
        if (next && next !== label) {
            void Promise.resolve(onRename(next)).catch((err) =>
                console.error('rename error', err)
            );
        }
        setEditing(false);
    }

    function cancelRename() {
        setVal(label);
        setEditing(false);
    }

    function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') finishRename();
        else if (e.key === 'Escape') cancelRename();
    }

    return (
        <div
            className="group w-full flex items-center justify-between px-2 py-1 rounded hover:bg-accent"
            onDoubleClick={() => setEditing(true)}
        >
            {!editing ? (
                <button className="text-left truncate flex-1" onClick={onOpen}>
                    {label}
                </button>
            ) : (
                <input
                    className="bg-transparent flex-1 outline-none"
                    value={val}
                    onChange={(e) => setVal(e.currentTarget.value)}
                    onBlur={finishRename}
                    onKeyDown={onKeyDown}
                    autoFocus
                />
            )}
            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
                ↲ rename
            </span>
        </div>
    );
}
