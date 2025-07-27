import { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { fetchMatchHistory, type MatchHistoryEntry, TIER_COLORS, getTraitBreakpointInfo, decodeHtmlEntities } from '../services/tftService';
import { useAuth } from '../contexts/AuthContext';
import { useTFT } from '../contexts/TFTContext';
import { userService } from '../services/userService';

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMatch: (matchId: string) => void;
}

export function MatchHistoryModal({ isOpen, onClose, onSelectMatch }: MatchHistoryModalProps) {
  const { userId } = useAuth();
  const { champions, version, traits, detailedTraitData, championImageMappings } = useTFT();
  const [matches, setMatches] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTrait, setHoveredTrait] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadMatchHistory();
    }
  }, [isOpen, userId]);

  const loadMatchHistory = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Get user's riot account
      const account = await userService.getUserRiotAccount(userId);
      if (!account) {
        setError('No Riot account connected. Please connect your Riot account first.');
        setLoading(false);
        return;
      }

      // Fetch match history
      const matchHistory = await fetchMatchHistory(account.riot_id, account.region);
      setMatches(matchHistory);
    } catch (err) {
      console.error('Error loading match history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load match history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const formatGameLength = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPlacementColor = (placement: number) => {
    if (placement === 1) return 'text-yellow-600 bg-yellow-100';
    if (placement === 2) return 'text-gray-600 bg-gray-100';
    if (placement === 3) return 'text-orange-600 bg-orange-100';
    if (placement <= 4) return 'text-blue-600 bg-blue-100';
    return 'text-red-600 bg-red-100';
  };

  const getPlacementText = (placement: number) => {
    if (placement === 1) return '1st';
    if (placement === 2) return '2nd';
    if (placement === 3) return '3rd';
    return `${placement}th`;
  };

  const getChampionIconUrl = (championName: string) => {
    // First, try to find the champion in our champions data
    const tftChampionKey = Object.keys(champions).find(key => 
      key.includes(`TFT14_${championName}`) || 
      champions[key].name.toLowerCase() === championName.toLowerCase()
    );
    
    if (tftChampionKey) {
      const championData = champions[tftChampionKey];
      return `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-champion/${championData.image.full}`;
    }
    
    // Fallback to the mappings if champion not found
    const mappedFilename = championImageMappings[championName];
    if (mappedFilename) {
      return `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-champion/${mappedFilename}`;
    }
    
    // Final fallback to the original logic if no mapping found
    const tftChampionName = `TFT14_${championName}`;
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-champion/${tftChampionName}.TFT_Set14.png`;
  };

  const getChampionTier = (championName: string): number => {
    // Look for the champion in the champions data with TFT14_ prefix
    const tftChampionKey = Object.keys(champions).find(key => 
      key.includes(`TFT14_${championName}`) || 
      champions[key].name.toLowerCase() === championName.toLowerCase()
    );
    
    if (tftChampionKey) {
      return champions[tftChampionKey].tier;
    }
    
    return 1; // Default to 1-cost if not found
  };

  const getTierBorderColor = (tier: number): string => {
    return TIER_COLORS[tier as keyof typeof TIER_COLORS] || 'border-gray-400';
  };

  const getTraitDisplayInfo = (traitName: string) => {
    // Clean the trait name - remove any suffixes like _1, _2, etc.
    const cleanTraitName = traitName.replace(/_\d+$/, '');
    const breakpoint = traitName.match(/_(\d+)$/)?.[1] || '';
    
    // Get breakpoint information from detailed trait data
    const breakpointInfo = getTraitBreakpointInfo(cleanTraitName, breakpoint, detailedTraitData || []);
    
    // Manual mapping for common trait names
    const traitMapping: { [key: string]: string } = {
      'Armorclad': 'TFT14_Armorclad',
      'Strong': 'TFT14_Strong', 
      'Cutter': 'TFT14_Cutter',
      'Marksman': 'TFT14_Marksman',
      'Techie': 'TFT14_Techie',
      'Controller': 'TFT14_Controller',
      'Supercharge': 'TFT14_Supercharge',
      'Immortal': 'TFT14_Immortal',
      'Assassin': 'TFTTutorial_Assassin',
      'Mage': 'TFTTutorial_Sorcerer',
      'Vanguard': 'TFTTutorial_Brawler'
    };
    
    // Try manual mapping first
    const mappedTraitKey = traitMapping[cleanTraitName];
    if (mappedTraitKey && traits[mappedTraitKey]) {
      const traitData = traits[mappedTraitKey];
      const iconUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-trait/${traitData.image.full}`;
      const displayName = breakpointInfo.levelName || `${traitData.name} ${breakpoint}`;
      return { 
        iconUrl, 
        displayName,
        unitsRequired: breakpointInfo.unitsRequired,
        description: breakpointInfo.description
      };
    }
    
    // Try multiple matching strategies
    let traitKey = null;
    
    // Strategy 1: Direct name match
    traitKey = Object.keys(traits).find(key => 
      traits[key].name.toLowerCase() === cleanTraitName.toLowerCase()
    );
    
    // Strategy 2: Key contains the trait name
    if (!traitKey) {
      traitKey = Object.keys(traits).find(key => 
        key.toLowerCase().includes(cleanTraitName.toLowerCase())
      );
    }
    
    // Strategy 3: Name contains the trait name
    if (!traitKey) {
      traitKey = Object.keys(traits).find(key => 
        traits[key].name.toLowerCase().includes(cleanTraitName.toLowerCase())
      );
    }
    
    if (traitKey) {
      const traitData = traits[traitKey];
      const iconUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-trait/${traitData.image.full}`;
      const displayName = breakpointInfo.levelName || `${traitData.name} ${breakpoint}`;
      return { 
        iconUrl, 
        displayName,
        unitsRequired: breakpointInfo.unitsRequired,
        description: breakpointInfo.description
      };
    }
    
    // Fallback to original name with breakpoint
    const fallbackIconUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-trait/Trait_Icon_Assassin.png`;
    const fallbackDisplayName = breakpointInfo.levelName || `${cleanTraitName} ${breakpoint}`;
    return { 
      iconUrl: fallbackIconUrl, 
      displayName: fallbackDisplayName,
      unitsRequired: breakpointInfo.unitsRequired,
      description: breakpointInfo.description
    };
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Load Game from Match History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your match history...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error}</p>
              {error.includes('No Riot account connected') && (
                <div className="mt-3">
                  <p className="text-sm text-red-600 mb-2">To use this feature, you need to:</p>
                  <ol className="text-sm text-red-600 list-decimal list-inside space-y-1">
                    <li>Log in to your account</li>
                    <li>Connect your Riot account in your profile settings</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {!loading && !error && matches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No recent matches found.</p>
            </div>
          )}

          {!loading && !error && matches.length > 0 && (
            <div className="space-y-4">
                             {matches.map((match) => (
                <div 
                  key={match.matchId}
                  className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onSelectMatch(match.matchId)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getPlacementColor(match.placement)}`}>
                        {getPlacementText(match.placement)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(match.gameCreation)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock size={14} />
                        {formatGameLength(match.gameLength)}
                      </div>
                    </div>
                  </div>

                  {/* Champions */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    {match.champions.map((champion, champIndex) => {
                      const tier = getChampionTier(champion.name);
                      const borderColor = getTierBorderColor(tier);
                      return (
                        <div key={champIndex} className="flex flex-col items-center relative">
                          <div className="relative">
                            {/* Star overlay above portrait */}
                            {champion.stars > 1 && (
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 flex flex-row gap-0.5 mb-1">
                                {Array.from({ length: champion.stars }, (_, starIndex) => (
                                  <svg key={starIndex} className="w-4 h-4 text-yellow-400 fill-current stroke-black stroke-1" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                  </svg>
                                ))}
                              </div>
                            )}
                            <img
                              src={getChampionIconUrl(champion.name)}
                              alt={champion.name}
                              className={`w-16 h-16 rounded-lg border-2 ${borderColor} object-cover`}
                              onError={(e) => {
                                // Fallback to text if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = document.createElement('div');
                                fallback.className = `w-16 h-16 rounded-lg border-2 ${borderColor} bg-gray-200 flex items-center justify-center text-xs text-gray-600`;
                                fallback.textContent = champion.name;
                                target.parentNode?.appendChild(fallback);
                              }}
                            />
                            {/* Items overlay */}
                            {champion.items.length > 0 && (
                              <div className="absolute left-0 bottom-0 w-16 flex flex-row justify-center items-end z-10 translate-y-1/2">
                                {champion.items.map((item, itemIndex) => {
                                  const itemIconUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-item/${item}.png`;
                                  return (
                                    <img
                                      key={itemIndex}
                                      src={itemIconUrl}
                                      alt={item.replace('TFT_Item_', '').replace(/([A-Z])/g, ' $1').trim()}
                                      className="w-[20px] h-[20px] rounded object-cover mx-[1px]"
                                      style={{ boxSizing: 'border-box' }}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const fallback = document.createElement('div');
                                        fallback.className = 'w-[20px] h-[20px] rounded bg-gray-300 flex items-center justify-center text-xs text-gray-600';
                                        fallback.textContent = item.replace('TFT_Item_', '').replace(/([A-Z])/g, ' $1').trim();
                                        target.parentNode?.appendChild(fallback);
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-600 mt-3 text-center max-w-16 truncate">
                            {champion.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Traits */}
                  {match.traits.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {match.traits.map((trait, traitIndex) => {
                          const traitInfo = getTraitDisplayInfo(trait.name);
                          return (
                            <div 
                              key={traitIndex} 
                              className="flex items-center gap-2 bg-black border border-white px-3 py-1 rounded-full text-white text-xs font-medium cursor-help relative"
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const tooltipText = traitInfo.description ? 
                                  decodeHtmlEntities(traitInfo.description) : 
                                  `${traitInfo.displayName} (${traitInfo.unitsRequired} units required)`;
                                setHoveredTrait({
                                  text: tooltipText,
                                  x: rect.left + rect.width / 2,
                                  y: rect.top - 10
                                });
                              }}
                              onMouseLeave={() => setHoveredTrait(null)}
                            >
                              <img 
                                src={traitInfo.iconUrl}
                                alt={traitInfo.displayName}
                                className="w-4 h-4 brightness-0 invert"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                              <span>{traitInfo.displayName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
                      )}
          </div>
        </div>
        
        {/* Custom Tooltip */}
        {hoveredTrait && (
          <div 
            className="fixed z-[9999] px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-xs"
            style={{
              left: hoveredTrait.x,
              top: hoveredTrait.y,
              transform: 'translateX(-50%) translateY(-100%)',
              pointerEvents: 'none'
            }}
          >
            <div className="whitespace-normal">{hoveredTrait.text}</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );
  } 