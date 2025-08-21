import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { fetchTFTComps, fetchCurrentVersion, fetchChampionData, createChampionImageMappings, fetchCompsWithPlacementStats, fetchTraitData, fetchMatchData, parseMatchDataForGameTab, type ChampionData, type TraitData, type DetailedTraitData } from '../services/tftService';
import type { TFTComp } from '../services/tftService';
import { TIER_POOLS } from './constants';

interface Champion {
    name: string;
    imageUrl: string;
    tier: number;
}

interface RankCompsData {
    mergedData: Array<{
        clusterId: string;
        comp: TFTComp;
        placementStats: {
            totalGames: number;
            avgPlacement: number;
            top4Rate: number;
            top1Rate: number;
            placementPercentages: number[];
        };
    }>;
    totalGames: number;
    sampleSize: number;
    rankFilter: string;
}

interface TFTContextType {
    comps: TFTComp[];
    champions: { [key: string]: ChampionData };
    traits: { [key: string]: TraitData };
    detailedTraitData: DetailedTraitData[];
    championImageMappings: { [key: string]: string };
    version: string;
    loading: boolean;
    error: string | null;
    refreshComps: () => Promise<void>;
    // Rank-based comps data
    rankCompsData: { [rank: string]: RankCompsData };
    selectedRank: string;
    setSelectedRank: (rank: string) => void;
    rankLoading: boolean;
    rankError: string | null;
    // Unit selection tracking
    selectedUnits: { [playerId: number]: (Champion | null)[] };
    updatePlayerUnits: (playerId: number, units: (Champion | null)[]) => void;
    playerStars: { [playerId: number]: { [unitName: string]: number } };
    updatePlayerStars: (playerId: number, stars: { [unitName: string]: number }) => void;
    getUnitContestRates: () => { [unitName: string]: number };
    // Player names tracking
    playerNames: { [playerId: number]: string };
    updatePlayerName: (playerId: number, name: string) => void;
    // Match data loading
    loadMatchData: (matchId: string) => Promise<void>;
    matchLoading: boolean;
    matchError: string | null;
}

const TFTContext = createContext<TFTContextType | undefined>(undefined);

interface TFTProviderProps {
    children: ReactNode;
}

