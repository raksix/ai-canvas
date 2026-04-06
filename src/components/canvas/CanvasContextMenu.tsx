'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Sparkles, Copy, Trash2, FileText, List, CheckSquare, GitBranch, Loader2 } from 'lucide-react';

interface CanvasContextMenuProps {
  children: React.ReactNode;
  onInsertText?: (text: string) => void;
  onInsertDiagram?: (diagram: { nodes: any[]; edges: any[] }) => void;
}

type AIAction =
  | 'create-note'
  | 'summarize'
  | 'expand'
  | 'simplify'
  | 'suggest-title'
  | 'extract-list'
  | 'create-checklist'
  | 'create-diagram'
  | 'create-flowchart'
  | 'create-mindmap'
  | null;

export function CanvasContextMenu({ children, onInsertText, onInsertDiagram }: CanvasContextMenuProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AIAction>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAIAction = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      let result: string;

      switch (selectedAction) {
        case 'create-note':
        case 'summarize':
        case 'expand':
        case 'simplify':
        case 'suggest-title':
        case 'extract-list':
        case 'create-checklist':
          const response = await api.aiChat(prompt);
          result = response.response;
          break;

        case 'create-diagram':
        case 'create-flowchart':
        case 'create-mindmap':
          const diagram = await api.generateDiagram(prompt);
          if (onInsertDiagram) {
            onInsertDiagram(diagram);
          }
          setIsDialogOpen(false);
          setPrompt('');
          toast.success('Diagram generated!');
          setIsLoading(false);
          return;

        default:
          return;
      }

      if (onInsertText) {
        onInsertText(result);
      }
      setIsDialogOpen(false);
      setPrompt('');
      toast.success('AI response added to canvas!');
    } catch (error) {
      console.error('AI error:', error);
      toast.error(error instanceof Error ? error.message : 'AI request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const openAIDialog = (action: AIAction) => {
    setSelectedAction(action);
    setIsDialogOpen(true);

    // Set placeholder based on action
    switch (action) {
      case 'create-note':
        setPrompt('');
        break;
      case 'summarize':
        setPrompt('Summarize the following text:\n\n');
        break;
      case 'expand':
        setPrompt('Expand on this topic:\n\n');
        break;
      case 'simplify':
        setPrompt('Simplify this text:\n\n');
        break;
      case 'suggest-title':
        setPrompt('Suggest a title for:\n\n');
        break;
      case 'extract-list':
        setPrompt('Extract key points as a list:\n\n');
        break;
      case 'create-checklist':
        setPrompt('Create a checklist for:\n\n');
        break;
      case 'create-diagram':
      case 'create-flowchart':
        setPrompt('Create a diagram showing:\n\n');
        break;
      case 'create-mindmap':
        setPrompt('Create a mind map for:\n\n');
        break;
    }
  };

  const getActionTitle = () => {
    switch (selectedAction) {
      case 'create-note': return 'Create Note';
      case 'summarize': return 'Summarize';
      case 'expand': return 'Expand';
      case 'simplify': return 'Simplify';
      case 'suggest-title': return 'Suggest Title';
      case 'extract-list': return 'Extract List';
      case 'create-checklist': return 'Create Checklist';
      case 'create-diagram': return 'Create Diagram';
      case 'create-flowchart': return 'Create Flowchart';
      case 'create-mindmap': return 'Create Mind Map';
      default: return 'AI Action';
    }
  };

  const getPromptPlaceholder = () => {
    switch (selectedAction) {
      case 'create-note': return 'What would you like to take notes about?';
      case 'summarize': return 'Paste or describe the text to summarize...';
      case 'expand': return 'What topic would you like to expand on?';
      case 'simplify': return 'What text would you like to simplify?';
      case 'suggest-title': return 'What is the content you need a title for?';
      case 'extract-list': return 'What text would you like to extract key points from?';
      case 'create-checklist': return 'What task do you need a checklist for?';
      case 'create-diagram': return 'What would you like to visualize?';
      case 'create-flowchart': return 'What process would you like to show?';
      case 'create-mindmap': return 'What topic would you like to mind map?';
      default: return 'Enter your prompt...';
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>

      <ContextMenuContent className="bg-slate-800 border-slate-700 text-slate-200">
        {/* Standard Actions */}
        <ContextMenuItem className="text-slate-300">
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </ContextMenuItem>
        <ContextMenuItem className="text-slate-300">
          <FileText className="w-4 h-4 mr-2" />
          Paste
        </ContextMenuItem>
        <ContextMenuItem className="text-slate-300">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* AI Actions */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="text-slate-300">
            <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
            AI Actions
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-slate-800 border-slate-700">
            <ContextMenuItem onClick={() => openAIDialog('create-note')} className="text-slate-300">
              <FileText className="w-4 h-4 mr-2" />
              Create Note
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => openAIDialog('summarize')} className="text-slate-300">
              Summarize
            </ContextMenuItem>
            <ContextMenuItem onClick={() => openAIDialog('expand')} className="text-slate-300">
              Expand
            </ContextMenuItem>
            <ContextMenuItem onClick={() => openAIDialog('simplify')} className="text-slate-300">
              Simplify
            </ContextMenuItem>
            <ContextMenuItem onClick={() => openAIDialog('suggest-title')} className="text-slate-300">
              Suggest Title
            </ContextMenuItem>
            <ContextMenuItem onClick={() => openAIDialog('extract-list')} className="text-slate-300">
              <List className="w-4 h-4 mr-2" />
              Extract List
            </ContextMenuItem>
            <ContextMenuItem onClick={() => openAIDialog('create-checklist')} className="text-slate-300">
              <CheckSquare className="w-4 h-4 mr-2" />
              Create Checklist
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => openAIDialog('create-diagram')} className="text-slate-300">
              <GitBranch className="w-4 h-4 mr-2" />
              Create Diagram
            </ContextMenuItem>
            <ContextMenuItem onClick={() => openAIDialog('create-flowchart')} className="text-slate-300">
              Create Flowchart
            </ContextMenuItem>
            <ContextMenuItem onClick={() => openAIDialog('create-mindmap')} className="text-slate-300">
              Create Mind Map
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>

      {/* AI Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              {getActionTitle()}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your prompt and AI will generate content for your canvas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={getPromptPlaceholder()}
                className="min-h-[120px] bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAIAction} disabled={isLoading || !prompt.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContextMenu>
  );
}
