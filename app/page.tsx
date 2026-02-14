'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Wallet, Lock, Users } from 'lucide-react';

interface Sewer {
  id: string;
  name: string;
}

export default function LoginPage() {
  const [mode, setMode] = useState<'select' | 'sewer' | 'manager'>('select');
  const [sewers, setSewers] = useState<Sewer[]>([]);
  const [selectedSewer, setSelectedSewer] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setCurrentSewer, setIsManager } = useAuth();
  const router = useRouter();

  // Load sewers when component mounts
  useEffect(() => {
    loadSewers();
  }, []);

  const loadSewers = async () => {
    try {
      const { data, error } = await supabase
        .from('sewers')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSewers(data || []);
    } catch (err) {
      console.error('Error loading sewers:', err);
      setError('Failed to load sewers');
    }
  };

  const handleSewerLogin = () => {
    if (!selectedSewer) {
      setError('Please select a sewer');
      return;
    }

    const sewer = sewers.find(s => s.id === selectedSewer);
    if (sewer) {
      setCurrentSewer({ id: sewer.id, name: sewer.name });
      router.push('/sewer');
    }
  };

  const handleManagerLogin = async () => {
    if (!managerPassword) {
      setError('Please enter password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call the database function to verify password
      const { data, error } = await supabase
        .rpc('verify_manager_password', {
          p_username: 'manager',
          p_password: managerPassword
        });

      if (error) throw error;

      if (data === true) {
        setIsManager(true);
        router.push('/manager');
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      console.error('Manager login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-primary-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl mb-4">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                Wallet Tracker
              </h1>
              <p className="text-neutral-500">
                Select your role to continue
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setMode('sewer')}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium py-4 px-6 rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Users className="w-5 h-5" />
                <span>I'm a Sewer</span>
              </button>

              <button
                onClick={() => setMode('manager')}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-neutral-700 to-neutral-800 text-white font-medium py-4 px-6 rounded-lg hover:from-neutral-800 hover:to-neutral-900 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Lock className="w-5 h-5" />
                <span>I'm a Manager</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'sewer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-primary-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                Sewer Login
              </h1>
              <p className="text-neutral-500">
                Select your name to continue
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Select Your Name
                </label>
                <select
                  value={selectedSewer}
                  onChange={(e) => {
                    setSelectedSewer(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">Choose your name...</option>
                  {sewers.map((sewer) => (
                    <option key={sewer.id} value={sewer.id}>
                      {sewer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMode('select')}
                  className="flex-1 border border-neutral-300 text-neutral-700 font-medium py-3 px-4 rounded-lg hover:bg-neutral-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSewerLogin}
                  disabled={!selectedSewer}
                  className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium py-3 px-4 rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Manager login
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-primary-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
      
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-xl mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              Manager Login
            </h1>
            <p className="text-neutral-500">
              Enter your password to continue
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Password
              </label>
              <input
                type="password"
                value={managerPassword}
                onChange={(e) => {
                  setManagerPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && managerPassword) {
                    handleManagerLogin();
                  }
                }}
                placeholder="Enter manager password"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMode('select')}
                disabled={loading}
                className="flex-1 border border-neutral-300 text-neutral-700 font-medium py-3 px-4 rounded-lg hover:bg-neutral-50 transition-all disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleManagerLogin}
                disabled={!managerPassword || loading}
                className="flex-1 bg-gradient-to-r from-neutral-700 to-neutral-800 text-white font-medium py-3 px-4 rounded-lg hover:from-neutral-800 hover:to-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
