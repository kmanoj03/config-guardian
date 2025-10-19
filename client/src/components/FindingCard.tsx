import { cn } from '../lib/utils';
import type { Finding } from '../lib/types';
import { SeverityBadge } from './SeverityBadge';

interface FindingCardProps {
  finding: Finding;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function FindingCard({ 
  finding, 
  isSelected = false, 
  onSelect, 
  className 
}: FindingCardProps) {
  return (
    <div
      className={cn(
        'border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md',
        isSelected 
          ? 'border-primary bg-primary/5 shadow-md' 
          : 'border-border hover:border-primary/50',
        className
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-medium text-sm leading-tight">{finding.title}</h3>
        <SeverityBadge severity={finding.severity} />
      </div>
      
      <div className="space-y-3 text-sm">
        <div>
          <h4 className="font-medium text-xs text-muted-foreground mb-1">Evidence</h4>
          <p className="font-mono text-xs bg-muted p-2 rounded border">
            {finding.evidence}
          </p>
        </div>
        
        <div>
          <h4 className="font-medium text-xs text-muted-foreground mb-1">Rationale</h4>
          <p className="text-muted-foreground">{finding.rationale}</p>
        </div>
        
        <div>
          <h4 className="font-medium text-xs text-muted-foreground mb-1">Recommendation</h4>
          <p className="text-muted-foreground">{finding.recommendation}</p>
        </div>
        
        {finding.lineRange && (
          <div className="text-xs text-muted-foreground">
            Lines {finding.lineRange[0]}-{finding.lineRange[1]}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          Source: {finding.source}
        </span>
        {finding.lineRange && (
          <span className="text-xs text-muted-foreground">
            {finding.lineRange[1] - finding.lineRange[0] + 1} line(s)
          </span>
        )}
      </div>
    </div>
  );
}
