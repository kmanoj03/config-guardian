import { useState } from 'react';
import { X, Copy, Download, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { copyToClipboard, downloadFile } from '../lib/utils';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useTheme } from '../lib/store';

interface DiffDrawerProps {
  diff: string;
  originalContent?: string;
  patchedContent?: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function DiffDrawer({ 
  diff, 
  originalContent, 
  patchedContent,
  isOpen, 
  onClose, 
  className 
}: DiffDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [showUnified, setShowUnified] = useState(false);
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  const handleCopyPatched = async () => {
    if (patchedContent) {
      await copyToClipboard(patchedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPatched = () => {
    if (patchedContent) {
      downloadFile(patchedContent, 'patched-file.txt', 'text/plain');
    }
  };

  const handleDownloadOriginal = () => {
    if (originalContent) {
      downloadFile(originalContent, 'original-file.txt', 'text/plain');
    }
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
            <div className="flex gap-2 flex-wrap">
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
                Download Patched
              </button>
              <button
                onClick={handleDownloadOriginal}
                className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Original
              </button>
              <button
                onClick={() => setShowUnified(!showUnified)}
                className="flex items-center gap-2 px-3 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                {showUnified ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showUnified ? 'Hide Unified' : 'Show Unified'}
              </button>
            </div>
          </div>
          
          {/* Diff Viewer */}
          <div className="flex-1 overflow-auto">
            {showUnified ? (
              <div className="p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap bg-muted p-4 rounded-lg dark:bg-gray-800 dark:text-gray-200">
                  {diff}
                </pre>
              </div>
            ) : (
              <ReactDiffViewer
                oldValue={originalContent || ''}
                newValue={patchedContent || ''}
                splitView={true}
                showDiffOnly={false}
                useDarkTheme={isDarkMode}
                leftTitle="Original"
                rightTitle="Patched"
                styles={{
                  diffContainer: {
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                    fontSize: '14px',
                  },
                  ...(isDarkMode ? {
                    // Dark mode styles
                    diffRemoved: {
                      backgroundColor: '#7f1d1d',
                      color: '#fca5a5',
                    },
                    diffAdded: {
                      backgroundColor: '#14532d',
                      color: '#86efac',
                    },
                    lineNumber: {
                      color: '#9ca3af',
                    },
                    gutter: {
                      backgroundColor: '#1f2937',
                      borderRight: '1px solid #374151',
                    },
                    diffViewerBackground: '#111827',
                    diffViewerColor: '#e5e7eb',
                  } : {
                    // Light mode styles
                    diffRemoved: {
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                    },
                    diffAdded: {
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                    },
                    lineNumber: {
                      color: '#6b7280',
                    },
                    gutter: {
                      backgroundColor: '#f9fafb',
                      borderRight: '1px solid #e5e7eb',
                    },
                    diffViewerBackground: '#ffffff',
                    diffViewerColor: '#1f2937',
                  }),
                }}
              />
            )}
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
