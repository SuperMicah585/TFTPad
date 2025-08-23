import { useState, useEffect, useRef } from 'react'
import { UserCheck, Mail, Users, Crown, Calendar, Upload, Eye, SquareX, ChevronsLeft, Award, Star, TrendingUp, TrendingDown, Clock, Globe, FileText, Image, Settings, AlertTriangle, LogOut, UserPlus, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { studyGroupService } from '../services/studyGroupService'
import { userService } from '../services/userService'
import { studyGroupInviteService, type StudyGroupInvite } from '../services/studyGroupInviteService'
import { studyGroupRequestService, type StudyGroupRequest } from '../services/studyGroupRequestService'
import { teamStatsService } from '../services/teamStatsService'
import { livePlayerService } from '../services/livePlayerService'

import { playerStatsService } from '../services/playerStatsService'
import { TeamStatsContent } from './TeamStatsContent'
import { TFTStatsContent } from './TFTStatsContent'
import { PlayerEloChart } from './PlayerEloChart'
import { RiotLoginModal } from './auth/RiotLoginModal'
import { RiotConnectModal } from './auth/RiotConnectModal'
import { useImageUpload } from '../hooks/useImageUpload'
import { LoadingSpinner } from './auth/LoadingSpinner'

import { riotService } from '../services/riotService'

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
  owner: number;
  rank?: string;
  icon_id?: number;
  user_id?: number;
}

interface NewGroupData {
  name: string;
  description: string;
  meeting_schedule: string[];
  application_instructions: string;
  time: string;
  timezone: string;
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
  const { userId } = useAuth()
  const [myGroups, setMyGroups] = useState<MyGroup[]>([])
  const [error, setError] = useState<string | null>(null)
  const [invitations, setInvitations] = useState<StudyGroupInvite[]>([])
  const [invitationsLoading, setInvitationsLoading] = useState(false)
  
  // Study group requests state
  const [groupRequests, setGroupRequests] = useState<{ [groupId: number]: StudyGroupRequest[] }>({})
  const [requestsLoading, setRequestsLoading] = useState<{ [groupId: number]: boolean }>({})
  const [respondingToRequest, setRespondingToRequest] = useState<number | null>(null)
  
  // Placeholder state
  const [placeholderCount, setPlaceholderCount] = useState<number>(2) // Start with 2 placeholders
  const [showPlaceholders, setShowPlaceholders] = useState(true) // Show placeholders immediately
  const [isDataLoading, setIsDataLoading] = useState(false) // Track if we're actively fetching data
  const [isCountLoading, setIsCountLoading] = useState(false) // Track if we're fetching the count
  
  // Cache state
  const [lastFetched, setLastFetched] = useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Update loading states when auth loading state changes
  useEffect(() => {
    if (authLoading) {
      setIsCountLoading(true) // Track loading during auth
      setShowPlaceholders(true) // Show placeholders during auth
    } else {
      setIsCountLoading(false)
    }
  }, [authLoading])

