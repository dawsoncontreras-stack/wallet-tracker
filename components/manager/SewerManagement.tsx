'use client';

import { useState } from 'react';
import { supabase, Sewer } from '@/lib/supabase';
import { UserPlus, Trash2, UserCheck, UserX } from 'lucide-react';

interface SewerManagementProps {
  sewers: Sewer[];
  onSewerAdded: () => void;
  onSewerRemoved: () => void;
}

export default function SewerManagement({ sewers, onSewerAdded, onSewerRemoved }: SewerManagementProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSewerName, setNewSewerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleAddSewer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!newSewerName.trim()) {
      setError('Please enter a name');
      return;
    }

    setLoading(true);

    try {
      const trimmedName = newSewerName.trim();
      
      // First check if a sewer with this name already exists (active or inactive)
      const { data: existingSewers, error: checkError } = await supabase
        .from('sewers')
        .select('*')
        .eq('name', trimmedName);

      if (checkError) throw checkError;

      if (existingSewers && existingSewers.length > 0) {
        const existingSewer = existingSewers[0];
        
        if (existingSewer.is_active) {
          setError('A sewer with this name is already active');
          setLoading(false);
          return;
        }
        
        // Sewer exists but is inactive - reactivate them
        const { error: updateError } = await supabase
          .from('sewers')
          .update({ is_active: true })
          .eq('id', existingSewer.id);

        if (updateError) throw updateError;

        // Success - reactivated
        setSuccessMessage(`✅ Restored ${trimmedName} with all their previous history!`);
        setNewSewerName('');
        setIsAdding(false);
        onSewerAdded();
        setLoading(false);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
        return;
      }

      // No existing sewer found - create new one
      const { error: insertError } = await supabase
        .from('sewers')
        .insert({
          name: trimmedName
        });

      if (insertError) {
        throw insertError;
      }

      // Success - created new
      setNewSewerName('');
      setIsAdding(false);
      onSewerAdded();
    } catch (err) {
      console.error('Error adding sewer:', err);
      setError('Failed to add sewer');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (sewerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('sewers')
        .update({ is_active: !currentStatus })
        .eq('id', sewerId);

      if (error) throw error;
      onSewerRemoved();
    } catch (err) {
      console.error('Error toggling sewer status:', err);
      alert('Failed to update sewer status');
    }
  };

  const handleDeleteSewer = async (sewerId: string, sewerName: string) => {
    if (!confirm(`Remove ${sewerName} from the dashboard? They will be deactivated but their data will be preserved.`)) {
      return;
    }

    try {
      // Just deactivate instead of delete
      const { error } = await supabase
        .from('sewers')
        .update({ is_active: false })
        .eq('id', sewerId);

      if (error) throw error;
      onSewerRemoved();
    } catch (err) {
      console.error('Error deactivating sewer:', err);
      alert('Failed to deactivate sewer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-neutral-900">Manage Sewers</h2>
        </div>
        
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Sewer
          </button>
        )}
      </div>

      {/* Add Sewer Form */}
      {isAdding && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Add New Sewer</h3>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleAddSewer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={newSewerName}
                onChange={(e) => setNewSewerName(e.target.value)}
                placeholder="e.g., Maria Garcia"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewSewerName('');
                  setError('');
                }}
                disabled={loading}
                className="flex-1 border border-neutral-300 text-neutral-700 font-medium py-2 px-4 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Sewer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sewers List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">Current Sewers</h3>
        
        {/* Success message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}
        
        {sewers.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
            <UserPlus className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600">No sewers added yet</p>
            <p className="text-neutral-500 text-sm mt-1">Add your first sewer to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sewers.map((sewer) => (
              <div
                key={sewer.id}
                className={`border rounded-lg p-4 flex items-center justify-between ${
                  sewer.is_active 
                    ? 'border-neutral-200 bg-white' 
                    : 'border-neutral-300 bg-neutral-100 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    sewer.is_active ? 'bg-primary-100' : 'bg-neutral-200'
                  }`}>
                    {sewer.is_active ? (
                      <UserCheck className="w-5 h-5 text-primary-600" />
                    ) : (
                      <UserX className="w-5 h-5 text-neutral-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">{sewer.name}</h4>
                    {!sewer.is_active && (
                      <span className="text-xs text-neutral-500 mt-1 inline-block">Inactive</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(sewer.id, sewer.is_active)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      sewer.is_active
                        ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                  >
                    {sewer.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteSewer(sewer.id, sewer.name)}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-medium transition-colors flex items-center gap-2"
                    title="Remove from dashboard"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <UserPlus className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">About Sewer Management</h4>
            <p className="text-sm text-blue-800">
              Sewers can select themselves from the login page to access their dashboard. 
              The "Deactivate" button hides them from login but keeps them in the manager list (can reactivate).
              The "Remove" button completely hides them from the dashboard.
              Adding a sewer with the same name as a previously removed sewer will restore them with all their history intact (orders, points, performance data).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
