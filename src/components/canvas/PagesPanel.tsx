'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCanvasStore } from '@/stores/canvasStore';
import { Plus, FileText, Trash2, Copy, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface PagesPanelProps {
  projectId: string;
  isMobile?: boolean;
}

export function PagesPanel({ projectId, isMobile }: PagesPanelProps) {
  const { pages, currentPage, setCurrentPage, createPage, deletePage, updatePage } = useCanvasStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreatePage = async () => {
    if (!newPageName.trim()) return;

    try {
      const page = await createPage(projectId, newPageName);
      setCurrentPage(page);
      setNewPageName('');
      setIsCreating(false);
      toast.success('Page created');
    } catch (error) {
      toast.error('Failed to create page');
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (pages.length <= 1) {
      toast.error('Cannot delete the last page');
      return;
    }
    if (!confirm('Delete this page?')) return;

    try {
      await deletePage(projectId, pageId);
      toast.success('Page deleted');
    } catch (error) {
      toast.error('Failed to delete page');
    }
  };

  const handleStartEditing = (page: { id: string; name: string }) => {
    setEditingPageId(page.id);
    setEditingName(page.name);
  };

  const handleFinishEditing = async () => {
    if (!editingPageId || !editingName.trim()) {
      setEditingPageId(null);
      return;
    }

    try {
      await updatePage(projectId, editingPageId, { name: editingName });
      setEditingPageId(null);
    } catch (error) {
      toast.error('Failed to rename page');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEditing();
    } else if (e.key === 'Escape') {
      setEditingPageId(null);
    }
  };

  return (
    <div className={`${isMobile ? 'w-full h-full' : 'w-64'} bg-slate-900 border-r border-slate-800 flex flex-col h-full`}>
      <div className="p-3 border-b border-slate-800">
        <h3 className="font-semibold text-sm text-slate-400 uppercase tracking-wide">Pages</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`group flex items-center gap-2 px-3 py-2.5 sm:py-2 rounded-md cursor-pointer transition-colors ${
                currentPage?.id === page.id
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
              onClick={() => setCurrentPage(page)}
            >
              <FileText className="w-4 h-4 shrink-0" />
              {editingPageId === page.id ? (
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleFinishEditing}
                  onKeyDown={handleKeyDown}
                  className="h-6 text-sm bg-slate-700 border-slate-600"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="flex-1 truncate text-sm"
                  onDoubleClick={() => handleStartEditing(page)}
                >
                  {page.name}
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 sm:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditing(page);
                    }}
                    className="text-slate-300"
                  >
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.info('Coming soon');
                    }}
                    className="text-slate-300"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePage(page.id);
                    }}
                    className="text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-slate-800">
        {isCreating ? (
          <div className="space-y-2">
            <Input
              placeholder="Page name"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreatePage();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              className="bg-slate-800 border-slate-700 text-white"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreatePage} className="flex-1">
                Create
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-slate-400"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Page
          </Button>
        )}
      </div>
    </div>
  );
}
