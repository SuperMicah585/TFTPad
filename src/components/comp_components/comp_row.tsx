import { CompHexagon } from "./comp_hexagon";
import { useState, useRef, useEffect } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { PresetModal } from "../preset_modal";
import { UnitSelectorPopup } from "../unit_selector_popup";
import { useTFT } from "../../contexts/TFTContext";

interface CompRowProps {
    player: number;
    isSelected: boolean;
    onPlayerSelect: (playerIndex: number) => void;
}

interface Champion {
    name: string;
    imageUrl: string;
    tier: number;
}

export function CompRow({ player, isSelected, onPlayerSelect }: CompRowProps) {
    const { selectedUnits, updatePlayerUnits } = useTFT();
    const [isHovered, setIsHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0, shouldPositionAbove: false });
    const rowRef = useRef<HTMLDivElement>(null);

    // Get current player's selected champions from context
    const selectedChampions = selectedUnits[player] || Array(10).fill(null);

    const handlePlayerClick = () => {
        onPlayerSelect(player);
    };

    const handlePresetClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event from bubbling up
        setIsModalOpen(true);
        onPlayerSelect(-1); // Close the popup by deselecting the row
    };

    const handleClearClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event from bubbling up
        updatePlayerUnits(player, Array(10).fill(null)); // Clear all units
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleCompSelect = (champions: Champion[]) => {
        // Fill the array with champions and pad with nulls to maintain 10 slots
        const newChampions: (Champion | null)[] = [...champions];
        while (newChampions.length < 10) {
            newChampions.push(null);
        }
        updatePlayerUnits(player, newChampions.slice(0, 10));
        setIsModalOpen(false);
    };

    const handleChampionToggle = (champion: Champion) => {
        const existingIndex = selectedChampions.findIndex(champ => champ && champ.name === champion.name);
        
        if (existingIndex !== -1) {
            // Remove champion if already selected, leaving the hexagon empty
            const newChampions = [...selectedChampions];
            newChampions[existingIndex] = null;
            updatePlayerUnits(player, newChampions);
        } else {
            // Add champion to first available spot
            const firstEmptyIndex = selectedChampions.findIndex(champ => !champ);
            if (firstEmptyIndex !== -1) {
                const newChampions = [...selectedChampions];
                newChampions[firstEmptyIndex] = champion;
                updatePlayerUnits(player, newChampions);
            }
        }
    };

    const handleClosePopup = () => {
        onPlayerSelect(-1); // Deselect the row
    };

    const handleUnselectClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event from bubbling up
        onPlayerSelect(-1); // Deselect the row
    };

    const handleHexagonClick = (index: number, e: React.MouseEvent) => {
        // Only remove unit if row is selected and there's a champion in that slot
        if (isSelected && selectedChampions[index]) {
            e.stopPropagation(); // Prevent event from bubbling up to row only when removing champion
            const newChampions = [...selectedChampions];
            newChampions[index] = null;
            updatePlayerUnits(player, newChampions);
        }
        // If no champion to remove, let the click bubble up to the row
    };

    // Update popup position when row is selected or on scroll
    useEffect(() => {
        if (isSelected && rowRef.current) {
            const updatePosition = () => {
                if (rowRef.current) {
                    const rect = rowRef.current.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    const popupHeight = 400; // Approximate height of the popup
                    const margin = 20;
                    
                    // Check if there's enough space below the row
                    const spaceBelow = viewportHeight - rect.bottom - margin;
                    const spaceAbove = rect.top - margin;
                    
                    let yPosition: number;
                    let shouldPositionAbove = false;
                    
                    if (spaceBelow >= popupHeight) {
                        // Enough space below, position below the row
                        yPosition = rect.bottom + margin;
                    } else if (spaceAbove >= popupHeight) {
                        // Not enough space below, but enough space above
                        yPosition = rect.top - margin;
                        shouldPositionAbove = true;
                    } else {
                        // Not enough space in either direction, position below but allow scrolling
                        yPosition = rect.bottom + margin;
                    }
                    
                    setPopupPosition({
                        x: rect.left + rect.width / 2,
                        y: yPosition,
                        shouldPositionAbove
                    });
                }
            };

            // Update position immediately
            updatePosition();

            // Update position on scroll
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);

            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isSelected]);

    return (
        <>
            <div className="flex flex-row gap-2 items-center justify-center relative cursor-pointer" ref={rowRef} onClick={handlePlayerClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                <div 
                    className={`relative w-20 h-20 bg-gray-100 text-gray-700 flex items-center justify-center font-bold border-2 ${(isSelected || isHovered) ? 'border-yellow-300' : 'border-gray-300'}`}
                >
                    <div>{'Player' + ' ' + (player+1).toString()}</div>
                    {isHovered && (
                        <div className="absolute -right-2 -top-2 bg-yellow-300 rounded-full p-1">
                            <Pencil size={12} className="text-white" />
                        </div>
                    )}
                </div>
                <div className={`flex flex-row gap-2 border-2 p-5 rounded-xl ${(isSelected || isHovered) ? 'border-yellow-300' : 'border-gray-300'} hover:border-yellow-300 bg-white`}>
                    {Array.from({ length: 10 }).map((_, index) => (
                        <div className="flex flex-col mt-2" key={index}> 
                            <CompHexagon 
                                champion={selectedChampions[index] || undefined} 
                                onClick={(e) => handleHexagonClick(index, e)}
                                isSelected={isSelected}
                            />
                        </div>
                    ))}
                </div>
                {isSelected && (
                    <div className="absolute right-0 top-0 transform -translate-y-1/2 flex gap-2">
                        <button 
                            className="bg-gray-500 text-white px-3 py-1 font-semibold hover:bg-gray-400 transition-colors flex items-center gap-1 rounded-full"
                            onClick={handleUnselectClick}
                        >
                            <X size={16} strokeWidth={3} />
                            close
                        </button>
                        <button 
                            className="bg-red-500 text-white px-3 py-1 font-semibold hover:bg-red-400 transition-colors flex items-center gap-1 rounded-full"
                            onClick={handleClearClick}
                        >
                            <Trash2 size={16} strokeWidth={3} />
                            clear
                        </button>
                        <button 
                            className="bg-blue-500 text-white px-3 py-1 font-semibold hover:bg-blue-400 transition-colors flex items-center gap-1 rounded-full"
                            onClick={handlePresetClick}
                        >
                            <Plus size={16} strokeWidth={3} />
                            presets
                        </button>
                    </div>
                )}
            </div>
            
            <PresetModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                playerNumber={player}
                onCompSelect={handleCompSelect}
            />
            
            <UnitSelectorPopup
                isOpen={isSelected}
                onClose={handleClosePopup}
                selectedChampions={selectedChampions}
                onChampionToggle={handleChampionToggle}
                position={popupPosition}
            />
        </>
    );
}


