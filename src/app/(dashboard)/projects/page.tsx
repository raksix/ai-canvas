'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { Project } from '@/types';
import { Plus, Folder, Trash2, LogOut, Settings, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadProjects();
  }, [isAuthenticated, router]);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    setIsCreating(true);
    try {
      const project = await api.createProject(newProjectTitle);
      setProjects([project, ...projects]);
      setNewProjectTitle('');
      toast.success('Project created!');
      router.push(`/editor/${project.id}`);
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await api.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
      toast.success('Project deleted');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Mobile Header */}
      <header className="border-b border-slate-800 sticky top-0 z-50 bg-slate-950">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">AI Canvas</h1>
            <p className="text-xs text-slate-400 hidden sm:block">Welcome, {user?.name || user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="sm:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-800 px-4 py-3 space-y-2 bg-slate-900">
            <Link href="/settings" className="block">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="w-full justify-start text-red-400" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">Your Projects</h2>
        </div>

        {/* Create Project Form */}
        <form onSubmit={handleCreateProject} className="mb-6 flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="New project name..."
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            className="bg-slate-900 border-slate-700 text-white flex-1"
          />
          <Button type="submit" disabled={isCreating || !newProjectTitle.trim()} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? 'Creating...' : 'New Project'}
          </Button>
        </form>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-base mb-2">No projects yet</p>
            <p className="text-sm">Create your first project to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/editor/${project.id}`)}
                className="group bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5 cursor-pointer hover:border-slate-700 transition-colors active:bg-slate-800"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <Folder className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-1 truncate">{project.title}</h3>
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500">
                  <span>{project._count?.pages || project.pages?.length || 0} pages</span>
                  <span className="hidden sm:inline">{formatDate(project.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
