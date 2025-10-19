import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Wrench, FileText, Clock, CheckCircle } from 'lucide-react';
import { CodeViewer } from '../components/CodeViewer';
import { FindingCard } from '../components/FindingCard';
import { DiffDrawer } from '../components/DiffDrawer';
import { Spinner } from '../components/Spinner';
import { useAppStore } from '../lib/store';
import { api } from '../lib/api';
import type { Task, Finding, FileType } from '../lib/types';
import { fileTypeIconMap } from '../lib/types';
import { formatDate } from '../lib/utils';

export function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useAppStore((state) => state.addToast);
  const setLoading = useAppStore((state) => state.setLoading);
  const setCurrentTask = useAppStore((state) => state.setCurrentTask);
  const selectedFinding = useAppStore((state) => state.selectedFinding);
  const setSelectedFinding = useAppStore((state) => state.setSelectedFinding);
  
  const [task, setTask] = useState<Task | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAutofixing, setIsAutofixing] = useState(false);
  const [diff, setDiff] = useState<string>('');
  const [showDiffDrawer, setShowDiffDrawer] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchTask = async () => {
      try {
        const taskData = await api.getTask(id);
        setTask(taskData);
        setCurrentTask(taskData);
      } catch (error) {
        addToast({
          title: 'Failed to load task',
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
          type: 'error',
        });
        navigate('/');
      }
    };

    fetchTask();
  }, [id, navigate, addToast, setCurrentTask]);

  useEffect(() => {
    if (!task || task.state !== 'INGESTED') return;

    // Auto-trigger analysis for INGESTED tasks
    const autoAnalyze = async () => {
      try {
        setIsAnalyzing(true);
        setLoading(true);
        const findings = await api.analyzeTask(task.id);
        setTask(prev => prev ? { ...prev, findings, state: 'ANALYZED' } : null);
        setCurrentTask({ ...task, findings, state: 'ANALYZED' });
        
        addToast({
          title: 'Analysis completed',
          description: `Found ${findings.length} security issues.`,
          type: 'success',
        });
      } catch (error) {
        addToast({
          title: 'Analysis failed',
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
          type: 'error',
        });
      } finally {
        setIsAnalyzing(false);
        setLoading(false);
      }
    };

    autoAnalyze();
  }, [task, addToast, setCurrentTask]);

  const handleAnalyze = async () => {
    if (!task) return;

    try {
      setIsAnalyzing(true);
      setLoading(true);
      const findings = await api.analyzeTask(task.id);
      setTask(prev => prev ? { ...prev, findings, state: 'ANALYZED' } : null);
      setCurrentTask({ ...task, findings, state: 'ANALYZED' });
      
      addToast({
        title: 'Analysis completed',
        description: `Found ${findings.length} security issues.`,
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        type: 'error',
        action: {
          label: 'Retry',
          onClick: handleAnalyze,
        },
      });
    } finally {
      setIsAnalyzing(false);
      setLoading(false);
    }
  };

  const handleAutofix = async () => {
    if (!task) return;

    try {
      setIsAutofixing(true);
      setLoading(true);
      const diffResult = await api.autofixTask(task.id);
      setDiff(diffResult);
      setShowDiffDrawer(true);
      
      // Update task state to PATCHED after successful autofix
      setTask(prev => prev ? { ...prev, state: 'PATCHED', patchDiff: diffResult } : null);
      setCurrentTask({ ...task, state: 'PATCHED', patchDiff: diffResult });
      
      addToast({
        title: 'Autofix generated',
        description: 'Review the suggested changes below.',
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Autofix failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        type: 'error',
        action: {
          label: 'Retry',
          onClick: handleAutofix,
        },
      });
    } finally {
      setIsAutofixing(false);
      setLoading(false);
    }
  };

  const handleFindingSelect = (finding: Finding) => {
    setSelectedFinding(finding);
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'ANALYZED':
      case 'PLANNED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PATCHED':
        return <Wrench className="h-4 w-4 text-blue-500" />;
      case 'VERIFIED':
      case 'REPORTED':
      case 'DONE':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'INGESTED':
        return <Spinner size="sm" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'ANALYZED':
      case 'PLANNED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PATCHED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'VERIFIED':
      case 'REPORTED':
      case 'DONE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'INGESTED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!task) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Task {task.id}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{fileTypeIconMap[task.fileType as FileType]}</span>
                  <span className="font-medium">{task.fileType.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStateIcon(task.state)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(task.state)}`}>
                    {task.state}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {formatDate(task.createdAt)}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || task.state === 'INGESTED' || task.state === 'ANALYZED'}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? <Spinner size="sm" /> : <Play className="h-4 w-4" />}
                Analyze
              </button>
              
              {task.findings && task.findings.length > 0 && task.state !== 'PATCHED' && (
                <button
                  onClick={handleAutofix}
                  disabled={isAutofixing}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAutofixing ? <Spinner size="sm" /> : <Wrench className="h-4 w-4" />}
                  Autofix
                </button>
              )}
              
              {task.state === 'PATCHED' && (
                <button
                  onClick={() => setShowDiffDrawer(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Wrench className="h-4 w-4" />
                  View Patch
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Code Viewer */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Original Content
            </h2>
            <CodeViewer
              value={task.input.text || ''}
              language={task.fileType === 'k8s' ? 'yaml' : 'dockerfile'}
              highlightRange={selectedFinding?.lineRange ? [selectedFinding.lineRange[0], selectedFinding.lineRange[1]] : undefined}
            />
          </div>

          {/* Right: Findings */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Security Findings ({task.findings?.length || 0})
            </h2>
            
            {task.findings && task.findings.length > 0 ? (
              <div className="space-y-4">
                {task.findings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    isSelected={selectedFinding?.id === finding.id}
                    onSelect={() => handleFindingSelect(finding)}
                  />
                ))}
              </div>
            ) : task.state === 'ANALYZED' || task.state === 'PLANNED' ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No critical issues detected</h3>
                <p className="text-muted-foreground">
                  Your configuration appears to be secure!
                </p>
              </div>
            ) : task.state === 'INGESTED' ? (
              <div className="text-center py-12">
                <Spinner size="lg" className="mx-auto mb-4" />
                <p className="text-muted-foreground">Analyzing configuration...</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Spinner size="lg" className="mx-auto mb-4" />
                <p className="text-muted-foreground">Processing...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diff Drawer */}
      <DiffDrawer
        diff={diff || task.patchDiff || ''}
        originalContent={task.input.text || ''}
        isOpen={showDiffDrawer}
        onClose={() => setShowDiffDrawer(false)}
      />
    </div>
  );
}