export function TFTProvider({ children }: TFTProviderProps) {
    const [comps, setComps] = useState<TFTComp[]>([]);
    const [champions, setChampions] = useState<{ [key: string]: ChampionData }>({});
    const [traits, setTraits] = useState<{ [key: string]: TraitData }>({});
    const [detailedTraitData, setDetailedTraitData] = useState<DetailedTraitData[]>([]);
    const [championImageMappings, setChampionImageMappings] = useState<{ [key: string]: string }>({});
    const [version, setVersion] = useState<string>('15.12.1');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Rank-based comps data and caching
    const [rankCompsData, setRankCompsData] = useState<{ [rank: string]: RankCompsData }>({});
    const [selectedRank, setSelectedRank] = useState('diamond+');
    const [rankLoading, setRankLoading] = useState(false);
    const [rankError, setRankError] = useState<string | null>(null);
    
    // Track which ranks have been loaded to prevent infinite loops
    const loadedRanks = useRef<Set<string>>(new Set());
    
    // Unit selection tracking for all 8 players
    const [selectedUnits, setSelectedUnits] = useState<{ [playerId: number]: (Champion | null)[] }>({});

    // Player stars tracking for all 8 players
    const [playerStars, setPlayerStars] = useState<{ [playerId: number]: { [unitName: string]: number } }>({});

    // Player names tracking for all 8 players
    const [playerNames, setPlayerNames] = useState<{ [playerId: number]: string }>({});
    
    // Match data loading state
    const [matchLoading, setMatchLoading] = useState(false);
    const [matchError, setMatchError] = useState<string | null>(null);

    const updatePlayerUnits = (playerId: number, units: (Champion | null)[]) => {
        setSelectedUnits(prev => ({
            ...prev,
            [playerId]: units
        }));
    };

    const updatePlayerStars = (playerId: number, stars: { [unitName: string]: number }) => {
        setPlayerStars(prev => ({
            ...prev,
            [playerId]: stars
        }));
    };

    const updatePlayerName = (playerId: number, name: string) => {
        setPlayerNames(prev => ({
            ...prev,
            [playerId]: name
        }));
    };

    const loadMatchData = async (matchId: string) => {
        setMatchLoading(true);
        setMatchError(null);

        try {
            // Check if champions data is loaded
            if (Object.keys(champions).length === 0) {
          
                // Wait a bit for champions to load
                await new Promise(resolve => setTimeout(resolve, 1000));
                if (Object.keys(champions).length === 0) {
                    throw new Error('Champions data not available');
                }
            }
            
        
            
            const matchData = await fetchMatchData(matchId);
            const parsedData = parseMatchDataForGameTab(matchData);
            
            // Clear existing data
            const newSelectedUnits: { [playerId: number]: (Champion | null)[] } = {};
            const newPlayerStars: { [playerId: number]: { [unitName: string]: number } } = {};
            const newPlayerNames: { [playerId: number]: string } = {};
            
            // Populate data for each player (0-7)
            parsedData.forEach((player, index) => {
                const playerId = index;
                
                // Set player name
                newPlayerNames[playerId] = player.playerName;
                
                // Convert champions to the format expected by the app
                const units: (Champion | null)[] = Array(9).fill(null);
                const stars: { [unitName: string]: number } = {};
                
                player.champions.forEach((champion, unitIndex) => {
                    if (unitIndex < 9) { // Max 9 units per player
                        
                        
                        // Try to find the champion by searching for the TFT15_ prefixed name in the full path
                        const tft15Name = `TFT15_${champion.name}`;
                        let championData = null;
                        let foundKey = null;
                        
                        // Search through all keys to find the one containing our champion name
                        for (const key of Object.keys(champions)) {
                            if (key.includes(tft15Name)) {
                                championData = champions[key];
                                foundKey = key;
                                break;
                            }
                        }
                        
                        
                        if (foundKey) {

                        }
                        
                        if (!championData) {
                            // If not found, try searching for just the name without TFT15_ prefix
                            for (const key of Object.keys(champions)) {
                                if (key.includes(champion.name)) {
                                    championData = champions[key];
                                    foundKey = key;
                                    break;
                                }
                            }
                            
                            if (foundKey) {
  
                            }
                        }
                        
                        if (championData) {
                            
                            
                            // Construct the full image URL
                            const fullImageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-champion/${championData.image.full}`;
                            
                            units[unitIndex] = {
                                name: championData.name, // Use the official name from champion data
                                imageUrl: fullImageUrl,
                                tier: championData.tier
                            };
                            
                            // Add to stars object if 3-star or 4-star
                            if (champion.stars === 3 || champion.stars === 4) {
                                stars[championData.name] = champion.stars;
                            }
                            

                        } else {

                        }
                    }
                });
                
                newSelectedUnits[playerId] = units;
                newPlayerStars[playerId] = stars;
            });
            
            // Update all state at once
            setSelectedUnits(newSelectedUnits);
            setPlayerStars(newPlayerStars);
            setPlayerNames(newPlayerNames);
            
        } catch (err) {
            setMatchError(err instanceof Error ? err.message : "Failed to load match data");
        } finally {
            setMatchLoading(false);
        }
    };

    const getUnitContestRates = () => {
        const unitCounts: { [unitName: string]: number } = {};
        Object.entries(selectedUnits).forEach(([playerId, playerUnits]) => {
            if (playerUnits) {
                const currentPlayerStars = playerStars[parseInt(playerId)] || {};
                playerUnits.forEach(unit => {
                    if (unit) {
                        // Check if unit is starred and get star level
                        const starLevel = currentPlayerStars[unit.name] || 0;
                        const weight = starLevel === 4 ? 27 : starLevel === 3 ? 9 : 3; // 4-star = 27, 3-star = 9, others = 3
                        unitCounts[unit.name] = (unitCounts[unit.name] || 0) + weight;
                    }
                });
            }
        });
        const contestRates: { [unitName: string]: number } = {};
        Object.entries(unitCounts).forEach(([unitName, count]) => {
            // Find the tier for this unit
            let tier = 1;
            if (champions[unitName]) {
                tier = champions[unitName].tier;
            } else {
                // Try to find by .name property
                const champ = Object.values(champions).find(c => c.name === unitName);
                if (champ) tier = champ.tier;
            }
            const poolSize = TIER_POOLS[tier as keyof typeof TIER_POOLS] || 1;
    
            contestRates[unitName] = Math.round((count / poolSize) * 1000) / 10; // e.g. 23.3%
        });
        return contestRates;
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch current version first
            const currentVersion = await fetchCurrentVersion();
            setVersion(currentVersion);
            
            // Load detailed trait data - temporarily disabled for TFT Set 15 migration
            // const detailedTraitDataModule = await import('../components/comp_data.json');
            // const detailedTraitDataArray = (detailedTraitDataModule.default || detailedTraitDataModule) as unknown as DetailedTraitData[];
            const detailedTraitDataArray: DetailedTraitData[] = [];
            
            // Fetch champion data, trait data, and TFT comps in parallel
            const [championData, traitData, compsData] = await Promise.all([
                fetchChampionData(currentVersion),
                fetchTraitData(currentVersion),
                fetchTFTComps()
            ]);
            
            setChampions(championData);
            setTraits(traitData);
            setDetailedTraitData(detailedTraitDataArray);
            setComps(compsData);
            
            // Create champion image mappings from the fetched data
            const mappings = createChampionImageMappings(championData);
            setChampionImageMappings(mappings);
        } catch (err) {
            setError('Failed to load TFT data');
            console.error('Error loading TFT data:', err);
        } finally {
            setLoading(false);
        }
    };

    const refreshComps = async () => {
        await loadData();
    };

    // Load rank-based comps data when selectedRank changes
    useEffect(() => {
        const loadRankCompsData = async () => {
            // Check if we already have data for this rank
            if (loadedRanks.current.has(selectedRank)) {
                return; // Use cached data
            }

            const isMounted = true;
            setRankLoading(true);
            setRankError(null);
            
            try {
                const data = await fetchCompsWithPlacementStats(selectedRank);
                
                if (isMounted) {
                    setRankCompsData(prev => ({
                        ...prev,
                        [selectedRank]: data
                    }));
                    loadedRanks.current.add(selectedRank);
                    setRankLoading(false);
                }
            } catch (err) {
                console.error('Error fetching comps for rank:', err);
                if (isMounted) {
                    setRankError(`Failed to fetch comps for selected rank: ${err instanceof Error ? err.message : 'Unknown error'}`);
                    setRankLoading(false);
                }
            }
        };

        loadRankCompsData();
    }, [selectedRank]); // Removed rankCompsData from dependencies

    useEffect(() => {
        loadData();
    }, []);

    const value: TFTContextType = {
        comps,
        champions,
        traits,
        detailedTraitData,
        championImageMappings,
        version,
        loading,
        error,
        refreshComps,
        rankCompsData,
        selectedRank,
        setSelectedRank,
        rankLoading,
        rankError,
        selectedUnits,
        updatePlayerUnits,
        playerStars,
        updatePlayerStars,
        getUnitContestRates,
        playerNames,
        updatePlayerName,
        loadMatchData,
        matchLoading,
        matchError
    };

    return (
        <TFTContext.Provider value={value}>
            {children}
        </TFTContext.Provider>
    );
}

export function useTFT() {
    const context = useContext(TFTContext);
    if (context === undefined) {
        throw new Error('useTFT must be used within a TFTProvider');
    }
    return context;
} 