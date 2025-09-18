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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Participants
        </h2>
        <p className="text-gray-500 text-center py-8">
          Aucun participant ajouté
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Participants ({participants.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-700">
                Présent
              </th>
              <th className="text-left py-3 px-2 font-medium text-gray-700">
                Nom
              </th>
              <th className="text-left py-3 px-2 font-medium text-gray-700">
                Temps alloué
              </th>
              <th className="text-left py-3 px-2 font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <tr key={participant.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2">
                  <button
                    onClick={() => !isDisabled && toggleParticipantPresence(participant.id)}
                    disabled={isDisabled}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      participant.isPresent
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
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
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                      className={`text-left text-gray-900 ${isDisabled ? 'cursor-not-allowed' : 'hover:text-blue-600 cursor-pointer'}`}
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
                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                      className={`font-mono text-gray-900 ${isDisabled ? 'cursor-not-allowed' : 'hover:text-blue-600 cursor-pointer'}`}
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
                          className="text-green-600 hover:text-green-700 p-1"
                          title="Sauvegarder"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-600 hover:text-gray-700 p-1"
                          title="Annuler"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => removeParticipant(participant.id)}
                        disabled={isDisabled}
                        className="text-red-600 hover:text-red-700 p-1 disabled:text-gray-400 disabled:cursor-not-allowed"
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