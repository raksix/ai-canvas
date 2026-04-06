'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Excalidraw = dynamic(
  () => import('excalidraw').then((mod) => ({ default: mod.Excalidraw })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-slate-400">Loading Excalidraw...</div>
      </div>
    ),
  }
);

interface InfiniteCanvasProps {
  projectId: string;
  pageId: string;
}

export function InfiniteCanvas({ projectId, pageId }: InfiniteCanvasProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-900">
      <Excalidraw />
    </div>
  );
}
