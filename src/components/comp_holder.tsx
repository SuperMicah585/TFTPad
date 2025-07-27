import { CompRow } from "./comp_components/comp_row"
import { useState, useRef } from "react"
import { HelpCircle } from "lucide-react"
import { createPortal } from "react-dom"
import { useTFT } from "../contexts/TFTContext"
import { useAuth } from "../contexts/AuthContext"
import { MatchHistoryModal } from "./MatchHistoryModal"

interface CompHolderProps {
    onShowGameIdModal: () => void;
}

export function CompHolder({ onShowGameIdModal: _ }: CompHolderProps) {
    const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [showMatchHistoryModal, setShowMatchHistoryModal] = useState(false);
    const iconRef = useRef<HTMLDivElement>(null);
    const { loadMatchData } = useTFT();
    const { userId } = useAuth();

    const handlePlayerSelect = (playerIndex: number) => {
        if (playerIndex === -1) {
            // Deselect when popup is closed
            setSelectedPlayer(null);
        } else {
            // Toggle selection for normal player clicks
            setSelectedPlayer(selectedPlayer === playerIndex ? null : playerIndex);
        }
    };

    const handleIconMouseEnter = () => {
        if (iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            setTooltipPosition({
                x: rect.left + rect.width / 2,
                y: rect.bottom + 10
            });
        }
        setShowTooltip(true);
    };

    const handleIconMouseLeave = () => {
        setShowTooltip(false);
    };



    const handleSelectMatchFromHistory = async (matchId: string) => {
        try {
            await loadMatchData(matchId);
            setShowMatchHistoryModal(false);
        } catch (err) {
            console.error("Failed to load match data:", err);
        }
    };

    return (
        <div className="relative w-full p-4">
            {/* Tab content */}
            <div className="relative z-20">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Game</h2>
                    <div className="relative" ref={iconRef}>
                        <HelpCircle 
                            size={20} 
                            className="text-gray-400 hover:text-gray-600 cursor-help transition-colors"
                            onMouseEnter={handleIconMouseEnter}
                            onMouseLeave={handleIconMouseLeave}
                        />
                    </div>
                </div>

                {/* Match History Button */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowMatchHistoryModal(true)}
                            disabled={!userId}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Load Game from Match History
                        </button>
                        
                        {!userId && (
                            <span className="text-sm text-gray-500">
                                Login and connect your Riot account to use this feature
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                {Array.from({ length: 8 }).map((_, index) => (
                    <CompRow 
                        key={index} 
                        player={index}
                        isSelected={selectedPlayer === index}
                        onPlayerSelect={handlePlayerSelect}
                    />
                ))}
                </div>
            </div>

            {/* Tooltip Portal */}
            {showTooltip && createPortal(
                <div 
                    className="fixed z-[99999] px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-xs"
                    style={{
                        left: tooltipPosition.x,
                        top: tooltipPosition.y,
                        transform: 'translateX(-50%)',
                        pointerEvents: 'none'
                    }}
                >
                    <div>
                        <div className="font-medium mb-1 text-left">Game Analysis Tool:</div>
                        <div className="text-xs mb-2 text-left pl-2">
                            <span className="text-orange-300 font-medium">Option 1:</span> Load games from your match history to analyze historical matches and review your previous comps and performance.<br/>
                            <span className="text-green-300 font-medium">Option 2:</span> Manually input comps you think players will go for live note-taking and real-time guidance during your game.
                        </div>
                        <div className="font-medium mb-1 text-left">How to edit:</div>
                        <div className="text-xs mb-2 text-left pl-2">
                            <span className="text-blue-300 font-medium">Row:</span> Click row to select it, then edit comp<br/>
                            <span className="text-green-300 font-medium">Player:</span> Click player square to edit name
                        </div>
                        <div className="font-medium mb-1 text-left">Adding Units to Selected Row:</div>
                        <div className="text-xs text-left pl-2 mb-2">
                            • Click unit squares to add manually<br/>
                            <span className="text-gray-300 font-medium">OR</span><br/>
                            • Click "presets" button for pre-built comps
                        </div>
                        <div className="font-medium mb-1 text-left">Modifying Specific Units:</div>
                        <div className="text-xs text-left pl-2">
                            • <span className="text-yellow-300 font-medium">Click a unit</span> to open the unit menu<br/>
                            • <span className="text-red-300 font-medium">Remove unit:</span> Removes the unit from the row<br/>
                                                    • <span className="text-yellow-400 font-medium">3★ star:</span> Make the unit 3-star (shows 3 gold stars)<br/>
                        • <span className="text-green-400 font-medium">4★ star:</span> Make the unit 4-star (shows 4 green stars)<br/>
                        • <span className="text-gray-200 font-medium">Remove stars:</span> Remove star status from the unit
                        </div>
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>,
                document.body
            )}



            {/* Match History Modal */}
            <MatchHistoryModal
                isOpen={showMatchHistoryModal}
                onClose={() => setShowMatchHistoryModal(false)}
                onSelectMatch={handleSelectMatchFromHistory}
            />
        </div>
    )
}