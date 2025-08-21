import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronsLeft, Calendar, FileText, SquareX, Globe, ChevronDown } from 'lucide-react';
import { LoadingSpinner } from './auth/LoadingSpinner';
import { freeAgentService, type FreeAgent } from '../services/freeAgentService';
import { studyGroupService } from '../services/studyGroupService';
import { studyGroupInviteService } from '../services/studyGroupInviteService';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { playerStatsService } from '../services/playerStatsService';
import { TFTStatsContent } from './TFTStatsContent';
import { Footer } from './Footer';
import { riotService } from '../services/riotService';

interface FreeAgentProfilePageProps {}

// Placeholder Components

function PlaceholderStatsSection() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Stats grid placeholder */}
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
      
      {/* Chart placeholder */}
      <div className="h-48 bg-gray-200 rounded-lg"></div>
    </div>
  );
}

export function FreeAgentProfilePage({}: FreeAgentProfilePageProps) {
  const { user_id } = useParams<{ user_id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  
  // Agent data state
  const [agent, setAgent] = useState<FreeAgent | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  
  // League data state
  const [leagueData, setLeagueData] = useState<any[]>([]);
  const [leagueDataError, setLeagueDataError] = useState<string | null>(null);
  
  // Player stats state
  const [playerStatsData, setPlayerStatsData] = useState<any[]>([]);
  const [playerStatsError, setPlayerStatsError] = useState<string | null>(null);
  
  // Optimized loading states
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLeagueDataLoading, setIsLeagueDataLoading] = useState(false);
  const [isPlayerStatsLoading, setIsPlayerStatsLoading] = useState(false);
  
  // Invitation modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [selectedStudyGroupId, setSelectedStudyGroupId] = useState<number | null>(null);
  const [userStudyGroups, setUserStudyGroups] = useState<any[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  
  // Overflow detection state
  const [descriptionOverflow, setDescriptionOverflow] = useState(false);
  const [descriptionScrolled, setDescriptionScrolled] = useState(false);
  
  // Profile icon state
  const [profileIconUrl, setProfileIconUrl] = useState<string | null>(null);
  const [iconError, setIconError] = useState(false);
  const [iconLoading, setIconLoading] = useState(false);


  // Fetch agent data on mount
  useEffect(() => {
    if (user_id) {
      // Scroll to top when navigating to this page
      window.scrollTo(0, 0);
      fetchInitialData(parseInt(user_id));
    }
  }, [user_id]);

  // Fetch initial data with optimized loading
  const fetchInitialData = async (id: number) => {
    try {
      // Get agent data immediately
      const agentData = await freeAgentService.getFreeAgentById(id);
      setAgent(agentData);
      
      // Show the page with placeholders
      setIsInitialLoading(false);
      setIsLeagueDataLoading(true);
      setIsPlayerStatsLoading(true);
      
      // Start loading additional data in background
      Promise.all([
        fetchAgentLeagueData(id),
        ...(agentData.riot_id ? [fetchPlayerStats(agentData.riot_id)] : [])
      ]).catch(err => {
        console.error('Background data loading failed:', err);
        // Don't show error to user for background loading
      });
      
    } catch (err) {
      console.error('Error fetching initial agent data:', err);
      setIsInitialLoading(false);
      setAgentError('Failed to load agent data. Please try refreshing the page.');
    }
  };

  // Fetch user's study groups for the dropdown
  useEffect(() => {
    if (userId) {
      fetchUserStudyGroups();
    }
  }, [userId]);

  // Fetch profile icon when agent data is loaded
  const fetchProfileIcon = async () => {
    if (!agent?.icon_id) {
      setIconError(true);
      return;
    }

    setIconLoading(true);
    try {
      const version = await riotService.getCurrentVersion();
      const iconUrl = riotService.getProfileIconUrl(agent.icon_id, version);
      setProfileIconUrl(iconUrl);
      setIconError(false);
    } catch (error) {
      console.error('Error fetching profile icon:', error);
      setIconError(true);
    } finally {
      setIconLoading(false);
    }
  };

  useEffect(() => {
    if (agent?.icon_id && !iconError) {
      fetchProfileIcon();
    }
  }, [agent?.icon_id]);

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



  const fetchUserStudyGroups = async () => {
    if (!userId) return;
    
    try {
      const userGroups = await retryWithBackoff(() => studyGroupService.getUserStudyGroupsByUser(userId));
      setUserStudyGroups(userGroups);
    } catch (error) {
      console.error('Error fetching user study groups:', error);
    }
  };

  const fetchAgentLeagueData = async (agentId: number) => {
    setLeagueDataError(null);
    
    try {
      // Get the agent's Riot account to get their puuid
      const riotAccount = await userService.getUserRiotAccount(agentId);
      if (!riotAccount || !riotAccount.riot_id) {
        setLeagueDataError('No Riot account found for this user');
        return;
      }

      // Fetch league data using the riot_id (which contains the PUUID)
      const fetchLeagueData = async () => {
        const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';
        const response = await fetch(`${API_BASE_URL}/api/tft-league/${riotAccount.riot_id}?user_id=${agentId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch league data: ${response.status}`);
        }
        return response.json();
      };
      
      const data = await fetchLeagueData();
      setLeagueData(data);
    } catch (error) {
      console.error('Error fetching agent league data:', error);
      // Try once more with retry
      try {
        const riotAccount = await retryWithBackoff(() => userService.getUserRiotAccount(agentId));
        if (!riotAccount || !riotAccount.riot_id) {
          setLeagueDataError('No Riot account found for this user');
          return;
        }
        
        const fetchLeagueData = async () => {
          const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';
          const response = await fetch(`${API_BASE_URL}/api/tft-league/${riotAccount.riot_id}?user_id=${agentId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch league data: ${response.status}`);
          }
          return response.json();
        };
        
        const data = await retryWithBackoff(fetchLeagueData);
        setLeagueData(data);
      } catch (retryError) {
        setLeagueDataError('Failed to load league data');
        setLeagueData([]);
      }
    } finally {
      setIsLeagueDataLoading(false);
    }
  };

  const fetchPlayerStats = async (riotId: string) => {
    setPlayerStatsError(null);
    
    try {
      const stats = await playerStatsService.getPlayerStats(riotId);
      console.log('📊 Player stats received:', stats);
      // Extract the events array from the PlayerStatsData object
      setPlayerStatsData(stats?.events || []);
    } catch (error) {
      console.error('Error fetching player stats:', error);
      // Try once more with retry
      try {
        const stats = await retryWithBackoff(() => playerStatsService.getPlayerStats(riotId));
        setPlayerStatsData(stats?.events || []);
      } catch (retryError) {
        setPlayerStatsError('Failed to load player stats');
        setPlayerStatsData([]);
      }
    } finally {
      setIsPlayerStatsLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!userId || !selectedStudyGroupId || !agent) return;
    
    setInviteLoading(true);
    try {
      await studyGroupInviteService.createInvite({
        user_one: userId,
        user_two: agent.id,
        study_group_id: selectedStudyGroupId,
        message: inviteMessage
      });
      
      // Close modal and reset form
      setShowInviteModal(false);
      setInviteMessage("");
      setSelectedStudyGroupId(null);
      
      // Show success message (you could add a toast notification here)
      alert('Invitation sent successfully!');
    } catch (error) {
      console.error('Error sending invitation:', error);
      
      // Extract the specific error message from the server response
      let errorMessage = 'Failed to send invitation. Please try again.';
      
      if (error instanceof Error) {
        // Try to parse the error message from the response
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If parsing fails, use the error message as is
          if (error.message) {
            errorMessage = error.message;
          }
        }
      }
      
      alert(errorMessage);
    } finally {
      setInviteLoading(false);
    }
  };

  const getRankedTftData = () => {
    return leagueData.find(data => data.queueType === 'RANKED_TFT');
  };

  const getTurboTftData = () => {
    return leagueData.find(data => data.queueType === 'RANKED_TFT_TURBO');
  };

  // Function to get text color based on background color
  const getTextColor = (backgroundColor: string): string => {
    // Simple contrast calculation
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    if (brightness > 128) {
      return '#333333';
    }
    return '#ffffff';
  };

  // Overflow detection functions
  const checkOverflow = (element: HTMLElement) => {
    return element.scrollHeight > element.clientHeight;
  };

  const handleDescriptionScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    console.log('🖱️ Scroll event:', target.scrollTop);
    if (target.scrollTop > 0) {
      console.log('✅ Setting scrolled to true');
      setDescriptionScrolled(true);
    }
  };

  // Check overflow when agent data is loaded
  useEffect(() => {
    if (agent && !isInitialLoading) {
      // Add a small delay to ensure content is rendered
      const timeoutId = setTimeout(() => {
        const descriptionElement = document.getElementById('description-container');
        if (descriptionElement) {
          setDescriptionOverflow(checkOverflow(descriptionElement));
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [agent, isInitialLoading]);

  // Show initial loading spinner until we get agent data
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state if agent fails to load
  if (agentError || !agent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{agentError || 'Profile not found'}</p>
          <button 
            onClick={() => navigate('/study-groups/free-agents')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Free Agents
          </button>
        </div>
      </div>
    );
  }

  console.log('🎨 Component rendering, agent:', agent?.id);
  return (
    <div className="min-h-screen bg-white text-gray-800 relative flex flex-col">
      {/* Notebook Lines Background - Full Viewport */}
      <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#F0F3F0' }}>
        <div className="absolute inset-0 opacity-15 dark:opacity-20">
          <svg width="100%" height="100%">
            <pattern id="notebook-lines-free-agent" x="0" y="0" width="100%" height="24" patternUnits="userSpaceOnUse">
              <line
                x1="0"
                y1="23"
                x2="100%"
                y2="23"
                stroke="currentColor"
                strokeWidth="1"
                className="text-blue-500 dark:text-blue-400"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#notebook-lines-free-agent)" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full sm:max-w-7xl sm:mx-auto px-0 sm:px-6 lg:px-8 relative z-10">
        {/* Back Button */}
        <div className="mt-4 sm:mt-6 mb-4 sm:mb-6 px-4 sm:px-0">
          <button
            onClick={() => navigate('/study-groups/free-agents')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 w-fit"
          >
            <ChevronsLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Back to Free Agents</span>
          </button>
        </div>

        {/* Profile Header - Matching old player modal style */}
        <div className="relative mx-2 sm:mx-0">
          {/* Banner */}
          <div className="h-24 sm:h-32 bg-[#2f4858] relative rounded-t-lg">
            {/* Agent Icon */}
            <div className="absolute -bottom-8 sm:-bottom-12 left-4 sm:left-6">
              <div className="relative">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-white overflow-hidden">
                  {profileIconUrl && !iconError && !iconLoading ? (
                    <img
                      src={profileIconUrl}
                      alt={`${agent.summoner_name} profile icon`}
                      className="w-full h-full object-cover"
                      onError={() => setIconError(true)}
                    />
                  ) : null}
                  <div 
                    className={`profile-placeholder w-full h-full flex items-center justify-center font-bold text-3xl ${(profileIconUrl && !iconError && !iconLoading) ? 'hidden' : 'flex'}`}
                    style={{ 
                      backgroundColor: ['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][agent.id % 5],
                      color: getTextColor(['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][agent.id % 5])
                    }}
                  >
                    {agent.summoner_name.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Username and Tag */}
          <div className="pt-12 sm:pt-16 pb-4 px-4 sm:px-6 bg-white rounded-b-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 text-left">{agent.summoner_name}</h3>
                <p className="text-gray-500 text-sm text-left">Free Agent</p>
              </div>
              {userId && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-[#00c9ac] hover:bg-[#00c9ac]/80 text-white px-4 py-2 rounded-lg font-medium transition-colors w-fit"
                >
                  Send Invitation
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-b-lg mx-2 sm:mx-0">
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Left Column - About Me Section */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">About Me</h3>
                
                {/* Description */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-left flex items-center gap-2">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    Description
                  </h4>
                  <div className="relative">
                    <div 
                      id="description-container"
                      className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 h-64 sm:h-96 overflow-y-auto"
                      onScroll={handleDescriptionScroll}
                    >
                      <p className="text-gray-700 whitespace-pre-wrap text-left text-xs">
                        {agent.looking_for || "No description provided"}
                      </p>
                    </div>
                    {descriptionOverflow && !descriptionScrolled && (
                      <div className="absolute bottom-2 right-2">
                        <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: '#00c9ac' }} />
                      </div>
                    )}

                  </div>
                </div>

                {/* Availability */}
                {agent.availability && agent.availability.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-left flex items-center gap-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#ff8889' }} />
                      Availability
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-gray-700 text-left text-xs">
                        <span>{Array.isArray(agent.availability) ? agent.availability.join(", ") : agent.availability}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Time and Timezone */}
                {(agent.time || agent.timezone) && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-left flex items-center gap-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#00c9ac' }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Preferred Time
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-gray-700 text-left text-xs">
                        {agent.time ? (
                          <span>
                            {agent.time.charAt(0).toUpperCase() + agent.time.slice(1)}
                            {agent.timezone && ` (${agent.timezone})`}
                          </span>
                        ) : (
                          <span>
                            Timezone: {agent.timezone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Region */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-left flex items-center gap-2">
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                    Region
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                          <div className="text-gray-700 text-left text-xs">
                        <span>{agent.region}</span>
                      </div>
                  </div>
                </div>




              </div>

              {/* Right Column - TFT Stats Section */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">TFT Statistics</h3>
                {isLeagueDataLoading || isPlayerStatsLoading ? (
                  <PlaceholderStatsSection />
                ) : (
                  <TFTStatsContent
                    leagueDataLoading={isLeagueDataLoading}
                    leagueDataError={leagueDataError}
                    playerLeagueData={leagueData}
                    playerStatsLoading={isPlayerStatsLoading}
                    playerStatsError={playerStatsError}
                    playerStatsData={playerStatsData}
                    getRankedTftData={getRankedTftData}
                    getTurboTftData={getTurboTftData}
                    className="w-full"
                    userId={user_id ? parseInt(user_id) : undefined}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invitation Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Send Invitation</h3>
              <button
                onClick={() => { 
                  setShowInviteModal(false); 
                  setInviteMessage(""); 
                  setSelectedStudyGroupId(null);
                }}
                className="p-0 bg-transparent border-none w-10 h-10 flex items-center justify-center group hover:bg-transparent"
                style={{ lineHeight: 0 }}
              >
                <SquareX className="w-10 h-10 text-black group-hover:opacity-80 transition-opacity" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-[#00c9ac]/10 border border-[#00c9ac]/20 rounded-lg p-4">
                <h4 className="font-semibold text-[#00c9ac] mb-2">Inviting {agent.summoner_name}</h4>
                <p className="text-[#00c9ac] text-sm">Send a personalized message to invite them to your group.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Study Group *
                </label>
                <select
                  value={selectedStudyGroupId || ''}
                  onChange={(e) => setSelectedStudyGroupId(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
                  required
                >
                  <option value="">Choose a study group...</option>
                  {userStudyGroups.map((userGroup) => (
                    <option key={userGroup.study_group?.id} value={userGroup.study_group?.id}>
                      {userGroup.study_group?.group_name || 'Unknown Group'}
                    </option>
                  ))}
                </select>
                {userStudyGroups.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    You need to be a member of at least one study group to send invitations.
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invitation Message
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 resize-vertical"
                  placeholder="Write a personalized message explaining why you'd like them to join your group..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { 
                    setShowInviteModal(false); 
                    setInviteMessage(""); 
                    setSelectedStudyGroupId(null);
                  }}
                  className="flex-1 bg-[#ff8889] hover:bg-[#ff8889]/80 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  disabled={inviteLoading}
                >
                  Cancel
                </button>
                {userId && (
                  <button
                    onClick={handleSendInvite}
                    disabled={!selectedStudyGroupId || inviteLoading}
                    className="flex-1 bg-[#00c9ac] hover:bg-[#00c9ac]/80 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inviteLoading ? 'Sending...' : 'Send Invitation'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
} 