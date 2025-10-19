import { useState } from 'react';
import { X, Copy, Download, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { copyToClipboard, downloadFile, reconstructPatchedFileFromDiff } from '../lib/utils';

interface DiffDrawerProps {
  diff: string;
  originalContent?: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function DiffDrawer({ 
  diff, 
  originalContent, 
  isOpen, 
  onClose, 
  className 
}: DiffDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPatched = async () => {
    const patchedContent = reconstructPatchedFileFromDiff(diff, originalContent);
    await copyToClipboard(patchedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPatched = () => {
    const patchedContent = reconstructPatchedFileFromDiff(diff, originalContent);
    downloadFile(patchedContent, 'patched-file.txt', 'text/plain');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={cn(
        'relative bg-background border-t sm:border rounded-t-lg sm:rounded-lg shadow-xl',
        'w-full max-w-4xl max-h-[80vh] flex flex-col',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Autofix Diff</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Actions */}
          <div className="p-4 border-b border-border">
            <div className="flex gap-2">
              <button
                onClick={handleCopyPatched}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Patched File'}
              </button>
              <button
                onClick={handleDownloadPatched}
                className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Patched File
              </button>
            </div>
          </div>
          
          {/* Diff Viewer */}
          <div className="flex-1 overflow-auto p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {diff}
            </pre>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            Apply Later
          </button>
        </div>
      </div>
    </div>
  );
}
