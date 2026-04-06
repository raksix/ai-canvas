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

  const onMount = useCallback((api: any) => {
    excalidrawRef.current = api;
    
    // Load existing scene from MongoDB
    const loadScene = async () => {
      try {
        const { elements } = await api.getCanvas(projectId, 'default');
        if (elements && elements.length > 0) {
          excalidrawRef.current.addElements(elements);
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
      const result = await api.generateDiagram(aiPrompt);
      
      if (result.nodes && result.edges) {
        const elements: any[] = [];
        let offsetX = 100;
        let offsetY = 100;
        
        result.nodes.forEach((node: any, index: number) => {
          const x = node.x || offsetX + (index % 3) * 200;
          const y = node.y || offsetY + Math.floor(index / 3) * 100;
          
          elements.push({
            type: node.type === 'circle' ? 'ellipse' : 'rectangle',
            x,
            y,
            width: 150,
            height: 60,
            text: node.label,
            strokeColor: '#1971c2',
            backgroundColor: node.type === 'circle' ? '#e3fafc' : '#e9ecef',
            fillStyle: 'solid',
            strokeWidth: 2,
            borderRadius: node.type === 'circle' ? 75 : 5,
          });
        });
        
        result.edges.forEach((edge: any) => {
          const fromNode = result.nodes.find((n: any) => n.id === edge.from);
          const toNode = result.nodes.find((n: any) => n.id === edge.to);
          
          if (fromNode && toNode) {
            const fromX = (fromNode.x || offsetX) + 75;
            const fromY = (fromNode.y || offsetY) + 60;
            const toX = (toNode.x || offsetX) + 75;
            const toY = (toNode.y || offsetY);
            
            elements.push({
              type: 'arrow',
              points: [[fromX, fromY], [toX, toY]],
              strokeColor: '#868e96',
              strokeWidth: 2,
              startArrowhead: null,
              endArrowhead: 'arrow',
            });
          }
        });
        
        excalidrawRef.current.addElements(elements);
        toast.success('Diagram added!');
        setShowAIDialog(false);
        setAiPrompt('');
      }
    } catch (error) {
      console.error('Failed:', error);
      toast.error('Failed to generate');
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
        <Excalidraw />
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
