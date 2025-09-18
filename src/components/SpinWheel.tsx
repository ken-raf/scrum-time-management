'use client';

import { useState } from 'react';
import { Wheel } from 'react-custom-roulette';
import { useMeetingStore } from '@/stores/meetingStore';

interface SpinWheelProps {
  onParticipantSelected: (participantId: string) => void;
}

export const SpinWheel = ({ onParticipantSelected }: SpinWheelProps) => {
  const { participants, meetingState } = useMeetingStore();
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);

  const availableParticipants = participants.filter(
    p => p.isPresent && !meetingState.spokenParticipants.includes(p.id)
  );

  const isPreviewMode = !meetingState.isStarted;
  const presentParticipants = participants.filter(p => p.isPresent);

  if (presentParticipants.length === 0) {
    return (
      <div className="flex flex-col items-center p-8">
        <div className="text-gray-500 text-center">
          <p className="text-lg font-medium">Aucun participant présent</p>
          <p className="text-sm mt-2">Marquez des participants comme présents pour utiliser la roue.</p>
        </div>
      </div>
    );
  }

  if (availableParticipants.length === 0 && !isPreviewMode) {
    return (
      <div className="flex flex-col items-center p-8">
        <div className="text-gray-500 text-center">
          <p className="text-lg font-medium">Tous les participants ont parlé !</p>
          <p className="text-sm mt-2">Vous pouvez finir la réunion.</p>
        </div>
      </div>
    );
  }

  // Use available participants for active meeting, present participants for preview
  const wheelParticipants = isPreviewMode ? presentParticipants : availableParticipants;

  // Create data for the wheel
  const data = wheelParticipants.map((participant, index) => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
      '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
    ];

    return {
      option: participant.name,
      style: { backgroundColor: colors[index % colors.length] }
    };
  });

  const handleSpinClick = () => {
    console.log('Spin button clicked');
    console.log('mustSpin:', mustSpin);
    console.log('wheelParticipants.length:', wheelParticipants.length);
    console.log('isPreviewMode:', isPreviewMode);

    if (mustSpin || wheelParticipants.length === 0 || isPreviewMode) {
      console.log('Spin blocked due to conditions');
      return;
    }

    const newPrizeNumber = Math.floor(Math.random() * data.length);
    console.log('Setting prizeNumber to:', newPrizeNumber);
    console.log('Setting mustSpin to true');

    setPrizeNumber(newPrizeNumber);
    setMustSpin(true);
  };

  const handleStopSpinning = () => {
    console.log('Wheel stopped spinning');
    console.log('prizeNumber:', prizeNumber);
    console.log('wheelParticipants:', wheelParticipants);

    setMustSpin(false);

    const selectedParticipant = wheelParticipants[prizeNumber];
    console.log('selectedParticipant:', selectedParticipant);

    if (selectedParticipant) {
      // Wait 2 seconds to let user see the result before opening modal
      setTimeout(() => {
        console.log('Opening modal for participant:', selectedParticipant.id);
        onParticipantSelected(selectedParticipant.id);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col items-center p-8">
      <div className="mb-8">
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeNumber}
          data={data}
          onStopSpinning={handleStopSpinning}
          outerBorderColor="#374151"
          outerBorderWidth={10}
          innerRadius={30}
          textDistance={60}
          fontSize={20}
        />
      </div>

      <button
        onClick={handleSpinClick}
        disabled={mustSpin || isPreviewMode}
        className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
          mustSpin || isPreviewMode
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
        }`}
      >
        {mustSpin ? 'Sélection en cours...' : isPreviewMode ? 'Démarrer la réunion pour utiliser' : 'À qui le tour ?'}
      </button>

      <div className="mt-4 text-center text-gray-600">
        <p className="text-sm">
          {wheelParticipants.length} participant{wheelParticipants.length > 1 ? 's' : ''}
          {isPreviewMode ? ' présent' : ' restant'}{wheelParticipants.length > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};