import { Leaf, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();

  return (
    <header className="sticky top-0 z-20 glass border-b border-forest-100/60 dark:border-forest-700/40 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center shadow-md shadow-forest-500/20">
            <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-forest-700 dark:text-forest-50 leading-none">EcoTrack</h1>
            <p className="text-[10px] text-forest-400 dark:text-forest-400 leading-none mt-0.5 hidden sm:block">
              AI-Powered Sustainability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-forest-100/80 dark:bg-forest-700/60 hover:bg-forest-200 dark:hover:bg-forest-600 flex items-center justify-center transition-all active:scale-90"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-forest-600" />
            ) : (
              <Sun className="w-4 h-4 text-forest-200" />
            )}
          </button>

          {user && (
            <button
              onClick={signOut}
              className="w-10 h-10 rounded-xl bg-forest-100/80 dark:bg-forest-700/60 hover:bg-forest-200 dark:hover:bg-forest-600 flex items-center justify-center transition-all active:scale-90"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-forest-600 dark:text-forest-200" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
