import { useTFT } from "../contexts/TFTContext";
import { useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { SearchBar } from "./search_bar";
import { X } from "lucide-react";

interface UnitSelectorPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onChampionToggle: (champion: {name: string; imageUrl: string; tier: number}) => void;
    position: { x: number; y: number; shouldPositionAbove?: boolean };
}

export function UnitSelectorPopup({ 
    isOpen, 
    onClose, 
    onChampionToggle,
    position 
}: UnitSelectorPopupProps) {
    const { champions, championImageMappings, version, loading } = useTFT();
    const [searchQuery, setSearchQuery] = useState("");
    const popupRef = useRef<HTMLDivElement>(null);

    const getChampionIconUrl = (championName: string) => {
        // Use the dynamic mappings from the context
        const mappedFilename = championImageMappings[championName];
        if (mappedFilename) {
            return `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-champion/${mappedFilename}`;
        }
        
        // Fallback to the original logic if no mapping found
        const tftChampionName = `TFT15_${championName}`;
        return `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-champion/${tftChampionName}.TFT_Set15.png`;
    };

    const getTierBorderColor = (tier: number): string => {
        const tierColors = {
            1: 'border-gray-500',
            2: 'border-green-500', 
            3: 'border-blue-500',
            4: 'border-purple-500',
            5: 'border-yellow-500',
        };
        return tierColors[tier as keyof typeof tierColors] || 'border-gray-500';
    };

    // Filter champions based on search query
    const filteredChampions = useMemo(() => {
        const allChampions = Object.entries(champions)
            .filter(([, champion]) => champion.id.startsWith('TFT15_'))
            .map(([, champion]) => ({
                name: champion.name,
                imageUrl: getChampionIconUrl(champion.name),
                tier: champion.tier
            }))
            .sort((a, b) => {
                // First sort by tier
                if (a.tier !== b.tier) {
                    return a.tier - b.tier;
                }
                // Then sort alphabetically within the same tier
                return a.name.localeCompare(b.name);
            });

        if (!searchQuery.trim()) return allChampions;

        const query = searchQuery.toLowerCase();
        return allChampions.filter(champion => 
            champion.name.toLowerCase().includes(query) ||
            champion.tier.toString().includes(query)
        );
    }, [champions, searchQuery, championImageMappings, version]);

    if (!isOpen || loading) return null;

    return createPortal(
        <div 
            ref={popupRef}
            className="fixed z-[99999] bg-white rounded-xl p-4 shadow-2xl min-w-6xl max-w-7xl max-h-96 overflow-y-auto backdrop-blur-sm"
            style={{
                left: position.x,
                top: position.y,
                transform: position.shouldPositionAbove ? 'translateX(-50%) translateY(-100%)' : 'translateX(-50%)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                zIndex: 99999
            }}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-800 font-semibold text-lg">Select Units</h3>
                <button
                    onClick={onClose}
                    className="text-gray-500 bg-gray-100 rounded-full p-2 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search units by name or tier..."
                />
            </div>
            
            <div className="grid grid-cols-12 gap-2">
                {filteredChampions.map((champion) => {
                    const tierColor = getTierBorderColor(champion.tier);
                    
                    return (
                        <div
                            key={champion.name}
                            className={`w-16 h-16 bg-gray-200 p-1 hover:cursor-pointer hover:opacity-80 border-2 ${tierColor} relative`}
                            onClick={() => onChampionToggle(champion)}
                            title={`${champion.name} (${champion.tier}-cost)`}
                        >
                            <div className="w-full h-full relative overflow-hidden">
                                <img
                                    src={champion.imageUrl}
                                    alt={champion.name}
                                    className="w-full h-full object-cover object-center scale-110"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const fallback = document.createElement('div');
                                        fallback.className = 'w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-600';
                                        fallback.textContent = champion.name;
                                        target.parentNode?.appendChild(fallback);
                                    }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                    <div className="text-white font-semibold text-xs text-center px-1 leading-tight max-w-full truncate">
                                        {champion.name}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredChampions.length === 0 && searchQuery.trim() && (
                <div className="text-center py-4">
                    <p className="text-gray-500">No units found matching "{searchQuery}"</p>
                </div>
            )}
        </div>,
        document.body
    );
} 