import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SquareX, Crown, ChevronsLeft, Users, Calendar, Zap, FileText, ChevronDown } from 'lucide-react';
import { LoadingSpinner } from './auth/LoadingSpinner';
import { studyGroupService } from '../services/studyGroupService';
import { userService } from '../services/userService';
import { playerStatsService } from '../services/playerStatsService';
import { teamStatsService } from '../services/teamStatsService';
import { livePlayerService } from '../services/livePlayerService';
import { TeamStatsContent } from './TeamStatsContent';
import { TFTStatsContent } from './TFTStatsContent';
import type { StudyGroup } from '../services/studyGroupService';

interface GroupMember {
  summoner_name: string;
  elo: number;
  owner: number;
  rank?: string;
  icon_id?: number;
  user_id?: number;
}

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  
  // Group state
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [groupError, setGroupError] = useState<string | null>(null);
  
  // Members state
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  
  // Group info state
  const [groupInfo, setGroupInfo] = useState({ description: '', instructions: '' });
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [clickedMemberId, setClickedMemberId] = useState<number | null>(null);
  const [playerLeagueData, setPlayerLeagueData] = useState<any[]>([]);
  const [leagueDataLoading, setLeagueDataLoading] = useState(false);
  const [leagueDataError, setLeagueDataError] = useState<string | null>(null);
  const [activePlayerTab, setActivePlayerTab] = useState<'about' | 'stats'>('stats');
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Player stats state
  const [playerStatsData, setPlayerStatsData] = useState<any[]>([]);
  const [playerStatsLoading, setPlayerStatsLoading] = useState(false);
  const [playerStatsError, setPlayerStatsError] = useState<string | null>(null);
  
  // Team stats state
  const [teamStatsData, setTeamStatsData] = useState<any[]>([]);
  const [teamStatsLoading, setTeamStatsLoading] = useState(false);
  const [teamStatsError, setTeamStatsError] = useState<string | null>(null);
  const [memberNames, setMemberNames] = useState<{ [riotId: string]: string }>({});
  const [liveData, setLiveData] = useState<{ [summonerName: string]: any }>({});
  const [liveDataLoading, setLiveDataLoading] = useState(false);

  // Overflow detection state
  const [descriptionOverflow, setDescriptionOverflow] = useState(false);
  const [instructionsOverflow, setInstructionsOverflow] = useState(false);
  const [descriptionScrolled, setDescriptionScrolled] = useState(false);
  const [instructionsScrolled, setInstructionsScrolled] = useState(false);

  // Fetch group data on mount
  useEffect(() => {
    if (groupId) {
      // Scroll to top when navigating to this page
      window.scrollTo(0, 0);
      fetchGroupData(parseInt(groupId));
    }
  }, [groupId]);

  // Auto-fetch team stats when component mounts
  useEffect(() => {
    if (group && teamStatsData.length === 0) {
      console.log('🔄 Auto-fetching team stats for group:', group.id);
      fetchTeamStats(group.id, group.created_at);
    }
  }, [group, teamStatsData.length]);

  // Retry helper function with exponential backoff
  const retryWithBackoff = async <T,>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('4')) {
          throw lastError;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  };

  const fetchGroupData = async (id: number) => {
    setGroupLoading(true);
    setGroupError(null);
    
    try {
      // Fetch group details and members in parallel with retry
      const [groupDetails, groupUsers] = await Promise.all([
        retryWithBackoff(() => studyGroupService.getStudyGroup(id)),
        retryWithBackoff(() => studyGroupService.getStudyGroupUsers(id))
      ]);
      
      setGroup(groupDetails);
      setGroupInfo({
        description: groupDetails.description || '',
        instructions: groupDetails.application_instructions || ''
      });
      
      const members = groupUsers.map(relationship => ({
        summoner_name: relationship.summoner_name || 'Unknown User',
        elo: relationship.elo || 0,
        rank: relationship.rank || 'UNRANKED',
        owner: relationship.owner,
        icon_id: relationship.icon_id,
        user_id: relationship.user_id
      }));
      
      setMembers(members);
    } catch (err) {
      console.error('Error fetching group data:', err);
      setGroupError('Failed to load group data after multiple attempts. Please try refreshing the page.');
    } finally {
      setGroupLoading(false);
      setMembersLoading(false);
    }
  };

  const fetchPlayerLeagueData = async (userId: number) => {
    try {
      setLeagueDataLoading(true);
      setLeagueDataError(null);
      
      // Get user's riot account to get PUUID with retry
      const riotAccount = await retryWithBackoff(() => userService.getUserRiotAccount(userId));
      if (!riotAccount || !riotAccount.riot_id) {
        setLeagueDataError('No Riot account found for this user');
        return;
      }

      // Fetch league data using the riot_id (which contains the PUUID) with retry
      const fetchLeagueData = async () => {
        const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';
        const response = await fetch(`${API_BASE_URL}/api/tft-league/${riotAccount.riot_id}?user_id=${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch league data: ${response.status}`);
        }
        return response.json();
      };
      
      const data = await retryWithBackoff(fetchLeagueData);
      setPlayerLeagueData(data);
    } catch (error) {
      console.error('Error fetching player league data:', error);
      setLeagueDataError('Failed to load league data after multiple attempts');
      setPlayerLeagueData([]);
    } finally {
      setLeagueDataLoading(false);
    }
  };

  const fetchPlayerProfile = async (userId: number) => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      
      const profile = await retryWithBackoff(() => userService.getUserProfile(userId));
      setPlayerProfile(profile);
    } catch (error) {
      console.error('Error fetching player profile:', error);
      setProfileError('Failed to load profile data after multiple attempts');
      setPlayerProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchPlayerStats = async (riotId: string) => {
    setPlayerStatsLoading(true);
    setPlayerStatsError(null);
    
    try {
      const stats = await retryWithBackoff(() => playerStatsService.getPlayerStats(riotId));
      console.log('📊 Player stats received:', stats);
      // Extract the events array from the PlayerStatsData object
      setPlayerStatsData(stats?.events || []);
    } catch (error) {
      console.error('Error fetching player stats:', error);
      setPlayerStatsError('Failed to load player stats after multiple attempts');
      setPlayerStatsData([]);
    } finally {
      setPlayerStatsLoading(false);
    }
  };

  const fetchTeamStats = async (groupId: number, startDate: string) => {
    setTeamStatsLoading(true);
    setTeamStatsError(null);
    
    try {
      console.log('🔄 Fetching team stats for group:', groupId);
      const memberStats = await retryWithBackoff(() => teamStatsService.getMemberStats(groupId, startDate));
      console.log('📊 Member stats received:', memberStats);
      
      if (!memberStats || Object.keys(memberStats).length === 0) {
        console.log('⚠️ No member stats received');
        setTeamStatsData([]);
        setMemberNames({});
        return;
      }
      
      // Flatten the data for the chart
      const allEvents = Object.values(memberStats).flat();
      console.log('📈 Flattened events for chart:', allEvents);
      console.log('📈 Number of events:', allEvents.length);
      
      setTeamStatsData(allEvents);
      
      // Create member names mapping from the API response
      const names: { [riotId: string]: string } = {};
      Object.keys(memberStats).forEach(summonerName => {
        names[summonerName] = summonerName;
      });
      
      console.log('👥 Member names mapping:', names);
      setMemberNames(names);
      
      // Fetch live data for all members
      try {
        setLiveDataLoading(true);
        console.log('🔄 Fetching live data for group:', groupId);
        const liveStats = await retryWithBackoff(() => livePlayerService.getLivePlayerStats(groupId));
        console.log('🎯 Live stats received:', liveStats);
        setLiveData(liveStats);
      } catch (liveError) {
        console.error('❌ Error fetching live data:', liveError);
        setLiveData({});
      } finally {
        setLiveDataLoading(false);
      }
      
    } catch (error) {
      console.error('❌ Error fetching team stats:', error);
      setTeamStatsError('Not enough historic data to graph');
      setTeamStatsData([]);
      setMemberNames({});
    } finally {
      setTeamStatsLoading(false);
    }
  };

  const handlePlayerClick = async (member: any) => {
    if (!member.user_id) {
      console.error('No user_id found for member:', member);
      return;
    }
    
    setSelectedPlayer(member);
    setClickedMemberId(member.user_id);
    setShowPlayerModal(true);
    setActivePlayerTab('stats');
    
    // Get the riot account for this user to fetch player stats
    let riotId = null;
    try {
      const riotAccount = await userService.getUserRiotAccount(member.user_id);
      riotId = riotAccount?.riot_id;
    } catch (error) {
      console.error('Error fetching riot account for player stats:', error);
    }
    
    // Fetch league data, profile data, and player stats for the player
    await Promise.all([
      fetchPlayerLeagueData(member.user_id),
      fetchPlayerProfile(member.user_id),
      ...(riotId ? [fetchPlayerStats(riotId)] : [])
    ]);
  };

  const getRankedTftData = () => {
    return playerLeagueData.find(data => data.queueType === 'RANKED_TFT');
  };

  const getTurboTftData = () => {
    return playerLeagueData.find(data => data.queueType === 'RANKED_TFT_TURBO');
  };

  // Overflow detection functions
  const checkOverflow = (element: HTMLElement) => {
    return element.scrollHeight > element.clientHeight;
  };

  const handleDescriptionScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop > 0) {
      setDescriptionScrolled(true);
    }
  };

  const handleInstructionsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop > 0) {
      setInstructionsScrolled(true);
    }
  };

  // Check overflow when content changes
  useEffect(() => {
    const descriptionElement = document.getElementById('description-container');
    const instructionsElement = document.getElementById('instructions-container');
    
    if (descriptionElement) {
      setDescriptionOverflow(checkOverflow(descriptionElement));
    }
    if (instructionsElement) {
      setInstructionsOverflow(checkOverflow(instructionsElement));
    }
  }, [groupInfo.description, groupInfo.instructions]);

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{groupError || 'Group not found'}</p>
          <button 
            onClick={() => navigate('/study-groups/groups')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Absolute positioned */}
      <div className="bg-white border-b border-gray-200 absolute top-0 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/study-groups/groups')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronsLeft className="w-5 h-5" />
                <span>Back to Groups</span>
              </button>
              
              {/* Group Icon - Hidden on small screens */}
              <div className="hidden sm:block">
                {group.image_url ? (
                  <img
                    src={group.image_url}
                    alt={`${group.group_name} icon`}
                    className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center border-2 border-gray-200 font-bold text-lg"
                    style={{ 
                      backgroundColor: ['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][group.id % 5],
                      color: getTextColor(['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][group.id % 5])
                    }}
                  >
                    {group.group_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Group Name and Date */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-800">{group.group_name}</h1>
                <p className="text-sm text-gray-500">Created: {new Date(group.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

              {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
            {/* Group header with group image background - matching groups page format */}
            <div className="relative overflow-hidden">
              {/* Background Image */}
              {group.image_url ? (
                <div
                  className="w-full bg-cover bg-no-repeat opacity-60"
                  style={{
                    backgroundImage: `url(${group.image_url})`,
                    backgroundPosition: 'center top',
                    paddingTop: '60%' // Creates aspect ratio for the image
                  }}
                />
              ) : (
                <div 
                  className="w-full flex items-center justify-center opacity-60"
                  style={{ 
                    backgroundColor: ['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][group.id % 5],
                    paddingTop: '60%' // Creates aspect ratio for the fallback
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl font-bold opacity-20" style={{ 
                      color: getTextColor(['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][group.id % 5])
                    }}>
                      {group.group_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
              )}
              {/* Fade overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0.6) 90%, rgba(255,255,255,1) 100%)'
                }}
              />
              {/* Content overlay - Empty since content moved to header */}
              <div className="absolute inset-0 flex items-start justify-start p-6 pt-20">
              </div>
            </div>
          </div>
          
          {/* All Content Sections - Overlapping on banner */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10" style={{ marginTop: '-30%' }}>
          {/* Left Column */}
          <div className="space-y-8">
            {/* Members Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Members ({members.length})
              </h2>
              
              {membersLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-center">
                    <LoadingSpinner size="md" className="mx-auto mb-2" />
                    <p className="text-gray-500">Loading members...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 cursor-pointer ${
                        clickedMemberId === member.user_id 
                          ? 'bg-blue-50 border-blue-300 shadow-md scale-[1.02]' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handlePlayerClick(member)}
                    >
                      {/* Member Icon */}
                      <ProfileIcon 
                        memberId={member.user_id || index}
                        summonerName={member.summoner_name}
                        iconId={member.icon_id}
                        size="md"
                        shape="rounded-full"
                      />
                      
                      {/* Member Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span 
                            className={`font-medium transition-all duration-300 ${
                              clickedMemberId === member.user_id 
                                ? 'text-blue-600 scale-105' 
                                : 'text-gray-800 hover:text-blue-600'
                            }`}
                          >
                            {member.summoner_name}
                          </span>
                          {member.owner === 1 && (
                            <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        {/* Rank and ELO - Below name on mobile, hidden on larger screens */}
                        <div className="flex flex-row gap-2 text-xs sm:text-sm text-gray-600 sm:hidden">
                          {/* Rank */}
                          <div className="flex items-center gap-1">
                            <img 
                              src={getRankIconUrl(member.rank || 'UNRANKED')} 
                              alt={member.rank || 'UNRANKED'} 
                              className="w-3 h-3 sm:w-4 sm:h-4"
                              onError={(e) => {
                                console.log('Failed to load rank icon for:', member.rank, 'URL:', getRankIconUrl(member.rank || 'UNRANKED'));
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <span className="font-medium">{member.rank || 'UNRANKED'}</span>
                          </div>
                          
                          {/* ELO */}
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                            <span className="font-bold">{member.elo.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Rank and ELO - To the right on larger screens, hidden on mobile */}
                      <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-2">
                        {/* Rank */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <img 
                            src={getRankIconUrl(member.rank || 'UNRANKED')} 
                            alt={member.rank || 'UNRANKED'} 
                            className="w-4 h-4"
                            onError={(e) => {
                              console.log('Failed to load rank icon for:', member.rank, 'URL:', getRankIconUrl(member.rank || 'UNRANKED'));
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <span className="font-medium">{member.rank || 'UNRANKED'}</span>
                        </div>
                        
                        {/* ELO */}
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="font-bold">{member.elo.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Group Info Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Group Information
              </h2>
              
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                  <div className="relative">
                    <div 
                      id="description-container"
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 h-96 overflow-y-auto"
                      onScroll={handleDescriptionScroll}
                    >
                      <p className="text-gray-700 whitespace-pre-wrap text-left text-xs">
                        {groupInfo.description || 'No description available.'}
                      </p>
                    </div>
                    {descriptionOverflow && !descriptionScrolled && (
                      <div className="absolute bottom-2 right-2">
                        <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: '#00c9ac' }} />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Application Instructions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Application Instructions</h3>
                  <div className="relative">
                    <div 
                      id="instructions-container"
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 h-96 overflow-y-auto"
                      onScroll={handleInstructionsScroll}
                    >
                      <p className="text-gray-700 whitespace-pre-wrap text-left text-xs">
                        {groupInfo.instructions || 'No application instructions available.'}
                      </p>
                    </div>
                    {instructionsOverflow && !instructionsScrolled && (
                      <div className="absolute bottom-2 right-2">
                        <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: '#00c9ac' }} />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Meeting Schedule */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5" style={{ color: '#ff8889' }} />
                    Meeting Schedule
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-700 text-xs">
                      <span className="font-medium">
                        {Array.isArray(group.meeting_schedule) ? group.meeting_schedule.join(", ") : group.meeting_schedule}
                      </span>
                    </div>
                    {group.time && (
                      <div className="flex items-center gap-2 text-gray-700 mt-2 text-xs">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#00c9ac' }}>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">
                          {group.time.charAt(0).toUpperCase() + group.time.slice(1)}
                          {group.timezone && ` (${group.timezone})`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Team Stats Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Team Statistics</h2>
              
              {teamStatsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-center">
                    <LoadingSpinner size="md" className="mx-auto mb-2" />
                    <p className="text-gray-500">Loading team stats...</p>
                  </div>
                </div>
              ) : teamStatsError ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <p className="text-yellow-800 font-medium mb-2">No Team Stats Available</p>
                  <p className="text-yellow-600 text-sm">{teamStatsError}</p>
                </div>
              ) : teamStatsData.length > 0 ? (
                                  <div className="space-y-6">
                    {/* Team Stats Content */}
                    <TeamStatsContent 
                      teamStatsData={teamStatsData}
                      teamStatsLoading={teamStatsLoading}
                      teamStatsError={teamStatsError}
                      memberNames={memberNames}
                      liveData={liveData}
                      liveDataLoading={liveDataLoading}
                      className="w-full"
                    />
                    
                  </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-gray-600">No team stats available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Player Modal */}
      {showPlayerModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full h-[600px] overflow-y-auto flex flex-col relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowPlayerModal(false);
                setSelectedPlayer(null);
                setClickedMemberId(null);
                setPlayerLeagueData([]);
                setPlayerProfile(null);
              }}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-0 bg-transparent border-none w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center group hover:bg-transparent"
              style={{ lineHeight: 0 }}
            >
              <SquareX className="w-6 h-6 sm:w-10 sm:h-10 text-black group-hover:opacity-80 transition-opacity" />
            </button>
            
            {/* Profile Header */}
            <div className="relative">
              {/* Banner */}
              <div className="h-32 bg-[#00c9ac] relative">
                {/* Player Icon */}
                <div className="absolute -bottom-12 left-6">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden">
                      {selectedPlayer.icon_id ? (
                        <img
                          src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${selectedPlayer.icon_id}.png`}
                          alt={`${selectedPlayer.summoner_name} profile icon`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.parentElement?.querySelector('.profile-placeholder') as HTMLElement;
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`profile-placeholder w-full h-full flex items-center justify-center font-bold text-3xl ${selectedPlayer.icon_id ? 'hidden' : 'flex'}`}
                        style={{ 
                          backgroundColor: ['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][selectedPlayer.user_id % 5],
                          color: getTextColor(['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][selectedPlayer.user_id % 5])
                        }}
                      >
                        {selectedPlayer.summoner_name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Username and Tag */}
              <div className="pt-16 pb-4 px-6">
                <h3 className="text-xl font-bold text-gray-800 mb-1 text-left">{selectedPlayer.summoner_name}</h3>
                <p className="text-gray-500 text-sm text-left">Group Member</p>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="px-4 sm:px-6 border-b border-gray-200">
              <div className="flex space-x-2 sm:space-x-6 overflow-x-auto">
                <button 
                  onClick={() => setActivePlayerTab('about')}
                  className={`transition-colors pb-2 border-b-2 whitespace-nowrap text-sm sm:text-base ${
                    activePlayerTab === 'about' 
                      ? 'text-[#00c9ac] border-[#00c9ac]' 
                      : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#00c9ac]'
                  }`}
                >
                  About Me
                </button>
                <button 
                  onClick={() => setActivePlayerTab('stats')}
                  className={`transition-colors pb-2 border-b-2 whitespace-nowrap text-sm sm:text-base ${
                    activePlayerTab === 'stats' 
                      ? 'text-[#00c9ac] border-[#00c9ac]' 
                      : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#00c9ac]'
                  }`}
                >
                  TFT Stats
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-4 sm:p-6">
              {/* TFT Stats Section */}
          
              {activePlayerTab === 'stats' && (
                    <div className="space-y-6"> 
                <TFTStatsContent
                  leagueDataLoading={leagueDataLoading}
                  leagueDataError={leagueDataError}
                  playerLeagueData={playerLeagueData}
                  playerStatsLoading={playerStatsLoading}
                  playerStatsError={playerStatsError}
                  playerStatsData={playerStatsData}
                  getRankedTftData={getRankedTftData}
                  getTurboTftData={getTurboTftData}
                  className="w-full"
                />

                
     
              </div>
              )}
              
              {/* About Me Section */}
              {activePlayerTab === 'about' && (
                <div className="space-y-4">
                  {profileLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="text-center">
                        <LoadingSpinner size="md" className="mx-auto mb-2" />
                        <p className="text-gray-500">Loading profile data...</p>
                      </div>
                    </div>
                  ) : profileError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-600">{profileError}</p>
                    </div>
                  ) : playerProfile ? (
                    <div className="space-y-4">
                      {/* Description */}
                      <div className="w-full">
                        <h4 className="font-semibold text-gray-800 mb-3 text-left flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          Description
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                          <p className="text-gray-700 whitespace-pre-wrap text-left text-xs">
                            {playerProfile.description || "No description provided"}
                          </p>
                        </div>
                      </div>

                      {/* Availability */}
                      {playerProfile.days && playerProfile.days.length > 0 && (
                        <div className="w-full">
                          <h4 className="font-semibold text-gray-800 mb-3 text-left flex items-center gap-2">
                            <Calendar className="w-4 h-4" style={{ color: '#ff8889' }} />
                            Availability
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                            <div className="text-gray-700 text-xs text-left">
                              <span>{Array.isArray(playerProfile.days) ? playerProfile.days.join(", ") : playerProfile.days}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Time and Timezone */}
                      {playerProfile.time && (
                        <div className="w-full">
                          <h4 className="font-semibold text-gray-800 mb-3 text-left flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#00c9ac' }}>
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Preferred Time
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                            <div className="text-gray-700 text-xs text-left">
                              <span>
                                {playerProfile.time.charAt(0).toUpperCase() + playerProfile.time.slice(1)}
                                {playerProfile.timezone && ` (${playerProfile.timezone})`}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <p className="text-gray-600">No profile data available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components
function ProfileIcon({ 
  memberId, 
  summonerName, 
  iconId, 
  size = 'md',
  shape = 'rounded-lg'
}: { 
  memberId: number
  summonerName: string
  iconId?: number
  size?: 'sm' | 'md' | 'lg'
  shape?: 'rounded-lg' | 'rounded-full'
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${shape} overflow-hidden bg-gray-200 flex items-center justify-center`}>
      {iconId ? (
        <img
          src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${iconId}.png`}
          alt={`${summonerName} profile icon`}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const placeholder = target.parentElement?.querySelector('.profile-placeholder') as HTMLElement;
            if (placeholder) {
              placeholder.style.display = 'flex';
            }
          }}
        />
      ) : null}
      <div 
        className={`profile-placeholder w-full h-full flex items-center justify-center font-bold text-sm ${iconId ? 'hidden' : 'flex'}`}
        style={{ 
          backgroundColor: ['#564ec7', '#007760', '#de8741', '#ffa65f', '#ffc77e'][memberId % 5],
          color: getTextColor(['#564ec7', '#007760', '#de8741', '#ffa65f', '#ffc77e'][memberId % 5])
        }}
      >
        {summonerName.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}

// Function to get TFT rank icon URL - matching FreeAgentsTab
function getRankIconUrl(rank: string): string {
    const rankIcons: { [key: string]: string } = {
        'iron': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Iron.png',
        'bronze': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Bronze.png',
        'silver': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Silver.png',
        'gold': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Gold.png',
        'platinum': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Platinum.png',
        'emerald': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Emerald.png',
        'diamond': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Diamond.png',
        'master': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Master.png',
        'grandmaster': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_GrandMaster.png',
        'challenger': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Challenger.png',
    };
    
    const rankTier = getRankTier(rank);
    console.log('Rank tier for mapping:', rankTier);
    console.log('Available keys:', Object.keys(rankIcons));
    console.log('Generated URL:', rankIcons[rankTier] || 'NOT FOUND');
    
    return rankIcons[rankTier] || '';
}

// Function to extract rank tier from rank string - matching FreeAgentsTab
function getRankTier(rank: string): string {
    if (!rank || rank === 'UNRANKED') return '';
    
    // Debug logging
    console.log('Processing rank:', rank);
    
    const firstWord = rank.split(' ')[0].toLowerCase();
    console.log('Extracted tier:', firstWord);
    
    return firstWord;
}

function getTextColor(backgroundColor: string): string {
  // Simple contrast calculation
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
} 