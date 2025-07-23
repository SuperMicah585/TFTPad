import { useState, useEffect } from 'react';
import { useTFT } from '../contexts/TFTContext';
import { TIER_COLORS, type UnitContestData } from '../services/tftService';
import { HelpCircle, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

// Tier pool data
const TIER_POOLS = {
    1: { copies: 30, champions: 13, total: 390 },
    2: { copies: 25, champions: 13, total: 325 },
    3: { copies: 18, champions: 13, total: 234 },
    4: { copies: 10, champions: 13, total: 130 },
    5: { copies: 9, champions: 8, total: 72 }
};

export function UnitsHolder() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { champions, championImageMappings, version, loading, getUnitContestRates, selectedUnits, playerStars } = useTFT();
    const [unitsData, setUnitsData] = useState<UnitContestData[]>([]);
    const [filteredUnits, setFilteredUnits] = useState<UnitContestData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearchTerm, setActiveSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'contest' | 'name' | 'tier'>('contest');
    const [showDescription] = useState(false);

    // Initialize search from URL on component mount
    useEffect(() => {
        const urlQuery = searchParams.get('q');
        if (urlQuery) {
            setSearchTerm(urlQuery);
            setActiveSearchTerm(urlQuery);
        }
    }, [searchParams]);

    // Update URL when search changes
    const updateSearchInURL = (query: string) => {
        if (query) {
            setSearchParams({ q: query });
        } else {
            setSearchParams({});
        }
    };

    // Function to calculate tier usage statistics
    const getTierUsageStats = () => {
        const tierUsage: { [tier: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        Object.entries(selectedUnits).forEach(([playerId, playerUnits]) => {
            if (playerUnits) {
                const currentPlayerStars = playerStars[parseInt(playerId)] || {};
                playerUnits.forEach(unit => {
                    if (unit) {
                        // Check star level and calculate weight
                        const starLevel = currentPlayerStars[unit.name] || 0;
                        const weight = starLevel === 4 ? 27 : starLevel === 3 ? 9 : 3; // 4-star = 27, 3-star = 9, others = 3
                        tierUsage[unit.tier] = (tierUsage[unit.tier] || 0) + weight;
                    }
                });
            }
        });
        
        return tierUsage;
    };

    // Function to convert tier border colors to background colors
    const getTierBackgroundColor = (tier: number): string => {
        const tierColors = {
            1: 'bg-gray-400',
            2: 'bg-green-400', 
            3: 'bg-blue-400',
            4: 'bg-purple-400',
            5: 'bg-yellow-400',
        };
        return tierColors[tier as keyof typeof tierColors] || 'bg-gray-400';
    };

    // Champion image URL logic (matches unit_selector_popup)
    const getChampionImageUrl = (championName: string, imageFull: string) => {
        if (championImageMappings[championName]) {
            return `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-champion/${championImageMappings[championName]}`;
        }
        return `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-champion/${imageFull}`;
    };

    useEffect(() => {
        if (champions && Object.keys(champions).length > 0) {
            const contestRates = getUnitContestRates();
            
            // Create unit data from all available champions
            const allUnits: UnitContestData[] = Object.values(champions)
                .filter(champion => champion.id.startsWith('TFT14_'))
                .map(champion => ({
                    name: champion.name,
                    contestRate: contestRates[champion.name] || 0,
                    tier: champion.tier,
                    imageUrl: getChampionImageUrl(champion.name, champion.image.full)
                }))
                .sort((a, b) => b.contestRate - a.contestRate); // Sort by contest rate
            
            setUnitsData(allUnits);
            setFilteredUnits(allUnits);
        }
    }, [champions, version, getUnitContestRates, championImageMappings]);

    useEffect(() => {
        let filtered = unitsData;
        
        // Apply search filter
        if (activeSearchTerm) {
            filtered = filtered.filter(unit => 
                unit.name.toLowerCase().includes(activeSearchTerm.toLowerCase())
            );
        }
        
        // Apply sorting
        filtered = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'contest':
                    return b.contestRate - a.contestRate;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'tier':
                    return b.tier - a.tier;
                default:
                    return 0;
            }
        });
        
        setFilteredUnits(filtered);
    }, [unitsData, activeSearchTerm, sortBy]);

    const getContestIndicator = (contestRate: number) => {
        if (contestRate >= 30) return { color: 'text-red-600', text: 'Highly Contested' };
        if (contestRate >= 20) return { color: 'text-orange-600', text: 'Contested' };
        if (contestRate >= 10) return { color: 'text-yellow-600', text: 'Moderately Contested' };
        return { color: 'text-green-600', text: 'Low Contest' };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-600 text-xl">Loading units...</div>
            </div>
        );
    }

    const tierUsage = getTierUsageStats();

    return (
        <div className="relative w-full p-4">
            {/* Tab content */}
            <div className="relative z-20">
                {/* Header and Controls */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">All Units</h2>
                        <div className="relative group">
                            <HelpCircle 
                                size={20} 
                                className="text-gray-500 hover:text-gray-700 cursor-help transition-colors" 
                            />
                            <div 
                                className="absolute px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50"
                                style={{
                                    width: '500px',
                                    whiteSpace: 'normal',
                                    top: 'calc(100% + 8px)',
                                    left: '50%',
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                <div>
                                    <div className="font-semibold mb-2 text-left">Tier Usage from Game Tab:</div>
                                    <div className="text-xs mb-2">
                                        The <span className="text-blue-400 font-medium">tier usage statistics</span> count units you've placed in the <span className="text-orange-400 font-medium">Game tab</span> to track how many units from each tier are being used in your lobby.
                                    </div>
                                    <div className="font-semibold mb-2 text-left">Champion Information:</div>
                                    <div className="text-xs mb-2">
                                        Each champion displays a <span className="text-green-400 font-medium">contest rate percentage</span> calculated from the total available units minus those expected to be taken based on your <span className="text-orange-400 font-medium">Game tab</span> selections.
                                    </div>
                                </div>
                                <div className="arrow absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Tier Usage Statistics */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Tier Usage from Game Tab</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5].map(tier => {
                                const usage = tierUsage[tier] || 0;
                                const pool = TIER_POOLS[tier as keyof typeof TIER_POOLS];
                                const percentage = pool ? Math.round((usage / pool.total) * 100) : 0;
                                const tierColor = getTierBackgroundColor(tier);
                                const tierBorderColor = TIER_COLORS[tier as keyof typeof TIER_COLORS] || 'border-gray-400';
                                
                                return (
                                    <div key={tier} className="text-center">
                                        <div className={`text-sm text-gray-600 p-3 rounded-lg border-2 ${tierBorderColor} bg-white relative`}>
                                            <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full ${tierColor} flex items-center justify-center text-white font-bold text-xs`}>
                                                {tier}
                                            </div>
                                            <div className="mt-2">
                                                <div className="font-semibold">{usage} / {pool.total}</div>
                                                <div className="text-xs">{percentage}% used</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            * 4-star units count as 27 copies, 3-star units count as 9 copies, all other units count as 3 copies
                        </div>
                    </div>
                    
                    {/* Contest Rate Explanation */}
                    {showDescription && (
                        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">How Contest Rate is Calculated</h3>
                            <div className="text-gray-800 text-sm space-y-2">
                                <p>
                                    <span className="text-yellow-600 font-medium">Formula:</span> Contest Rate = (Players using unit ÷ Total players) × 100
                                </p>
                                <p>
                                    <span className="text-yellow-600 font-medium">Example:</span> If 3 out of 8 players have selected "Ahri", 
                                    then Ahri's contest rate = (3 ÷ 8) × 100 = <span className="text-orange-600 font-medium">37.5%</span>
                                </p>
                                <p>
                                    <span className="text-yellow-600 font-medium">Note:</span> Contest rates update in real-time based on unit selections in the Game page.
                                </p>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        {/* Search Bar */}
                        <div className="flex-1">
                            <h3 className="text-gray-800 font-medium mb-2 text-left">Filter Units</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search units..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setActiveSearchTerm(searchTerm);
                                            updateSearchInURL(searchTerm);
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-transparent"
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'rgb(253, 186, 116)';
                                        e.target.style.boxShadow = '0 0 0 2px rgba(253, 186, 116, 0.2)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '';
                                        e.target.style.boxShadow = '';
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        setActiveSearchTerm(searchTerm);
                                        updateSearchInURL(searchTerm);
                                    }}
                                    className="px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                    style={{ backgroundColor: '#964B00' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#7c3a00'; // darker brown for hover
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#964B00';
                                    }}
                                >
                                    <Search className="w-4 h-4" />
                                    Search
                                </button>
                            </div>
                        </div>
                        
                        {/* Sort Dropdown */}
                        <div className="sm:w-48">
                            <h3 className="text-gray-800 font-medium mb-2 text-left">Sort By</h3>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'contest' | 'name' | 'tier')}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-transparent"
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'rgb(253, 186, 116)';
                                    e.target.style.boxShadow = '0 0 0 2px rgb(253, 186, 116)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#d1d5db'; // gray-300
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <option value="contest">Sort by Contest Rate</option>
                                <option value="name">Sort by Name</option>
                                <option value="tier">Sort by Tier</option>
                            </select>
                        </div>
                    </div>
                </div>
                {/* Units Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredUnits.map((unit) => {
                        const contestIndicator = getContestIndicator(unit.contestRate);
                        const tierBorderColor = TIER_COLORS[unit.tier as keyof typeof TIER_COLORS] || 'border-gray-400';
                        const tierBackgroundColor = getTierBackgroundColor(unit.tier);
                        
                        return (
                            <div
                                key={unit.name}
                                className={`relative bg-white rounded-lg p-3 border-2 ${tierBorderColor} hover:scale-105 transition-transform duration-200 cursor-pointer group shadow-sm`}
                            >
                                {/* Contest Rate Badge */}
                                <div className={`absolute -top-2 -right-2 ${tierBackgroundColor} rounded-full px-2 py-1 text-xs font-bold text-white`}>
                                    {unit.contestRate}%
                                </div>
                                
                                {/* Unit Image */}
                                <div className="flex justify-center mb-2">
                                    {unit.imageUrl ? (
                                        <img
                                            src={unit.imageUrl}
                                            alt={unit.name}
                                            className="w-16 h-16 rounded-lg object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 text-xs text-center">
                                            {unit.name}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Unit Name */}
                                <div className="text-center">
                                    <h3 className="text-gray-800 font-semibold text-sm truncate">
                                        {unit.name}
                                    </h3>
                                    
                                    {/* Contest Indicator */}
                                    <div className={`text-xs font-medium ${contestIndicator.color} mt-1`}>
                                        {contestIndicator.text}
                                    </div>
                                    
                                    {/* Tier Indicator */}
                                    <div className="text-xs text-gray-500 mt-1">
                                        Tier {unit.tier}
                                    </div>
                                </div>
                                
                                {/* Hover Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                    <div className="font-semibold">{unit.name}</div>
                                    <div>Contest Rate: {unit.contestRate}%</div>
                                    <div>Tier: {unit.tier}</div>
                                    <div className={`${contestIndicator.color}`}>
                                        {contestIndicator.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* No Results */}
                {filteredUnits.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        {searchTerm ? 'No units found matching your search.' : 'No units available.'}
                    </div>
                )}
                {/* Stats */}
                {filteredUnits.length > 0 && (
                    <div className="mt-6 text-gray-500 text-sm">
                        Showing {filteredUnits.length} of {unitsData.length} units
                    </div>
                )}
            </div>
        </div>
    );
} 