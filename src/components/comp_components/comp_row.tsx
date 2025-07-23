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
    const { selectedUnits, updatePlayerUnits, playerNames, updatePlayerName, playerStars, updatePlayerStars } = useTFT();
    const [isHovered, setIsHovered] = useState(false);
    const [isRowHovered, setIsRowHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0, shouldPositionAbove: false });
    const [isEditingPlayer, setIsEditingPlayer] = useState(false);
    const rowRef = useRef<HTMLDivElement>(null);
    const starredUnits = playerStars[player] || {};
    const [popupIndex, setPopupIndex] = useState<number | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);

    // Get current player's selected champions from context
    const selectedChampions = selectedUnits[player] || Array(10).fill(null);
    
    // Get current player's name from context or use default
    const playerName = playerNames[player] !== undefined ? playerNames[player] : `Player ${player + 1}`;

    const handlePlayerClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row selection when clicking player box
        setIsEditingPlayer(true);
    };

    const handleRowClick = () => {
        onPlayerSelect(player);
    };

    const handleHexagonContainerMouseEnter = () => {
        setIsRowHovered(true);
    };

    const handleHexagonContainerMouseLeave = () => {
        setIsRowHovered(false);
    };

    const handlePlayerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        updatePlayerName(player, newName);
    };

    const handlePlayerNameBlur = () => {
        setIsEditingPlayer(false);
    };

    const handlePlayerNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setIsEditingPlayer(false);
        }
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

    const handleCompSelect = (champions: Champion[], stars: { [unitName: string]: number }) => {
        // Fill the array with champions and pad with nulls to maintain 10 slots
        const newChampions: (Champion | null)[] = [...champions];
        while (newChampions.length < 10) {
            newChampions.push(null);
        }
        updatePlayerUnits(player, newChampions.slice(0, 10));
        
        // Stars are already in object format
        updatePlayerStars(player, stars);
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

    // Close popup when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setPopupIndex(null);
            }
        }
        if (popupIndex !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [popupIndex]);

    // New handler for hex click
    const handleHexagonClick = (index: number) => {
        if (isSelected && selectedChampions[index]) {
            // Don't stop propagation - let the row stay selected
            setPopupIndex(index);
        }
    };

    // Remove unit
    const handleRemoveUnit = (index: number) => {
        const newChampions = [...selectedChampions];
        newChampions[index] = null;
        updatePlayerUnits(player, newChampions);
        setPopupIndex(null);
        // Don't deselect the row
    };

    // Toggle stars
    const handleToggleStars = (index: number, starLevel: number) => {
        const unit = selectedChampions[index];
        if (!unit) return;
        const newStars: { [unitName: string]: number } = { ...starredUnits };
        if (starredUnits[unit.name] === starLevel) {
            delete newStars[unit.name];
        } else {
            newStars[unit.name] = starLevel;
        }
        updatePlayerStars(player, newStars);
        setPopupIndex(null);
        // Don't deselect the row
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
            <div 
                className="flex flex-row gap-2 items-center justify-center relative cursor-pointer" 
                ref={rowRef} 
                onClick={handleRowClick}
            >
                <div 
                    className={`relative w-20 h-20 bg-gray-100 text-gray-700 flex items-center justify-center font-bold border-2 cursor-pointer ${isHovered ? 'border-yellow-300' : 'border-gray-300'}`}
                    onClick={handlePlayerClick}
                    onMouseEnter={(e) => {
                        e.stopPropagation();
                        setIsHovered(true);
                    }}
                    onMouseLeave={(e) => {
                        e.stopPropagation();
                        setIsHovered(false);
                    }}
                >
                    {isEditingPlayer ? (
                        <input
                            type="text"
                            value={playerName}
                            onChange={handlePlayerNameChange}
                            onBlur={handlePlayerNameBlur}
                            onKeyDown={handlePlayerNameKeyDown}
                            className="w-full h-full text-center bg-transparent border-none outline-none text-gray-700 font-bold text-xs"
                            autoFocus
                        />
                    ) : (
                        <div className="w-full h-full text-center text-xs overflow-hidden text-ellipsis whitespace-nowrap px-1 leading-[80px]" title={playerName}>
                            {playerName}
                        </div>
                    )}
                    {isHovered && !isEditingPlayer && (
                        <div className="absolute -right-2 -top-2 bg-yellow-300 rounded-full p-1">
                            <Pencil size={12} className="text-white" />
                        </div>
                    )}
                </div>
                <div 
                    className={`flex flex-row gap-2 border-2 p-5 rounded-xl relative ${isSelected ? 'border-yellow-300' : isRowHovered ? 'border-yellow-300' : 'border-gray-300'} bg-white`}
                    onMouseEnter={handleHexagonContainerMouseEnter}
                    onMouseLeave={handleHexagonContainerMouseLeave}
                >
                    {/* Row hover pencil icon */}
                    {isRowHovered && !isSelected && (
                        <div className="absolute -left-2 -top-2 bg-yellow-300 rounded-full p-1">
                            <Pencil size={12} className="text-white" />
                        </div>
                    )}
                    {Array.from({ length: 10 }).map((_, index) => (
                        <div className="flex flex-col mt-2 relative" key={index}>
                            <CompHexagon 
                                champion={selectedChampions[index] || undefined} 
                                onClick={() => handleHexagonClick(index)}
                                isSelected={isSelected}
                                starLevel={selectedChampions[index] ? (starredUnits[selectedChampions[index].name] || 0) : 0}
                            />
                            {/* Popup menu for actions */}
                            {popupIndex === index && selectedChampions[index] && (
                                <div ref={popupRef} className="absolute z-[9999] top-1/2 left-full ml-2 -translate-y-1/2 bg-white border border-gray-300 rounded shadow-lg flex flex-col min-w-[120px]">
                                    <button
                                        className="px-4 py-2 text-left hover:bg-gray-100 text-sm border-b border-gray-200"
                                        onClick={() => handleRemoveUnit(index)}
                                    >
                                        Remove unit
                                    </button>
                                    <button
                                        className="px-4 py-2 text-left hover:bg-gray-100 text-sm border-b border-gray-200"
                                        onClick={() => handleToggleStars(index, 3)}
                                    >
                                        {starredUnits[selectedChampions[index].name] === 3 ? 'Remove 3★' : '3★ star'}
                                    </button>
                                    <button
                                        className="px-4 py-2 text-left hover:bg-gray-100 text-sm"
                                        onClick={() => handleToggleStars(index, 4)}
                                    >
                                        {starredUnits[selectedChampions[index].name] === 4 ? 'Remove 4★' : '4★ star'}
                                    </button>
                                </div>
                            )}
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
                onChampionToggle={handleChampionToggle}
                position={popupPosition}
            />
        </>
    );
}


