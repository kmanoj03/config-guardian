import { useState } from 'react';
import { Shield, Copy, Check, Link, ExternalLink, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { fetchEnvelope, verifyEnvelope } from './api';
import { isAgentAddr, short, fmtTime, copyToClipboard } from './utils';
import type { Envelope, VerifyResp } from './types';

export default function ProvenancePage() {
  const navigate = useNavigate();
  const [taskId, setTaskId] = useState('');
  const [envelope, setEnvelope] = useState<Envelope | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResp | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedAgent, setCopiedAgent] = useState(false);
  const [copiedEnvelope, setCopiedEnvelope] = useState(false);

  const handleBuildEnvelope = async () => {
    if (!taskId.trim()) {
      toast.error('Please enter a task ID');
      return;
    }

    setIsLoading(true);
    setEnvelope(null); // Clear previous envelope
    setVerifyResult(null); // Clear previous verification result
    try {
      const result = await fetchEnvelope(taskId.trim());
      console.log('Frontend received envelope:', result);
      
      if (!result) {
        toast.error('No envelope data received from server');
        return;
      }
      
      setEnvelope(result);
      toast.success('Envelope ready');
    } catch (error) {
      let errorMessage = 'Failed to build envelope';
      
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = `Task ID "${taskId.trim()}" not found. Please use a valid task ID.`;
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid task ID format. Please check your input.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      console.error('Error building envelope:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!envelope) return;

    setIsVerifying(true);
    try {
      const result = await verifyEnvelope(envelope);
      setVerifyResult(result);
      if (result.ok) {
        toast.success('Envelope verified successfully');
      } else {
        toast.error('Envelope verification failed - hash mismatch');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify envelope';
      toast.error(errorMessage);
      console.error('Error verifying envelope:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyHash = async () => {
    if (!envelope) return;
    await copyToClipboard(envelope.hash);
    setCopiedHash(true);
    toast.success('Hash copied to clipboard');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyAgent = async () => {
    if (!envelope) return;
    await copyToClipboard(envelope.publishHint);
    setCopiedAgent(true);
    toast.success('Agent address copied to clipboard');
    setTimeout(() => setCopiedAgent(false), 2000);
  };

  const handleCopyEnvelope = async () => {
    if (!envelope) return;
    await copyToClipboard(JSON.stringify(envelope, null, 2));
    setCopiedEnvelope(true);
    toast.success('Envelope JSON copied to clipboard');
    setTimeout(() => setCopiedEnvelope(false), 2000);
  };

  const handleOpenAgentverse = () => {
    if (!envelope) return;
    const agentverseBase = import.meta.env.VITE_AGENTVERSE_BASE || 'https://agentverse.ai/agents/';
    const agentId = envelope.publishHint.replace('agent1', '');
    window.open(`${agentverseBase}${agentId}`, '_blank');
  };

  const handleOpenUrl = () => {
    if (!envelope) return;
    window.open(envelope.publishHint, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Provenance</h1>
              <p className="text-muted-foreground">Hash, agent, and verification</p>
            </div>
          </div>
        </div>

        {/* Task Form */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-5 space-y-4 mb-6">
          <div>
            <label htmlFor="taskId" className="block text-sm font-medium mb-2">
              Task ID
            </label>
            <div className="flex gap-2">
              <input
                id="taskId"
                type="text"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                placeholder="Enter task ID (e.g., tsk_1760893773359)"
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleBuildEnvelope}
                disabled={isLoading || !taskId.trim()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Building...' : 'Build Envelope'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Tip: Create a task first by analyzing a configuration file, then use the task ID from the URL or task details.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5 space-y-4 mb-6">
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Building envelope...</span>
              </div>
            </div>
          </div>
        )}

        {/* Envelope Card */}
        {envelope && !isLoading && (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5 space-y-4 mb-6">
            <h2 className="text-xl font-semibold">Envelope</h2>
            
            {/* Hash */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Hash
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-lg font-mono text-sm">
                  {envelope.hash}
                </code>
                <button
                  onClick={handleCopyHash}
                  className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                  aria-label="Copy hash"
                >
                  {copiedHash ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Created At */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Created At
              </label>
              <p className="text-sm">{fmtTime(envelope.createdAt)}</p>
            </div>

            {/* Agent Address or URL */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {isAgentAddr(envelope.publishHint) ? 'Anchored by Agent' : 'Receipt URL'}
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-lg font-mono text-sm">
                  {isAgentAddr(envelope.publishHint) 
                    ? short(envelope.publishHint, 20)
                    : envelope.publishHint
                  }
                </code>
                <button
                  onClick={handleCopyAgent}
                  className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                  aria-label="Copy agent address"
                >
                  {copiedAgent ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
                {isAgentAddr(envelope.publishHint) ? (
                  <button
                    onClick={handleOpenAgentverse}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    aria-label="Open Agentverse"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Agentverse
                  </button>
                ) : (
                  <button
                    onClick={handleOpenUrl}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    aria-label="Open URL"
                  >
                    <Link className="h-4 w-4" />
                    Open
                  </button>
                )}
              </div>
            </div>


            {/* Payload Summary */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Payload Summary
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">File Type:</span> {envelope.payload?.fileType || 'Unknown'}
                </div>
                <div>
                  <span className="font-medium">Findings:</span> {envelope.payload?.findings?.length || 0}
                </div>
                <div className="md:col-span-1">
                  <span className="font-medium">Summary:</span> {short(envelope.payload?.summary || 'No summary available', 50)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleCopyEnvelope}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                {copiedEnvelope ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedEnvelope ? 'Copied!' : 'Copy Envelope JSON'}
              </button>
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isVerifying ? 'Verifying...' : 'Verify Locally'}
              </button>
            </div>
          </div>
        )}

        {/* Verify Result Card */}
        {verifyResult && (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="text-xl font-semibold">Verification Result</h2>
            
            <div className="flex items-center gap-3">
              {verifyResult.ok ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg dark:bg-green-900 dark:text-green-200">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg dark:bg-red-900 dark:text-red-200">
                  <Shield className="h-5 w-5" />
                  <span className="font-semibold">Mismatch</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Recomputed Hash
                </label>
                <code className="block px-3 py-2 bg-muted rounded-lg font-mono text-sm">
                  {verifyResult.recomputed}
                </code>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Provided Hash
                </label>
                <code className="block px-3 py-2 bg-muted rounded-lg font-mono text-sm">
                  {verifyResult.provided}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
