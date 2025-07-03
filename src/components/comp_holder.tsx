import { CompRow } from "./comp_components/comp_row"
import { useState, useRef } from "react"
import { HelpCircle } from "lucide-react"
import { createPortal } from "react-dom"

export function CompHolder() {
    const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const iconRef = useRef<HTMLDivElement>(null);

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
                    className="fixed z-[99999] px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap"
                    style={{
                        left: tooltipPosition.x,
                        top: tooltipPosition.y,
                        transform: 'translateX(-50%)',
                        pointerEvents: 'none'
                    }}
                >
                    <div>
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
                            • <span className="text-yellow-400 font-medium">3 star:</span> Make the unit 3-star (shows 3 gold stars)<br/>
                            • <span className="text-gray-200 font-medium">Remove stars:</span> Remove 3-star status from the unit
                        </div>
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>,
                document.body
            )}
        </div>
    )
}