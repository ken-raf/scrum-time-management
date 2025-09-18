'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMeetingStore } from '@/stores/meetingStore';
import { parseTimeInput } from '@/utils/time';
import { Plus } from 'lucide-react';

export const ParticipantForm = () => {
  const t = useTranslations('participants');
  const [name, setName] = useState('');
  const [timeInput, setTimeInput] = useState('02:00');
  const { addParticipant, meetingState } = useMeetingStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const allocatedTime = parseTimeInput(timeInput);
    addParticipant(name.trim(), allocatedTime);
    setName('');
    setTimeInput('02:00');
  };

  const isDisabled = meetingState.isStarted;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {t('addParticipant')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            {t('name')}
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isDisabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 disabled:text-gray-500"
            placeholder={t('namePlaceholder')}
            required
          />
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
            {t('allocatedTime')}
          </label>
          <input
            id="time"
            type="text"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            disabled={isDisabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 disabled:text-gray-500"
            placeholder="02:00"
            pattern="^\d{2}:\d{2}$"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          {t('add')}
        </button>
      </form>
    </div>
  );
};