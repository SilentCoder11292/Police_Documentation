import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'dark', label: 'Dark', icon: Moon }
  ];

  return (
    <div className="relative flex items-center p-0.5 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg transition-colors duration-200">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium select-none transition-all duration-150 ${
              isActive 
                ? 'bg-white text-black border border-gray-200 dark:bg-black dark:text-white dark:border-gray-800 shadow-sm font-semibold' 
                : 'text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
