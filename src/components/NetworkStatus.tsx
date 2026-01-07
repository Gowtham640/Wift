'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Show "back online" briefly
      setShowIndicator(true);
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and not recently reconnected
  if (isOnline && !showIndicator) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
        isOnline
          ? 'bg-green-500/90 text-white shadow-lg'
          : 'bg-amber-500/90 text-black shadow-lg'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi size={16} />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>Offline - Wift still works!</span>
          </>
        )}
      </div>
    </div>
  );
}




