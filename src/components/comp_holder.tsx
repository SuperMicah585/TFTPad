import { CompRow } from "./comp_components/comp_row"
import { useState } from "react"

export function CompHolder() {
    const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);

    const handlePlayerSelect = (playerIndex: number) => {
        if (playerIndex === -1) {
            // Deselect when popup is closed
            setSelectedPlayer(null);
        } else {
            // Toggle selection for normal player clicks
            setSelectedPlayer(selectedPlayer === playerIndex ? null : playerIndex);
        }
    };

    return (
        <div className="relative w-full p-4">
            {/* Tab content */}
            <div className="relative z-20">
                <div className="text-gray-600 text-lg font-medium mb-4">
                    Click player to edit comp
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
        </div>
    )
}