'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  BarChart3,
  ListChecks,
  Library,
  Settings,
  History
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/routines', label: 'Routines', icon: ListChecks },
  { href: '/exercises', label: 'Exercises', icon: Library },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/history', label: 'History', icon: History },
  { href: '/admin', label: 'Admin', icon: Settings }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex h-full w-64 glass-widget rounded-none border-r border-white/10 p-6 flex-col fixed left-0 top-0">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Dumbbell size={32} className="text-white" />
          <h1 className="text-2xl font-bold text-white">GymTracker</h1>
        </div>
        <p className="text-sm text-white/40">Track your fitness journey</p>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-white/10">
        <p className="text-xs text-white/40 text-center">
          Built with Next.js & Dexie
        </p>
      </div>
    </div>
  );
}