  // Fetch user's study groups
  useEffect(() => {
    const fetchMyGroups = async () => {
      if (!userId && !authLoading) {
        setShowPlaceholders(false) // Hide placeholders if not logged in and not loading
        setIsCountLoading(false)
        return
      }

      // Check if we have valid cached data
      const isCacheValid = lastFetched && (Date.now() - lastFetched < CACHE_DURATION)
      if (isCacheValid && myGroups.length > 0) {
        return
      }

      try {
        setError(null)
        setIsCountLoading(true) // Track loading state
        
        // Get the count of user's study groups first
        let userStudyGroups: any[] = []
        if (userId) {
          userStudyGroups = await studyGroupService.getUserStudyGroupsByUser(userId)
          setPlaceholderCount(Math.max(userStudyGroups.length, 2)) // At least 2 placeholders
          setIsCountLoading(false) // Hide loading spinner, got the count
          
          // Keep placeholders visible while processing data
          setIsDataLoading(true)
        }
        
        // Transform the data to match the expected format (using enhanced data from backend)
        const transformedGroups = userStudyGroups.map((userGroup: any) => {
          const group = userGroup.study_group
          if (!group) return null
          
          // Use the enhanced member data from the backend
          const members = (userGroup.members || []).map((member: any) => ({
            summoner_name: member.summoner_name || 'Unknown User',
            elo: member.elo || 0,
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
            role: userGroup.owner === 1 ? "captain" : "member", // Use owner field to determine role
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
        setLastFetched(Date.now())
        setIsDataLoading(false)
        setShowPlaceholders(false) // Hide placeholders once real data is loaded
      } catch (err) {
        console.error('Failed to fetch my groups:', err)
        setError('Failed to load your study groups. Please try again later.')
        setShowPlaceholders(false) // Hide placeholders on error
        setMyGroups([]) // Clear any existing groups on error
        setIsDataLoading(false)
        setIsCountLoading(false)
      }
    }

    fetchMyGroups()
  }, [userId, refreshTrigger])

  // Fetch user's pending invitations
  const fetchInvitations = async () => {
    if (!userId) return;
    
    try {
      setInvitationsLoading(true);
      const userInvites = await studyGroupInviteService.getUserInvites(userId);
      setInvitations(userInvites);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setInvitationsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [userId, refreshTrigger]);



  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupData, setNewGroupData] = useState<NewGroupData>({
    name: "",
    description: "",
    meeting_schedule: [] as string[],
    application_instructions: "",
    time: "",
    timezone: ""
  });

  // Modal state for MyGroupCard modals
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCombinedModal, setShowCombinedModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<MyGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [captain, setCaptain] = useState("");
  const [activeSection, setActiveSection] = useState<'members' | 'info' | 'manage' | 'team-stats'>('members');

  const [groupSettings, setGroupSettings] = useState<GroupSettings>({
    name: "",
    meeting_schedule: [] as string[],
    description: "",
    application_instructions: "",
    time: "",
    timezone: ""
  });
  const [promoteLoading, setPromoteLoading] = useState<string | null>(null); // Track which member is being promoted
  const [deleteLoading, setDeleteLoading] = useState(false); // Track delete operation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Show delete confirmation modal

  // Player modal state
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

  // Authentication and Riot account state
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [showRiotModal, setShowRiotModal] = useState(false);
  const [riotAccount, setRiotAccount] = useState<any>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  

  
  // Image upload functionality
  const { uploadImage, isLoading: imageUploadLoading, error: imageUploadError, clearError: clearImageError } = useImageUpload();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user has Riot account linked
  useEffect(() => {
    const checkRiotAccount = async () => {
      if (!userId) return;
      
      try {
        const account = await userService.getUserRiotAccount(userId);
        setRiotAccount(account);
      } catch (error) {
        console.error('Error checking Riot account:', error);
        setRiotAccount(null);
      }
    };

    checkRiotAccount();
  }, [userId]);

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

  const handleImageUpload = async (groupId: number) => {
    if (!selectedImage) return;

    try {
      console.log('Starting image upload for group:', groupId);
      console.log('Selected image:', selectedImage.name, selectedImage.size);
      
      const fileName = `groups/${groupId}/icon.${selectedImage.name.split('.').pop()}`;
      console.log('Generated file name:', fileName);
      
      const result = await uploadImage(selectedImage, fileName);
      console.log('Upload result:', result);
      
      if (result.error) {
        console.error('Failed to upload image:', result.error);
        return null;
      }
      
      // Use the URL returned from the backend (which includes cache-busting)
      const imageUrl = result.data.url;
      console.log('Generated image URL:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleCreateGroup = async () => {
    // Check if user is logged in
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    // Check if user has Riot account linked
    if (!riotAccount) {
      setShowRiotModal(true);
      return;
    }

    setCreatingGroup(true);
    try {
      // Create the study group first
      const result = await studyGroupService.createStudyGroup({
        user_id: userId,
        group_name: newGroupData.name,
        description: newGroupData.description,
        meeting_schedule: newGroupData.meeting_schedule,
        application_instructions: newGroupData.application_instructions,
        time: newGroupData.time,
        timezone: newGroupData.timezone
      });

      // Upload image if selected and update the database with the image URL
      if (selectedImage && result.group) {
        const imageUrl = await handleImageUpload(result.group.id);
        if (imageUrl) {
          // Update the study group with the image URL
          await studyGroupService.updateStudyGroup(result.group.id, {
            image_url: imageUrl
          });
        }
      }

      // Close modal and reset form
      setShowCreateModal(false);
      setNewGroupData({
        name: "",
        description: "",
        meeting_schedule: [],
        application_instructions: "",
        time: "",
        timezone: ""
      });
      setSelectedImage(null);
      setImagePreview(null);
      clearImageError();

      // Refresh the groups data
      setRefreshTrigger(prev => prev + 1);
      setMyGroups([]);

      // Show success message (you could add a toast notification here)
      console.log("Study group created successfully!");
      
    } catch (error) {
      console.error('Failed to create study group:', error);
      // Show error message (you could add a toast notification here)
      alert('Failed to create study group. Please try again.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleMeetingScheduleChange = (day: string) => {
    setNewGroupData(prev => ({
      ...prev,
      meeting_schedule: prev.meeting_schedule.includes(day)
        ? prev.meeting_schedule.filter(d => d !== day)
        : [...prev.meeting_schedule, day]
    }));
  };

  // Handle switching captain
  const handleSwitchCaptain = async (newCaptainSummonerName: string) => {
    if (!selectedGroup) return;
    
    setPromoteLoading(newCaptainSummonerName); // Start loading
    
    try {
      await studyGroupService.switchCaptain(selectedGroup.id, newCaptainSummonerName);
      
      // Update the local state to reflect the change
      const updatedMembers = members.map(member => ({
        ...member,
        owner: member.summoner_name === newCaptainSummonerName ? 1 : 0
      }))
      
      setMembers(updatedMembers);
      setCaptain(newCaptainSummonerName);
      
      // Check if the current user is still the captain
      const currentUserSummonerName = riotAccount?.summoner_name;
      const isCurrentUserStillCaptain = newCaptainSummonerName === currentUserSummonerName;
      
      // Refresh the groups data to update ownership status
      setRefreshTrigger(prev => prev + 1);
      setMyGroups([]);
      
      // Show success message
      console.log('Captain switched successfully');
      
      // Close modal if current user is no longer the captain (loses access to manage tab)
      if (!isCurrentUserStillCaptain) {
        console.log('Current user is no longer captain, closing modal');
        setShowSettings(false);
        setShowCombinedModal(false);
      } else {
        // If current user is still captain, just close the settings modal but keep the combined modal open
        setShowSettings(false);
      }
      
    } catch (error) {
      console.error('Failed to switch captain:', error);
      // Show error message (you could add a toast notification here)
      alert('Failed to switch captain. Please try again.');
    } finally {
      setPromoteLoading(null); // Stop loading
    }
  };

  // Handle deleting study group
  const handleDeleteGroup = async () => {
    if (!selectedGroup || !riotAccount) return;
    
    setDeleteLoading(true);
    
    try {
      await studyGroupService.deleteStudyGroup(selectedGroup.id, riotAccount.summoner_name);
      
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

  const handleRespondToInvite = async (inviteId: number, response: 'accept' | 'decline') => {
    try {
      await studyGroupInviteService.respondToInvite(inviteId, response);
      
      // Remove the invitation from the list
      setInvitations(prev => prev.filter(invite => invite.id !== inviteId));
      
      // Refresh groups if accepted
      if (response === 'accept') {
        // Clear cache and force refresh
        setLastFetched(null);
        setMyGroups([]);
        
        // Small delay to ensure backend has processed the acceptance
        setTimeout(() => {
          setRefreshTrigger(prev => prev + 1);
        }, 500);
      }
      
      alert(`Invitation ${response}ed successfully!`);
    } catch (error) {
      console.error('Error responding to invitation:', error);
      alert(error instanceof Error ? error.message : 'Failed to respond to invitation');
    }
  };

  // Fetch requests for a specific group
  const fetchGroupRequests = async (groupId: number) => {
    try {
      setRequestsLoading(prev => ({ ...prev, [groupId]: true }));
      const requests = await studyGroupRequestService.getGroupRequests(groupId);
      setGroupRequests(prev => ({ ...prev, [groupId]: requests }));
    } catch (error) {
      console.error('Error fetching group requests:', error);
    } finally {
      setRequestsLoading(prev => ({ ...prev, [groupId]: false }));
    }
  };

  // Handle responding to a study group request
  const handleRespondToRequest = async (requestId: number, response: 'approve' | 'reject') => {
    setRespondingToRequest(requestId);
    
    try {
      await studyGroupRequestService.respondToRequest(requestId, response);
      
      // Remove the request from all groups
      setGroupRequests(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(groupId => {
          updated[parseInt(groupId)] = updated[parseInt(groupId)].filter(req => req.id !== requestId);
        });
        return updated;
      });
      
      // Refresh groups if approved
      if (response === 'approve') {
        setRefreshTrigger(prev => prev + 1);
        setMyGroups([]);
      }
      
      alert(`Request ${response}ed successfully!`);
    } catch (error) {
      console.error('Error responding to request:', error);
      alert(error instanceof Error ? error.message : 'Failed to respond to request');
    } finally {
      setRespondingToRequest(null);
    }
  };

  // Handle leaving group
  const handleLeaveGroup = async () => {
    if (!selectedGroup || !userId) return;
    
    if (!confirm('Are you sure you want to leave this study group? This action cannot be undone.')) {
      return;
    }
    
    try {
      await studyGroupService.leaveStudyGroup(selectedGroup.id, userId);
      
      // Remove the group from the list
      setMyGroups(prev => prev.filter(group => group.id !== selectedGroup.id));
      
      // Close the modal
      setShowCombinedModal(false);
      
      alert('Successfully left the study group!');
    } catch (error) {
      console.error('Error leaving group:', error);
      alert(error instanceof Error ? error.message : 'Failed to leave study group');
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
        
        // Upload new image (will overwrite existing file due to upsert: true)
        const uploadedImageUrl = await handleImageUpload(selectedGroup.id);
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
          console.log('New image uploaded successfully:', imageUrl);
        } else {
          throw new Error('Failed to upload new image');
        }
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

  // Player modal functions
  const fetchPlayerLeagueData = async (userId: number) => {
    try {
      setLeagueDataLoading(true);
      setLeagueDataError(null);
      
      // Get user's riot account to get PUUID
      const riotAccount = await userService.getUserRiotAccount(userId);
      if (!riotAccount || !riotAccount.riot_id) {
        setLeagueDataError('No Riot account found for this user');
        return;
      }

      // Fetch league data using the riot_id (which contains the PUUID)
      const response = await fetch(`${API_BASE_URL}/api/tft-league/${riotAccount.riot_id}?user_id=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch league data');
      }
      
      const data = await response.json();
      setPlayerLeagueData(data);
    } catch (error) {
      console.error('Error fetching player league data:', error);
      setLeagueDataError('Failed to load league data');
    } finally {
      setLeagueDataLoading(false);
    }
  };

  const fetchPlayerProfile = async (userId: number) => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      
      const profile = await userService.getUserProfile(userId);
      setPlayerProfile(profile);
    } catch (error) {
      console.error('Error fetching player profile:', error);
      setProfileError('Failed to load profile data');
    } finally {
      setProfileLoading(false);
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
      console.log('👤 Fetching riot account for user_id:', member.user_id);
      const riotAccount = await userService.getUserRiotAccount(member.user_id);
      riotId = riotAccount?.riot_id;
      console.log('🎯 Riot account found:', riotAccount);
      console.log('🎯 Riot ID:', riotId);
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
              <h2 className="text-2xl font-bold text-gray-800">My Study Groups</h2>
              <div className="relative group">
                <UserCheck 
                  size={20} 
                  className="text-gray-500 hover:text-gray-700 cursor-help transition-colors" 
                />
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999] hidden sm:block">
                  <div className="text-center">Manage groups you're part of and their settings</div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (!userId) {
                  setShowLoginModal(true);
                } else if (!riotAccount) {
                  setShowRiotModal(true);
                } else {
                  setShowCreateModal(true);
                }
              }}
              disabled={!userId || !riotAccount}
              className="text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: !userId || !riotAccount ? '#666' : '#964B00' }}
              onMouseEnter={(e) => {
                if (!userId || !riotAccount) return;
                e.currentTarget.style.backgroundColor = '#7c3a00';
              }}
              onMouseLeave={(e) => {
                if (!userId || !riotAccount) return;
                e.currentTarget.style.backgroundColor = '#964B00';
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {!userId ? 'Login Required' : !riotAccount ? 'Link Riot Account' : 'Create New Group'}
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center flex-1 flex flex-col items-center justify-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Study Groups</h3>
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
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Study Groups Yet</h3>
            <p className="text-gray-600 mb-4">You haven't joined any study groups yet.</p>
            <button 
              onClick={() => window.location.href = '/study-groups'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Browse Study Groups
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
                  
                  // Find the captain (member with owner = 1)
                  const captainMember = group.members.find((m: GroupMember) => m.owner === 1);
                  const currentCaptain = captainMember?.summoner_name || 'Unknown Captain';
                  setCaptain(currentCaptain);
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
                      user_id: relationship.user_id
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

        {/* Invitations Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Invitations</h2>
            <div className="relative group">
              <Mail 
                size={20} 
                className="text-gray-500 hover:text-gray-700 cursor-help transition-colors" 
              />
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999] hidden sm:block">
                <div className="text-center">View and respond to group invitations</div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
              </div>
            </div>
          </div>

          {/* Mock invitations data - TODO: Replace with real invitations API */}
          {invitationsLoading ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <LoadingSpinner size="md" className="mx-auto mb-4" />
              <p className="text-blue-700">Loading invitations...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <Mail className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-800 mb-2">No Invitations</h3>
              <p className="text-blue-700">You don't have any pending group invitations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {invitations.map((invitation) => (
                <InvitationCard 
                  key={invitation.id} 
                  invitation={invitation} 
                  onRespond={handleRespondToInvite}
                />
              ))}
            </div>
          )}
        </div>

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
                          checked={newGroupData.meeting_schedule.includes(day)}
                          onChange={() => handleMeetingScheduleChange(day)}
                          className="mr-2"
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" style={{ color: '#00c9ac' }} />
                      Preferred Time
                    </label>
                    <select
                      id="time"
                      value={newGroupData.time}
                      onChange={(e) => setNewGroupData({...newGroupData, time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-400"
                    >
                      <option value="">Select time...</option>
                      <option value="mornings">Mornings</option>
                      <option value="afternoons">Afternoons</option>
                      <option value="evenings">Evenings</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-purple-600" />
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      value={newGroupData.timezone}
                      onChange={(e) => setNewGroupData({...newGroupData, timezone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-400"
                    >
                      <option value="">Select timezone...</option>
                      <option value="UTC-8">Pacific Time (UTC-8)</option>
                      <option value="UTC-7">Mountain Time (UTC-7)</option>
                      <option value="UTC-6">Central Time (UTC-6)</option>
                      <option value="UTC-5">Eastern Time (UTC-5)</option>
                      <option value="UTC+0">UTC</option>
                      <option value="UTC+1">Central European Time (UTC+1)</option>
                      <option value="UTC+2">Eastern European Time (UTC+2)</option>
                      <option value="UTC+8">China Standard Time (UTC+8)</option>
                      <option value="UTC+9">Japan Standard Time (UTC+9)</option>
                      <option value="UTC+10">Australian Eastern Time (UTC+10)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    Application Instructions
                  </label>
                  <textarea
                    id="instructions"
                    value={newGroupData.application_instructions}
                    onChange={(e) => setNewGroupData({...newGroupData, application_instructions: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-400 resize-vertical"
                    placeholder="What should potential members include in their application?"
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
                        memberId={member.user_id || index}
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
                      {selectedGroup.role === 'captain' && member.summoner_name !== 'Moisturizar' && (
                        <button className="text-red-500 hover:text-red-700 text-sm font-medium flex-shrink-0">
                          Remove
                        </button>
                      )}
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
                    if (selectedGroup?.role === 'captain') {
                      fetchGroupRequests(selectedGroup.id);
                    }
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
                {activeSection === 'members' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-3">Switch Captain</h4>
                    <p className="text-blue-700 text-sm mb-3">Promote another member to captain:</p>
                    <ul className="space-y-2">
                      {members.filter((m: GroupMember) => m.summoner_name !== captain).length === 0 ? (
                        <li className="text-gray-500 text-sm">No other members to promote.</li>
                      ) : (
                        members.filter((m: GroupMember) => m.summoner_name !== captain).map((member: GroupMember, idx: number) => (
                          <li key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded px-3 py-2 border border-blue-100 gap-2">
                            <div className="relative">
                              <div className="text-gray-800 truncate">{member.summoner_name}</div>
                              {member.owner === 1 && (
                                <div className="absolute -top-2 -right-2 text-yellow-500">
                                  <Crown className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {getCurrentRank(member) ? (
                                <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200 flex-shrink-0">
                                  {getCurrentRank(member) && getRankTier(getCurrentRank(member)!) && (
                                    <img 
                                      src={getRankIconUrl(getRankTier(getCurrentRank(member)!) + '+')} 
                                      alt={getRankTier(getCurrentRank(member)!)}
                                      className="w-4 h-4 object-contain"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                  <span className="text-xs truncate">{getCurrentRank(member)}</span>
                                </div>
                              ) : (
                                <span className="text-gray-500 italic text-xs">No current ranked data</span>
                              )}
                              <button
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors flex-shrink-0 ${
                                  promoteLoading === member.summoner_name
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                                onClick={() => handleSwitchCaptain(member.summoner_name)}
                                disabled={promoteLoading === member.summoner_name}
                              >
                                {promoteLoading === member.summoner_name ? (
                                  <div className="flex items-center gap-1">
                                    <LoadingSpinner size="sm" />
                                    <span>Promoting...</span>
                                  </div>
                                ) : (
                                  'Promote'
                                )}
                              </button>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                    <p className="text-xs text-gray-500 mt-3">Current captain: <span className="font-semibold">{captain}</span></p>
                  </div>
                )}

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
                              memberId={m.user_id || idx}
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

                    {/* Pending Requests Section - Only show for captains */}
                    {selectedGroup?.role === 'captain' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                            Pending Requests
                          </h4>
                          <button
                            onClick={() => fetchGroupRequests(selectedGroup.id)}
                            disabled={requestsLoading[selectedGroup.id]}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {requestsLoading[selectedGroup.id] ? 'Loading...' : 'Refresh'}
                          </button>
                        </div>
                        
                        {requestsLoading[selectedGroup.id] ? (
                          <div className="text-center py-4">
                            <LoadingSpinner size="sm" className="mx-auto mb-2" />
                            <p className="text-blue-700 text-sm">Loading requests...</p>
                          </div>
                        ) : groupRequests[selectedGroup.id]?.length > 0 ? (
                          <div className="space-y-3">
                            {groupRequests[selectedGroup.id].map((request) => (
                              <div key={request.id} className="bg-white rounded-lg p-3 border border-blue-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-800">
                                        {request.user?.summoner_name || 'Unknown User'}
                                      </span>
                                      {request.user?.rank && (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                          {request.user.rank}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Requested on {new Date(request.created_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleRespondToRequest(request.id, 'approve')}
                                      disabled={respondingToRequest === request.id}
                                      className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {respondingToRequest === request.id ? (
                                        <LoadingSpinner size="sm" />
                                      ) : (
                                        <CheckCircle className="w-3 h-3" />
                                      )}
                                      {respondingToRequest === request.id ? 'Approving...' : 'Approve'}
                                    </button>
                                    <button
                                      onClick={() => handleRespondToRequest(request.id, 'reject')}
                                      disabled={respondingToRequest === request.id}
                                      className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {respondingToRequest === request.id ? (
                                        <LoadingSpinner size="sm" />
                                      ) : (
                                        <XCircle className="w-3 h-3" />
                                      )}
                                      {respondingToRequest === request.id ? 'Rejecting...' : 'Reject'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <UserPlus className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                            <p className="text-blue-700 text-sm">No pending requests</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Removed pendingApplications section - will be handled in manage tab */}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Authentication Modals */}
      <RiotLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={(user) => {
          console.log('Login successful:', user)
        }}
      />
      
      <RiotConnectModal
        isOpen={showRiotModal}
        onClose={() => setShowRiotModal(false)}
        userId={userId || 0}
        onSuccess={() => {
          // Refresh Riot account data after successful connection
          setShowRiotModal(false);
          // Re-check Riot account
          if (userId) {
            userService.getUserRiotAccount(userId).then(setRiotAccount);
          }
        }}
      />



      {/* Combined Modal with Tabs */}
      {showCombinedModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full h-[600px] overflow-y-auto flex flex-col relative">
            {/* Close button - absolute positioned */}
            <button
              onClick={() => setShowCombinedModal(false)}
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
                  onClick={() => setActiveSection('members')}
                  className={`transition-colors pb-2 border-b-2 whitespace-nowrap text-sm sm:text-base ${
                    activeSection === 'members' 
                      ? 'text-[#564ec7] border-[#564ec7]' 
                      : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#564ec7]'
                  }`}
                >
                  Members
                </button>
                <button 
                  onClick={() => setActiveSection('info')}
                  className={`transition-colors pb-2 border-b-2 whitespace-nowrap text-sm sm:text-base ${
                    activeSection === 'info' 
                      ? 'text-[#564ec7] border-[#564ec7]' 
                      : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#564ec7]'
                  }`}
                >
                  Group Info
                </button>
                {(selectedGroup.role === 'captain' || selectedGroup.role === 'member') && (
                                  <button 
                  onClick={() => {
                    setActiveSection('manage');
                    // Fetch requests when manage tab is opened for captains
                    if (selectedGroup?.role === 'captain') {
                      fetchGroupRequests(selectedGroup.id);
                    }
                  }}
                  className={`transition-colors pb-2 border-b-2 whitespace-nowrap text-sm sm:text-base ${
                    activeSection === 'manage' 
                      ? 'text-[#564ec7] border-[#564ec7]' 
                      : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#564ec7]'
                  }`}
                >
                  Manage
                </button>
                )}
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
              {/* Members Tab */}
              {activeSection === 'members' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {members.map((member, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                          clickedMemberId === member.user_id 
                            ? 'bg-blue-50 border-blue-300 shadow-md scale-[1.02]' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
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
                              className={`font-medium truncate cursor-pointer transition-all duration-300 ${
                                clickedMemberId === member.user_id 
                                  ? 'text-blue-600 scale-105' 
                                  : 'text-gray-800 hover:text-blue-600'
                              }`}
                              onClick={() => handlePlayerClick(member)}
                            >
                              {member.summoner_name}
                            </span>
                            {member.owner === 1 && (
                              <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        
                        {/* Rank */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getCurrentRank(member) ? (
                            <div className="flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full border" style={{ backgroundColor: '#f8e0db', color: '#8b4513', borderColor: '#e6c7c0' }}>
                              {getCurrentRank(member) && getRankTier(getCurrentRank(member)!) && (
                                <img 
                                  src={getRankIconUrl(getRankTier(getCurrentRank(member)!) === 'challenger' || getRankTier(getCurrentRank(member)!) === 'grandmaster' ? getRankTier(getCurrentRank(member)!) : getRankTier(getCurrentRank(member)!) + '+')} 
                                  alt={getRankTier(getCurrentRank(member)!)}
                                  className="w-4 h-4 object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              )}
                              <span className="text-sm">{getCurrentRank(member)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500 italic text-sm">No current ranked data</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Group Info Tab */}
              {activeSection === 'info' && (
                <div className="space-y-4 w-full">
                  <div className="space-y-4 w-full">
                    <div className="w-full">
                      <h5 className="font-medium text-gray-800 mb-2 text-left flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        Description
                      </h5>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                        <p className="text-gray-700 whitespace-pre-wrap text-left text-xs">
                          {selectedGroup.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                    <div className="w-full">
                      <h5 className="font-medium text-gray-800 mb-2 text-left flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-600" />
                        Application Instructions
                      </h5>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                        <p className="text-gray-700 whitespace-pre-wrap text-left text-xs">
                          {selectedGroup.application_instructions || "No application instructions provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Manage Tab - Role-based content */}
              {activeSection === 'manage' && (
                <div className="space-y-4 w-full">
                  <div className="space-y-4 w-full">
                    {/* Captain-only content */}
                    {selectedGroup.role === 'captain' && (
                      <>
                        {/* Pending Requests Section */}
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-800 text-left flex items-center gap-2">
                              <UserPlus className="w-4 h-4 text-blue-600" />
                              Pending Requests
                            </h5>
                            <button
                              onClick={() => fetchGroupRequests(selectedGroup.id)}
                              disabled={requestsLoading[selectedGroup.id]}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              {requestsLoading[selectedGroup.id] ? 'Loading...' : 'Refresh'}
                            </button>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                            {requestsLoading[selectedGroup.id] ? (
                              <div className="text-center py-4">
                                <LoadingSpinner size="sm" className="mx-auto mb-2" />
                                <p className="text-gray-700 text-sm">Loading requests...</p>
                              </div>
                            ) : groupRequests[selectedGroup.id]?.length > 0 ? (
                              <div className="space-y-3">
                                {groupRequests[selectedGroup.id].map((request) => (
                                  <div key={request.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium text-gray-800 truncate">
                                            {request.user?.summoner_name || 'Unknown User'}
                                          </span>
                                          {request.user?.rank && (
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex-shrink-0">
                                              {request.user.rank}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Requested on {new Date(request.created_at).toLocaleDateString()}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                          onClick={() => handleRespondToRequest(request.id, 'approve')}
                                          disabled={respondingToRequest === request.id}
                                          className="flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {respondingToRequest === request.id ? (
                                            <LoadingSpinner size="sm" />
                                          ) : (
                                            <CheckCircle className="w-3 h-3" />
                                          )}
                                          {respondingToRequest === request.id ? 'Approving...' : 'Approve'}
                                        </button>
                                        <button
                                          onClick={() => handleRespondToRequest(request.id, 'reject')}
                                          disabled={respondingToRequest === request.id}
                                          className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {respondingToRequest === request.id ? (
                                            <LoadingSpinner size="sm" />
                                          ) : (
                                            <XCircle className="w-3 h-3" />
                                          )}
                                          {respondingToRequest === request.id ? 'Rejecting...' : 'Reject'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <UserPlus className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-700 text-sm">No pending requests</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Switch Captain Section */}
                    <div className="w-full">
                      <h5 className="font-medium text-gray-800 mb-2 text-left flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        Switch Captain
                      </h5>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                        <p className="text-gray-700 text-sm mb-3">Promote another member to captain:</p>
                        <div className="space-y-2">
                          {members.filter((m: GroupMember) => m.summoner_name !== captain).length === 0 ? (
                            <p className="text-gray-500 text-sm">No other members to promote.</p>
                          ) : (
                            members.filter((m: GroupMember) => m.summoner_name !== captain).map((member: GroupMember, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <ProfileIcon 
                                    memberId={member.user_id || idx}
                                    summonerName={member.summoner_name}
                                    iconId={member.icon_id}
                                    size="sm"
                                    shape="rounded-full"
                                  />
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-800 truncate">{member.summoner_name}</span>
                                    {member.owner === 1 && (
                                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {getCurrentRank(member) ? (
                                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold rounded-full border" style={{ backgroundColor: '#f8e0db', color: '#8b4513', borderColor: '#e6c7c0' }}>
                                      {getCurrentRank(member) && getRankTier(getCurrentRank(member)!) && (
                                        <img 
                                          src={getRankIconUrl(getRankTier(getCurrentRank(member)!) === 'challenger' || getRankTier(getCurrentRank(member)!) === 'grandmaster' ? getRankTier(getCurrentRank(member)!) : getRankTier(getCurrentRank(member)!) + '+')} 
                                          alt={getRankTier(getCurrentRank(member)!)}
                                          className="w-3 h-3 object-contain"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <span className="text-xs truncate">{getCurrentRank(member)}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 italic text-xs">No current ranked data</span>
                                  )}
                                  <button
                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors flex-shrink-0 ${
                                      promoteLoading === member.summoner_name
                                        ? 'bg-gray-400 text-white cursor-not-allowed'
                                        : 'bg-[#564ec7] hover:bg-[#4a3fb8] text-white'
                                    }`}
                                    onClick={() => handleSwitchCaptain(member.summoner_name)}
                                    disabled={promoteLoading === member.summoner_name}
                                  >
                                    {promoteLoading === member.summoner_name ? (
                                      <div className="flex items-center gap-1">
                                        <LoadingSpinner size="sm" />
                                        <span>Promoting...</span>
                                      </div>
                                    ) : (
                                      'Promote'
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">Current captain: <span className="font-semibold">{captain}</span></p>
                      </div>
                    </div>

                    {/* Group Settings Section */}
                    <div className="w-full">
                      <h5 className="font-medium text-gray-800 mb-2 text-left flex items-center gap-2">
                        <Settings className="w-4 h-4 text-purple-600" />
                        Group Settings
                      </h5>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full space-y-4">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#564ec7] focus:ring-1 focus:ring-[#564ec7]"
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
                              <label key={day} className="flex items-center text-sm">
                                <input
                                  type="checkbox"
                                  checked={groupSettings.meeting_schedule.includes(day)}
                                  onChange={() => setGroupSettings(prev => ({
                                    ...prev,
                                    meeting_schedule: prev.meeting_schedule.includes(day)
                                      ? prev.meeting_schedule.filter(d => d !== day)
                                      : [...prev.meeting_schedule, day]
                                  }))}
                                  className="mr-2 text-[#564ec7] focus:ring-[#564ec7]"
                                />
                                {day}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            Description
                          </label>
                          <textarea
                            id="description"
                            value={groupSettings.description}
                            onChange={(e) => setGroupSettings({...groupSettings, description: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#564ec7] focus:ring-1 focus:ring-[#564ec7] resize-vertical"
                            placeholder="Group description..."
                          />
                        </div>
                        <div>
                          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-600" />
                            Application Instructions
                          </label>
                          <textarea
                            id="instructions"
                            value={groupSettings.application_instructions}
                            onChange={(e) => setGroupSettings({...groupSettings, application_instructions: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#564ec7] focus:ring-1 focus:ring-[#564ec7] resize-vertical"
                            placeholder="Application instructions..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="manageTime" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <Clock className="w-4 h-4" style={{ color: '#00c9ac' }} />
                              Preferred Time
                            </label>
                            <select
                              id="manageTime"
                              value={groupSettings.time}
                              onChange={(e) => setGroupSettings({...groupSettings, time: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#564ec7] focus:ring-1 focus:ring-[#564ec7]"
                            >
                              <option value="">Select time...</option>
                              <option value="mornings">Mornings</option>
                              <option value="afternoons">Afternoons</option>
                              <option value="evenings">Evenings</option>
                              <option value="flexible">Flexible</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="manageTimezone" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <Globe className="w-4 h-4 text-purple-600" />
                              Timezone
                            </label>
                            <select
                              id="manageTimezone"
                              value={groupSettings.timezone}
                              onChange={(e) => setGroupSettings({...groupSettings, timezone: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#564ec7] focus:ring-1 focus:ring-[#564ec7]"
                            >
                              <option value="">Select timezone...</option>
                              <option value="UTC-8">Pacific Time (UTC-8)</option>
                              <option value="UTC-7">Mountain Time (UTC-7)</option>
                              <option value="UTC-6">Central Time (UTC-6)</option>
                              <option value="UTC-5">Eastern Time (UTC-5)</option>
                              <option value="UTC+0">UTC</option>
                              <option value="UTC+1">Central European Time (UTC+1)</option>
                              <option value="UTC+2">Eastern European Time (UTC+2)</option>
                              <option value="UTC+8">China Standard Time (UTC+8)</option>
                              <option value="UTC+9">Japan Standard Time (UTC+9)</option>
                              <option value="UTC+10">Australian Eastern Time (UTC+10)</option>
                            </select>
                          </div>
                        </div>

                        {/* Group Icon Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Image className="w-4 h-4 text-gray-600" />
                            Group Icon (Optional)
                          </label>
                          <div className="space-y-3">
                            {/* Current Image Preview */}
                            {selectedGroup?.image_url && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={selectedGroup.image_url}
                                    alt="Current group icon"
                                    className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700">Current Icon</span>
                                    <span className="text-xs text-gray-500">This is your group's current icon</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* New Image Preview - Only show when new image is uploaded */}
                            {imagePreview && (
                              <div className="relative inline-block">
                                <img
                                  src={imagePreview}
                                  alt="New group icon preview"
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
                                {selectedImage ? 'Change Image' : 'Upload New Group Icon'}
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

                        <button
                          className="w-full bg-[#564ec7] hover:bg-[#4a3fb8] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          onClick={handleSaveGroupSettings}
                        >
                          Save Settings
                        </button>
                      </div>
                    </div>

                    {/* Captain Leave Group Info */}
                    <div className="w-full">
                      <h5 className="font-medium text-gray-800 mb-2 text-left flex items-center gap-2">
                        <LogOut className="w-4 h-4 text-blue-600" />
                        Leave Group
                      </h5>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <Crown className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h6 className="font-medium text-blue-800">Captain Requirements</h6>
                            <p className="text-blue-600 text-sm mt-1">
                              As the captain of this study group, you must promote another member to captain before you can leave the group. 
                              This ensures the group continues to have leadership and can function properly.
                            </p>
                            <p className="text-blue-600 text-sm mt-2">
                              Use the "Switch Captain" section above to promote another member, then you'll be able to leave the group.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delete Group Section */}
                    <div className="w-full">
                      <h5 className="font-medium text-gray-800 mb-2 text-left flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        Danger Zone
                      </h5>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 w-full">
                        <div>
                          <h6 className="font-medium text-red-800">Delete Study Group</h6>
                          <p className="text-red-600 text-sm mt-1">
                            This action cannot be undone. All members will be removed and all data will be permanently deleted.
                          </p>
                        </div>
                        <div className="flex justify-end mt-3">
                          <button
                            className="bg-[#ff8889] hover:bg-[#ff7778] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            onClick={() => setShowDeleteConfirm(true)}
                          >
                            Delete Group
                          </button>
                        </div>
                      </div>
                    </div>
                      </>
                    )}

                    {/* Member-only content */}
                    {selectedGroup.role === 'member' && (
                      <div className="w-full">
                        <h5 className="font-medium text-gray-800 mb-2 text-left flex items-center gap-2">
                          <LogOut className="w-4 h-4 text-orange-600" />
                          Leave Group
                        </h5>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 w-full">
                          <div>
                            <h6 className="font-medium text-orange-800">Leave Study Group</h6>
                            <p className="text-orange-600 text-sm mt-1">
                              You will be removed from this study group and lose access to all group features.
                            </p>
                          </div>
                          <div className="flex justify-end mt-3">
                            <button
                              className="bg-[#ff8889] hover:bg-[#ff7778] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                              onClick={handleLeaveGroup}
                            >
                              Leave Group
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
                  setClickedMemberId(null);
                  setPlayerLeagueData([]);
                  setPlayerProfile(null);
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
                    onClick={() => setActivePlayerTab('about')}
                    className={`transition-colors pb-2 border-b-2 ${
                      activePlayerTab === 'about' 
                        ? 'text-[#00c9ac] border-[#00c9ac]' 
                        : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-[#00c9ac]'
                    }`}
                  >
                    About Me
                  </button>
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
                    userId={selectedPlayer?.user_id}
                  />
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
    'challenger': 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/tft-regalia/TFT_Regalia_Challenger.png',
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



// Invitation Card Component
function InvitationCard({ 
  invitation, 
  onRespond 
}: { 
  invitation: StudyGroupInvite;
  onRespond: (inviteId: number, response: 'accept' | 'decline') => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [responding, setResponding] = useState(false);
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
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
  const [liveDataLoading] = useState(false);

  // Profile icon state for selected player
  const [selectedPlayerIconUrl, setSelectedPlayerIconUrl] = useState<string>('');
  const [selectedPlayerIconError, setSelectedPlayerIconError] = useState(false);
  const [selectedPlayerIconLoading, setSelectedPlayerIconLoading] = useState(false);

  const fetchGroupDetails = async () => {
    if (!invitation.study_group_id) return;
    
    try {
      setDetailsLoading(true);
      const details = await studyGroupService.getStudyGroup(invitation.study_group_id);
      setGroupDetails(details);
    } catch (error) {
      console.error('Error fetching group details:', error);
      setGroupDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchGroupMembers = async () => {
    if (!invitation.study_group_id) return;
    
    try {
      setMembersLoading(true);
      const groupUsers = await studyGroupService.getStudyGroupUsers(invitation.study_group_id);
      
      console.log('Raw group users data:', groupUsers);
      
      // Transform members to ensure all fields are properly mapped
      const members = groupUsers.map(member => ({
        summoner_name: member.summoner_name || 'Unknown User',
        elo: member.elo || 0,
        rank: member.rank || 'UNRANKED',
        owner: member.owner,
        icon_id: member.icon_id || undefined,
        user_id: member.user_id || undefined
      }));
      
      console.log('Transformed members data:', members);
      
      setGroupMembers(members);
    } catch (error) {
      console.error('Error fetching group members:', error);
      setGroupMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  // Fetch group details and members when component mounts
  useEffect(() => {
    fetchGroupDetails();
    fetchGroupMembers();
  }, [invitation.study_group_id]);

  // Fetch team stats when group details are loaded
  useEffect(() => {
    if (groupDetails && invitation.study_group_id) {
      fetchTeamStats(invitation.study_group_id, groupDetails.created_at);
    }
  }, [groupDetails, invitation.study_group_id]);

  // Fetch selected player icon when selectedPlayer changes
  useEffect(() => {
    if (selectedPlayer?.icon_id) {
      fetchSelectedPlayerIcon();
    }
  }, [selectedPlayer?.icon_id]);

  const handleShowDetails = () => {
    setShowDetails(true);
  };

  const fetchPlayerLeagueData = async (userId: number) => {
    try {
      setLeagueDataLoading(true);
      setLeagueDataError(null);
      
      // Get user's riot account to get PUUID
      const riotAccount = await userService.getUserRiotAccount(userId);
      if (!riotAccount || !riotAccount.riot_id) {
        setLeagueDataError('No Riot account found for this user');
        return;
      }

      // Fetch league data using the riot_id (which contains the PUUID)
      const response = await fetch(`${API_BASE_URL}/api/tft-league/${riotAccount.riot_id}?user_id=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch league data');
      }
      
      const data = await response.json();
      setPlayerLeagueData(data);
    } catch (error) {
      console.error('Error fetching player league data:', error);
      setLeagueDataError('Failed to load league data');
    } finally {
      setLeagueDataLoading(false);
    }
  };

  const fetchPlayerProfile = async (userId: number) => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      
      const profile = await userService.getUserProfile(userId);
      setPlayerProfile(profile);
    } catch (error) {
      console.error('Error fetching player profile:', error);
      setProfileError('Failed to load profile data');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchPlayerStats = async (riotId: string) => {
    try {
      setPlayerStatsLoading(true);
      setPlayerStatsError(null);
      
      const stats = await playerStatsService.getPlayerStats(riotId);
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
      
      // Handle the new combined API response format
      let allEvents: any[] = [];
      let names: { [riotId: string]: string } = {};
      let liveDataFromAPI: any = {};
      
      if (memberStats && memberStats.events && Array.isArray(memberStats.events)) {
        // New combined format: {"events": [...], "memberNames": {...}, "liveData": {...}}
        allEvents = memberStats.events;
        
        // Get member names from API response if available
        if (memberStats.memberNames && typeof memberStats.memberNames === 'object') {
          names = memberStats.memberNames as unknown as { [riotId: string]: string };
        }
        
        // Get live data from API response if available
        if (memberStats.liveData && typeof memberStats.liveData === 'object') {
          liveDataFromAPI = memberStats.liveData as unknown as { [summonerName: string]: any };
        }
      } else if (memberStats && typeof memberStats === 'object' && Object.keys(memberStats).length > 0) {
        // Old format: {summonerName: [events]}
        allEvents = Object.values(memberStats).flat();
        
        // Create member names mapping from the API response
        Object.keys(memberStats).forEach(summonerName => {
          names[summonerName] = summonerName;
        });
      } else {
        // No data available
        allEvents = [];
      }
      
      setTeamStatsData(allEvents);
      setMemberNames(names);
      setLiveData(liveDataFromAPI);
      
    } catch (error) {
      console.error('Error fetching team stats:', error);
      setTeamStatsError('Failed to load team stats');
      setTeamStatsData([]);
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

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200 relative">
      {/* Invitation badge */}
      <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
        INVITATION
      </div>
      
      {/* Group Icon and Name */}
      <div className="flex items-start mb-3">
        <div className="relative flex-shrink-0 mr-3">
          <div className="w-12 h-12 rounded-lg border-2 border-white overflow-hidden">
            {groupDetails?.image_url ? (
              <img
                src={groupDetails.image_url}
                alt={`${invitation.study_group?.group_name || 'Group'} icon`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const placeholder = target.parentElement?.querySelector('.group-placeholder') as HTMLElement;
                  if (placeholder) {
                    placeholder.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div 
              className={`group-placeholder w-full h-full flex items-center justify-center font-bold text-lg ${groupDetails?.image_url ? 'hidden' : 'flex'}`}
              style={{ 
                backgroundColor: ['#564ec7', '#007760', '#de8741', '#ffa65f', '#ffc77e'][invitation.study_group_id % 5],
                color: getTextColor(['#564ec7', '#007760', '#de8741', '#ffa65f', '#ffc77e'][invitation.study_group_id % 5])
              }}
            >
              {(invitation.study_group?.group_name || 'G').charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gray-800 truncate">{invitation.study_group?.group_name || 'Unknown Group'}</h3>
          <p className="text-xs text-gray-500 mt-1 text-left">Sent {new Date(invitation.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Message positioned under the icon */}
      <div className="flex mb-4">
        <div className="flex-shrink-0"></div>
        <div className="min-w-0">
          <p className="text-gray-700 text-xs break-words">{invitation.message}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setResponding(true);
              onRespond(invitation.id, 'accept');
            }}
            disabled={responding}
            className="bg-emerald-200 hover:bg-emerald-300 text-emerald-800 px-3 py-1.5 rounded-lg font-medium transition-colors text-sm border border-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {responding ? 'Accepting...' : 'Accept'}
          </button>
          <button 
            onClick={() => {
              setResponding(true);
              onRespond(invitation.id, 'decline');
            }}
            disabled={responding}
            className="bg-rose-200 hover:bg-rose-300 text-rose-800 px-3 py-1.5 rounded-lg font-medium transition-colors text-sm border border-rose-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {responding ? 'Declining...' : 'Decline'}
          </button>
        </div>
        <button
          onClick={handleShowDetails}
          className="bg-blue-200 hover:bg-blue-300 text-blue-800 p-2 rounded-lg transition-colors border border-blue-300"
          title="View Group Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Group Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full h-[800px] overflow-y-auto flex flex-col relative">
            {/* Close button */}
            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 z-10 p-0 bg-transparent border-none w-10 h-10 flex items-center justify-center group hover:bg-transparent"
              style={{ lineHeight: 0 }}
            >
              <SquareX className="w-10 h-10 text-black group-hover:opacity-80 transition-opacity" />
            </button>
            
            {/* Profile Header */}
            <div className="relative">
              {/* Banner */}
              <div className="h-32 bg-[#564ec7] relative">
                {/* Group Icon */}
                <div className="absolute -bottom-12 left-6">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden">
                      {groupDetails?.image_url ? (
                        <img
                          src={groupDetails.image_url}
                          alt={`${invitation.study_group?.group_name || 'Group'} icon`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.parentElement?.querySelector('.group-placeholder') as HTMLElement;
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`group-placeholder w-full h-full flex items-center justify-center font-bold text-3xl ${groupDetails?.image_url ? 'hidden' : 'flex'}`}
                        style={{ 
                          backgroundColor: ['#564ec7', '#007760', '#de8741', '#ffa65f', '#ffc77e'][invitation.study_group_id % 5],
                          color: getTextColor(['#564ec7', '#007760', '#de8741', '#ffa65f', '#ffc77e'][invitation.study_group_id % 5])
                        }}
                      >
                        {(invitation.study_group?.group_name || 'G').charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Group name and info */}
              <div className="pt-16 pb-4 px-6">
                <h3 className="text-xl font-bold text-gray-800 mb-1 text-left">{invitation.study_group?.group_name || 'Unknown Group'}</h3>
                <p className="text-gray-500 text-sm text-left">Created: {new Date(invitation.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-4 sm:p-6">
              {detailsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-left">
                    <LoadingSpinner size="md" className="mb-2" />
                    <p className="text-gray-500">Loading group details...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group Members */}
                  <div className="w-full">
                    <h5 className="font-medium text-gray-800 mb-2 text-left">Group Members ({groupMembers.length})</h5>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                      {membersLoading ? (
                        <div className="flex justify-center items-center py-4">
                          <LoadingSpinner size="sm" />
                        </div>
                      ) : groupMembers.length > 0 ? (
                        <div className="space-y-3">
                          {groupMembers.map((member, index) => (
                            <div key={index} className="flex items-center gap-3 p-3">
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
                                    className="font-medium text-gray-800 truncate cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => handlePlayerClick(member)}
                                  >
                                    {member.summoner_name}
                                  </span>
                                  {member.owner === 1 && (
                                    <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                              
                              {/* Rank */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {member.rank ? (
                                  <div className="flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full border" style={{ backgroundColor: '#f8e0db', color: '#8b4513', borderColor: '#e6c7c0' }}>
                                    {member.rank && getRankTier(member.rank) && (
                                      <img 
                                        src={getRankIconUrl(getRankTier(member.rank) === 'challenger' || getRankTier(member.rank) === 'grandmaster' ? getRankTier(member.rank) : getRankTier(member.rank) + '+')} 
                                        alt={getRankTier(member.rank)}
                                        className="w-4 h-4 object-contain"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <span className="text-sm">{member.rank}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 italic text-sm">No current ranked data</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No members found</p>
                      )}
                    </div>
                  </div>

                  {/* Group Description */}
                  <div className="w-full">
                    <h5 className="font-medium text-gray-800 mb-2 text-left flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      Description
                    </h5>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                      <p className="text-gray-700 whitespace-pre-wrap text-left text-xs">
                        {groupDetails?.description || invitation.study_group?.description || "No description provided"}
                      </p>
                    </div>
                  </div>

                  {/* Application Instructions */}
                  {groupDetails?.application_instructions && (
                    <div className="w-full">
                      <h5 className="font-medium text-gray-800 mb-2 text-left flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-600" />
                        Application Instructions
                      </h5>
                                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                      <p className="text-gray-700 whitespace-pre-wrap text-left text-xs">
                        {groupDetails.application_instructions}
                      </p>
                    </div>
                    </div>
                  )}

                  {/* Meeting Schedule */}
                  {groupDetails?.meeting_schedule && groupDetails.meeting_schedule.length > 0 && (
                    <div className="w-full">
                      <h5 className="font-medium text-gray-800 mb-2 text-left">Meeting Schedule</h5>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                        <div className="flex items-center gap-2 text-gray-700 text-xs">
                          <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#ff8889' }} />
                          <span>{Array.isArray(groupDetails.meeting_schedule) ? groupDetails.meeting_schedule.join(", ") : groupDetails.meeting_schedule}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Time and Timezone */}
                  {groupDetails?.time && (
                    <div className="w-full">
                      <h5 className="font-medium text-gray-800 mb-2 text-left">Preferred Time</h5>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                        <div className="flex items-center gap-2 text-gray-700 text-xs">
                          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#00c9ac' }}>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>
                            {groupDetails.time.charAt(0).toUpperCase() + groupDetails.time.slice(1)}
                            {groupDetails.timezone && ` (${groupDetails.timezone})`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Team Stats */}
                  <div className="w-full">
                    <h5 className="font-medium text-gray-800 mb-2 text-left flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Team Performance
                    </h5>
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Player Modal */}
      {showPlayerModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full h-[800px] overflow-y-auto flex flex-col relative">
            {/* Close button - absolute positioned */}
            <button
                              onClick={() => {
                  setShowPlayerModal(false);
                  setSelectedPlayer(null);
                  setPlayerLeagueData([]);
                  setPlayerProfile(null);
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
                <div className="space-y-4">
                  {leagueDataLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="text-center">
                        <LoadingSpinner size="md" className="mx-auto mb-2" />
                        <p className="text-gray-500">Loading league data...</p>
                      </div>
                    </div>
                  ) : leagueDataError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-600">{leagueDataError}</p>
                    </div>
                  ) : playerLeagueData.length > 0 ? (
                    <div className="space-y-4">
                      {/* Ranked TFT */}
                      {getRankedTftData() && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <div className="w-5 h-5 bg-amber-500 rounded-lg flex items-center justify-center">
                              <svg className="w-3 h-3 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            Ranked TFT
                            
                          </h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Award className="w-3 h-3 text-amber-600" />
                                <p className="text-xs text-gray-600">Rank</p>
                              </div>
                              <p className="font-bold text-gray-800 text-lg">{getRankedTftData()?.tier} {getRankedTftData()?.rank}</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Star className="w-3 h-3 text-yellow-600" fill="currentColor" />
                                <p className="text-xs text-gray-600">LP</p>
                              </div>
                              <p className="font-bold text-gray-800 text-lg">{getRankedTftData()?.leaguePoints}</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingUp className="w-3 h-3 text-green-600" />
                                <p className="text-xs text-gray-600">Wins</p>
                              </div>
                              <p className="font-bold text-gray-800 text-lg">{getRankedTftData()?.wins}</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingDown className="w-3 h-3 text-red-600" />
                                <p className="text-xs text-gray-600">Losses</p>
                              </div>
                              <p className="font-bold text-gray-800 text-lg">{getRankedTftData()?.losses}</p>
                            </div>
                          </div>
                          <div className="text-center mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Win Rate</p>
                                                          <p className="font-bold text-gray-800 text-xl">
                                {getRankedTftData() ? 
                                  `${((getRankedTftData()!.wins / (getRankedTftData()!.wins + getRankedTftData()!.losses)) * 100).toFixed(1)}%` : 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}

                      {/* Turbo TFT */}
                      {getTurboTftData() && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <div className="w-5 h-5 bg-purple-500 rounded-lg flex items-center justify-center">
                              <svg className="w-3 h-3 text-purple-900" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            Turbo TFT
                          </h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Award className="w-3 h-3 text-amber-600" />
                                <p className="text-xs text-gray-600">Tier</p>
                              </div>
                              <p className="font-bold text-gray-800 text-lg">{getTurboTftData()?.ratedTier}</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Star className="w-3 h-3 text-yellow-600" fill="currentColor" />
                                <p className="text-xs text-gray-600">Rating</p>
                              </div>
                              <p className="font-bold text-gray-800 text-lg">{getTurboTftData()?.ratedRating}</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingUp className="w-3 h-3 text-green-600" />
                                <p className="text-xs text-gray-600">Wins</p>
                              </div>
                              <p className="font-bold text-gray-800 text-lg">{getTurboTftData()?.wins}</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingDown className="w-3 h-3 text-red-600" />
                                <p className="text-xs text-gray-600">Losses</p>
                              </div>
                              <p className="font-bold text-gray-800 text-lg">{getTurboTftData()?.losses}</p>
                            </div>
                          </div>
                          <div className="text-center mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Win Rate</p>
                            <p className="font-bold text-gray-800 text-xl">
                              {getTurboTftData() ? 
                                `${((getTurboTftData()!.wins / (getTurboTftData()!.wins + getTurboTftData()!.losses)) * 100).toFixed(1)}%` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <p className="text-gray-600">No league data available</p>
                    </div>
                  )}

                  {/* Player ELO Chart */}
                  {playerStatsLoading ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-center items-center py-8">
                        <LoadingSpinner size="md" className="mx-auto mb-2" />
                        <p className="text-gray-500">Loading ELO progression...</p>
                      </div>
                    </div>
                  ) : playerStatsError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <p className="text-red-600">{playerStatsError}</p>
                    </div>
                  ) : playerStatsData.length > 0 ? (
                    <PlayerEloChart 
                      data={playerStatsData}
                      liveData={getRankedTftData()}
                      height={500}
                      className="w-full"
                    />
                  ) : null}
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
  const [profileIconUrl, setProfileIconUrl] = useState<string | null>(null)
  const [iconError, setIconError] = useState(false)
  const [loading, setLoading] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  const fetchProfileIcon = async () => {
    if (!iconId) {
      console.log('ProfileIcon: No iconId provided for', summonerName)
      setIconError(true)
      return
    }

    console.log('ProfileIcon: Fetching icon for', summonerName, 'with iconId:', iconId)
    setLoading(true)
    try {
      const version = await riotService.getCurrentVersion()
      const iconUrl = riotService.getProfileIconUrl(iconId, version)
      console.log('ProfileIcon: Generated URL for', summonerName, ':', iconUrl)
      setProfileIconUrl(iconUrl)
      setIconError(false)
    } catch (error) {
      console.error('Error fetching profile icon:', error)
      setIconError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (iconId && !iconError) {
      fetchProfileIcon()
    }
  }, [iconId])

  // If we have a valid icon URL and no error, show the actual icon
  if (profileIconUrl && !iconError && !loading) {
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