// src/components/name-popover.tsx
import { useEffect, useRef, useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function NamePopover({
    label,
    placeholder,
    trigger,
    onSubmit,
    defaultOpen = false,
}: {
    label: string;
    placeholder: string;
    trigger: React.ReactNode;
    onSubmit: (name: string, close: () => void) => void | Promise<void>;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) queueMicrotask(() => inputRef.current?.focus());
    }, [open]);

    function close() {
        setOpen(false);
        setName('');
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-2">
                    <div className="text-sm font-medium">{label}</div>
                    <Input
                        ref={inputRef}
                        value={name}
                        placeholder={placeholder}
                        onChange={(e) => setName(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onSubmit(name.trim(), close);
                        }}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={close}>
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onSubmit(name.trim(), close)}
                            disabled={!name.trim()}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
