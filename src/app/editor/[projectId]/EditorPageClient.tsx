'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Menu, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => ({ default: mod.Excalidraw })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-slate-400">Loading Excalidraw...</div>
      </div>
    ),
  }
);

export default function EditorPageClient() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [showPages, setShowPages] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const excalidrawRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentPageIdRef = useRef<string>('page-1');

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/@excalidraw/excalidraw/dist/prod/index.css';
    document.head.appendChild(link);
    setIsReady(true);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const onMount = useCallback((excalidrawAPI: any) => {
    excalidrawRef.current = excalidrawAPI;
    
    // Load existing scene from MongoDB
    const loadScene = async () => {
      try {
        const { elements } = await api.getCanvas(projectId, 'default');
        if (elements && elements.length > 0) {
          excalidrawRef.current.updateScene({ elements });
        }
      } catch (error) {
        console.error('Failed to load scene:', error);
      }
    };
    loadScene();
  }, [projectId]);

  const onChange = useCallback(async () => {
    if (!excalidrawRef.current) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const elements = excalidrawRef.current.getSceneElements();
        await api.saveCanvas(projectId, 'default', elements);
      } catch (error) {
        console.error('Failed to save:', error);
      }
    }, 2000);
  }, [projectId]);

  const handleGenerateDiagram = async () => {
    if (!aiPrompt.trim() || !excalidrawRef.current) return;
    
    setIsGenerating(true);
    try {
      // Generate SVG instead of JSON diagram
      const result = await api.generateDiagramSvg(aiPrompt);
      
      if (result.svg) {
        // Convert SVG to base64 data URL
        const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(result.svg)));
        
        // Create image element for Excalidraw
        const imageElement = {
          id: `ai-img-${Date.now()}`,
          type: 'image' as const,
          x: 150,
          y: 150,
          width: 600,
          height: 400,
          strokeColor: '#000000',
          backgroundColor: 'transparent',
          fillStyle: 'solid' as const,
          strokeWidth: 0,
          strokeStyle: 'solid' as const,
          roughness: 0,
          opacity: 100,
          groupIds: [],
          roundness: null,
          boundElements: [],
          link: null,
          updated: Date.now(),
          version: 1,
          versionNonce: Math.floor(Math.random() * 1000000),
          isDeleted: false,
          seed: Math.floor(Math.random() * 1000000),
          parentId: null,
          requestId: null,
          focus: false,
          pointerOffset: { x: 0, y: 0 },
          zipper: false,
          startBinding: null,
          endBinding: null,
          lastCommittedPoint: null,
          startArrowhead: null,
          endArrowhead: null,
          text: null,
          fontFamily: 1,
          fontSize: 20,
          textAlign: 'center' as const,
          textVerticalAlign: 'middle' as const,
          baseline: 14,
          containerId: null,
          originalText: null,
          lineHeight: 1.25,
          data: {
            url: svgDataUrl,
            naturalWidth: 600,
            naturalHeight: 400,
            mimeType: 'image/svg+xml',
            generatedId: `ai-img-${Date.now()}`,
            hash: Date.now().toString(),
          },
          status: 'pending' as const,
          fileId: `ai-img-${Date.now()}`,
        };
        
        toast.success('SVG diagram added!');
        setShowAIDialog(false);
        setAiPrompt('');
      }
    } catch (error) {
      console.error('Failed:', error);
      toast.error('Failed to generate diagram');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <header className="h-12 sm:h-14 border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/projects" className="flex items-center">
            <Button variant="ghost" size="sm" className="px-2 sm:px-3">
              <ArrowLeft className="w-4 h-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Projects</span>
            </Button>
          </Link>
          <div className="h-5 sm:h-6 w-px bg-slate-700 hidden sm:block" />
          <div className="min-w-0">
            <h1 className="font-semibold text-white text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
              {projectId}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowPages(!showPages)} className="px-2 sm:px-3">
            {showPages ? <X className="w-4 h-4 sm:mr-2" /> : <Menu className="w-4 h-4 sm:mr-2" />}
            <span className="hidden sm:inline">{showPages ? 'Close' : 'Pages'}</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <Excalidraw excalidrawAPI={onMount} />
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setShowAIDialog(true)}
            className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-xl"
            size="icon"
          >
            <Sparkles className="w-6 h-6" />
          </Button>
        </div>
      </div>

      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Diagram Generator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Describe:</label>
              <Input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., TCP/IP layers..."
                className="bg-slate-800 border-slate-700 text-white"
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateDiagram(); }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAIDialog(false)}>Cancel</Button>
              <Button onClick={handleGenerateDiagram} disabled={!aiPrompt.trim() || isGenerating} className="bg-purple-600 hover:bg-purple-700">
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
