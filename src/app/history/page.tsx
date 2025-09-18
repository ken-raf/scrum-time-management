'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMeetingStore } from '@/stores/meetingStore';
import { formatTime } from '@/utils/time';
import { HistoricalMeeting } from '@/types';
import {
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  Eye,
  AlertTriangle,
  CheckCircle,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  BarChart3,
  TrendingUp,
  Download,
  Upload,
  FileJson
} from 'lucide-react';

type SortField = 'date' | 'participants' | 'duration' | 'overtime';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'list' | 'dashboard';

export default function HistoryPage() {
  const t = useTranslations();
  const meetingStore = useMeetingStore();
  const { getHistoricalMeetings } = meetingStore;
  const [selectedMeeting, setSelectedMeeting] = useState<HistoricalMeeting | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  const allMeetings = getHistoricalMeetings();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filter meetings based on search term
  const filteredMeetings = allMeetings.filter(meeting => {
    const searchLower = searchTerm.toLowerCase();
    const meetingDate = formatDate(meeting.startTime).toLowerCase();
    const participantNames = meeting.participants.map(p => p.name.toLowerCase()).join(' ');

    return meeting.name.toLowerCase().includes(searchLower) ||
           meetingDate.includes(searchLower) ||
           participantNames.includes(searchLower);
  });

  // Sort meetings
  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    let aValue: number, bValue: number;

    switch (sortField) {
      case 'date':
        aValue = new Date(a.startTime).getTime();
        bValue = new Date(b.startTime).getTime();
        break;
      case 'participants':
        aValue = a.summary.totalParticipants;
        bValue = b.summary.totalParticipants;
        break;
      case 'duration':
        aValue = a.totalDuration;
        bValue = b.totalDuration;
        break;
      case 'overtime':
        aValue = a.summary.totalOvertimeParticipants;
        bValue = b.summary.totalOvertimeParticipants;
        break;
      default:
        return 0;
    }

    const result = aValue - bValue;
    return sortDirection === 'asc' ? result : -result;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = () => {
    // Get all data from the store
    const fullStoreData = {
      participants: meetingStore.participants,
      meetingState: meetingStore.meetingState,
      historicalMeetings: meetingStore.historicalMeetings,
      summaries: meetingStore.summaries,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    // Create JSON file
    const dataStr = JSON.stringify(fullStoreData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    // Create download link
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scrum-meeting-data-${new Date().toISOString().split('T')[0]}.json`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);

        // Validate data structure
        if (!importedData.participants || !importedData.historicalMeetings) {
          alert(t('import.invalidFile'));
          return;
        }

        // Import data to store
        useMeetingStore.setState({
          participants: importedData.participants || [],
          meetingState: importedData.meetingState || {
            isStarted: false,
            isFinished: false,
            participantsOrder: [],
            spokenParticipants: [],
          },
          historicalMeetings: importedData.historicalMeetings || [],
          summaries: importedData.summaries || [],
          globalTimer: 0,
          currentSpeakingTime: 0,
          isSpeaking: false,
        });

        setShowImportDialog(false);
        alert(t('import.success') + '\n' + t('import.successDetails', {
          meetings: importedData.historicalMeetings?.length || 0,
          participants: importedData.participants?.length || 0
        }));
      } catch (error) {
        alert(t('import.invalidJson'));
      }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
  };

  if (selectedMeeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setSelectedMeeting(null)}
              className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
            >
              <ArrowLeft size={20} />
              Retour à l'historique
            </button>
          </div>

          {/* Meeting Detail */}
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-4">
                <Calendar size={28} className="text-blue-600" />
                {selectedMeeting.name}
              </h1>

              {/* Meeting Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Clock size={32} className="text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Durée totale</p>
                  <p className="text-2xl font-bold text-gray-800 font-mono">
                    {formatTime(selectedMeeting.totalDuration)}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <Users size={32} className="text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Participants</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {selectedMeeting.summary.participantsWhoSpoke}/{selectedMeeting.summary.totalParticipants}
                  </p>
                </div>

                <div className={`rounded-lg p-4 text-center ${
                  selectedMeeting.summary.totalOvertimeParticipants > 0 ? 'bg-red-50' : 'bg-green-50'
                }`}>
                  {selectedMeeting.summary.totalOvertimeParticipants > 0 ? (
                    <AlertTriangle size={32} className="text-red-600 mx-auto mb-2" />
                  ) : (
                    <CheckCircle size={32} className="text-green-600 mx-auto mb-2" />
                  )}
                  <p className="text-sm text-gray-600 mb-1">Dépassements</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {selectedMeeting.summary.totalOvertimeParticipants}
                  </p>
                </div>
              </div>
            </div>

            {/* Time Comparison */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Comparaison des temps
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Temps total alloué</p>
                  <p className="text-2xl font-bold text-blue-600 font-mono">
                    {formatTime(selectedMeeting.summary.totalAllocatedTime)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Temps total utilisé</p>
                  <p className="text-2xl font-bold text-green-600 font-mono">
                    {formatTime(selectedMeeting.summary.totalActualTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Participants Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Détail par participant
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-700">
                        Participant
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">
                        Temps alloué
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">
                        Temps utilisé
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">
                        Différence
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMeeting.participants.map((participant, index) => {
                      const difference = participant.actualTime - participant.allocatedTime;
                      const hasSpoken = participant.actualTime > 0;

                      return (
                        <tr
                          key={index}
                          className={`border-b border-gray-100 ${
                            participant.isOvertime ? 'bg-red-50' : hasSpoken ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          <td className="py-3 px-2 font-medium text-gray-900">
                            {participant.name}
                          </td>
                          <td className="py-3 px-2 font-mono text-gray-900">
                            {formatTime(participant.allocatedTime)}
                          </td>
                          <td className="py-3 px-2 font-mono text-gray-900">
                            {hasSpoken ? formatTime(participant.actualTime) : '-'}
                          </td>
                          <td className={`py-3 px-2 font-mono font-semibold ${
                            !hasSpoken
                              ? 'text-gray-400'
                              : participant.isOvertime
                              ? 'text-red-600'
                              : difference < 0
                              ? 'text-green-600'
                              : 'text-gray-800'
                          }`}>
                            {!hasSpoken
                              ? '-'
                              : difference > 0
                              ? `+${formatTime(difference)}`
                              : difference < 0
                              ? `-${formatTime(Math.abs(difference))}`
                              : '±00:00'
                            }
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              {!hasSpoken ? (
                                <>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  <span className="text-sm text-gray-600">N'a pas parlé</span>
                                </>
                              ) : participant.isOvertime ? (
                                <>
                                  <AlertTriangle size={16} className="text-red-600" />
                                  <span className="text-sm text-red-600 font-medium">Dépassement</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={16} className="text-green-600" />
                                  <span className="text-sm text-green-600 font-medium">Respecté</span>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <Calendar size={40} className="text-yellow-500" />
            Historique des réunions
          </h1>
          <Link
            href="/"
            className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-medium"
          >
            <ArrowLeft size={20} />
            Retour à l'accueil
          </Link>
        </div>

        {/* View Mode Toggle and Import/Export */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-yellow-500 text-black'
                  : 'text-black hover:text-gray-700'
              }`}
            >
              <Eye className="inline w-4 h-4 mr-2" />
              Liste
            </button>
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                viewMode === 'dashboard'
                  ? 'bg-yellow-500 text-black'
                  : 'text-black hover:text-gray-700'
              }`}
            >
              <BarChart3 className="inline w-4 h-4 mr-2" />
              Dashboard
            </button>
          </div>

          {/* Import/Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <Download size={16} />
              Exporter
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Upload size={16} />
              Importer
            </button>
          </div>
        </div>

        {viewMode === 'list' && allMeetings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar size={64} className="text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Aucune réunion enregistrée
            </h2>
            <p className="text-gray-500 mb-6">
              Vos réunions terminées apparaîtront ici automatiquement.
            </p>
            <Link
              href="/"
              className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              Créer une réunion
            </Link>
          </div>
        ) : viewMode === 'list' ? (
          <>
            {/* Search and Sort Controls */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Rechercher par date, participant..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Sort Controls */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSort('date')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                      sortField === 'date'
                        ? 'bg-yellow-500 text-black shadow-md'
                        : 'bg-gray-100 text-black hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    Date
                    {sortField === 'date' && (
                      sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleSort('participants')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                      sortField === 'participants'
                        ? 'bg-yellow-500 text-black shadow-md'
                        : 'bg-gray-100 text-black hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    Participants
                    {sortField === 'participants' && (
                      sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleSort('duration')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                      sortField === 'duration'
                        ? 'bg-yellow-500 text-black shadow-md'
                        : 'bg-gray-100 text-black hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    Durée
                    {sortField === 'duration' && (
                      sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleSort('overtime')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                      sortField === 'overtime'
                        ? 'bg-yellow-500 text-black shadow-md'
                        : 'bg-gray-100 text-black hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    Dépassements
                    {sortField === 'overtime' && (
                      sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Meetings List */}
            <div className="grid gap-6">
              {sortedMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {meeting.name}
                    </h3>
                    <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>Durée: {formatTime(meeting.totalDuration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span>{meeting.summary.participantsWhoSpoke}/{meeting.summary.totalParticipants} participants</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {meeting.summary.totalOvertimeParticipants > 0 ? (
                          <>
                            <AlertTriangle size={16} className="text-red-600" />
                            <span className="text-red-600">{meeting.summary.totalOvertimeParticipants} dépassement(s)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-green-600">Temps respectés</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500 text-right">
                      <p>Début: {formatDate(meeting.startTime)}</p>
                      <p>Fin: {formatDate(meeting.endTime)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedMeeting(meeting)}
                      className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 flex items-center gap-2"
                    >
                      <Eye size={16} />
                      Voir détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        ) : (
          /* Dashboard View */
          <DashboardView meetings={allMeetings} onSelectMeeting={setSelectedMeeting} />
        )}

        {/* Import Dialog */}
        {showImportDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <FileJson size={24} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">{t('import.title')}</h3>
              </div>

              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertTriangle size={16} />
                    <span className="font-medium">{t('import.warning')}</span>
                  </div>
                  <p className="text-sm text-red-700">
                    {t('import.warningText')}
                  </p>
                  <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                    <li>{t('import.warningItems.participants')}</li>
                    <li>{t('import.warningItems.history')}</li>
                    <li>{t('import.warningItems.settings')}</li>
                  </ul>
                  <p className="text-sm text-red-700 mt-2">
                    {t('import.irreversible')}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('import.selectFile')}
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500">
                    {t('import.acceptedFormat')}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  {t('import.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const DashboardView = ({ meetings, onSelectMeeting }: { meetings: HistoricalMeeting[], onSelectMeeting: (meeting: HistoricalMeeting) => void }) => {
  if (meetings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <BarChart3 size={64} className="text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Aucune donnée disponible
        </h2>
        <p className="text-gray-500">
          Terminez quelques réunions pour voir les statistiques.
        </p>
      </div>
    );
  }

  const totalMeetings = meetings.length;
  const totalParticipants = meetings.reduce((sum, m) => sum + m.summary.totalParticipants, 0);
  const averageParticipants = totalParticipants / totalMeetings;
  const totalDuration = meetings.reduce((sum, m) => sum + m.totalDuration, 0);
  const averageDuration = totalDuration / totalMeetings;

  // Find meetings with most/least participants
  const meetingsByParticipants = [...meetings].sort((a, b) => b.summary.totalParticipants - a.summary.totalParticipants);
  const meetingWithMostParticipants = meetingsByParticipants[0];
  const meetingWithLeastParticipants = meetingsByParticipants[meetingsByParticipants.length - 1];

  // Find longest/shortest meetings
  const meetingsByDuration = [...meetings].sort((a, b) => b.totalDuration - a.totalDuration);
  const longestMeeting = meetingsByDuration[0];
  const shortestMeeting = meetingsByDuration[meetingsByDuration.length - 1];

  // Find participants who spoke too much
  const participantOvertimes: { [name: string]: number } = {};
  const participantMeetings: { [name: string]: number } = {};

  meetings.forEach(meeting => {
    meeting.participants.forEach(participant => {
      if (!participantOvertimes[participant.name]) {
        participantOvertimes[participant.name] = 0;
        participantMeetings[participant.name] = 0;
      }
      participantMeetings[participant.name]++;
      if (participant.isOvertime && participant.actualTime > 0) {
        participantOvertimes[participant.name]++;
      }
    });
  });

  const participantOvertimeStats = Object.entries(participantOvertimes)
    .map(([name, overtimes]) => ({
      name,
      overtimes,
      meetings: participantMeetings[name],
      overtimeRate: (overtimes / participantMeetings[name]) * 100
    }))
    .sort((a, b) => b.overtimeRate - a.overtimeRate)
    .slice(0, 5);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Calendar className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Réunions</h3>
          <p className="text-3xl font-bold text-yellow-600">{totalMeetings}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Users className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Participants Moyens</h3>
          <p className="text-3xl font-bold text-green-600">{averageParticipants.toFixed(1)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Clock className="w-12 h-12 text-purple-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Durée Moyenne</h3>
          <p className="text-3xl font-bold text-purple-600 font-mono">{formatTime(Math.round(averageDuration))}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Dépassements</h3>
          <p className="text-3xl font-bold text-red-600">
            {meetings.reduce((sum, m) => sum + m.summary.totalOvertimeParticipants, 0)}
          </p>
        </div>
      </div>

      {/* Meeting Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-yellow-500" size={20} />
            Records de Réunions
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                 onClick={() => onSelectMeeting(longestMeeting)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Plus longue réunion</p>
                  <p className="text-sm text-gray-600">{longestMeeting.name}</p>
                </div>
                <p className="text-lg font-bold text-blue-600 font-mono">{formatTime(longestMeeting.totalDuration)}</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                 onClick={() => onSelectMeeting(shortestMeeting)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Plus courte réunion</p>
                  <p className="text-sm text-gray-600">{shortestMeeting.name}</p>
                </div>
                <p className="text-lg font-bold text-green-600 font-mono">{formatTime(shortestMeeting.totalDuration)}</p>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                 onClick={() => onSelectMeeting(meetingWithMostParticipants)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Plus de participants</p>
                  <p className="text-sm text-gray-600">{meetingWithMostParticipants.name}</p>
                </div>
                <p className="text-lg font-bold text-purple-600">{meetingWithMostParticipants.summary.totalParticipants}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Overtime Speakers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-600" size={20} />
            Participants avec Dépassements
          </h3>
          <div className="space-y-3">
            {participantOvertimeStats.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucun dépassement enregistré</p>
            ) : (
              participantOvertimeStats.map((participant, index) => (
                <div key={participant.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">{participant.name}</p>
                      <p className="text-sm text-gray-600">
                        {participant.overtimes} dépassement{participant.overtimes > 1 ? 's' : ''} sur {participant.meetings} réunion{participant.meetings > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-red-600 font-bold">
                    {participant.overtimeRate.toFixed(1)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Meetings Quick Access */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="text-yellow-500" size={20} />
          Réunions Récentes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.slice(0, 6).map((meeting) => (
            <div
              key={meeting.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onSelectMeeting(meeting)}
            >
              <h4 className="font-medium text-gray-800 mb-2 truncate">{meeting.name}</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>{meeting.summary.totalParticipants} participants</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span className="font-mono">{formatTime(meeting.totalDuration)}</span>
                </div>
                {meeting.summary.totalOvertimeParticipants > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle size={14} />
                    <span>{meeting.summary.totalOvertimeParticipants} dépassement{meeting.summary.totalOvertimeParticipants > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};