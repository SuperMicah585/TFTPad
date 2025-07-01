import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { fetchTFTComps, fetchCurrentVersion, fetchChampionData, createChampionImageMappings, fetchCompsWithPlacementStats, fetchTraitData, type ChampionData, type TraitData, type DetailedTraitData } from '../services/tftService';
import type { TFTComp } from '../services/tftService';

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
    playerStars: { [playerId: number]: string[] };
    updatePlayerStars: (playerId: number, stars: string[]) => void;
    getUnitContestRates: () => { [unitName: string]: number };
    // Player names tracking
    playerNames: { [playerId: number]: string };
    updatePlayerName: (playerId: number, name: string) => void;
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
    const [playerStars, setPlayerStars] = useState<{ [playerId: number]: string[] }>({});

    // Player names tracking for all 8 players
    const [playerNames, setPlayerNames] = useState<{ [playerId: number]: string }>({});

    const updatePlayerUnits = (playerId: number, units: (Champion | null)[]) => {
        setSelectedUnits(prev => ({
            ...prev,
            [playerId]: units
        }));
    };

    const updatePlayerStars = (playerId: number, stars: string[]) => {
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

    const getUnitContestRates = () => {
        const unitCounts: { [unitName: string]: number } = {};
        const totalPlayers = 8;
        // 3-star units count as 3 players, regular units count as 1 player
        Object.entries(selectedUnits).forEach(([playerId, playerUnits]) => {
            if (playerUnits) {
                const currentPlayerStars = playerStars[parseInt(playerId)] || [];
                playerUnits.forEach(unit => {
                    if (unit) {
                        const isStarred = currentPlayerStars.includes(unit.name);
                        const weight = isStarred ? 3 : 1;
                        unitCounts[unit.name] = (unitCounts[unit.name] || 0) + weight;
                        console.log(`Unit ${unit.name} from player ${playerId}: isStarred=${isStarred}, weight=${weight}, total count=${unitCounts[unit.name]}`);
                    }
                });
            }
        });
        const contestRates: { [unitName: string]: number } = {};
        Object.entries(unitCounts).forEach(([unitName, count]) => {
            contestRates[unitName] = Math.round((count / totalPlayers) * 100 * 10) / 10;
            console.log(`Final contest rate for ${unitName}: ${count}/${totalPlayers} = ${contestRates[unitName]}%`);
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
            
            // Load detailed trait data
            const detailedTraitDataModule = await import('../components/comp_data.json');
            const detailedTraitDataArray = (detailedTraitDataModule.default || detailedTraitDataModule) as unknown as DetailedTraitData[];
            
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

            let isMounted = true;
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
        updatePlayerName
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