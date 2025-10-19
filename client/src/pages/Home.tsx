import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Image, Play } from 'lucide-react';
import { Tabs } from '../components/Tabs';
import { ImageDropzone } from '../components/ImageDropzone';
import { useAppStore } from '../lib/store';
import { api } from '../lib/api';
import type { FileType } from '../lib/types';

export function Home() {
  const navigate = useNavigate();
  const addToast = useAppStore((state) => state.addToast);
  const setLoading = useAppStore((state) => state.setLoading);
  const isLoading = useAppStore((state) => state.isLoading);
  
  const [activeTab, setActiveTab] = useState('text');
  const [content, setContent] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [fileType, setFileType] = useState<FileType>('dockerfile');

  // Reset loading state when component mounts (e.g., when returning from task page)
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  const handleAnalyze = async () => {
    if (!content.trim() && !imageBase64) {
      addToast({
        title: 'No content provided',
        description: 'Please provide either text content or upload an image.',
        type: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Show immediate feedback that analysis has started
      addToast({
        title: 'Analysis started',
        description: 'Your configuration is being analyzed...',
        type: 'info',
      });
      
      // Step 1: Create the task
      const taskId = await api.createTask(content, fileType, imageBase64 || undefined);
      
      // Step 2: Immediately analyze the task
      const findings = await api.analyzeTask(taskId);
      
      // Step 3: Show success toast with results
      addToast({
        title: 'Analysis completed',
        description: `Found ${findings.length} security issues in your ${fileType} configuration.`,
        type: 'success',
      });
      
      // Step 4: Navigate to the task page (which will already be analyzed)
      navigate(`/task/${taskId}`);
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
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'text',
      label: 'Paste Text',
      content: (
        <div className="space-y-4">
          <div>
            <label htmlFor="fileType" className="block text-sm font-medium mb-2">
              File Type
            </label>
            <select
              id="fileType"
              value={fileType}
              onChange={(e) => setFileType(e.target.value as FileType)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="dockerfile">Dockerfile</option>
              <option value="k8s">Kubernetes YAML</option>
              <option value="env">Environment File</option>
              <option value="nginx">Nginx Config</option>
              <option value="iam">IAM Policy</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Configuration Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your configuration file content here..."
              className="w-full h-64 px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'image',
      label: 'Upload Image',
      content: (
        <div className="space-y-4">
          <div>
            <label htmlFor="fileType" className="block text-sm font-medium mb-2">
              File Type
            </label>
            <select
              id="fileType"
              value={fileType}
              onChange={(e) => setFileType(e.target.value as FileType)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="dockerfile">Dockerfile</option>
              <option value="k8s">Kubernetes YAML</option>
              <option value="env">Environment File</option>
              <option value="nginx">Nginx Config</option>
              <option value="iam">IAM Policy</option>
            </select>
          </div>
          
          <ImageDropzone onBase64={setImageBase64} />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Shield className="h-16 w-16 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">
            AI-Powered Config Security
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Analyze your configuration files for security vulnerabilities and get instant fixes.
            Supports both text input and image uploads.
          </p>
          
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Text Analysis
            </div>
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Image Analysis
            </div>
          </div>
        </div>
      </div>
      
      {/* Analysis Form */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-6">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={(!content.trim() && !imageBase64) || isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="h-4 w-4" />
                Analyze Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
