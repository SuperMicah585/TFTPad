import { X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { SearchBar } from "./search_bar";
import { useTFT } from "../contexts/TFTContext";
import { TIER_COLORS, getTraitBreakpointInfo, decodeHtmlEntities } from "../services/tftService";

interface PresetModalProps {
    isOpen: boolean;
    onClose: () => void;
    playerNumber: number;
    onCompSelect?: (champions: { name: string; imageUrl: string; tier: number }[], stars: string[]) => void;
}

export function PresetModal({ isOpen, onClose, playerNumber, onCompSelect }: PresetModalProps) {
    const { comps, champions, traits, detailedTraitData, championImageMappings, version, loading, error } = useTFT();
    const [searchQuery, setSearchQuery] = useState("");
    const [hoveredTrait, setHoveredTrait] = useState<{ text: string; x: number; y: number } | null>(null);

    // Debug logging to see what traits are in the comps
    useEffect(() => {
        if (comps.length > 0) {
            console.log('Sample comp traits:', comps.slice(0, 3).map(comp => ({
                name: comp.name,
                traits: comp.traits
            })));
        }
    }, [comps]);

    // Debug logging to see what traits are available from the API
    useEffect(() => {
        if (Object.keys(traits).length > 0) {
            console.log('Available traits from API:', Object.keys(traits).slice(0, 10));
            console.log('Sample trait data:', Object.entries(traits).slice(0, 3));
        }
    }, [traits]);

    const filteredComps = useMemo(() => {
        if (!searchQuery.trim()) {
            // Sort by playCount (popularity) in descending order
            return [...comps].sort((a, b) => b.playCount - a.playCount);
        }
        
        const query = searchQuery.toLowerCase();
        const filtered = comps.filter(comp => 
            comp.name.toLowerCase().includes(query) ||
            comp.units.some(unit => unit.toLowerCase().includes(query))
        );
        
        // Sort filtered results by playCount (popularity) in descending order
        return filtered.sort((a, b) => b.playCount - a.playCount);
    }, [searchQuery, comps]);

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

    const handleCompClick = (comp: any) => {
        if (onCompSelect) {
            const validChampions = comp.units
                .filter((unit: string) => isValidTFT14Champion(unit))
                .map((unit: string) => ({
                    name: unit,
                    imageUrl: getChampionIconUrl(unit),
                    tier: getChampionTier(unit)
                }));
            onCompSelect(validChampions, comp.stars || []);
        }
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-[95%] min-w-96 min-h-96 max-h-[80vh] overflow-y-auto shadow-lg">
                    <div className="flex justify-center items-center h-full">
                        <div className="text-gray-600 text-lg">Loading TFT comps...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-[95%] min-w-96 min-h-96 max-h-[80vh] overflow-y-auto shadow-lg">
                    <div className="flex justify-center items-center h-full">
                        <div className="text-red-600 text-lg">Error: {error}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[95%] min-w-96 min-h-96 max-h-[80vh] overflow-y-auto shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-gray-800 text-xl font-bold">
                            Preset Comps - Player {playerNumber + 1}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 bg-gray-100 rounded-full p-2 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search comps or units..."
                    />
                </div>
                
                <div className="space-y-3">
                    {filteredComps.length > 0 ? (
                        filteredComps.map((comp) => (
                            <div 
                                key={comp.id} 
                                className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
                                onClick={() => handleCompClick(comp)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-gray-800 font-semibold text-lg">{comp.name}</h3>
                                </div>
                                <div className="mb-3">
                                    <div className="flex flex-wrap gap-2">
                                        {comp.units
                                            .filter(unit => isValidTFT14Champion(unit))
                                            .sort((a, b) => getChampionTier(a) - getChampionTier(b))
                                            .map((unit, index) => {
                                                const tier = getChampionTier(unit);
                                                const borderColor = getTierBorderColor(tier);
                                                const unitBuild = comp.builds.find((build: any) => build.unit === unit);
                                                const isItemized = unitBuild && unitBuild.num_items > 0;
                                                
                                                return (
                                                    <div key={index} className="flex flex-col items-center relative">
                                                        <div className="relative">
                                                            <img
                                                                src={getChampionIconUrl(unit)}
                                                                alt={unit}
                                                                className={`w-16 h-16 rounded-lg border-2 ${borderColor}`}
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
                                                            {/* Star overlay for starred units */}
                                                            {comp.stars && comp.stars.includes(unit) && (
                                                                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 flex flex-row gap-0.5">
                                                                    {[1, 2, 3].map((starIndex) => (
                                                                        <svg key={starIndex} className="w-4 h-4 text-yellow-400 fill-current stroke-black stroke-1" viewBox="0 0 24 24">
                                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                                        </svg>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {isItemized && (
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
                                                        <span className="text-xs text-gray-600 mt-5 text-center max-w-16 truncate">
                                                            {unit}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                                {comp.traits && comp.traits.length > 0 && (
                                    <div className="mb-3">
                                        <div className="flex flex-wrap gap-2">
                                            {comp.traits.map((trait, index) => {
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
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>Difficulty: {comp.difficulty}</span>
                                    <span>Levelling: {comp.levelling}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No comps found matching "{searchQuery}"</p>
                        </div>
                    )}
                </div>
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
        </div>
    );
} 