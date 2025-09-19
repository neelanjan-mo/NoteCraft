// src/app/bottom-bar.tsx
import { Button } from '@/components/ui/button';

export function BottomBar({
    onNewPage,
    onNewFolder,
}: {
    onNewPage: () => void;
    onNewFolder: () => void;
}) {
    return (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto max-w-screen-lg flex items-center justify-between px-3 py-2">
                <div className="font-medium">NoteCraft</div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onNewFolder}>
                        New Folder
                    </Button>
                    <Button variant="outline" onClick={onNewPage}>
                        New Page
                    </Button>
                </div>
            </div>
        </div>
    );
}
