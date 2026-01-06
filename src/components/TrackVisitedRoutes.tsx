'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function TrackVisitedRoutes() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const visited = JSON.parse(
      sessionStorage.getItem('visited_routes') || '[]'
    );

    if (!visited.includes(pathname)) {
      visited.push(pathname);
      sessionStorage.setItem('visited_routes', JSON.stringify(visited));
      console.log('📍 Route tracked:', pathname);
    }
  }, [pathname]);

  return null;
}


