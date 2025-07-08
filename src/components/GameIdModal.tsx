import { X } from 'lucide-react';

interface GameIdModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GameIdModal({ isOpen, onClose }: GameIdModalProps) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">How to Find Your Game ID</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Step 1 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                1
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Visit MetaTFT</h3>
                        </div>
                        <p className="text-gray-600 ml-11">
                            First, navigate to <a href="https://www.metatft.com/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 underline">MetaTFT.com</a> and enter the summoner name you want to get match data for.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                2
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Expand Match Details</h3>
                        </div>
                        <p className="text-gray-600 ml-11">
                            You'll see the match history for this summoner. For the match you want to analyze, click on the carrot expander (▼) to reveal more details about that specific game.
                        </p>
                        <div className="ml-11">
                            <img src="/image1.png" alt="Expand match details" className="rounded-lg border border-gray-200 max-w-full" />
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                3
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Copy the Match Link</h3>
                        </div>
                        <p className="text-gray-600 ml-11">
                            Once the match details are expanded, click on the "Copy Link" button to copy the URL for that specific match to your clipboard.
                        </p>
                        <div className="ml-11">
                            <img src="/image2.png" alt="Copy match link" className="rounded-lg border border-gray-200 max-w-full" />
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                4
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Extract the Game ID</h3>
                        </div>
                        <p className="text-gray-600 ml-11">
                            Paste the copied URL into the search box in TFTPad. You'll need to extract just the game ID portion (highlighted in red) from the URL. Delete everything else so you're left with just the game ID.
                        </p>
                        <div className="ml-11">
                            <img src="/image3.png" alt="Extract game ID from URL" className="rounded-lg border border-gray-200 max-w-full" />
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                5
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Finalize the Game ID</h3>
                        </div>
                        <p className="text-gray-600 ml-11">
                            Delete the rest of the URL so that it looks like what is shown in the image. Press search and the match data should show!
                        </p>
                        <div className="ml-11">
                            <img src="/image4.png" alt="Final game ID format" className="rounded-lg border border-gray-200 max-w-full" />
                        </div>
                    </div>

                    {/* Final Step */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                ✓
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Load Your Match!</h3>
                        </div>
                        <p className="text-gray-600 ml-11">
                            Press the "Load Match" button and TFTPad will populate all the rows with the actual match data, allowing you to analyze the game and see what the optimal comps would have been!
                        </p>
                    </div>

                    {/* Tips */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 ml-11">
                        <h4 className="font-semibold text-orange-800 mb-2">💡 Pro Tips:</h4>
                        <ul className="text-sm text-orange-700 space-y-1">
                            <li>• Game IDs typically look like: <code className="bg-orange-100 px-1 rounded">NA1_5320285575</code></li>
                            <li>• You can analyze your own games or study other players' matches</li>
                            <li>• Use this feature to learn from past games and improve your decision-making</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                        style={{ backgroundColor: '#964B00' }}
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
} 