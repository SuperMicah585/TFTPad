import { useState, useEffect, useMemo } from 'react';
import { useTFT } from '../contexts/TFTContext';
import { TIER_COLORS, getTraitBreakpointInfo, decodeHtmlEntities } from '../services/tftService';
import { HelpCircle } from 'lucide-react';

interface CompWithContest {
    comp: any; // Using any to match the actual TFTComp type
    contestRate: number;
    score: number;
    placementStats?: {
        totalGames: number;
        avgPlacement: number;
        top4Rate: number;
        top1Rate: number;
        placementPercentages: number[];
    };
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

// Custom Rank Dropdown Component
function RankDropdown({ selectedRank, onRankChange, rankOptions }: { 
    selectedRank: string; 
    onRankChange: (rank: string) => void; 
    rankOptions: string[]; 
}) {
    const [isOpen, setIsOpen] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.rank-dropdown')) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative rank-dropdown">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white border-2 border-gray-300 text-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 hover:border-gray-400 transition-colors font-medium text-sm min-w-44 flex items-center justify-between shadow-lg"
            >
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <img 
                            src={getRankIconUrl(selectedRank)} 
                            alt={selectedRank}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                // Create fallback text
                                const fallback = document.createElement('div');
                                fallback.className = 'w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-xs text-gray-600 font-bold';
                                fallback.textContent = selectedRank.charAt(0).toUpperCase();
                                target.parentNode?.appendChild(fallback);
                            }}
                        />
                    </div>
                    <span className="truncate">{selectedRank.charAt(0).toUpperCase() + selectedRank.slice(1)}</span>
                </div>
                <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-300 rounded-lg z-50 max-h-60 overflow-y-auto shadow-xl min-w-44">
                    {rankOptions.map(rank => (
                        <button
                            key={rank}
                            onClick={() => {
                                onRankChange(rank);
                                setIsOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-gray-800 hover:bg-gray-100 flex items-center gap-2 border-b border-gray-200 last:border-b-0 transition-colors"
                            style={{ backgroundColor: rank === selectedRank ? '#f3f4f6' : '#ffffff' }}
                        >
                            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                                <img 
                                    src={getRankIconUrl(rank)} 
                                    alt={rank}
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        // Create fallback text
                                        const fallback = document.createElement('div');
                                        fallback.className = 'w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-xs text-gray-600 font-bold';
                                        fallback.textContent = rank.charAt(0).toUpperCase();
                                        target.parentNode?.appendChild(fallback);
                                    }}
                                />
                            </div>
                            <span className="truncate text-sm">{rank.charAt(0).toUpperCase() + rank.slice(1)}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Placement Distribution Graph Component
function PlacementDistributionGraph({ placementPercentages }: { placementPercentages: number[] }) {
    const maxPercentage = Math.max(...placementPercentages);
    
    return (
        <div className="flex flex-col items-end space-y-2 bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="text-xs text-gray-600 font-medium mb-2 w-full text-center">Placement Distribution</div>
            <div className="flex items-end space-x-1 h-24 w-full">
                {placementPercentages.map((percentage, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                        <div className="text-xs text-gray-500 mb-1 h-4 flex items-center">
                            {percentage.toFixed(1)}%
                        </div>
                        <div 
                            className="w-full max-w-4 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t border border-blue-500"
                            style={{ 
                                height: `${(percentage / maxPercentage) * 60}px`,
                                minHeight: '3px'
                            }}
                            title={`${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} place: ${percentage.toFixed(1)}%`}
                        />
                        <div className="text-xs text-gray-500 mt-2 font-medium">
                            {index + 1}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Placeholder component for loading state
function PlacementDistributionPlaceholder() {
    return (
        <div className="flex flex-col items-end space-y-2 bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="text-xs text-gray-600 font-medium mb-2 w-full text-center">Placement Distribution</div>
            <div className="flex items-end space-x-1 h-24 w-full">
                {Array.from({ length: 8 }, (_, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                        <div className="text-xs text-gray-400 mb-1 h-4 flex items-center">
                            --
                        </div>
                        <div 
                            className="w-full max-w-4 bg-gray-300 rounded-t border border-gray-400 animate-pulse"
                            style={{ 
                                height: '20px',
                                minHeight: '3px'
                            }}
                        />
                        <div className="text-xs text-gray-400 mt-2 font-medium">
                            {index + 1}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function CompsHolder() {
    const { 
        comps, 
        selectedUnits, 
        version, 
        loading, 
        champions, 
        championImageMappings,
        traits,
        detailedTraitData,
        rankCompsData,
        selectedRank,
        setSelectedRank,
        rankLoading,
        rankError,
        playerStars
    } = useTFT();
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredTrait, setHoveredTrait] = useState<{ text: string; x: number; y: number } | null>(null);
    const [hoveredStar, setHoveredStar] = useState<{ x: number; y: number } | null>(null);
    
    // Load weights from localStorage or use defaults
    const [weights, setWeights] = useState(() => {
        const savedContestRate = localStorage.getItem('tft-contest-weight');
        const savedPlacement = localStorage.getItem('tft-placement-weight');
        const savedItemizedWeight = localStorage.getItem('tft-itemized-weight');
        
        return {
            contestRate: savedContestRate ? parseInt(savedContestRate) : 60,
            placement: savedPlacement ? parseInt(savedPlacement) : 40,
            itemizedWeight: savedItemizedWeight ? parseInt(savedItemizedWeight) : 150
        };
    });

    // Save weights to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('tft-contest-weight', weights.contestRate.toString());
    }, [weights.contestRate]);

    useEffect(() => {
        localStorage.setItem('tft-placement-weight', weights.placement.toString());
    }, [weights.placement]);

    useEffect(() => {
        localStorage.setItem('tft-itemized-weight', weights.itemizedWeight.toString());
    }, [weights.itemizedWeight]);

    const rankOptions = [
        'iron+', 'bronze+', 'silver+', 'gold+', 'platinum+', 'emerald+', 'diamond+', 'master+', 'grandmaster+', 'challenger'
    ];

    // Get the current rank data from context
    const currentRankData = rankCompsData[selectedRank];
    
    // Determine which comps to display - use rank-based comps if available, otherwise fall back to default comps
    const displayComps = currentRankData?.mergedData?.map(item => ({
        ...item.comp,
        placementStats: item.placementStats
    })) || comps;

    // Calculate contest rates based on units selected in Game tab
    const unitContestRates = useMemo(() => {
        console.log('Comps tab - Recalculating unitContestRates');
        console.log('Comps tab - selectedUnits:', selectedUnits);
        console.log('Comps tab - playerStars:', playerStars);
        
        const unitCounts: { [unitName: string]: number } = {};
        const totalPlayers = 8;
        Object.entries(selectedUnits).forEach(([playerId, playerUnits]) => {
            if (playerUnits) {
                const currentPlayerStars = playerStars[parseInt(playerId)] || [];
                console.log(`Comps tab - Player ${playerId} stars:`, currentPlayerStars);
                // Debug: Check if Nidalee is in the stars array
                const nidaleeInStars = currentPlayerStars.find(star => star.toLowerCase().includes('nidalee'));
                if (nidaleeInStars) {
                    console.log(`DEBUG NIDALEE STARS: Found Nidalee in stars: "${nidaleeInStars}"`);
                }
                playerUnits.forEach(unit => {
                    if (unit) {
                        const isStarred = currentPlayerStars.includes(unit.name);
                        const weight = isStarred ? 3 : 1;
                        // Normalize unit name to match Comps tab display (remove TFT14_ prefix and trim)
                        let normalizedUnitName = unit.name.replace(/^TFT14_/, '').toLowerCase().trim();
                        
                        // Handle special case for Nidalee/NidaleeCougar mismatch
                        if (normalizedUnitName === 'nidalee') {
                            normalizedUnitName = 'nidaleecougar';
                        }
                        unitCounts[normalizedUnitName] = (unitCounts[normalizedUnitName] || 0) + weight;
                        console.log(`Comps tab - Unit ${unit.name} (normalized: ${normalizedUnitName}) from player ${playerId}: isStarred=${isStarred}, weight=${weight}, total count=${unitCounts[normalizedUnitName]}`);
                        // Debug: Log all unit names to see what's being stored
                        if (unit.name.toLowerCase().includes('nidalee')) {
                            console.log(`DEBUG NIDALEE: Original name: "${unit.name}", Normalized: "${normalizedUnitName}"`);
                        }
                    }
                });
            }
        });
        const contestRates: { [unitName: string]: number } = {};
        Object.entries(unitCounts).forEach(([unitName, count]) => {
            contestRates[unitName] = Math.round((count / totalPlayers) * 100 * 10) / 10;
            console.log(`Comps tab - Final contest rate for ${unitName}: ${count}/${totalPlayers} = ${contestRates[unitName]}%`);
        });
        console.log('Comps tab - Final unitContestRates:', contestRates);
        return contestRates;
    }, [selectedUnits, playerStars]);

    // Calculate comps with contest scores and apply search filter
    const filteredComps = useMemo(() => {
        if (displayComps.length === 0) return [];

        // Calculate contest scores for each comp
        const compsWithContest: CompWithContest[] = displayComps.map(comp => {
            const uncontestedUnits: string[] = [];
            let totalContestScore = 0;
            let unitCount = 0;
            
            comp.units.forEach((unit: string) => {
                // Normalize unit name for better matching - remove TFT14_ prefix if present
                const normalizedUnitName = unit.replace(/^TFT14_/, '').toLowerCase().trim();
                const contestRate = unitContestRates[normalizedUnitName] || 0;
                
                // Debug: Log unit and contest rate
                console.log(`Unit: ${unit}, Normalized: ${normalizedUnitName}, Contest Rate: ${contestRate}%`);
                // Debug: Log Nidalee specifically
                if (unit.toLowerCase().includes('nidalee')) {
                    console.log(`DEBUG NIDALEE COMP: Unit: "${unit}", Normalized: "${normalizedUnitName}", Contest Rate: ${contestRate}%`);
                }
                
                // Add to contest score (for display purposes)
                totalContestScore += contestRate;
                unitCount++;
                
                if (contestRate <= 12.5) { // Mark units with <=12.5% contest rate (1 player or less) as "uncontested"
                    uncontestedUnits.push(unit);
                }
            });
            
            const averageContestScore = unitCount > 0 ? totalContestScore / unitCount : 0;
            
            // Calculate itemized penalty separately
            let itemizedPenalty = 0;
            comp.units.forEach((unit: string) => {
                const contestRate = unitContestRates[unit.replace(/^TFT14_/, '').toLowerCase().trim()] || 0;
                const unitBuild = comp.builds.find((build: any) => build.unit === unit);
                const isItemized = unitBuild && unitBuild.num_items > 0;
                
                if (isItemized) {
                    // New formula: 100% = base penalty, 150% = 50% extra penalty, 200% = double penalty
                    itemizedPenalty += contestRate * (weights.itemizedWeight / 100);
                }
            });
            
            // Use placement stats if available, otherwise fall back to comp's default placement
            const placementScore = comp.placementStats?.avgPlacement || comp.avgPlacement;
            
            // Normalize values to similar scales (0-100 range)
            const normalizedContestScore = averageContestScore; // Already 0-100
            const normalizedPlacementScore = (placementScore - 1) * 14.29;
            
            // Combined score: use user-defined weights and add itemized penalty
            const combinedScore = (normalizedContestScore * (weights.contestRate / 100)) + (normalizedPlacementScore * (weights.placement / 100)) + itemizedPenalty;
            
            return {
                comp: {
                    ...comp,
                    uncontestedUnits
                },
                contestRate: Math.round(averageContestScore * 10) / 10,
                score: Math.round(combinedScore * 10) / 10,
                placementStats: comp.placementStats
            };
        });
        
        // Sort by combined score (lower is better)
        compsWithContest.sort((a, b) => a.score - b.score);

        // Apply search filter if search term exists
        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            return compsWithContest.filter(compWithContest => 
                compWithContest.comp.name.toLowerCase().includes(query) ||
                compWithContest.comp.units.some((unit: string) => unit.toLowerCase().includes(query))
            );
        }

        return compsWithContest;
    }, [displayComps, unitContestRates, weights.contestRate, weights.placement, weights.itemizedWeight, searchTerm]);

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

    const isValidTFT14Champion = (championName: string): boolean => {
        // Exclude special units that are not playable champions
        const excludedUnits = [
            'SummonLevel2',
            'SummonLevel4',
        ];
        
        if (excludedUnits.includes(championName)) {
            return false;
        }
        
        // Check if the champion exists in our TFT14_ data
        const tftChampionKey = Object.keys(champions).find(key => 
            key.includes(`TFT14_${championName}`) || 
            champions[key].name.toLowerCase() === championName.toLowerCase()
        );
        
        if (!tftChampionKey) return false;
        
        // Double-check that it's actually a TFT14_ champion
        const championData = champions[tftChampionKey];
        return championData.id.startsWith('TFT14_');
    };

    const getTraitDisplayInfo = (traitName: string) => {
        // Clean the trait name - remove any suffixes like _1, _2, etc.
        const cleanTraitName = traitName.replace(/_\d+$/, '');
        const breakpoint = traitName.match(/_(\d+)$/)?.[1] || '';
        
        // Get breakpoint information from detailed trait data
        const breakpointInfo = getTraitBreakpointInfo(cleanTraitName, breakpoint, detailedTraitData);
        
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-600 text-xl">Loading comps...</div>
            </div>
        );
    }

    return (
        <div className="relative w-full p-4">
            {/* Tab content */}
            <div className="relative z-20">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-gray-800">Comps</h2>
                            <div className="relative group">
                                <HelpCircle 
                                    size={20} 
                                    className="text-gray-500 hover:text-gray-700 cursor-help transition-colors" 
                                    onMouseEnter={(e) => {
                                        const iconRect = e.currentTarget.getBoundingClientRect();
                                        const popup = e.currentTarget.parentElement?.querySelector('.popup') as HTMLElement;
                                        
                                        if (popup && iconRect) {
                                            const viewportHeight = window.innerHeight;
                                            const viewportWidth = window.innerWidth;
                                            const popupHeight = 200; // Approximate height
                                            const popupWidth = 500;
                                            
                                            const spaceAbove = iconRect.top;
                                            const spaceBelow = viewportHeight - iconRect.bottom;
                                            const spaceLeft = iconRect.left;
                                            const spaceRight = viewportWidth - iconRect.right;
                                            
                                            // Adjust horizontal positioning to prevent cutoff
                                            if (spaceLeft < popupWidth / 2) {
                                                // Not enough space on left, align to left edge
                                                popup.style.left = '0';
                                                popup.style.transform = 'translateX(0)';
                                            } else if (spaceRight < popupWidth / 2) {
                                                // Not enough space on right, align to right edge
                                                popup.style.left = 'auto';
                                                popup.style.right = '0';
                                                popup.style.transform = 'none';
                                            } else {
                                                // Center the popup
                                                popup.style.left = '50%';
                                                popup.style.right = 'auto';
                                                popup.style.transform = 'translateX(-50%)';
                                            }
                                            
                                            // Adjust vertical positioning - prioritize below
                                            if (spaceBelow >= popupHeight + 8) {
                                                // Position below (preferred)
                                                popup.style.top = 'calc(100% + 8px)';
                                                popup.style.bottom = 'auto';
                                                popup.querySelector('.arrow')?.classList.add('rotate-180');
                                            } else if (spaceAbove >= popupHeight + 8) {
                                                // Position above if no space below
                                                popup.style.bottom = 'calc(100% + 8px)';
                                                popup.style.top = 'auto';
                                                popup.querySelector('.arrow')?.classList.remove('rotate-180');
                                            } else {
                                                // Not enough space, position below but allow scrolling
                                                popup.style.top = 'calc(100% + 8px)';
                                                popup.style.bottom = 'auto';
                                                popup.querySelector('.arrow')?.classList.add('rotate-180');
                                            }
                                        }
                                    }}
                                />
                                <div 
                                    className="popup absolute px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50"
                                    style={{
                                        width: '500px',
                                        whiteSpace: 'normal',
                                        left: '-9999px',
                                        transform: 'none'
                                    }}
                                >
                                    <div>
                                        <div className="font-semibold mb-2 text-left">Comp Ordering & Scoring:</div>
                                        <div className="text-xs mb-2">
                                            <span className="text-blue-400 font-medium">Comps are ordered by best score</span> based on the weights you can adjust below. The score combines contest rate and average placement. Lower scores = better comps.
                                        </div>
                                        <div className="font-semibold mb-2 text-left">Red Borders:</div>
                                        <div className="text-xs mb-2">
                                            Units with <span className="text-red-400 font-medium">red borders</span> are contested. This means more than 3 copies of this unit will be contested in your lobby. Hover over red-bordered units for details.
                                        </div>

                                    </div>
                                    <div className="arrow absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 transition-transform duration-200"></div>
                                </div>
                            </div>
                        </div>
                        {/* Rank Dropdown */}
                        <div className="flex items-center gap-3">
                            <label className="text-gray-700 font-medium text-sm">Rank Filter:</label>
                            <RankDropdown
                                selectedRank={selectedRank}
                                onRankChange={setSelectedRank}
                                rankOptions={rankOptions}
                            />
                        </div>
                    </div>
                    {/* Show loading/error for rank fetch */}
                    <div className="h-6 mb-2">
                        {rankLoading && <div className="text-yellow-600">Loading comps for {selectedRank}...</div>}
                        {rankError && <div className="text-red-600">{rankError}</div>}
                    </div>
                    
                    {/* Weight Controls */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-gray-800 font-medium mb-3">Scoring Weights</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-600 text-sm mb-2">
                                    Contest Rate Weight: {weights.contestRate}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={weights.contestRate}
                                    onChange={(e) => {
                                        const newContestRate = parseInt(e.target.value);
                                        setWeights({
                                            ...weights,
                                            contestRate: newContestRate,
                                            placement: 100 - newContestRate
                                        });
                                    }}
                                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm mb-2">
                                    Placement Weight: {weights.placement}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={weights.placement}
                                    onChange={(e) => {
                                        const newPlacement = parseInt(e.target.value);
                                        setWeights({
                                            ...weights,
                                            placement: newPlacement,
                                            contestRate: 100 - newPlacement
                                        });
                                    }}
                                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-gray-600 text-sm mb-2">
                                Itemized Unit Weight: {weights.itemizedWeight}%
                            </label>
                            <input
                                type="range"
                                min="100"
                                max="200"
                                value={weights.itemizedWeight}
                                onChange={(e) => setWeights({
                                    ...weights,
                                    itemizedWeight: parseInt(e.target.value)
                                })}
                                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <p className="text-gray-500 text-xs mt-1">
                                100% = base penalty, 150% = 50% extra penalty, 200% = double penalty
                            </p>
                        </div>
                        <p className="text-gray-500 text-xs mt-2">
                            Adjust how much contest rate vs placement affects comp rankings
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                    <h3 className="text-gray-800 font-medium mb-2">Search Comps</h3>
                    <input
                        type="text"
                        placeholder="Search comps or units..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Comps List */}
                <div className="space-y-3">
                    {filteredComps.length > 0 ? (
                        filteredComps.map((compWithContest) => (
                            <div
                                key={compWithContest.comp.id}
                                className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-gray-800 font-semibold text-lg">{compWithContest.comp.name}</h3>
                                    <div className="flex gap-2 text-sm">
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                            {compWithContest.score.toFixed(1)} score
                                        </span>
                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                                            {compWithContest.contestRate.toFixed(1)}% contested
                                        </span>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {compWithContest.placementStats?.avgPlacement?.toFixed(2) || compWithContest.comp.avgPlacement.toFixed(1)} avg
                                        </span>
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                            {compWithContest.placementStats?.totalGames?.toLocaleString() || compWithContest.comp.playCount.toLocaleString()} games
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-6">
                                    {/* Left side - Units */}
                                    <div className="flex-1">
                                        {/* Main Units Section */}
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {compWithContest.comp.units
                                                    .filter((unit: string) => isValidTFT14Champion(unit))
                                                    .sort((a: string, b: string) => getChampionTier(a) - getChampionTier(b))
                                                    .map((unit: string, index: number) => {
                                                        const tier = getChampionTier(unit);
                                                        const baseBorderColor = getTierBorderColor(tier);
                                                        const unitBuild = compWithContest.comp.builds.find((build: any) => build.unit === unit);
                                                        // Check if this unit is in the stars array (with TFT14_ prefix)
                                                        const isStarred = compWithContest.comp.stars.includes(`TFT14_${unit}`);
                                                        
                                                        // Determine border color based on contest status
                                                        let borderColor = baseBorderColor;
                                                        // Check if unit is contested (has contest rate > 12.5%)
                                                        const normalizedUnitName = unit.replace(/^TFT14_/, '').toLowerCase().trim();
                                                        console.log(`Comps tab - Original unit name: "${unit}", Normalized: "${normalizedUnitName}"`);
                                                        const contestRate = unitContestRates[normalizedUnitName] || 0;
                                                        console.log(`Comps tab - Unit: ${unit}, Normalized: ${normalizedUnitName}, Contest Rate: ${contestRate}%, Should be red: ${contestRate > 12.5}`);
                                                        if (contestRate > 12.5) {
                                                            borderColor = 'border-red-500 border-4 shadow-lg';
                                                        }
                                                        
                                                        return (
                                                            <div key={index} className="flex flex-col items-center relative">
                                                                <div className="relative">
                                                                    <img
                                                                        src={getChampionIconUrl(unit)}
                                                                        alt={unit}
                                                                        className={`w-16 h-16 rounded-lg border-2 ${borderColor}`}
                                                                        onMouseEnter={(e) => {
                                                                            if (borderColor.includes('border-red-500')) {
                                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                                setHoveredStar({
                                                                                    x: rect.left + rect.width / 2,
                                                                                    y: rect.top - 10
                                                                                });
                                                                            }
                                                                        }}
                                                                        onMouseLeave={() => {
                                                                            if (borderColor.includes('border-red-500')) {
                                                                                setHoveredStar(null);
                                                                            }
                                                                        }}
                                                                        onError={(e) => {
                                                                            // Fallback to text if image fails to load
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.style.display = 'none';
                                                                            const fallback = document.createElement('div');
                                                                            fallback.className = `w-16 h-16 rounded-lg border-2 ${borderColor} bg-gray-200 flex items-center justify-center text-xs text-gray-600`;
                                                                            fallback.textContent = unit;
                                                                            target.parentNode?.appendChild(fallback);
                                                                        }}
                                                                    />
                                                                    {isStarred && (
                                                                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 flex flex-row gap-0.5">
                                                                            <svg className="w-4 h-4 text-yellow-400 fill-current stroke-black stroke-1" viewBox="0 0 24 24">
                                                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                                            </svg>
                                                                            <svg className="w-4 h-4 text-yellow-400 fill-current stroke-black stroke-1" viewBox="0 0 24 24">
                                                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                                            </svg>
                                                                            <svg className="w-4 h-4 text-yellow-400 fill-current stroke-black stroke-1" viewBox="0 0 24 24">
                                                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                    {unitBuild && unitBuild.num_items > 0 && (
                                                                        <div className="absolute left-0 bottom-0 w-16 flex flex-row justify-center items-end z-10 translate-y-1/2">
                                                                            {unitBuild.buildName.map((item: string, itemIndex: number) => {
                                                                                const itemIconUrl = `https://ddragon.leagueoflegends.com/cdn/15.12.1/img/tft-item/${item}.png`;
                                                                                return (
                                                                                    <img
                                                                                        key={itemIndex}
                                                                                        src={itemIconUrl}
                                                                                        alt={item.replace('TFT_Item_', '').replace(/([A-Z])/g, ' $1').trim()}
                                                                                        className="w-[21px] h-[21px] rounded object-cover mx-[1px]"
                                                                                        style={{ boxSizing: 'border-box' }}
                                                                                        onError={(e) => {
                                                                                            const target = e.target as HTMLImageElement;
                                                                                            target.style.display = 'none';
                                                                                            const fallback = document.createElement('div');
                                                                                            fallback.className = 'w-[21px] h-[21px] rounded bg-gray-300 flex items-center justify-center text-xs text-gray-600';
                                                                                            fallback.textContent = item.replace('TFT_Item_', '').replace(/([A-Z])/g, ' $1').trim();
                                                                                            target.parentNode?.appendChild(fallback);
                                                                                        }}
                                                                                    />
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs mt-5 text-center max-w-16 truncate text-black">
                                                                    {unit}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                        
                                        {/* Traits Section */}
                                        {compWithContest.comp.traits && compWithContest.comp.traits.length > 0 && (
                                            <div className="mb-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {compWithContest.comp.traits.map((trait: string, index: number) => {
                                                        const traitInfo = getTraitDisplayInfo(trait);
                                                        return (
                                                            <div 
                                                                key={index} 
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
                                    
                                    {/* Right side - Placement Distribution Graph */}
                                    <div className="flex-shrink-0">
                                        {rankLoading ? (
                                            <PlacementDistributionPlaceholder />
                                        ) : (
                                            compWithContest.placementStats && compWithContest.placementStats.placementPercentages.length > 0 && (
                                                <PlacementDistributionGraph 
                                                    placementPercentages={compWithContest.placementStats.placementPercentages} 
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                                
                                {/* Bottom corners - Difficulty and Levelling */}
                                <div className="flex justify-between items-center text-xs text-gray-500 mt-3">
                                    <span>Difficulty: {compWithContest.comp.difficulty}</span>
                                    <span>Levelling: {compWithContest.comp.levelling}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">
                                {searchTerm ? `No comps found matching "${searchTerm}"` : 'No comps available.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Stats */}
                {filteredComps.length > 0 && (
                    <div className="mt-6 text-gray-500 text-sm">
                        <div className="flex flex-wrap gap-4 items-center">
                            <span>Showing {filteredComps.length} of {displayComps.length} comps</span>
                            {currentRankData && (
                                <>
                                    <span className="text-yellow-600">(Rank: {selectedRank})</span>
                                    <span>Total games: {currentRankData.totalGames.toLocaleString()}</span>
                                    <span>Sample size: {currentRankData.sampleSize.toLocaleString()}</span>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Custom Tooltip */}
            {hoveredTrait && (
                <div 
                    className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-xs"
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
            
            {/* Star Tooltip */}
            {hoveredStar && (
                <div 
                    className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-xs"
                    style={{
                        left: hoveredStar.x,
                        top: hoveredStar.y,
                        transform: 'translateX(-50%) translateY(-100%)',
                        pointerEvents: 'none'
                    }}
                >
                    <div className="whitespace-normal">
                        <div className="font-semibold mb-1">Contested Unit</div>
                        <div>More than 3 copies will be contested.</div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            )}
        </div>
    );
} 