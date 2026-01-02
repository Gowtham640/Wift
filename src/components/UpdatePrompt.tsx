'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function UpdatePrompt() {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    // Listen for service worker controller change (update activated)
    const handleControllerChange = () => {
      console.log('🔄 Service Worker updated - showing reload prompt');
      setShowReload(true);
    };

    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  if (!showReload) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-lg shadow-lg border border-white/20 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <RefreshCw size={20} className="animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Update Applied</h3>
            <p className="text-xs opacity-90 mb-3">
              Wift has been updated with the latest features. Reload to see the changes.
            </p>
            <button
              onClick={handleReload}
              className="bg-white text-blue-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-50 transition-colors flex items-center gap-1"
            >
              <RefreshCw size={12} />
              Reload Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
