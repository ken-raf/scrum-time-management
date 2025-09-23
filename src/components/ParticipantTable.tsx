'use client';

import { useMeetingStore } from '@/stores/meetingStore';
import { formatTimeInput, parseTimeInput } from '@/utils/time';
import { Trash2, Check, X } from 'lucide-react';
import { useState } from 'react';

export const ParticipantTable = () => {
  const {
    participants,
    removeParticipant,
    updateParticipant,
    toggleParticipantPresence,
    meetingState
  } = useMeetingStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingTime, setEditingTime] = useState('');

  const isDisabled = meetingState.isStarted;

  const startEditing = (id: string, name: string, allocatedTime: number) => {
    if (isDisabled) return;
    setEditingId(id);
    setEditingName(name);
    setEditingTime(formatTimeInput(allocatedTime));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setEditingTime('');
  };

  const saveEditing = (id: string) => {
    if (!editingName.trim()) return;

    const allocatedTime = parseTimeInput(editingTime);
    updateParticipant(id, {
      name: editingName.trim(),
      allocatedTime,
    });
    cancelEditing();
  };

  if (participants.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Participants
        </h2>
        <p className="text-foreground-muted text-center py-8">
          Aucun participant ajouté
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-foreground">
        Participants ({participants.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 font-medium text-foreground-secondary">
                Présent
              </th>
              <th className="text-left py-3 px-2 font-medium text-foreground-secondary">
                Nom
              </th>
              <th className="text-left py-3 px-2 font-medium text-foreground-secondary">
                Temps alloué
              </th>
              <th className="text-left py-3 px-2 font-medium text-foreground-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <tr key={participant.id} className="border-b border-border hover:bg-surface-hover">
                <td className="py-3 px-2">
                  <button
                    onClick={() => !isDisabled && toggleParticipantPresence(participant.id)}
                    disabled={isDisabled}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      participant.isPresent
                        ? 'bg-success border-success text-white'
                        : 'border-border hover:border-success'
                    } ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    {participant.isPresent && <Check size={16} />}
                  </button>
                </td>
                <td className="py-3 px-2">
                  {editingId === participant.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full px-2 py-1 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditing(participant.id);
                        if (e.key === 'Escape') cancelEditing();
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => startEditing(participant.id, participant.name, participant.allocatedTime)}
                      disabled={isDisabled}
                      className={`text-left text-foreground ${isDisabled ? 'cursor-not-allowed' : 'hover:text-primary cursor-pointer'}`}
                    >
                      {participant.name}
                    </button>
                  )}
                </td>
                <td className="py-3 px-2">
                  {editingId === participant.id ? (
                    <input
                      type="text"
                      value={editingTime}
                      onChange={(e) => setEditingTime(e.target.value)}
                      className="w-20 px-2 py-1 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      pattern="^\d{2}:\d{2}$"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditing(participant.id);
                        if (e.key === 'Escape') cancelEditing();
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => startEditing(participant.id, participant.name, participant.allocatedTime)}
                      disabled={isDisabled}
                      className={`font-mono text-foreground ${isDisabled ? 'cursor-not-allowed' : 'hover:text-primary cursor-pointer'}`}
                    >
                      {formatTimeInput(participant.allocatedTime)}
                    </button>
                  )}
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    {editingId === participant.id ? (
                      <>
                        <button
                          onClick={() => saveEditing(participant.id)}
                          className="text-success hover:text-success p-1"
                          title="Sauvegarder"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-foreground-muted hover:text-foreground-secondary p-1"
                          title="Annuler"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => removeParticipant(participant.id)}
                        disabled={isDisabled}
                        className="text-error hover:text-error p-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};