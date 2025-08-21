import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SquareX, Crown, ChevronsLeft, Users, Calendar, Zap, FileText, ChevronDown } from 'lucide-react';
import { LoadingSpinner } from './auth/LoadingSpinner';
import { studyGroupService } from '../services/studyGroupService';
import { userService } from '../services/userService';
import { playerStatsService } from '../services/playerStatsService';
import { teamStatsService, type MemberData } from '../services/teamStatsService';
import { api } from '../services/apiUtils';

import { riotService } from '../services/riotService';
import { riotAuthService } from '../services/riotAuthService';
import { useAuth } from '../contexts/AuthContext';
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

// Placeholder Components

function PlaceholderMemberCard() {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 animate-pulse transition-opacity duration-300">
      <div className="flex items-center gap-3">
        {/* Profile icon placeholder */}
        <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
        
        <div className="min-w-0">
          {/* Name placeholder */}
          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
          {/* Rank placeholder */}
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      
      {/* ELO placeholder */}
      <div className="flex items-center gap-2">
        <div className="h-4 bg-gray-200 rounded w-12"></div>
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}



function PlaceholderTeamStats() {
  return (
    <div className="space-y-4 animate-pulse transition-opacity duration-300">
      {/* Chart placeholder */}
      <div className="h-48 bg-gray-200 rounded-lg"></div>
      
      {/* Stats grid placeholder */}
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
      
      {/* Table placeholder */}
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-1">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderContentSection() {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-left flex items-center gap-2">
        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </h4>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 h-96 overflow-y-auto">
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
}

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  
  // Group state - now independent
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [groupError, setGroupError] = useState<string | null>(null);
  
  // Members state - now independent
  const [members, setMembers] = useState<MemberData[]>([]);
  
  // Placeholder loading state
  const [memberCount, setMemberCount] = useState(0);
  const [showMemberPlaceholders, setShowMemberPlaceholders] = useState(false);
  const [isMemberDataLoading, setIsMemberDataLoading] = useState(false);
  const [isTeamStatsLoading, setIsTeamStatsLoading] = useState(true);
  
  // Group info state
  const [groupInfo, setGroupInfo] = useState({ description: '', instructions: '' });
  const [isGroupInfoLoading, setIsGroupInfoLoading] = useState(false);
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
  
  // Team stats state - now independent
  const [teamStatsData, setTeamStatsData] = useState<any[]>([]);

  const [teamStatsError, setTeamStatsError] = useState<string | null>(null);
  const [memberNames, setMemberNames] = useState<{ [riotId: string]: string }>({});
  const [liveData, setLiveData] = useState<{ [summonerName: string]: any }>({});
  const [liveDataLoading, setLiveDataLoading] = useState(false);
  
  // Update button state
  const [isUpdatingData, setIsUpdatingData] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<string>('');



  // Profile icon state for selected player
  const [selectedPlayerIconUrl, setSelectedPlayerIconUrl] = useState<string>('');
  const [selectedPlayerIconError, setSelectedPlayerIconError] = useState(false);
  const [selectedPlayerIconLoading, setSelectedPlayerIconLoading] = useState(false);

  // Overflow detection state
  const [descriptionOverflow, setDescriptionOverflow] = useState(false);
  const [instructionsOverflow, setInstructionsOverflow] = useState(false);
  const [membersOverflow, setMembersOverflow] = useState(false);
  const [descriptionScrolled, setDescriptionScrolled] = useState(false);
  const [instructionsScrolled, setInstructionsScrolled] = useState(false);
  const [membersScrolled, setMembersScrolled] = useState(false);

  // Initialize page - start loading all components independently
  useEffect(() => {
    if (groupId) {
      // Scroll to top when navigating to this page
      window.scrollTo(0, 0);
      
      // Start loading immediately
      fetchInitialCounts(parseInt(groupId));
    }
  }, [groupId]);

  // Fetch initial counts to determine placeholder quantities
  const fetchInitialCounts = async (id: number) => {
    try {
      // Get group data and member count in parallel with faster timeout
      const [groupDetails, groupUsers] = await Promise.all([
        studyGroupService.getStudyGroup(id), // Remove retry for faster initial load
        studyGroupService.getStudyGroupUsers(id, false) // Don't update ranks for count
      ]);
      
      // Set all initial data immediately
      setGroup(groupDetails);
      setGroupInfo({
        description: groupDetails.description || '',
        instructions: groupDetails.application_instructions || ''
      });
      setMemberCount(groupUsers.length);
      
      // Show the page with placeholders immediately
      setShowMemberPlaceholders(true);
      setIsMemberDataLoading(true);
      setIsTeamStatsLoading(true);
      
      // Start loading detailed member data and team stats in background
      Promise.all([
        fetchMembersData(id),
        fetchTeamStatsData(id, true) // Load live data initially to get wins/losses
      ]).then(async () => {
        // After loading team stats, check if we need to create initial rank audit events
        try {
          const memberStats = await teamStatsService.getMemberStats(id, groupDetails.created_at);
          if (!memberStats.events || memberStats.events.length === 0) {
            console.log('📊 No rank audit events found, creating initial events...');
            // Get members with riot_id and create initial rank audit events
            const groupUsers = await studyGroupService.getStudyGroupUsers(id, false);
            const membersWithRiotId = await Promise.all(
              groupUsers.map(async (member) => {
                try {
                  const riotAccount = await userService.getUserRiotAccount(member.user_id);
                  return {
                    ...member,
                    riot_id: riotAccount?.riot_id || null
                  };
                } catch (error) {
                  console.error(`❌ Error getting riot_id for user ${member.user_id}:`, error);
                  return {
                    ...member,
                    riot_id: null
                  };
                }
              })
            );
            await createRankAuditEventsForMembers(membersWithRiotId);
          }
        } catch (error) {
          console.error('Error checking for initial rank audit events:', error);
        }
      }).catch(err => {
        console.error('Background data loading failed:', err);
        // Don't show error to user for background loading
      });
      
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setGroupError('Failed to load group data. Please try refreshing the page.');
    }
  };

  // Fetch selected player icon when selectedPlayer changes
  useEffect(() => {
    if (selectedPlayer?.icon_id) {
      fetchSelectedPlayerIcon();
    }
  }, [selectedPlayer?.icon_id]);

  // Fetch group icon in background when group data is available
  useEffect(() => {
    if (group?.image_url) {
      // Preload the group image in background
      const img = new Image();
      img.onload = () => {
        // Image loaded successfully, it will be displayed automatically
      };
      img.onerror = () => {
        // Image failed to load, will show fallback
      };
      img.src = group.image_url;
    }
  }, [group?.image_url]);

  // Preload member profile icons in background when members data is available
  useEffect(() => {
    if (members.length > 0) {
      // Preload member icons in background
      members.forEach(member => {
        if (member.icon_id) {
          // The ProfileIcon component will handle the icon loading
          // This is just to ensure the data is available
        }
      });
    }
  }, [members]);

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



  // Independent members data fetching
  const fetchMembersData = async (id: number) => {
    try {
      // Use faster loading without retry for better UX
      const groupUsers = await studyGroupService.getStudyGroupUsers(id, false); // Don't update ranks, use stored data
      
      const membersData = groupUsers.map(relationship => ({
        summoner_name: relationship.summoner_name || 'Unknown User',
        elo: relationship.elo || 0,
        rank: relationship.rank || 'UNRANKED',
        owner: relationship.owner,
        icon_id: relationship.icon_id,
        user_id: relationship.user_id
      }));
      
      setMembers(membersData);
      // Hide placeholders now since we have member data (rank/elo from database)
      setShowMemberPlaceholders(false);
      
    } catch (err) {
      console.error('Error fetching members data:', err);
      // Don't show error immediately, try once more with retry
      try {
        const groupUsers = await retryWithBackoff(() => studyGroupService.getStudyGroupUsers(id, false));
        const membersData = groupUsers.map(relationship => ({
          summoner_name: relationship.summoner_name || 'Unknown User',
          elo: relationship.elo || 0,
          rank: relationship.rank || 'UNRANKED',
          owner: relationship.owner,
          icon_id: relationship.icon_id,
          user_id: relationship.user_id
        }));
        setMembers(membersData);
        // Hide placeholders now since we have member data (rank/elo from database)
        setShowMemberPlaceholders(false);
      } catch (retryErr) {
        console.error('Retry failed:', retryErr);
        setShowMemberPlaceholders(false);
      }
    } finally {
      setIsMemberDataLoading(false);
    }
  };

  // Function to fetch updated group information
  const fetchUpdatedGroupInfo = async (id: number) => {
    console.log('🔄 Starting group info update for group ID:', id);
    setIsGroupInfoLoading(true);
    try {
      // Step 1: Update the database with fresh data from Riot Games API
      console.log('📡 Step 1: Updating database with fresh rank data from Riot API...');
      const updatedGroupUsers = await studyGroupService.getStudyGroupUsers(id, true); // updateRanks = true
      console.log('📊 Database updated with fresh data for', updatedGroupUsers.length, 'members');
      
      // Step 2: Fetch the updated group details from database
      console.log('📡 Step 2: Fetching updated group details from database...');
      const updatedGroupDetails = await studyGroupService.getStudyGroup(id);
      console.log('📊 Updated group details fetched from database');
      
      // Step 3: Update the UI with the fresh data
      console.log('📡 Step 3: Updating UI with fresh data...');
      
      // Check if data actually changed
      const currentDescription = groupInfo.description;
      const currentInstructions = groupInfo.instructions;
      const newDescription = updatedGroupDetails.description || '';
      const newInstructions = updatedGroupDetails.application_instructions || '';
      
      console.log('📝 Data comparison:', {
        descriptionChanged: currentDescription !== newDescription,
        instructionsChanged: currentInstructions !== newInstructions,
        oldDescription: currentDescription,
        newDescription: newDescription,
        oldInstructions: currentInstructions,
        newInstructions: newInstructions
      });
      
      // Force a re-render by creating new objects
      setGroup({ ...updatedGroupDetails });
      setGroupInfo({
        description: newDescription,
        instructions: newInstructions
      });
      
      // Also update the members data with fresh rank/elo
      const membersData = updatedGroupUsers.map(relationship => ({
        summoner_name: relationship.summoner_name || 'Unknown User',
        elo: relationship.elo || 0,
        rank: relationship.rank || 'UNRANKED',
        owner: relationship.owner,
        icon_id: relationship.icon_id,
        user_id: relationship.user_id
      }));
      setMembers(membersData);
      
      console.log('✅ Group info and members updated successfully in UI');
      
      // Return the updated members data for immediate use
      return membersData;
    } catch (error) {
      console.error('❌ Error fetching updated group info:', error);
      return [];
    } finally {
      // Add a small delay to make the loading state visible and ensure database operations complete
      setTimeout(() => {
        setIsGroupInfoLoading(false);
        console.log('🏁 Group info loading finished');
      }, 1000);
    }
  };

  // Function to create rank audit events for all members
  const createRankAuditEventsForMembers = async (members: any[]) => {
    console.log('📊 Creating rank audit events for members:', members.length);
    
    // Filter out members without required data
    const validMembers = members.filter(member => 
      member.riot_id && member.elo !== undefined && member.elo !== null
    );
    
    if (validMembers.length === 0) {
      console.log('⚠️ No valid members found for rank audit events');
      return 0;
    }
    
    console.log(`📊 Processing ${validMembers.length} valid members for rank audit events`);
    
    // Create rank audit events for each member
    const auditPromises = validMembers.map(async (member, index) => {
      console.log(`📡 Creating rank audit event ${index + 1}/${validMembers.length} for ${member.summoner_name}...`);
      
      // Get wins and losses from live data if available, otherwise try to fetch them
      let wins = 0;
      let losses = 0;
      
      const liveMemberData = liveData[member.summoner_name];
      if (liveMemberData) {
        wins = liveMemberData.wins || 0;
        losses = liveMemberData.losses || 0;
      } else {
        // If no live data available, try to fetch it for this member
        try {
          console.log(`📡 Fetching live data for ${member.summoner_name} to get wins/losses...`);
          const riotAccount = await userService.getUserRiotAccount(member.user_id);
          if (riotAccount?.riot_id) {
            // Fetch live data from Riot API
            const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';
            const response = await fetch(`${API_BASE_URL}/api/tft-league/${riotAccount.riot_id}?user_id=${member.user_id}`);
            if (response.ok) {
              const leagueData = await response.json();
              const rankedData = leagueData.find((entry: any) => entry.queueType === 'RANKED_TFT');
              if (rankedData) {
                wins = rankedData.wins || 0;
                losses = rankedData.losses || 0;
                console.log(`✅ Fetched wins/losses for ${member.summoner_name}: ${wins}W/${losses}L`);
              }
            }
          }
        } catch (error) {
          console.error(`❌ Error fetching live data for ${member.summoner_name}:`, error);
        }
      }
      
      console.log(`📊 Final data for ${member.summoner_name}:`, {
        wins,
        losses,
        elo: member.elo
      });
      
      const auditData = {
        elo: member.elo,
        wins: wins,
        losses: losses,
        riot_id: member.riot_id
      };
      
      try {
        console.log(`🔐 Making API call to /api/rank-audit-events for ${member.summoner_name}`);
        console.log(`🔐 Request data:`, auditData);
        const result = await api.post('/api/rank-audit-events', auditData);
        console.log(`✅ Created rank audit event for ${member.summoner_name}:`, result);
        return result;
      } catch (error) {
        console.error(`❌ Error creating rank audit event for ${member.summoner_name}:`, error);
        console.error(`❌ Error details:`, error instanceof Error ? error.message : error);
        // Don't fail the entire process if one member fails
        return null;
      }
    });
    
    try {
      console.log('📡 Waiting for all rank audit events to be created in database...');
      const results = await Promise.all(auditPromises);
      const successful = results.filter(result => result !== null).length;
      console.log(`📊 Rank audit events created: ${successful}/${validMembers.length} successful`);
      return successful;
    } catch (error) {
      console.error('❌ Error creating rank audit events:', error);
      return 0;
    }
  };

  // Function to update live data (called by update button)
  const updateLiveData = async () => {
    if (!groupId || isUpdatingData) return;
    
    console.log('🚀 Update button clicked, starting data refresh...');
    console.log('🔐 Auth check - Token exists:', !!riotAuthService.getToken());
    console.log('🔐 Auth check - User ID:', userId);
    console.log('🔐 Auth check - Is authenticated:', riotAuthService.isAuthenticated());
    setIsUpdatingData(true);
    
    try {
      // Step 1: Fetch fresh live data
      setUpdateProgress('Fetching fresh live data...');
      console.log('📡 Step 1: Fetching fresh live data...');
      await fetchTeamStatsData(parseInt(groupId), true);
      
      // Step 2: Update database with fresh rank data and fetch updated group info
      setUpdateProgress('Updating database with fresh rank data...');
      console.log('📡 Step 2: Updating database with fresh rank data...');
      const updatedMembers = await fetchUpdatedGroupInfo(parseInt(groupId));
      
      // Step 3: Create rank audit events for all members with riot_id
      if (updatedMembers && updatedMembers.length > 0) {
        setUpdateProgress('Creating rank audit events...');
        console.log('📡 Step 3: Creating rank audit events for updated members...');
        
        // Get riot_id for each member
        const membersWithRiotId = await Promise.all(
          updatedMembers.map(async (member) => {
            try {
              const riotAccount = await userService.getUserRiotAccount(member.user_id);
              return {
                ...member,
                riot_id: riotAccount?.riot_id || null
              };
            } catch (error) {
              console.error(`❌ Error getting riot_id for user ${member.user_id}:`, error);
              return {
                ...member,
                riot_id: null
              };
            }
          })
        );
        
        // Wait for all rank audit events to be created in the database
        const auditResults = await createRankAuditEventsForMembers(membersWithRiotId);
        console.log(`📊 Rank audit events created: ${auditResults} successful`);
      }
      
      // Step 4: Final refresh of team stats to show updated data
      setUpdateProgress('Refreshing team stats...');
      console.log('📡 Step 4: Refreshing team stats with updated data...');
      await fetchTeamStatsData(parseInt(groupId), false); // Don't fetch live data again, just refresh from database
      
      setUpdateProgress('Update completed successfully!');
      console.log('✅ All data updated successfully');
    } catch (error) {
      console.error('❌ Error updating live data:', error);
      setUpdateProgress('Update failed - please try again');
    } finally {
      // Add a small delay to ensure the user sees the completion
      setTimeout(() => {
        setIsUpdatingData(false);
        setUpdateProgress('');
        console.log('🏁 Update process finished');
      }, 1000);
    }
  };

  // Independent team stats data fetching
  const fetchTeamStatsData = async (id: number, loadLiveData: boolean = false) => {
    setTeamStatsError(null);
    if (loadLiveData) {
      setLiveDataLoading(true);
    }
    
    try {
      // Use the group data we already have instead of fetching again
      const groupDetails = group || await studyGroupService.getStudyGroup(id);
      
      if (loadLiveData) {
        // Only fetch live data when explicitly requested
        try {
          const combinedStats = await teamStatsService.getCombinedTeamStats(id, groupDetails.created_at);
          
          setTeamStatsData(combinedStats.events || []);
          setMemberNames(combinedStats.memberNames || {});
          setLiveData(combinedStats.liveData || {});
          
        } catch (combinedError) {
          console.log('⚠️ Combined API failed, using separate calls:', combinedError);
          
          // Fallback to separate API calls
          const memberStats = await teamStatsService.getMemberStats(id, groupDetails.created_at);
          
          // Handle team stats data
          let allEvents: any[] = [];
          let names: { [riotId: string]: string } = {};
          let liveDataFromAPI: any = {};
          
          if (memberStats && memberStats.events && Array.isArray(memberStats.events)) {
            allEvents = memberStats.events;
            if (memberStats.memberNames && typeof memberStats.memberNames === 'object') {
              names = memberStats.memberNames as unknown as { [riotId: string]: string };
            }
            if (memberStats.liveData && typeof memberStats.liveData === 'object') {
              liveDataFromAPI = memberStats.liveData as unknown as { [summonerName: string]: any };
            }
          } else if (memberStats && typeof memberStats === 'object' && Object.keys(memberStats).length > 0) {
            allEvents = Object.values(memberStats).flat();
            Object.keys(memberStats).forEach(summonerName => {
              names[summonerName] = summonerName;
            });
          }
          
          setTeamStatsData(allEvents);
          setMemberNames(names);
          setLiveData(liveDataFromAPI);
        }
      } else {
        // Just fetch basic team stats without live data
        try {
          const memberStats = await teamStatsService.getMemberStats(id, groupDetails.created_at);
          
          let allEvents: any[] = [];
          let names: { [riotId: string]: string } = {};
          
          if (memberStats && memberStats.events && Array.isArray(memberStats.events)) {
            allEvents = memberStats.events;
            if (memberStats.memberNames && typeof memberStats.memberNames === 'object') {
              names = memberStats.memberNames as unknown as { [riotId: string]: string };
            }
          } else if (memberStats && typeof memberStats === 'object' && Object.keys(memberStats).length > 0) {
            allEvents = Object.values(memberStats).flat();
            Object.keys(memberStats).forEach(summonerName => {
              names[summonerName] = summonerName;
            });
          }
          
          setTeamStatsData(allEvents);
          setMemberNames(names);
          // Don't set live data - keep existing or empty
        } catch (err) {
          console.error('Error fetching basic team stats:', err);
          // Don't set error for basic stats failure
        }
      }
      
    } catch (err) {
      console.error('Error fetching team stats data:', err);
      setTeamStatsError('Failed to load team stats data.');
    } finally {
      if (loadLiveData) {
        setLiveDataLoading(false);
      }
      setIsTeamStatsLoading(false);
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

  // Helper function to get most recent ELO for a member from date-based data
  const getCurrentElo = (member: MemberData | GroupMember): number | null => {
    // First try to find the most recent data from team stats
    if (teamStatsData && teamStatsData.length > 0) {
      // Find the most recent event for this member
      const memberEvents = teamStatsData.filter(event => {
        const eventSummonerName = memberNames[event.riot_id] || event.riot_id;
        return eventSummonerName.toLowerCase() === member.summoner_name.toLowerCase();
      });
      
      if (memberEvents.length > 0) {
        // Sort by date and get the most recent
        const mostRecentEvent = memberEvents.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        console.log(`📊 Using most recent ELO for ${member.summoner_name}: ${mostRecentEvent.elo} (from ${mostRecentEvent.created_at})`);
        return mostRecentEvent.elo;
      }
    }
    
    // Fallback to stored ELO data from database (riot_accounts table)
    if (member.elo && member.elo > 0) {
      console.log(`📊 Using stored ELO for ${member.summoner_name}: ${member.elo}`);
      return member.elo;
    }
    
    // No ELO data available
    console.log(`❌ No ELO data for ${member.summoner_name}`);
    return null;
  };

  // Helper function to convert ELO to approximate rank
  const eloToRank = (elo: number): string => {
    if (elo >= 2400) return 'MASTER';
    if (elo >= 2000) return 'DIAMOND';
    if (elo >= 1600) return 'PLATINUM';
    if (elo >= 1200) return 'EMERALD';
    if (elo >= 800) return 'GOLD';
    if (elo >= 400) return 'SILVER';
    if (elo >= 0) return 'BRONZE';
    return 'UNRANKED';
  };

  // Helper function to get most recent rank for a member from date-based data
  const getCurrentRank = (member: MemberData | GroupMember): string | null => {
    console.log(`🔍 Getting most recent rank for ${member.summoner_name}`);
    
    // Prioritize stored rank data from database (riot_accounts table) as it has full rank + LP
    if (member.rank && member.rank !== 'UNRANKED') {
      console.log(`📊 Using stored rank for ${member.summoner_name}: ${member.rank}`);
      return member.rank;
    }
    
    // Fallback to converting ELO from team stats to approximate rank
    if (teamStatsData && teamStatsData.length > 0) {
      // Find the most recent event for this member
      const memberEvents = teamStatsData.filter(event => {
        const eventSummonerName = memberNames[event.riot_id] || event.riot_id;
        return eventSummonerName.toLowerCase() === member.summoner_name.toLowerCase();
      });
      
      if (memberEvents.length > 0) {
        // Sort by date and get the most recent
        const mostRecentEvent = memberEvents.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        // Convert ELO to rank for display
        const rankFromElo = eloToRank(mostRecentEvent.elo);
        console.log(`📊 Using converted rank for ${member.summoner_name}: ${rankFromElo} (from ${mostRecentEvent.created_at})`);
        return rankFromElo;
      }
    }
    
    // No rank data available
    console.log(`❌ No rank data for ${member.summoner_name}`);
    return null;
  };



  const fetchSelectedPlayerIcon = async () => {
    if (!selectedPlayer?.icon_id) return;
    
    setSelectedPlayerIconLoading(true);
    setSelectedPlayerIconError(false);
    
    try {
      const version = await riotService.getCurrentVersion();
      const iconUrl = riotService.getProfileIconUrl(selectedPlayer.icon_id, version);
      setSelectedPlayerIconUrl(iconUrl);
    } catch (error) {
      console.error('Error fetching selected player icon:', error);
      setSelectedPlayerIconError(true);
    } finally {
      setSelectedPlayerIconLoading(false);
    }
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

  const handleMembersScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop > 0) {
      setMembersScrolled(true);
    }
  };

  // Check overflow when content changes
  useEffect(() => {
    const descriptionElement = document.getElementById('description-container');
    const instructionsElement = document.getElementById('instructions-container');
    const membersElement = document.getElementById('members-container');
    
    if (descriptionElement) {
      setDescriptionOverflow(checkOverflow(descriptionElement));
    }
    if (instructionsElement) {
      setInstructionsOverflow(checkOverflow(instructionsElement));
    }
    if (membersElement) {
      setMembersOverflow(checkOverflow(membersElement));
    }
  }, [groupInfo.description, groupInfo.instructions, members]);



  // Show error state if group fails to load
  if (groupError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{groupError}</p>
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
    <div className="min-h-screen bg-white text-gray-800 relative flex flex-col">
      {/* Notebook Lines Background - Full Viewport */}
      <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#F0F3F0' }}>
        <div className="absolute inset-0 opacity-15 dark:opacity-20">
          <svg width="100%" height="100%">
            <pattern id="notebook-lines-group-detail" x="0" y="0" width="100%" height="24" patternUnits="userSpaceOnUse">
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
            <rect width="100%" height="100%" fill="url(#notebook-lines-group-detail)" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full sm:max-w-7xl sm:mx-auto px-0 sm:px-6 lg:px-8 relative z-10 bg-white">
        {/* Back Button and Group Info */}
        <div className="absolute top-2 left-2 right-2 z-20">
          <div className="flex justify-between items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/study-groups/groups')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 flex-shrink-0"
            >
              <ChevronsLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Back to Groups</span>
            </button>
            
            {/* Group Icon and Name - Show immediately when available */}
            <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
              {group ? (
                <>
                  <div className="flex items-center gap-3">
                    {group.image_url ? (
                      <img
                        src={group.image_url}
                        alt={`${group.group_name} icon`}
                        className="hidden sm:block w-8 h-8 sm:w-12 sm:h-12 rounded-lg object-cover border-2 border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div 
                        className="hidden sm:flex w-8 h-8 sm:w-12 sm:h-12 rounded-lg items-center justify-center border-2 border-gray-200 font-bold text-sm sm:text-lg"
                        style={{ 
                          backgroundColor: ['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][group.id % 5],
                          color: getTextColor(['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][group.id % 5])
                        }}
                      >
                        {group.group_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Group Name and Date */}
                    <div className="hidden sm:block min-w-0 bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3">
                      <h1 className="text-lg sm:text-xl font-bold text-gray-800">{group.group_name}</h1>
                      <p className="text-xs sm:text-sm text-gray-500">Created: {new Date(group.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* Update Ranks Button - Positioned on the right */}
                  <button
                    onClick={updateLiveData}
                    disabled={isUpdatingData}
                    className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 transition-all duration-200 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-200 hover:border-blue-300 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex-shrink-0"
                  >
                    {isUpdatingData ? (
                      <LoadingSpinner size="sm" className="w-4 h-4" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {isUpdatingData ? (updateProgress || 'Updating...') : 'Update'}
                    </span>
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="relative sm:-mx-6 lg:-mx-8">
          {/* Group header with group image background - matching groups page format */}
          <div className="relative overflow-hidden">
            {/* Background Image */}
            {group ? (
              <>
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
                </>
              ) : (
                <div className="w-full bg-gradient-to-br from-gray-100 to-gray-200" style={{ paddingTop: '60%' }} />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 relative z-10" style={{ marginTop: '-30%' }}>
          {/* Left Column */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Group Information Section */}
            <div className="rounded-lg p-4 sm:p-6 bg-white border border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
                Group Information
              </h3>
              
              <div className="space-y-6">
                {/* Members Subsection */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-left flex items-center gap-2">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    Members
                  </h4>
                  
                  {showMemberPlaceholders || isMemberDataLoading || isUpdatingData ? (
                    <div className="relative">
                      <div 
                        className="space-y-3 h-64 sm:h-96 overflow-y-auto bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200"
                      >
                        {Array.from({ length: memberCount }, (_, index) => (
                          <PlaceholderMemberCard key={`placeholder-member-${index}`} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div 
                        id="members-container"
                        className="space-y-3 h-64 sm:h-96 overflow-y-auto bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200"
                        onScroll={handleMembersScroll}
                      >
                        {members.map((member, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all duration-300 cursor-pointer ${
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
                              {getCurrentRank(member) && getCurrentElo(member) ? (
                                <>
                                  {/* Rank */}
                                  <div className="flex items-center gap-1">
                                    <img 
                                      src={getRankIconUrl(getCurrentRank(member)!)} 
                                      alt={getCurrentRank(member)!} 
                                      className="w-3 h-3 sm:w-4 sm:h-4"
                                      onError={(e) => {
                                        console.log('Failed to load rank icon for:', getCurrentRank(member), 'URL:', getRankIconUrl(getCurrentRank(member)!));
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                    <span className="font-medium">{getCurrentRank(member)}</span>
                                  </div>
                                  
                                  {/* ELO */}
                                  <div className="flex items-center gap-1">
                                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                                    <span className="font-bold">{getCurrentElo(member)!.toLocaleString()}</span>
                                  </div>
                                </>
                              ) : (
                                <span className="text-gray-500 italic">No ranked data available</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Rank and ELO - To the right on larger screens, hidden on mobile */}
                          <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-2">
                            {getCurrentRank(member) && getCurrentElo(member) ? (
                              <>
                                {/* Rank */}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <img 
                                    src={getRankIconUrl(getCurrentRank(member)!)} 
                                    alt={getCurrentRank(member)!} 
                                    className="w-4 h-4"
                                    onError={(e) => {
                                      console.log('Failed to load rank icon for:', getCurrentRank(member), 'URL:', getRankIconUrl(getCurrentRank(member)!));
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                  <span className="font-medium">{getCurrentRank(member)}</span>
                                </div>
                                
                                {/* ELO */}
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Zap className="w-4 h-4 text-yellow-500" />
                                  <span className="font-bold">{getCurrentElo(member)!.toLocaleString()}</span>
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-500 italic">No ranked data available</span>
                            )}
                          </div>
                        </div>
                      ))}
                      </div>
                      {membersOverflow && !membersScrolled && (
                        <div className="absolute bottom-2 right-2">
                          <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: '#00c9ac' }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                {(isGroupInfoLoading || isUpdatingData) ? (
                  <PlaceholderContentSection />
                ) : (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-left flex items-center gap-2">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                      Description
                    </h4>
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
                )}
                
                {/* Application Instructions */}
                {(isGroupInfoLoading || isUpdatingData) ? (
                  <PlaceholderContentSection />
                ) : (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-left flex items-center gap-2">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                      Application Instructions
                    </h4>
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
                )}
                
                {/* Meeting Schedule */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-left flex items-center gap-2">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#ff8889' }} />
                    Meeting Schedule
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-700 text-xs">
                      <span className="font-medium">
                        {group && Array.isArray(group.meeting_schedule) ? group.meeting_schedule.join(", ") : group?.meeting_schedule}
                      </span>
                    </div>
                    {group && (group.time || group.timezone) && (
                      <div className="flex items-center gap-2 text-gray-700 mt-2 text-xs">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#00c9ac' }}>
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">
                          {group.time ? (
                            <>
                              {group.time.charAt(0).toUpperCase() + group.time.slice(1)}
                              {group.timezone && ` (${group.timezone})`}
                            </>
                          ) : (
                            `Timezone: ${group.timezone}`
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Team Stats Section */}
            <div className="rounded-lg p-4 sm:p-6 bg-white border border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Team Statistics</h3>
              
              {(isTeamStatsLoading || isUpdatingData) ? (
                <PlaceholderTeamStats />
              ) : teamStatsError ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <p className="text-yellow-800 font-medium mb-2">No Team Stats Available</p>
                  <p className="text-yellow-600 text-sm">{teamStatsError}</p>
                </div>
              ) : (teamStatsData.length > 0 || (liveData && Object.keys(liveData).length > 0)) ? (
                <div className="space-y-6">
                  {/* Team Stats Content */}
                  <TeamStatsContent 
                    teamStatsData={teamStatsData}
                    teamStatsLoading={isTeamStatsLoading}
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
                      {selectedPlayerIconUrl && !selectedPlayerIconError && !selectedPlayerIconLoading ? (
                        <img
                          src={selectedPlayerIconUrl}
                          alt={`${selectedPlayer.summoner_name} profile icon`}
                          className="w-full h-full object-cover"
                          onError={() => setSelectedPlayerIconError(true)}
                        />
                      ) : null}
                      <div 
                        className={`profile-placeholder w-full h-full flex items-center justify-center font-bold text-3xl ${(selectedPlayerIconUrl && !selectedPlayerIconError && !selectedPlayerIconLoading) ? 'hidden' : 'flex'}`}
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
                  userId={selectedPlayer?.user_id}
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
                      {(playerProfile.time || playerProfile.timezone) && (
                        <div className="w-full">
                          <h4 className="font-semibold text-gray-800 mb-3 text-left flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#00c9ac' }}>
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Preferred Time
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                            <div className="text-gray-700 text-xs text-left">
                              {playerProfile.time ? (
                                <span>
                                  {playerProfile.time.charAt(0).toUpperCase() + playerProfile.time.slice(1)}
                                  {playerProfile.timezone && ` (${playerProfile.timezone})`}
                                </span>
                              ) : (
                                <span>
                                  Timezone: {playerProfile.timezone}
                                </span>
                              )}
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
  const [profileIconUrl, setProfileIconUrl] = useState<string>('');
  const [iconError, setIconError] = useState(false);
  const [iconLoading, setIconLoading] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const fetchProfileIcon = async () => {
    if (!iconId) return;
    
    setIconLoading(true);
    setIconError(false);
    
    try {
      const version = await riotService.getCurrentVersion();
      const iconUrl = riotService.getProfileIconUrl(iconId, version);
      setProfileIconUrl(iconUrl);
    } catch (error) {
      console.error('Error fetching profile icon:', error);
      setIconError(true);
    } finally {
      setIconLoading(false);
    }
  };

  useEffect(() => {
    if (iconId) {
      fetchProfileIcon();
    }
  }, [iconId]);

  return (
    <div className={`${sizeClasses[size]} ${shape} overflow-hidden bg-gray-200 flex items-center justify-center`}>
      {profileIconUrl && !iconError && !iconLoading ? (
        <img
          src={profileIconUrl}
          alt={`${summonerName} profile icon`}
          className="w-full h-full object-cover"
          onError={() => setIconError(true)}
        />
      ) : null}
      <div 
        className={`profile-placeholder w-full h-full flex items-center justify-center font-bold text-sm ${(profileIconUrl && !iconError && !iconLoading) ? 'hidden' : 'flex'}`}
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