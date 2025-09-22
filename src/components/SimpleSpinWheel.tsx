'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useMeetingStore } from '@/stores/meetingStore';

interface SimpleSpinWheelProps {
  onParticipantSelected: (participantId: string) => void;
}

export const SimpleSpinWheel = ({ onParticipantSelected }: SimpleSpinWheelProps) => {
  const t = useTranslations();
  const { participants, meetingState } = useMeetingStore();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingSoundRef = useRef(false);

  const availableParticipants = participants.filter(
    p => p.isPresent && !meetingState.spokenParticipants.includes(p.id)
  );

  const isPreviewMode = !meetingState.isStarted;
  const presentParticipants = participants.filter(p => p.isPresent);

  // Reset selected participant when they are no longer available (completed their turn)
  useEffect(() => {
    if (selectedParticipantId && !availableParticipants.find(p => p.id === selectedParticipantId)) {
      setSelectedParticipantId(null);
    }
  }, [selectedParticipantId, availableParticipants]);

  // Reset selected participant when currentParticipant changes to undefined
  // This happens when modal is closed without completing the turn
  useEffect(() => {
    if (!meetingState.currentParticipant && selectedParticipantId && !isSpinning) {
      setSelectedParticipantId(null);
    }
  }, [meetingState.currentParticipant, selectedParticipantId, isSpinning]);

  if (presentParticipants.length === 0) {
    return (
      <div className="flex flex-col items-center p-8">
        <div className="text-gray-500 text-center">
          <p className="text-lg font-medium">{t('meeting.noParticipantsPresent')}</p>
          <p className="text-sm mt-2">{t('meeting.noParticipantsPresentDescription')}</p>
        </div>
      </div>
    );
  }

  if (availableParticipants.length === 0 && !isPreviewMode) {
    return (
      <div className="flex flex-col items-center p-8">
        <div className="text-gray-500 text-center">
          <p className="text-lg font-medium">{t('meeting.allParticipantsSpoken')}</p>
          <p className="text-sm mt-2">{t('meeting.allParticipantsSpokenDescription')}</p>
        </div>
      </div>
    );
  }

  const wheelParticipants = isPreviewMode ? presentParticipants : availableParticipants;

  // Initialize audio context
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as typeof AudioContext))();
    }
    return audioContextRef.current;
  };

  // Generate spinning sound
  const playSpinSound = () => {
    try {
      const audioContext = getAudioContext();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      isPlayingSoundRef.current = true;

      // Create a series of ticking sounds that get slower over time
      const playTick = (time: number, frequency: number, interval: number) => {
        if (!isPlayingSoundRef.current) return;

        // Create oscillator for the tick sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Sharp tick sound
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'square';

        // Quick fade out for tick effect
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);

        // Schedule next tick if still spinning
        if (time < 3000) { // 3 seconds total
          const nextInterval = interval * 1.05; // Gradually slow down
          const nextFrequency = Math.max(200, frequency * 0.99); // Gradually lower pitch
          setTimeout(() => playTick(time + interval, nextFrequency, nextInterval), interval);
        }
      };

      // Start the ticking sequence
      playTick(0, 800, 50); // Start with 800Hz frequency, 50ms interval

    } catch (error) {
      console.warn('Could not play spin sound:', error);
    }
  };

  const stopSpinSound = () => {
    isPlayingSoundRef.current = false;
  };

  const spinWheel = () => {
    if (isSpinning || wheelParticipants.length === 0 || isPreviewMode) return;

    setIsSpinning(true);
    playSpinSound();

    // Calculate the angle for each segment
    const segmentAngle = 360 / wheelParticipants.length;

    // Randomly select a participant
    const selectedIndex = Math.floor(Math.random() * wheelParticipants.length);
    const selectedParticipant = wheelParticipants[selectedIndex];

    // Store the selected participant
    setSelectedParticipantId(selectedParticipant.id);

    // Calculate target angle (pointing to the selected segment)
    // ISSUE: Visual wheel is offset by 72° from mathematical positions
    // Mike (index 0) should be at top (-90° + 36° = -54°) but Tsiky (index 1) is visually at top
    // This means visual is offset by +72° (one segment) from mathematical

    // Calculate where the selected segment center SHOULD be mathematically
    const mathematicalCenterAngle = -90 + (selectedIndex * segmentAngle) + (segmentAngle / 2);

    // Account for the 72° visual offset
    const visualCenterAngle = mathematicalCenterAngle + 72;

    // To align this visual center with the pointer (0 degrees), we need to rotate by -visualCenterAngle
    const targetAngle = -visualCenterAngle;

    // Add multiple full rotations for effect
    const fullRotations = 5;

    // Calculate how much to rotate from current position to reach target
    // We want to end up at targetAngle, but we need to add full rotations for effect
    let rotationToAdd = (360 * fullRotations) + targetAngle - rotation;

    // Ensure we always rotate forward (positive direction)
    while (rotationToAdd <= 360 * fullRotations) {
      rotationToAdd += 360;
    }

    const finalRotation = rotation + rotationToAdd;

    setRotation(finalRotation);

    // Wait for animation to complete, then wait 2 more seconds before opening modal
    setTimeout(() => {
      stopSpinSound();
      setIsSpinning(false);
      // Wait 2 seconds to let user see the result
      setTimeout(() => {
        onParticipantSelected(selectedParticipant.id);
      }, 2000);
    }, 3000);
  };

  const segmentAngle = 360 / wheelParticipants.length;

  return (
    <div className="flex flex-col items-center p-8">
      <div className="relative mb-8">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-red-600 drop-shadow-md"></div>
        </div>

        {/* Wheel */}
        <motion.div
          className="relative w-80 h-80 rounded-full border-4 border-gray-700 shadow-xl overflow-hidden bg-white"
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: "easeOut" }}
        >
          {wheelParticipants.map((participant, index) => {
            // Start from -90 degrees (top) so first segment (index 0) aligns with pointer
            const startAngle = index * segmentAngle - 90;
            const endAngle = startAngle + segmentAngle;


            const startRadians = (startAngle * Math.PI) / 180;
            const endRadians = (endAngle * Math.PI) / 180;
            const centerX = 160;
            const centerY = 160;
            const radius = 150;

            const x1 = centerX + radius * Math.cos(startRadians);
            const y1 = centerY + radius * Math.sin(startRadians);
            const x2 = centerX + radius * Math.cos(endRadians);
            const y2 = centerY + radius * Math.sin(endRadians);

            const largeArcFlag = segmentAngle > 180 ? 1 : 0;

            // For single participant, draw a full circle instead of arc
            const pathData = wheelParticipants.length === 1
              ? `M ${centerX} ${centerY} m -${radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`
              : [
                  `M ${centerX} ${centerY}`,
                  `L ${x1} ${y1}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ');

            const colors = [
              '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
              '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
              '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
            ];
            const color = colors[index % colors.length];

            // Text position (halfway through the segment or center for single participant)
            let textX, textY;
            if (wheelParticipants.length === 1) {
              // Center the text for single participant
              textX = centerX;
              textY = centerY;
            } else {
              const textAngle = startAngle + segmentAngle / 2;
              const textRadians = (textAngle * Math.PI) / 180;
              textX = centerX + (radius * 0.7) * Math.cos(textRadians);
              textY = centerY + (radius * 0.7) * Math.sin(textRadians);
            }

            return (
              <div key={participant.id} className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 320 320">
                  <path
                    d={pathData}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize={wheelParticipants.length === 1 ? "20" : "16"}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="Lucida Console, Courier New, monospace"
                  >
                    {participant.name}
                  </text>
                </svg>
              </div>
            );
          })}
        </motion.div>
      </div>

      {!isPreviewMode && (
        <button
          onClick={spinWheel}
          disabled={isSpinning}
          className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
            isSpinning
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-black'
          }`}
        >
          {isSpinning ? t('participants.selecting') : t('participants.whosTurn')}
        </button>
      )}

      <div className="mt-4 text-center text-gray-600">
        <p className="text-sm">
          {wheelParticipants.length} {t('participants.participants')} {isPreviewMode ? t('participants.present') : (wheelParticipants.length > 1 ? t('participants.remainingPlural') : t('participants.remaining'))}
        </p>
      </div>
    </div>
  );
};