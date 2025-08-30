import { useState, useEffect, useRef } from 'react'
import { UserCheck, Users, Crown, Calendar, Upload, SquareX, ChevronsLeft, FileText, Image, Settings, Zap, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { studyGroupService } from '../services/studyGroupService'
import { userService } from '../services/userService'
import { useLocation } from 'react-router-dom'


import { teamStatsService } from '../services/teamStatsService'
import { livePlayerService } from '../services/livePlayerService'

import { playerStatsService } from '../services/playerStatsService'
import { TeamStatsContent } from './TeamStatsContent'
import { TFTStatsContent } from './TFTStatsContent'

import { SupabaseLoginModal } from './auth/SupabaseLoginModal'

import { useImageUpload } from '../hooks/useImageUpload'
import { LoadingSpinner } from './auth/LoadingSpinner'

import { riotService } from '../services/riotService'
import { useVersion } from '../contexts/VersionContext'

interface MyGroup {
  id: number;
  name: string;
  role: string;
  members: GroupMember[];
  total_elo: number;
  avg_elo?: number;
  created_date: string;
  description: string;
  max_members: number;
  current_members: number;
  meeting_schedule: string[];
  application_instructions: string;
  time?: string;
  timezone?: string;
  image_url?: string;
}

interface GroupMember {
  summoner_name: string;
  elo: number;
  owner?: number;
  rank?: string;
  icon_id?: number;
  riot_id?: string;
}

interface NewGroupData {
  name: string;
  description: string;
}

interface GroupSettings {
  name: string;
  meeting_schedule: string[];
  description: string;
  application_instructions: string;
  time: string;
  timezone: string;
}



const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';

export function MyGroupsTab({ authLoading = false }: { authLoading?: boolean }) {
  const { userId, jwtUserId, exchangeTokenForJWT } = useAuth()
  const location = useLocation()
  const [myGroups, setMyGroups] = useState<MyGroup[]>([])
  const [error, setError] = useState<string | null>(null)

  

  
  // Placeholder state
  const [placeholderCount, setPlaceholderCount] = useState<number>(2) // Start with 2 placeholders
  const [showPlaceholders, setShowPlaceholders] = useState(true) // Show placeholders immediately
  const [isDataLoading, setIsDataLoading] = useState(false) // Track if we're actively fetching data
  const [isCountLoading, setIsCountLoading] = useState(false) // Track if we're fetching the count
  
  // Refresh trigger for manual refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Riot accounts state
  const [_riotAccounts, setRiotAccounts] = useState<Array<{ riot_id: string, summoner_name: string, rank: string, region: string, created_at: string }>>([])
  const [selectedRiotId, setSelectedRiotId] = useState<string>('')

  // Update loading states when auth loading state changes
  useEffect(() => {
    if (authLoading) {
      setIsCountLoading(true) // Track loading during auth
      setShowPlaceholders(true) // Show placeholders during auth
    } else {
      setIsCountLoading(false)
    }
  }, [authLoading])

  // Load Riot accounts when component mounts
  useEffect(() => {
    
    const loadRiotAccounts = async () => {
      try {
        const response = await riotService.getAllRiotAccounts()
        setRiotAccounts(response.accounts)
        // Auto-select the first Riot account if available
        if (response.accounts.length > 0 && !selectedRiotId) {
          setSelectedRiotId(response.accounts[0].riot_id)
        }
      } catch (error) {
        console.error('Failed to load Riot accounts:', error)
      }
    }

    if (userId && !authLoading) {
      loadRiotAccounts()
    }
  }, [userId, authLoading, selectedRiotId])

  // Force data refresh when navigating to this route
  useEffect(() => {
    if (userId && !authLoading && location.pathname === '/my-groups') {
      console.log('🔄 Navigated to my-groups route, fetching fresh data')
      setRefreshTrigger(prev => prev + 1)
    }
  }, [location.pathname, userId, authLoading])

      // Fetch user's owned groups - always fresh data
  // Shows only groups where the user is the owner (creator) - matches the 'owner' column in the database
  useEffect(() => {
    const fetchMyGroups = async () => {
      if (!userId && !authLoading) {
        setShowPlaceholders(false) // Hide placeholders if not logged in and not loading
        setIsCountLoading(false)
        return
      }

      try {
        setError(null)
        setIsCountLoading(true) // Track loading state
        setShowPlaceholders(true) // Show placeholders while loading
        

        
        // Get owned groups with member data in a single efficient call
        let ownedGroups: any[] = []
        if (userId) {
          console.log('🔍 Fetching owned groups with members for user ID:', userId)
          console.log(userId,"test")
          
          // Exchange Supabase token for JWT token if needed
          if (!jwtUserId) {
            try {
              console.log('🔄 Exchanging Supabase token for JWT token...')
              await exchangeTokenForJWT()
            } catch (error) {
              console.error('Failed to exchange token for JWT:', error)
              throw new Error('Authentication failed: Unable to exchange token')
            }
          }
          
          // Add a timeout wrapper to prevent infinite loading
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
          });
          
          // Try to fetch groups with automatic retry on auth failure
          let retryCount = 0;
          const maxRetries = 2;
          
          while (retryCount <= maxRetries) {
            try {
              ownedGroups = await Promise.race([
                studyGroupService.getStudyGroupsByOwnerWithMembers(parseInt(userId, 10)),
                timeoutPromise
              ]);
              break; // Success, exit the retry loop
            } catch (error) {
              retryCount++;
              
              // If it's an authentication error and we haven't exceeded retries, try to exchange token again
              if (error instanceof Error && 
                  (error.message.includes('401') || error.message.includes('Authentication failed')) && 
                  retryCount <= maxRetries) {
                console.log(`🔄 Authentication failed, attempting token exchange retry ${retryCount}/${maxRetries}...`);
                
                // Try to exchange token again
                try {
                  await exchangeTokenForJWT()
                } catch (exchangeError) {
                  console.error('Token exchange failed on retry:', exchangeError)
                }
                
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                continue;
              }
              
              // If it's not an auth error or we've exceeded retries, throw the error
              throw error;
            }
          }
          
          console.log('📊 Received owned groups with members:', ownedGroups)
          setPlaceholderCount(Math.max(ownedGroups.length, 2)) // At least 2 placeholders
          setIsCountLoading(false) // Hide loading spinner, got the count
          
          // Keep placeholders visible while processing data
          setIsDataLoading(true)
        }
        
        // Transform the data to match the expected format - now using pre-fetched member data
        const transformedGroups = ownedGroups.map((group: any) => {
          if (!group) return null
          
          // Use the member data that comes with the group from the optimized endpoint
          const members = (group.members || []).map((member: any) => ({
            summoner_name: member.summoner_name || 'Unknown User',
            elo: member.elo || 0, // ELO might be 0 if not available from simplified query
            rank: member.rank || 'UNRANKED',
            owner: member.owner, // Preserve the owner field to identify captain
            icon_id: member.icon_id || undefined,
            user_id: member.user_id || undefined
          }))
          
          // Calculate average ELO
          const totalElo = members.reduce((sum: number, member: any) => sum + member.elo, 0);
          const avgElo = members.length > 0 ? Math.round(totalElo / members.length) : 0;
          
          return {
            id: group.id,
            name: group.group_name,
            role: "owner", // User is the owner of these groups
            members: members,
            total_elo: totalElo,
            avg_elo: avgElo,
            created_date: group.created_at,
            description: group.description || "",
            max_members: 20, // Default - we'll need to add this field
            current_members: members.length,
            meeting_schedule: group.meeting_schedule || [],
            application_instructions: group.application_instructions || "",
            time: group.time || "",
            timezone: group.timezone || "",
            image_url: group.image_url || ""
          }
        })
        
        // Filter out null values and set the groups
        const validGroups = transformedGroups.filter(group => group !== null)
        setMyGroups(validGroups)
        setIsDataLoading(false)
        setShowPlaceholders(false) // Hide placeholders once real data is loaded
      } catch (err) {
        console.error('Failed to fetch my groups:', err)
        
        // Provide more specific error messages
        let errorMessage = 'Failed to load your groups. Please try again later.';
        let isRetryable = true;
        
        if (err instanceof Error) {
          if (err.message.includes('timeout')) {
            errorMessage = 'Request timed out. The server might be slow right now. Please try again.';
            isRetryable = true;
          } else if (err.message.includes('401') || err.message.includes('403') || err.message.includes('UNAUTHORIZED')) {
            errorMessage = 'Your session has expired. Please refresh the page or log in again.';
            isRetryable = false;
          } else if (err.message.includes('500')) {
            errorMessage = 'Server error. Please try again in a moment.';
            isRetryable = true;
          } else if (err.message.includes('No authentication token')) {
            errorMessage = 'Please log in to view your groups.';
            isRetryable = false;
          } else if (err.message.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your connection and try again.';
            isRetryable = true;
          } else if (err.message.includes('Authentication failed')) {
            errorMessage = 'Authentication failed. Please refresh the page and try again.';
            isRetryable = false;
          }
        }
        
        setError(errorMessage)
        setShowPlaceholders(false) // Hide placeholders on error
        setMyGroups([]) // Clear any existing groups on error
        setIsDataLoading(false)
        setIsCountLoading(false)
        
        // If it's a retryable error, show a retry button
        if (isRetryable) {
          console.log('🔄 Error is retryable, user can retry manually');
        }
      }
    }

    fetchMyGroups()
  }, [userId, refreshTrigger, authLoading])





  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupData, setNewGroupData] = useState<NewGroupData>({
    name: "",
    description: ""
  });

  // Modal state for MyGroupCard modals
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCombinedModal, setShowCombinedModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<MyGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  // Captain state removed - no longer needed
  const [activeSection, setActiveSection] = useState<'group-info' | 'manage' | 'team-stats' | 'members' | 'info'>('group-info');

  const [groupSettings, setGroupSettings] = useState<GroupSettings>({
    name: "",
    meeting_schedule: [] as string[],
    description: "",
    application_instructions: "",
    time: "",
    timezone: ""
  });
  // Promote loading state removed - no longer needed
  const [deleteLoading, setDeleteLoading] = useState(false); // Track delete operation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Show delete confirmation modal

  // Player modal state
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedPlayerRiotId, setSelectedPlayerRiotId] = useState<string | null>(null);
  const [selectedPlayerRegion, setSelectedPlayerRegion] = useState<string | null>(null);
  const [clickedMemberId, setClickedMemberId] = useState<number | null>(null);
  const [playerLeagueData, setPlayerLeagueData] = useState<any[]>([]);
  const [leagueDataLoading, setLeagueDataLoading] = useState(false);
  const [leagueDataError, setLeagueDataError] = useState<string | null>(null);
  const [activePlayerTab, setActivePlayerTab] = useState<'stats'>('stats');


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
  const [liveDataLoading] = useState(false);

  // Profile icon state for selected player
  const [selectedPlayerIconUrl, setSelectedPlayerIconUrl] = useState<string>('');
  const [selectedPlayerIconError, setSelectedPlayerIconError] = useState(false);
  const [selectedPlayerIconLoading, setSelectedPlayerIconLoading] = useState(false);
  
  // Auto-fetch team stats when group changes (for live data)
  useEffect(() => {
    if (selectedGroup && teamStatsData.length === 0) {
      console.log('🔄 Auto-fetching team stats for group:', selectedGroup.id);
      fetchTeamStats(selectedGroup.id, selectedGroup.created_date);
    }
  }, [selectedGroup, teamStatsData.length]);

  // Fetch selected player icon when selectedPlayer changes
  useEffect(() => {
    if (selectedPlayer?.icon_id) {
      fetchSelectedPlayerIcon();
    }
  }, [selectedPlayer?.icon_id]);

  // Authentication state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  

  
  // Image upload functionality
  const { uploadImage, isLoading: imageUploadLoading, error: imageUploadError, clearError: clearImageError } = useImageUpload();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);



  // Image upload handlers
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  const handleCreateGroup = async () => {
    // Check if user is logged in
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    setCreatingGroup(true);
    try {
      let imageUrl = null;
      
      // Upload image first if selected
      if (selectedImage) {
        console.log('Uploading image before creating group...');
        // Generate a temporary path for the image
        const tempFileName = `temp/${Date.now()}-${selectedImage.name}`;
        const uploadResult = await uploadImage(selectedImage, tempFileName);
        
        if (uploadResult.error) {
          console.error('Failed to upload image:', uploadResult.error);
          alert('Failed to upload image. Please try again.');
          return;
        }
        
        imageUrl = uploadResult.data.url;
        console.log('Image uploaded successfully:', imageUrl);
      }

      // Create the study group with image URL if available
      const result = await studyGroupService.createStudyGroup({
        user_id: parseInt(userId, 10),
        group_name: newGroupData.name,
        description: newGroupData.description,
        image_url: imageUrl || ''
      });

      // If image was uploaded, rename it to the proper group path
      if (imageUrl && result.group) {
        console.log('Renaming image to proper group path...');
        const newPath = `groups/${result.group.id}/icon.${selectedImage?.name.split('.').pop()}`;
        
        // Upload the image to the correct path
        const finalUploadResult = await uploadImage(selectedImage!, newPath);
        if (finalUploadResult.data?.url) {
          // Update the group with the final image URL
          await studyGroupService.updateStudyGroup(result.group.id, {
            image_url: finalUploadResult.data.url
          });
        }
      }

      // Close modal and reset form
      setShowCreateModal(false);
      setNewGroupData({
        name: "",
        description: ""
      });
      setSelectedImage(null);
      setImagePreview(null);
      clearImageError();

      // Refresh the groups data
      setRefreshTrigger(prev => prev + 1);
      setMyGroups([]);

      // Show success message
      console.log("Study group created successfully!");
      
    } catch (error) {
      console.error('Failed to create study group:', error);
      alert('Failed to create study group. Please try again.');
    } finally {
      setCreatingGroup(false);
    }
  };



  // Captain switching functionality removed

  // Handle deleting study group
  const handleDeleteGroup = async () => {
    if (!selectedGroup || !userId) return;
    
    setDeleteLoading(true);
    
    try {
      await studyGroupService.deleteStudyGroup(selectedGroup.id, parseInt(userId, 10));
      
      // Close all modals
      setShowDeleteConfirm(false);
      setShowSettings(false);
      setShowCombinedModal(false);
      
      // Refresh the groups data
      setRefreshTrigger(prev => prev + 1);
      setMyGroups([]);
      
      // Show success message
      console.log('Study group deleted successfully');
      alert('Study group deleted successfully');
      
    } catch (error) {
      console.error('Failed to delete study group:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete study group. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };







  // Handle saving group settings
  const handleSaveGroupSettings = async () => {
    if (!selectedGroup) return;
    
    try {
      console.log('Starting to save group settings for group:', selectedGroup.id);
      console.log('Current group settings:', groupSettings);
      
      // Handle image replacement if new image is selected
      let imageUrl = selectedGroup.image_url;
      if (selectedImage) {
        console.log('New image selected, uploading...');
        
        // Upload new image to the proper group path
        const newPath = `groups/${selectedGroup.id}/icon.${selectedImage.name.split('.').pop()}`;
        const uploadResult = await uploadImage(selectedImage, newPath);
        
        if (uploadResult.error) {
          console.error('Failed to upload image:', uploadResult.error);
          throw new Error('Failed to upload new image');
        }
        
        imageUrl = uploadResult.data.url;
        console.log('New image uploaded successfully:', imageUrl);
      } else {
        console.log('No new image selected, keeping current image:', imageUrl);
      }

      // Update the study group settings using the service
      console.log('Updating study group with data:', {
        group_name: groupSettings.name,
        description: groupSettings.description,
        meeting_schedule: groupSettings.meeting_schedule,
        application_instructions: groupSettings.application_instructions,
        time: groupSettings.time,
        timezone: groupSettings.timezone,
        image_url: imageUrl
      });
      
      await studyGroupService.updateStudyGroup(selectedGroup.id, {
        group_name: groupSettings.name,
        description: groupSettings.description,
        meeting_schedule: groupSettings.meeting_schedule,
        application_instructions: groupSettings.application_instructions,
        time: groupSettings.time,
        timezone: groupSettings.timezone,
        image_url: imageUrl
      });
      
      // Clear the selected image and preview
      setSelectedImage(null);
      setImagePreview(null);
      clearImageError();
      
      // Refresh the groups data
      setRefreshTrigger(prev => prev + 1);
      setMyGroups([]);
      
      // Close the modal
      setShowCombinedModal(false);
      
      // Show success message
      console.log('Group settings saved successfully!');
      alert('Group settings saved successfully!');
      
    } catch (error) {
      console.error('Failed to save group settings:', error);
      
      // Provide more detailed error information
      let errorMessage = 'Failed to save group settings. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Unable to connect to the server. Please check your connection and try again.';
        } else if (error.message.includes('Failed to upload new image')) {
          errorMessage = 'Failed to upload the new image. Please try again.';
        } else if (error.message.includes('Failed to update study group')) {
          errorMessage = 'Failed to update group settings. Please try again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  };

  // Handle removing a member from the group
  const handleRemoveMember = async (member: GroupMember) => {
    if (!selectedGroup) return;
    
    try {
      console.log('Removing member:', member.summoner_name, 'from group:', selectedGroup.id);
      
      // Call the service to remove the member
      await studyGroupService.removeMemberFromStudyGroup(selectedGroup.id, member.summoner_name);
      
      // Update the local members list
      setMembers(prevMembers => prevMembers.filter(m => m.summoner_name !== member.summoner_name));
      
      // No confirmation or success message - just remove silently
      console.log('Member removed successfully!');
      
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member. Please try again.');
    }
  };

  // Handle group image upload
  const handleGroupImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      clearImageError();
    }
  };

  // Player modal functions
  const fetchPlayerLeagueData = async (_userId: number, riotId: string) => {
    try {
      console.log('🔍 Fetching league data for riot_id:', riotId);
      setLeagueDataLoading(true);
      setLeagueDataError(null);
      
      // Use the provided riotId - no fallback
      const puuid = riotId;

      // Fetch league data using the riot_id (which contains the PUUID)
      console.log('🔍 Making API call to:', `${API_BASE_URL}/api/tft-league/${puuid}`);
      const response = await fetch(`${API_BASE_URL}/api/tft-league/${puuid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch league data');
      }
      
      const data = await response.json();
      console.log('🔍 League data received:', data);
      console.log('🔍 League data length:', Array.isArray(data) ? data.length : 'N/A');
      setPlayerLeagueData(data);
    } catch (error) {
      console.error('Error fetching player league data:', error);
      setLeagueDataError('Failed to load league data');
    } finally {
      setLeagueDataLoading(false);
    }
  };



  const fetchPlayerStats = async (riotId: string) => {
    try {
      setPlayerStatsLoading(true);
      setPlayerStatsError(null);
      
      console.log('🔍 Fetching player stats for riot_id:', riotId);
      const stats = await playerStatsService.getPlayerStats(riotId);
      console.log('📊 Player stats received:', stats);
      console.log('📊 Number of events:', stats.events.length);
      
      setPlayerStatsData(stats.events);
    } catch (error) {
      console.error('Error fetching player stats:', error);
      setPlayerStatsError('Failed to load player stats');
      setPlayerStatsData([]);
    } finally {
      setPlayerStatsLoading(false);
    }
  };

  const fetchTeamStats = async (groupId: number, startDate: string) => {
    try {
      setTeamStatsLoading(true);
      setTeamStatsError(null);
      
      console.log('🚀 Starting to fetch team stats for group:', groupId, 'from date:', startDate);
      
      // Clear cache and use direct API call - NO CACHING
      teamStatsService.clearCache();
      livePlayerService.clearCache();
      
      // Direct API call to bypass caching
      const queryParams = new URLSearchParams();
      queryParams.append('group_id', groupId.toString());
      queryParams.append('start_date', startDate);
      
      const response = await fetch(`${import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001'}/api/team-stats/members?${queryParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch member stats: ${response.statusText}`);
      }
      const memberStats = await response.json();
      
      console.log('📊 Received member stats:', memberStats);
      console.log('📊 Member stats type:', typeof memberStats);
      console.log('📊 Member stats keys:', Object.keys(memberStats || {}));
      
      // Handle the new combined API response format
      let allEvents: any[] = [];
      let names: { [riotId: string]: string } = {};
      let liveDataFromAPI: any = {};
      
      if (memberStats && memberStats.events && Array.isArray(memberStats.events)) {
        // New combined format: {"events": [...], "memberNames": {...}, "liveData": {...}}
        allEvents = memberStats.events;
        console.log('📈 Using new combined API format, events:', allEvents);
        
        // Get member names from API response if available
        if (memberStats.memberNames && typeof memberStats.memberNames === 'object') {
          names = memberStats.memberNames as unknown as { [riotId: string]: string };
          console.log('👥 Member names from API:', names);
        }
        
        // Get live data from API response if available
        if (memberStats.liveData && typeof memberStats.liveData === 'object') {
          liveDataFromAPI = memberStats.liveData as unknown as { [summonerName: string]: any };
          console.log('🎯 Live data from API:', liveDataFromAPI);
        }
      } else if (memberStats && typeof memberStats === 'object' && Object.keys(memberStats).length > 0) {
        // Old format: {summonerName: [events]}
        allEvents = Object.values(memberStats).flat();
        console.log('📈 Using old API format, flattened events:', allEvents);
        
        // Create member names mapping from the API response
        Object.keys(memberStats).forEach(summonerName => {
          names[summonerName] = summonerName;
        });
      } else {
        // No data available
        console.log('⚠️ No member stats received');
        allEvents = [];
      }
      
      console.log('📈 Final events for chart:', allEvents);
      console.log('📈 Number of events:', allEvents.length);
      
      setTeamStatsData(allEvents);
      setMemberNames(names);
      setLiveData(liveDataFromAPI);
      
      console.log('👥 Member names mapping:', names);
      console.log('🎯 Live data set:', liveDataFromAPI);
      
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
    if (!member.riot_id) {
      console.error('No riot_id found for member:', member);
      return;
    }
    
    setSelectedPlayer(member);
    setClickedMemberId(member.riot_id);
    setShowPlayerModal(true);
    setActivePlayerTab('stats');
    
    const riotId = member.riot_id;
    
    // Get the region from the riot account
    let playerRegion = null;
    try {
      if (member.summoner_name) {
        const riotAccount = await userService.getRiotAccountBySummoner(member.summoner_name);
        playerRegion = riotAccount?.region;
      }
    } catch (error) {
      console.error('Error fetching region for player:', error);
    }
    
    setSelectedPlayerRiotId(riotId);
    setSelectedPlayerRegion(playerRegion || null);
    
    // Fetch league data and player stats for the player
    await Promise.all([
      fetchPlayerLeagueData(0, riotId), // Always fetch league data using riotId
      fetchPlayerStats(riotId)
    ]);
  };

  const getRankedTftData = () => {
    return playerLeagueData.find(data => data.queueType === 'RANKED_TFT');
  };

  const getTurboTftData = () => {
    return playerLeagueData.find(data => data.queueType === 'RANKED_TFT_TURBO');
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



  // Helper function to get current rank for a member, prioritizing stored rank data
  const getCurrentRank = (member: GroupMember): string | null => {
    // Prioritize stored rank data from database (riot_accounts table) as it has full rank + LP
    if (member.rank && member.rank !== 'UNRANKED') {
      return member.rank;
    }
    
    // Fallback to live data if available
    if (liveData && Object.keys(liveData).length > 0) {
      // Try to find the member in live data by summoner name
      const liveDataKey = Object.keys(liveData).find(key => {
        // Normalize both names for comparison
        const normalizedLiveKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedMemberName = member.summoner_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedLiveKey === normalizedMemberName;
      });
      
      if (liveDataKey && liveData[liveDataKey]) {
        const liveMemberData = liveData[liveDataKey];
        if (liveMemberData.tier && liveMemberData.rank) {
          // Construct the full rank string: "TIER RANK LP"
          const tier = String(liveMemberData.tier).toUpperCase();
          const rank = String(liveMemberData.rank);
          const lp = liveMemberData.leaguePoints !== undefined ? ` ${liveMemberData.leaguePoints}LP` : '';
          const liveRank = `${tier} ${rank}${lp}`;
          return liveRank;
        }
      }
    }
    
    // No rank data available
    return null;
  };

  return (
    <>
      <div className="p-6 min-h-screen flex flex-col">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-800">My Groups</h2>
              <div className="relative group">
                <UserCheck 
                  size={20} 
                  className="text-gray-500 hover:text-gray-700 cursor-help transition-colors" 
                />
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999] hidden sm:block">
                  <div className="text-center">Manage groups you own and their settings</div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (!userId) {
                  setShowLoginModal(true);
                } else {
                  setShowCreateModal(true);
                }
              }}
              disabled={!userId}
              className="text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: !userId ? '#666' : '#964B00' }}
              onMouseEnter={(e) => {
                if (!userId) return;
                e.currentTarget.style.backgroundColor = '#7c3a00';
              }}
              onMouseLeave={(e) => {
                if (!userId) return;
                e.currentTarget.style.backgroundColor = '#964B00';
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {!userId ? 'Login Required' : 'Create New Group'}
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center flex-1 flex flex-col items-center justify-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
                            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Groups</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={() => {
                setError(null)
                setRefreshTrigger(prev => prev + 1)
                setMyGroups([])
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (showPlaceholders || isDataLoading || isCountLoading) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: placeholderCount }, (_, index) => (
              <PlaceholderGroupCard key={`placeholder-${index}`} />
            ))}
          </div>
        ) : myGroups.length === 0 ? (
          <div className="text-center flex-1 flex flex-col items-center justify-center">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Groups Yet</h3>
                <p className="text-gray-600 mb-4">You haven't created any groups yet. Create your first group to get started!</p>
            <button 
              onClick={() => {
                if (!userId) {
                  setShowLoginModal(true);
                } else {
                  setShowCreateModal(true);
                }
              }}
              disabled={!userId}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!userId ? 'Login Required' : 'Create Your First Group'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map((group) => (
              <MyGroupCard 
                key={group.id} 
                group={group} 
                onTileClick={async (group) => {
                  setSelectedGroup(group);
                  setMembers(group.members); // Set initial members from cache
                  
                  // Captain functionality removed
                  setGroupSettings({
                    name: group.name,
                    meeting_schedule: group.meeting_schedule,
                    description: group.description || "",
                    application_instructions: group.application_instructions || "",
                    time: group.time || "",
                    timezone: group.timezone || ""
                  });
                  setShowCombinedModal(true);
                  
                  // Clear team stats data when a new group is selected
                  setTeamStatsData([]);
                  setTeamStatsError(null);
                  setMemberNames({});
                  
                  // Fetch fresh member data with updated ranks (same as Group Information page)
                  setMembersLoading(true);
                  try {
                    const freshMembers = await studyGroupService.getStudyGroupUsers(group.id, false); // Don't update ranks, use stored data
                    const membersData = freshMembers.map(relationship => ({
                      summoner_name: relationship.summoner_name || 'Unknown User',
                      elo: relationship.elo || 0,
                      rank: relationship.rank || 'UNRANKED',
                      owner: relationship.owner,
                      icon_id: relationship.icon_id,
                      riot_id: relationship.riot_id
                    }));
                    setMembers(membersData);
                  } catch (error) {
                    console.error('Error fetching fresh member data:', error);
                    // Keep the cached data if fresh fetch fails
                  } finally {
                    setMembersLoading(false);
                  }
                }}
              />
            ))}
          </div>
        )}

        

        {/* Create New Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Create New Study Group</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-0 bg-transparent border-none w-10 h-10 flex items-center justify-center group hover:bg-transparent"
                  style={{ lineHeight: 0 }}
                >
                  <SquareX className="w-10 h-10 text-black group-hover:opacity-80 transition-opacity" />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleCreateGroup(); }} className="space-y-4">
                <div>
                  <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Group Name *
                  </label>
                  <input
                    type="text"
                    id="groupName"
                    value={newGroupData.name}
                    onChange={(e) => setNewGroupData({...newGroupData, name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-400"
                    placeholder="e.g., Diamond+ Meta Masters"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newGroupData.description}
                    onChange={(e) => setNewGroupData({...newGroupData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-400 resize-vertical"
                    placeholder="Describe your study group's focus and goals..."
                  />
                </div>



                {/* Group Icon Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Image className="w-4 h-4 text-gray-600" />
                    Group Icon (Optional)
                  </label>
                  <div className="space-y-3">
                    {/* Image Preview - Only show when image is uploaded */}
                    {imagePreview && (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Group icon preview"
                          className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-gray-600 hover:text-gray-800"
                      >
                        <Upload className="w-4 h-4" />
                        {selectedImage ? 'Change Image' : 'Upload Group Icon'}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      {selectedImage && (
                        <span className="text-sm text-gray-500">
                          {selectedImage.name}
                        </span>
                      )}
                    </div>
                    
                    {/* Error Display */}
                    {imageUploadError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{imageUploadError}</p>
                        <button
                          type="button"
                          onClick={clearImageError}
                          className="text-red-500 hover:text-red-700 text-xs mt-1"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Upload a square image (recommended: 256x256px) for your group icon.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingGroup || imageUploadLoading}
                    className="flex-1 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#964B00' }}
                    onMouseEnter={(e) => {
                      if (!creatingGroup && !imageUploadLoading) {
                        e.currentTarget.style.backgroundColor = '#7c3a00';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!creatingGroup && !imageUploadLoading) {
                        e.currentTarget.style.backgroundColor = '#964B00';
                      }
                    }}
                  >
                    {creatingGroup || imageUploadLoading ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Members Modal at top level */}
        {showMembers && selectedGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Group Members</h3>
                <button
                  onClick={() => setShowMembers(false)}
                  className="p-0 bg-transparent border-none w-10 h-10 flex items-center justify-center group hover:bg-transparent"
                  style={{ lineHeight: 0 }}
                >
                  <SquareX className="w-10 h-10 text-black group-hover:opacity-80 transition-opacity" />
                </button>
              </div>
              <div className="space-y-2">
                {membersLoading ? (
                  <div className="text-center py-4">
                    <LoadingSpinner size="sm" className="mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Loading fresh member data...</p>
                  </div>
                ) : (
                  members.map((member: GroupMember, index: number) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-2">
                    <div className="flex items-center gap-2">
                      <ProfileIcon 
                        memberId={index}
                        summonerName={member.summoner_name}
                        iconId={member.icon_id}
                        size="sm"
                        shape="rounded-full"
                      />
                      <div className="relative">
                        <div className="text-gray-800 font-medium truncate">{member.summoner_name}</div>
                        {member.owner === 1 && (
                          <div className="absolute -top-2 -right-2 text-yellow-500">
                            <Crown className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getCurrentRank(member) ? (
                        <div className="flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700 border border-green-200 flex-shrink-0">
                          {getCurrentRank(member) && getRankTier(getCurrentRank(member)!) && (
                            <img 
                              src={getRankIconUrl(getRankTier(getCurrentRank(member)!) + '+')} 
                              alt={getRankTier(getCurrentRank(member)!)}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="text-sm truncate">{getCurrentRank(member)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic text-sm">No current ranked data</span>
                      )}
                      {/* Remove functionality removed - no captain system */}
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Study Group</h3>
                
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete <strong>{selectedGroup.name}</strong>? This action cannot be undone.
                  <br /><br />
                  <strong>This will:</strong>
                  <br />• Remove all members from the group
                  <br />• Delete all pending invitations
                  <br />• Permanently delete all group data
                  <br /><br />
                  <em>Only group owners can delete study groups.</em>
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteGroup}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Deleting...</span>
                      </div>
                    ) : (
                      'Delete Group'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal at top level */}
        {showSettings && selectedGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-[600px] h-[500px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Manage Group</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-0 bg-transparent border-none w-10 h-10 flex items-center justify-center group hover:bg-transparent"
                  style={{ lineHeight: 0 }}
                >
                  <SquareX className="w-10 h-10 text-black group-hover:opacity-80 transition-opacity" />
                </button>
              </div>
              
              {/* Tab Headers */}
              <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveSection('members')}
                  className={`flex-1 py-2 px-3 rounded-md font-medium transition-colors focus:outline-none text-xs sm:text-sm ${
                    activeSection === 'members'
                      ? 'bg-white text-blue-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Members
                </button>
                <button
                  onClick={() => setActiveSection('info')}
                  className={`flex-1 py-2 px-3 rounded-md font-medium transition-colors focus:outline-none text-xs sm:text-sm ${
                    activeSection === 'info'
                      ? 'bg-white text-green-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Group Info
                </button>
                <button
                  onClick={() => {
                    setActiveSection('manage');
                    // Fetch requests when manage tab is opened for captains
                    // Request management removed - no captain system
                  }}
                  className={`flex-1 py-2 px-3 rounded-md font-medium transition-colors focus:outline-none text-xs sm:text-sm ${
                    activeSection === 'manage'
                      ? 'bg-white text-purple-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Manage
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Captain functionality removed */}

                {activeSection === 'info' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-3">Add Member</h4>
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Enter summoner name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-green-400"
                      />
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex-shrink-0"
                        onClick={() => {
                          if (newMemberName.trim()) {
                            setMembers([...members, { summoner_name: newMemberName, elo: 2000, owner: 0 }]);
                            setNewMemberName("");
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                    <div className="text-xs text-gray-700">
                      <p className="font-medium mb-2">Current members:</p>
                      <ul className="space-y-1">
                        {members.map((m: GroupMember, idx: number) => (
                                                  <li key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded px-2 py-1 border border-green-100 gap-2">
                          <div className="flex items-center gap-2">
                            <ProfileIcon 
                                                             memberId={idx}
                              summonerName={m.summoner_name}
                              iconId={m.icon_id}
                              size="sm"
                              shape="rounded-full"
                            />
                            <div className="relative">
                              <div className="text-gray-800 truncate">{m.summoner_name}</div>
                              {m.owner === 1 && (
                                <div className="absolute -top-2 -right-2 text-yellow-500">
                                  <Crown className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getCurrentRank(m) ? (
                              <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200 flex-shrink-0">
                                {getCurrentRank(m) && getRankTier(getCurrentRank(m)!) && (
                                  <img 
                                    src={getRankIconUrl(getRankTier(getCurrentRank(m)!) + '+')} 
                                    alt={getRankTier(getCurrentRank(m)!)}
                                    className="w-4 h-4 object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              )}
                              <span className="text-xs truncate">{getCurrentRank(m)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500 italic text-xs">No current ranked data</span>
                          )}
                          </div>
                        </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                                {activeSection === 'manage' && (
                  <div className="space-y-4">
                    {/* Group Settings Section */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-purple-600" />
                        Group Settings
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            Group Name
                          </label>
                          <input
                            type="text"
                            id="groupName"
                            value={groupSettings.name}
                            onChange={(e) => setGroupSettings({...groupSettings, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400"
                            placeholder="Group name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" style={{ color: '#ff8889' }} />
                            Meeting Schedule
                          </label>
                          <div className="grid grid-cols-2 gap-2 ml-4">
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                              <label key={day} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={groupSettings.meeting_schedule.includes(day)}
                                  onChange={() => {
                                    setGroupSettings(prev => ({
                                      ...prev,
                                      meeting_schedule: prev.meeting_schedule.includes(day)
                                        ? prev.meeting_schedule.filter(d => d !== day)
                                        : [...prev.meeting_schedule, day]
                                    }));
                                  }}
                                  className="mr-2"
                                />
                                {day}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            Group Description
                          </label>
                          <textarea
                            id="description"
                            value={groupSettings.description}
                            onChange={(e) => setGroupSettings({...groupSettings, description: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 resize-vertical"
                            placeholder="Group description"
                          />
                        </div>
                        <div>
                          <label htmlFor="applicationInstructions" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-600" />
                            Application Instructions
                          </label>
                          <textarea
                            id="applicationInstructions"
                            value={groupSettings.application_instructions}
                            onChange={(e) => setGroupSettings({...groupSettings, application_instructions: e.target.value})}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 resize-vertical"
                            placeholder="What should potential members include in their application?"
                          />
                        </div>
                        <button
                          onClick={() => {
                            console.log("Saving group settings:", groupSettings);
                            setShowSettings(false);
                          }}
                          className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Save Settings
                        </button>
                      </div>
                    </div>

                    {/* Request management removed - no captain system */}
                  </div>
                )}

                {/* Removed pendingApplications section - will be handled in manage tab */}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Authentication Modals */}
      <SupabaseLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      




      {/* Combined Modal with Tabs */}
      {showCombinedModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full h-[600px] overflow-y-auto flex flex-col relative">
            {/* Close button - absolute positioned */}
            <button
              onClick={() => {
                setShowCombinedModal(false);
                // Clear image preview when modal is closed
                setSelectedImage(null);
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                clearImageError();
                // Trigger a refresh by incrementing the refresh trigger
                setRefreshTrigger(prev => prev + 1);
              }}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-0 bg-transparent border-none w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center group hover:bg-transparent"
              style={{ lineHeight: 0 }}
            >
              <SquareX className="w-6 h-6 sm:w-10 sm:h-10 text-black group-hover:opacity-80 transition-opacity" />
            </button>
            
            {/* Profile Header */}
            <div className="relative">
              {/* Banner - starts at top */}
              <div className="h-32 bg-[#564ec7] relative">
                {/* Group Icon */}
                <div className="absolute -bottom-12 left-6">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden">
                      {selectedGroup.image_url ? (
                        <img
                          src={selectedGroup.image_url}
                          alt={`${selectedGroup.name} icon`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            // Show placeholder instead
                            const placeholder = target.parentElement?.querySelector('.group-placeholder') as HTMLElement;
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`group-placeholder w-full h-full flex items-center justify-center font-bold text-3xl ${selectedGroup.image_url ? 'hidden' : 'flex'}`}
                        style={{ 
                          backgroundColor: ['#564ec7', '#007760', '#de8741', '#ffa65f', '#ffc77e'][selectedGroup.id % 5],
                          color: getTextColor(['#564ec7', '#007760', '#de8741', '#ffa65f', '#ffc77e'][selectedGroup.id % 5])
                        }}
                      >
                        {selectedGroup.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Group name and info */}
              <div className="pt-16 pb-4 px-6">
                <h3 className="text-xl font-bold text-gray-800 mb-1 text-left">{selectedGroup.name}</h3>
                <p className="text-gray-500 text-sm text-left">Created: {new Date(selectedGroup.created_date).toLocaleDateString()}</p>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="px-4 sm:px-6 border-b border-gray-200">
              <div className="flex space-x-2 sm:space-x-6 overflow-x-auto">
                <button 
                  onClick={() => setActiveSection('group-info')}
                  className={`transition-colors pb-2 border-b-2 whitespace-nowrap text-sm sm:text-base ${
                    activeSection === 'group-info' 
                      ? 'text-[#564ec7] border-[#564ec7]' 
                      : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#564ec7]'
                  }`}
                >
                  Group Info
                </button>
                <button 
                  onClick={() => setActiveSection('manage')}
                  className={`transition-colors pb-2 border-b-2 whitespace-nowrap text-sm sm:text-base ${
                    activeSection === 'manage' 
                      ? 'text-[#564ec7] border-[#564ec7]' 
                      : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#564ec7]'
                  }`}
                >
                  Manage
                </button>
                <button 
                  onClick={() => {
                    setActiveSection('team-stats');
                    if (selectedGroup) {
                      fetchTeamStats(selectedGroup.id, selectedGroup.created_date);
                    }
                  }}
                  className={`transition-colors pb-2 border-b-2 ${
                    activeSection === 'team-stats' 
                      ? 'text-[#564ec7] border-[#564ec7]' 
                      : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#564ec7]'
                  }`}
                >
                  Team Stats
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-4 sm:p-6">
              {/* Group Info Tab - Combined Members and Description */}
              {activeSection === 'group-info' && (
                <div className="space-y-6">
                  {/* Members Section */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-800 mb-3 text-left flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Members ({members.length})
                    </h5>
                    <div className="space-y-3">
                      {members.map((member, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all duration-300 cursor-pointer ${
                            clickedMemberId === (member.riot_id ? parseInt(member.riot_id) : null)
                              ? 'bg-blue-50 border-blue-300 shadow-md scale-[1.02]' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => handlePlayerClick(member)}
                        >
                          {/* Member Icon */}
                          <ProfileIcon 
                            memberId={index}
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
                                  clickedMemberId === (member.riot_id ? parseInt(member.riot_id) : null) 
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
                              {member.rank && member.elo ? (
                                <>
                                  {/* Rank */}
                                  <div className="flex items-center gap-1">
                                                                      <img 
                                    src={getRankIconUrl(getRankTier(member.rank) + '+')} 
                                    alt={member.rank} 
                                    className="w-4 h-4 sm:w-5 sm:h-5"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                    <span className="font-medium">{member.rank}</span>
                                  </div>
                                  
                                  {/* ELO */}
                                  <div className="flex items-center gap-1">
                                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                                    <span className="font-bold">{member.elo.toLocaleString()}</span>
                                  </div>
                                </>
                              ) : (
                                <span className="text-gray-500 italic">No ranked data available</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Rank and ELO - To the right on larger screens, hidden on mobile */}
                          <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-2">
                            {member.rank && member.elo ? (
                              <>
                                {/* Rank */}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <img 
                                    src={getRankIconUrl(getRankTier(member.rank) + '+')} 
                                    alt={member.rank} 
                                    className="w-5 h-5"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                  <span className="font-medium">{member.rank}</span>
                                </div>
                                
                                {/* ELO */}
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Zap className="w-4 h-4 text-yellow-500" />
                                  <span className="font-bold">{member.elo.toLocaleString()}</span>
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-500 italic text-sm">No ranked data available</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Description Section */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-800 mb-2 text-left flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      Description
                    </h5>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                      <p className="text-gray-700 whitespace-pre-wrap text-left text-sm">
                        {selectedGroup.description || "No description provided"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Manage Tab */}
              {activeSection === 'manage' && (
                <div className="space-y-6">
                  {/* Group Settings Section */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-800 mb-3 text-left flex items-center gap-2">
                      <Settings className="w-4 h-4 text-blue-600" />
                      Group Settings
                    </h5>
                    
                    {/* Group Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Group Name</label>
                      <input
                        type="text"
                        value={groupSettings.name}
                        onChange={(e) => setGroupSettings({...groupSettings, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter group name"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={groupSettings.description}
                        onChange={(e) => setGroupSettings({...groupSettings, description: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Enter group description"
                      />
                    </div>

                    {/* Save Settings Button */}
                    <div className="pt-4">
                      <button
                        onClick={handleSaveGroupSettings}
                        disabled={imageUploadLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {imageUploadLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <LoadingSpinner size="sm" />
                            <span>Saving...</span>
                          </div>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Member Management Section */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-800 mb-3 text-left flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600" />
                      Member Management
                    </h5>
                    
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="space-y-3">
                        {members.map((member, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <ProfileIcon 
                                memberId={index}
                                summonerName={member.summoner_name}
                                iconId={member.icon_id}
                                size="sm"
                                shape="rounded-full"
                              />
                              <div>
                                <div className="font-medium text-gray-800">{member.summoner_name}</div>
                                <div className="text-sm text-gray-500">{member.rank || 'No rank'}</div>
                              </div>
                            </div>
                            {member.owner !== 1 && (
                              <button
                                onClick={() => handleRemoveMember(member)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                              >
                                Remove
                              </button>
                            )}
                            {member.owner === 1 && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                Owner
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Group Image Section */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-800 mb-3 text-left flex items-center gap-2">
                      <Image className="w-4 h-4 text-purple-600" />
                      Group Image
                    </h5>
                    
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="New group image preview"
                              className="w-full h-full object-cover"
                            />
                          ) : selectedGroup.image_url ? (
                            <img
                              src={selectedGroup.image_url}
                              alt="Current group image"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-2xl font-bold">
                              {selectedGroup.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-2">
                            {imagePreview ? 'New image selected' : 'Upload a new image for your group'}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => document.getElementById('group-image-upload')?.click()}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                              {imagePreview ? 'Change Image' : 'Select Image'}
                            </button>
                            {imagePreview && (
                              <button
                                onClick={() => {
                                  setSelectedImage(null);
                                  setImagePreview(null);
                                  if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <input
                            id="group-image-upload"
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleGroupImageUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                      
                      {/* Error Display */}
                      {imageUploadError && (
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-red-600 text-sm">{imageUploadError}</p>
                          <button
                            type="button"
                            onClick={clearImageError}
                            className="text-red-500 hover:text-red-700 text-xs mt-1"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete Group Section */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-800 mb-3 text-left flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      Delete Group
                    </h5>
                    
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="space-y-3">
                        <p className="text-sm text-red-700">
                          <strong>Warning:</strong> This action cannot be undone. Deleting the group will:
                        </p>
                        <ul className="text-sm text-red-700 list-disc list-inside space-y-1 ml-4">
                          <li>Permanently remove all group data</li>
                          <li>Remove all members from the group</li>
                          <li>Delete all group settings and configurations</li>
                        </ul>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Delete Group
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {/* Team Stats Tab */}
              {activeSection === 'team-stats' && (
                <div className="space-y-4 w-full">
                  {teamStatsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="text-center">
                        <LoadingSpinner size="md" className="mx-auto mb-2" />
                        <p className="text-gray-500">Loading team stats...</p>
                      </div>
                    </div>
                  ) : (
                    <TeamStatsContent
                      teamStatsData={teamStatsData}
                      teamStatsLoading={teamStatsLoading}
                      teamStatsError={teamStatsError}
                      memberNames={memberNames}
                      liveData={liveData}
                      liveDataLoading={liveDataLoading}
                      className="w-full"
                    />
                  )}
                </div>
              )}
            </div>


          </div>
        </div>
              )}

        {/* Player Modal */}
        {showPlayerModal && selectedPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-lg max-w-2xl w-full h-[600px] overflow-y-auto flex flex-col relative animate-in zoom-in-95 duration-300">
              {/* Close button - absolute positioned */}
              <button
                onClick={() => {
                  setShowPlayerModal(false);
                  setSelectedPlayer(null);
                  setSelectedPlayerRiotId(null);
    setSelectedPlayerRegion(null);
                  setClickedMemberId(null);
                  setPlayerLeagueData([]);
          
                }}
                className="absolute top-4 right-4 z-10 p-0 bg-transparent border-none w-10 h-10 flex items-center justify-center group hover:bg-transparent"
                style={{ lineHeight: 0 }}
              >
                <ChevronsLeft className="w-10 h-10 text-black group-hover:opacity-80 transition-opacity" />
              </button>
              
              {/* Profile Header */}
              <div className="relative">
                {/* Banner - starts at top */}
                <div className="h-32 bg-[#ff8889] relative">
                  {/* Profile Picture */}
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
              <div className="px-6 border-b border-gray-200">
                <div className="flex space-x-6">

                  <button 
                    onClick={() => setActivePlayerTab('stats')}
                    className={`transition-colors pb-2 border-b-2 ${
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
                    riotId={selectedPlayerRiotId || undefined}
                    region={selectedPlayerRegion || undefined}
                  />
                )}
                

                

              </div>
            </div>
          </div>
        )}
      </>
    )
  }

// Function to get TFT rank icon URL
function getRankIconUrl(rank: string): string {
  const rankIcons: { [key: string]: string } = {
    'iron+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Iron.png',
    'bronze+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Bronze.png',
    'silver+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Silver.png',
    'gold+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Gold.png',
    'platinum+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Platinum.png',
    'emerald+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Emerald.png',
    'diamond+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Diamond.png',
    'master+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Master.png',
    'grandmaster+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_GrandMaster.png',
    'challenger+': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Challenger.png',
  };
  return rankIcons[rank] || '';
}

// Function to extract rank tier from rank string
function getRankTier(rank: string): string {
  if (!rank || rank === 'UNRANKED') return '';
  const firstWord = rank.split(' ')[0].toLowerCase();
  return firstWord;
}

// Function to get text color based on background color
function getTextColor(backgroundColor: string): string {
  // Light colors need dark text
  if (backgroundColor === '#ffc77e' || backgroundColor === '#ffa65f') {
    return '#333333'; // Dark gray for light backgrounds
  }
  return '#ffffff'; // White for dark backgrounds
}

// Placeholder Group Card Component
function PlaceholderGroupCard() {
  return (
    <div className="relative w-full">
      <div className="relative bg-white rounded-xl shadow-lg overflow-hidden h-80 animate-pulse">
        {/* Image Section - Fixed height */}
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl">
          {/* Placeholder for group image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-300 mx-auto mb-2 border-4 border-white/40"></div>
              <div className="w-8 h-8 bg-gray-300 rounded mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Information Section - Fixed height */}
        <div className="p-4 h-32 flex flex-col justify-between">
          {/* Title and Date */}
          <div className="flex-1">
            {/* Group Title */}
            <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
            
            {/* Created Date */}
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// My Group Card Component
function MyGroupCard({ 
  group, 
  onTileClick
}: { 
  group: MyGroup
  onTileClick: (group: MyGroup) => void
}) {
  return (
    <div 
      className="relative w-full"
      onClick={() => onTileClick(group)}
    >
      <div className="relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden h-80">
        {/* Image Section - Fixed height */}
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl overflow-hidden">
          {group.image_url ? (
            /* Display uploaded image */
            <img
              src={group.image_url}
              alt={`${group.name} group`}
              className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          {/* Placeholder for group image - shown when no image or image fails to load */}
          <div className={`absolute inset-0 flex items-center justify-center ${group.image_url ? 'hidden' : ''}`}>
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-white/20"
                style={{ 
                  backgroundColor: ['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][group.id % 5],
                  color: getTextColor(['#964b00', '#b96823', '#de8741', '#ffa65f', '#ffc77e'][group.id % 5])
                }}
              >
                <span className="text-2xl font-bold">{group.name.charAt(0).toUpperCase()}</span>
              </div>
              <svg
                className="w-8 h-8 text-white opacity-80 mx-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          
          {/* Role indicator overlay */}
          {group.role === 'captain' && (
            <div className="absolute top-3 right-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Captain
            </div>
          )}
        </div>

        {/* Information Section - Fixed height */}
        <div className="p-4 h-32 flex flex-col justify-between">
          {/* Title and Date */}
          <div className="flex-1">
            {/* Group Title */}
            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
              {group.name}
            </h3>
            
            {/* Created Date */}
            <p className="text-xs text-gray-500">
              Created: {new Date(group.created_date).toLocaleDateString()}
            </p>
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              <span className="font-medium text-blue-600 truncate">
                {group.members.length} {group.members.length === 1 ? 'Member' : 'Members'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-yellow-600 truncate">
                {group.avg_elo ? group.avg_elo.toLocaleString() : 'N/A'} ELO
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}





// Profile Icon Component
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
  const { version } = useVersion()
  const [profileIconUrl, setProfileIconUrl] = useState<string | null>(null)
  const [iconError, setIconError] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  useEffect(() => {
    if (!iconId || !version) {
      if (!iconId) setIconError(true)
      return
    }

    const iconUrl = riotService.getProfileIconUrl(iconId, version)
    setProfileIconUrl(iconUrl)
    setIconError(false)
  }, [iconId, version])

  // If we have a valid icon URL and no error, show the actual icon
  if (profileIconUrl && !iconError) {
    return (
      <img
        src={profileIconUrl}
        alt={`${summonerName} profile icon`}
        className={`${sizeClasses[size]} ${shape} object-cover border-2 border-gray-200`}
        onError={() => setIconError(true)}
      />
    )
  }

  // Otherwise, show the colored placeholder
  return (
    <div 
      className={`${sizeClasses[size]} ${shape} flex items-center justify-center border-2 border-gray-200 font-bold`}
      style={{ 
        backgroundColor: ['#564ec7', '#007760', '#de8741', '#ffa65f', '#ffc77e'][memberId % 5],
        color: getTextColor(['#564ec7', '#007760', '#de8741', '#ffa65f', '#ffc77e'][memberId % 5])
      }}
    >
      {summonerName.charAt(0).toUpperCase()}
    </div>
  )
} 