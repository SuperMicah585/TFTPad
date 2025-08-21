export interface TFTComp {
    id: string;
    name: string;
    units: string[];
    traits: string[];
    avgPlacement: number;
    playCount: number;
    difficulty: string;
    levelling: string;
    stars: string[]; // Array of starred units (e.g., ["TFT15_Seraphine", "TFT15_Shaco"])
    topUnits: Array<{
        name: string;
        type: 'unit' | 'trait';
        score: number;
    }>;
    builds: Array<{
        unit: string;
        count: number;
        avg: number;
        buildName: string[];
        num_items: number;
        score: number;
        place_change: number;
        unit_numitems_count: number;
    }>;
}

export interface TFTData {
    cluster_id: number;
    tft_set: string;
    cluster_details: {
        [key: string]: {
            Cluster: number;
            centroid: number[];
            units_string: string;
            traits_string: string;
            name: Array<{
                name: string;
                type: 'unit' | 'trait';
                score: number;
            }>;
            name_string: string;
            top_headliner: string[];
            overall: {
                count: number;
                avg: number;
            };
            stars: string[];
            stars_4: string[];
            builds: Array<{
                cluster: string;
                count: number;
                avg: number;
                unit: string;
                buildName: string[];
                build: string[];
                num_items: number;
                score: number;
                place_change: number;
                unit_numitems_count: number;
            }>;
            build_items: Record<string, unknown>;
            top_itemNames: string[];
            top_items: string[];
            trends: string[];
            difficulty?: string;
            levelling?: string;
        };
    };
    updated: number;
    queue_id: number;
}

export interface ChampionData {
    id: string;
    name: string;
    tier: number;
    image: {
        full: string;
        sprite: string;
        group: string;
        x: number;
        y: number;
        w: number;
        h: number;
    };
}

export interface VersionData {
    n: {
        item: string;
        rune: string;
        mastery: string;
        summoner: string;
        champion: string;
        profileicon: string;
        map: string;
        language: string;
        sticker: string;
    };
    v: string;
    l: string;
    cdn: string;
    dd: string;
    lg: string;
    css: string;
    profileiconmax: number;
    store: null;
}

export interface UnitContestData {
    name: string;
    contestRate: number;
    tier: number;
    imageUrl?: string;
}

export function analyzeUnitContestRates(comps: TFTComp[], champions: { [key: string]: ChampionData }): UnitContestData[] {
    const unitCounts: { [key: string]: number } = {};
    
    // Count how many times each unit appears across all comps
    comps.forEach(comp => {
        comp.units.forEach(unit => {
            unitCounts[unit] = (unitCounts[unit] || 0) + 1;
        });
    });
    
    // Calculate contest rate (percentage of comps that use this unit)
    const totalComps = comps.length;
    const contestRates: UnitContestData[] = Object.entries(unitCounts).map(([unitName, count]) => {
        const contestRate = (count / totalComps) * 100;
        
        // Find the actual tier from champion data
        let tier = 1; // Default tier
        const champion = Object.values(champions).find(champ => 
            champ.name === unitName || 
            champ.name.replace("'", "") === unitName ||
            champ.name.replace(" ", "") === unitName
        );
        
        if (champion) {
            tier = champion.tier;
        }
        
        return {
            name: unitName,
            contestRate: Math.round(contestRate * 10) / 10, // Round to 1 decimal place
            tier,
            imageUrl: undefined // Will be populated by the component
        };
    });
    
    // Sort by contest rate (highest first)
    return contestRates.sort((a, b) => b.contestRate - a.contestRate);
}

// TFT tier border colors
export const TIER_COLORS = {
    1: 'border-gray-400', // Gray for 1-cost
    2: 'border-green-400', // Green for 2-cost
    3: 'border-blue-400', // Blue for 3-cost
    4: 'border-purple-400', // Purple for 4-cost
    5: 'border-yellow-400', // Gold for 5-cost
};

export async function fetchCurrentVersion(): Promise<string> {
    try {
        const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await response.json();
        return versions[0]; // Return the latest version
    } catch (error) {
        console.error('Error fetching version:', error);
        return '15.12.1'; // Fallback version
    }
}

export async function fetchChampionData(version: string): Promise<{ [key: string]: ChampionData }> {
    try {
        const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/tft-champion.json`);
        const data = await response.json();
        
        // Filter for only TFT Set 15 champions (TFT15_ prefix)
        const filteredData: { [key: string]: ChampionData } = {};
        
        Object.entries(data.data).forEach(([key, champion]) => {
            const championData = champion as ChampionData;
            // Only include champions with TFT15_ prefix
            if (championData.id.startsWith('TFT15_')) {
                filteredData[key] = championData;
            }
        });
        
        return filteredData;
    } catch (error) {
        console.error('Error fetching champion data:', error);
        return {};
    }
}

export function createChampionImageMappings(champions: { [key: string]: ChampionData }): { [key: string]: string } {
    const mappings: { [key: string]: string } = {};
    
    Object.values(champions).forEach(champion => {
        // Only create mappings for TFT15_ champions
        if (!champion.id.startsWith('TFT15_')) {
            return;
        }
        
        // Create mappings for different name variations
        const name = champion.name;
        const imageFilename = champion.image.full;
        
        // Add the exact name mapping
        mappings[name] = imageFilename;
        
        // Add common variations
        const variations = [
            // Handle special cases with different spellings
            name.replace("'", ""), // Cho'Gath -> Chogath
            name.replace(" ", ""), // Miss Fortune -> MissFortune
            name.toLowerCase(), // lowercase version
            name.replace("'", "").toLowerCase(), // lowercase without apostrophe
            name.replace(" ", "").toLowerCase(), // lowercase without spaces
            // Handle specific TFT naming conventions
            name.replace("'", "").replace(" ", ""), // Cho'Gath -> Chogath, Miss Fortune -> MissFortune
            name.replace("'", "").replace(" ", "").toLowerCase(), // lowercase version of above
        ];
        
        variations.forEach(variation => {
            if (variation !== name && !mappings[variation]) {
                mappings[variation] = imageFilename;
            }
        });
    });
    
    return mappings;
}

export async function fetchTFTComps(): Promise<TFTComp[]> {
    try {
        const response = await fetch('https://api-hc.metatft.com/tft-comps-api/comps_data');
        const data = await response.json();
        
        const tftData: TFTData = data.results.data;
        const comps: TFTComp[] = [];
        
        // Transform the API data into our format
        Object.entries(tftData.cluster_details).forEach(([clusterId, cluster]) => {
            // Extract units from units_string and filter for only TFT15_ units
            const units = cluster.units_string
                .split(', ')
                .filter(unit => unit.startsWith('TFT15_')) // Only include TFT15_ units
                .map(unit => unit.replace('TFT15_', ''))
                .filter(unit => unit.length > 0);
            
            // Extract traits from traits_string
            const traits = cluster.traits_string
                .split(', ')
                .map(trait => trait.replace('TFT15_', ''))
                .filter(trait => trait.length > 0);
            
            // Get the main name (usually the first trait or unit)
            const mainName = cluster.name[0]?.name.replace('TFT15_', '') || `Comp ${clusterId}`;
            
            const comp: TFTComp = {
                id: clusterId,
                name: `${mainName} Comp`,
                units,
                traits,
                avgPlacement: cluster.overall.avg,
                playCount: cluster.overall.count,
                difficulty: cluster.difficulty || 'Medium',
                levelling: cluster.levelling || 'Standard',
                stars: (cluster.stars || []).map(star => star.replace('TFT15_', '')), // Add stars array from API data and remove TFT15_ prefix
                topUnits: cluster.name
                    .filter(item => item.name.startsWith('TFT15_')) // Only include TFT15_ units in topUnits
                    .map(item => ({
                        name: item.name.replace('TFT15_', ''),
                        type: item.type,
                        score: item.score
                    })),
                builds: cluster.builds.map(build => ({
                    unit: build.unit.replace('TFT15_', ''),
                    count: build.count,
                    avg: build.avg,
                    buildName: build.buildName,
                    num_items: build.num_items,
                    score: build.score,
                    place_change: build.place_change,
                    unit_numitems_count: build.unit_numitems_count
                }))
            };
            
            comps.push(comp);
        });
        
        return comps;
    } catch (error) {
        console.error('Error fetching TFT comps:', error);
        // Return fallback data if API fails
        return getFallbackComps();
    }
}

function getFallbackComps(): TFTComp[] {
    return [
        { 
            id: "assassin", 
            name: "Assassin Comp", 
            units: ["Katarina", "Akali", "Zed", "Pyke"],
            traits: ["Assassin"],
            avgPlacement: 4.2,
            playCount: 1000,
            difficulty: "Medium",
            levelling: "Fast 8",
            stars: [], // Empty stars array for fallback data
            topUnits: [
                { name: "Katarina", type: "unit", score: 4.5 },
                { name: "Akali", type: "unit", score: 4.2 }
            ],
            builds: [
                { unit: "Katarina", count: 1, avg: 4.5, buildName: ["Katarina"], num_items: 1, score: 4.5, place_change: 0, unit_numitems_count: 1 },
                { unit: "Akali", count: 1, avg: 4.2, buildName: ["Akali"], num_items: 1, score: 4.2, place_change: 0, unit_numitems_count: 1 }
            ]
        },
        { 
            id: "mage", 
            name: "Mage Comp", 
            units: ["Ahri", "Lux", "Veigar", "Annie"],
            traits: ["Mage"],
            avgPlacement: 4.1,
            playCount: 1200,
            difficulty: "Easy",
            levelling: "Standard",
            stars: [], // Empty stars array for fallback data
            topUnits: [
                { name: "Ahri", type: "unit", score: 4.3 },
                { name: "Lux", type: "unit", score: 4.0 }
            ],
            builds: [
                { unit: "Ahri", count: 1, avg: 4.3, buildName: ["Ahri"], num_items: 1, score: 4.3, place_change: 0, unit_numitems_count: 1 },
                { unit: "Lux", count: 1, avg: 4.0, buildName: ["Lux"], num_items: 1, score: 4.0, place_change: 0, unit_numitems_count: 1 }
            ]
        },
        { 
            id: "tank", 
            name: "Tank Comp", 
            units: ["Braum", "Sejuani", "Galio", "Alistar"],
            traits: ["Vanguard"],
            avgPlacement: 4.3,
            playCount: 800,
            difficulty: "Hard",
            levelling: "Slow 9",
            stars: [], // Empty stars array for fallback data
            topUnits: [
                { name: "Braum", type: "unit", score: 4.1 },
                { name: "Sejuani", type: "unit", score: 4.0 }
            ],
            builds: [
                { unit: "Braum", count: 1, avg: 4.1, buildName: ["Braum"], num_items: 1, score: 4.1, place_change: 0, unit_numitems_count: 1 },
                { unit: "Sejuani", count: 1, avg: 4.0, buildName: ["Sejuani"], num_items: 1, score: 4.0, place_change: 0, unit_numitems_count: 1 }
            ]
        }
    ];
}

export async function fetchCompsStatsByRank(rankLabel: string) {
  // Map dropdown label to API rank string
  const rankMap: Record<string, string> = {
    'iron+': 'IRON,BRONZE,SILVER,GOLD,PLATINUM,EMERALD,DIAMOND,MASTER,GRANDMASTER,CHALLENGER',
    'bronze+': 'BRONZE,SILVER,GOLD,PLATINUM,EMERALD,DIAMOND,MASTER,GRANDMASTER,CHALLENGER',
    'silver+': 'SILVER,GOLD,PLATINUM,EMERALD,DIAMOND,MASTER,GRANDMASTER,CHALLENGER',
    'gold+': 'GOLD,PLATINUM,EMERALD,DIAMOND,MASTER,GRANDMASTER,CHALLENGER',
    'platinum+': 'PLATINUM,EMERALD,DIAMOND,MASTER,GRANDMASTER,CHALLENGER',
    'emerald+': 'EMERALD,DIAMOND,MASTER,GRANDMASTER,CHALLENGER',
    'diamond+': 'DIAMOND,MASTER,GRANDMASTER,CHALLENGER',
    'master+': 'MASTER,GRANDMASTER,CHALLENGER',
    'grandmaster+': 'GRANDMASTER,CHALLENGER',
    'challenger': 'CHALLENGER',
  };
  const apiRank = rankMap[rankLabel] || rankLabel;
  
  // Use the comps_data endpoint instead of comps_stats for getting comp details
  const url = `https://api-hc.metatft.com/tft-comps-api/comps_data?queue=1100&patch=current&days=3&rank=${encodeURIComponent(apiRank)}&permit_filter_adjustment=true`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching comps by rank:', error);
    throw new Error('Failed to fetch comps stats');
  }
}

// Separate function for fetching placement statistics data
export async function fetchPlacementStatsByRank(rankLabel: string): Promise<CompPlacementStats> {
  // Map dropdown label to API rank string
  const rankMap: Record<string, string> = {
    'iron+': 'IRON,BRONZE,SILVER,GOLD,PLATINUM,EMERALD,DIAMOND,MASTER,GRANDMASTER,CHALLENGER',
    'bronze+': 'BRONZE,SILVER,GOLD,PLATINUM,EMERALD,DIAMOND,MASTER,GRANDMASTER,CHALLENGER',
    'silver+': 'SILVER,GOLD,PLATINUM,EMERALD,DIAMOND,MASTER,GRANDMASTER,CHALLENGER',
    'gold+': 'GOLD,PLATINUM,EMERALD,DIAMOND,MASTER,GRANDMASTER,CHALLENGER',
    'platinum+': 'PLATINUM,EMERALD,DIAMOND,MASTER,GRANDMASTER,CHALLENGER',
    'emerald+': 'EMERALD,DIAMOND,MASTER,GRANDMASTER,CHALLENGER',
    'diamond+': 'DIAMOND,MASTER,GRANDMASTER,CHALLENGER',
    'master+': 'MASTER,GRANDMASTER,CHALLENGER',
    'grandmaster+': 'GRANDMASTER,CHALLENGER',
    'challenger': 'CHALLENGER',
  };
  const apiRank = rankMap[rankLabel] || rankLabel;
  
  // Use the comps_stats endpoint for placement statistics
  const url = `https://api-hc.metatft.com/tft-comps-api/comps_stats?queue=1100&patch=current&days=3&rank=${encodeURIComponent(apiRank)}&permit_filter_adjustment=true`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data as CompPlacementStats;
  } catch (error) {
    console.error('Error fetching placement stats by rank:', error);
    throw new Error('Failed to fetch placement stats');
  }
}

export interface CompPlacementData {
    cluster: string;
    places: number[]; // Array of 8 numbers representing placements 1-8
    count: number; // Total number of games
}

export interface CompPlacementStats {
    results: CompPlacementData[];
    updated: number;
    tft_set: string;
    queue_id: number;
    cluster_id: number;
    filter_adjustment: {
        override_applied: boolean;
        rank_filter: string;
        sample_size: number;
    };
}

export function processPlacementData(data: CompPlacementStats): { [clusterId: string]: CompPlacementData } {
    const clusterMap: { [clusterId: string]: CompPlacementData } = {};
    
    data.results.forEach(result => {
        if (result.cluster && result.cluster !== '') {
            clusterMap[result.cluster] = result;
        }
    });
    
    return clusterMap;
}

export function calculatePlacementPercentages(placementData: CompPlacementData): {
    top4Rate: number;
    top1Rate: number;
    avgPlacement: number;
    placementPercentages: number[];
} {
    const totalGames = placementData.count;
    const placements = placementData.places.slice(0, 8); // Only use first 8 elements (1st-8th place)
    
    // Calculate placement percentages (1st through 8th)
    const placementPercentages = placements.map(count => 
        totalGames > 0 ? (count / totalGames) * 100 : 0
    );
    
    // Calculate top 4 rate (sum of 1st, 2nd, 3rd, 4th place percentages)
    const top4Rate = placementPercentages.slice(0, 4).reduce((sum, rate) => sum + rate, 0);
    
    // Calculate top 1 rate
    const top1Rate = placementPercentages[0] || 0;
    
    // Calculate average placement
    let totalPlacement = 0;
    let totalGamesForAvg = 0;
    placements.forEach((count, index) => {
        totalPlacement += (index + 1) * count; // index + 1 gives us placement (1st, 2nd, 3rd, etc.)
        totalGamesForAvg += count;
    });
    const avgPlacement = totalGamesForAvg > 0 ? totalPlacement / totalGamesForAvg : 0;
    
    return {
        top4Rate: Math.round(top4Rate * 10) / 10, // Round to 1 decimal place
        top1Rate: Math.round(top1Rate * 10) / 10,
        avgPlacement: Math.round(avgPlacement * 100) / 100, // Round to 2 decimal places
        placementPercentages: placementPercentages.map(rate => Math.round(rate * 10) / 10)
    };
}

export function getTopPerformingComps(placementStats: CompPlacementStats, limit: number = 10): Array<{
    clusterId: string;
    top4Rate: number;
    top1Rate: number;
    avgPlacement: number;
    totalGames: number;
}> {
    const comps = placementStats.results
        .filter(result => result.cluster && result.cluster !== '' && result.count > 0)
        .map(result => {
            const stats = calculatePlacementPercentages(result);
            return {
                clusterId: result.cluster,
                top4Rate: stats.top4Rate,
                top1Rate: stats.top1Rate,
                avgPlacement: stats.avgPlacement,
                totalGames: result.count
            };
        })
        .sort((a, b) => b.top4Rate - a.top4Rate) // Sort by top 4 rate descending
        .slice(0, limit);
    
    return comps;
}

// Helper function to analyze the provided placement data
export function analyzeProvidedPlacementData(rawData: CompPlacementStats): {
    topComps: Array<{
        clusterId: string;
        top4Rate: number;
        top1Rate: number;
        avgPlacement: number;
        totalGames: number;
    }>;
    totalGames: number;
    sampleSize: number;
    rankFilter: string;
} {
    const placementStats = rawData;
    
    const topComps = getTopPerformingComps(placementStats, 15);
    const totalGames = placementStats.results.reduce((sum, result) => sum + result.count, 0);
    
    return {
        topComps,
        totalGames,
        sampleSize: placementStats.filter_adjustment.sample_size,
        rankFilter: placementStats.filter_adjustment.rank_filter
    };
}

// Function to merge placement statistics with comp details data
export function mergePlacementStatsWithComps(
    placementStats: CompPlacementStats, 
    compsData: TFTData
): Array<{
    clusterId: string;
    comp: TFTComp;
    placementStats: {
        totalGames: number;
        avgPlacement: number;
        top4Rate: number;
        top1Rate: number;
        placementPercentages: number[];
    };
}> {
    const mergedData: Array<{
        clusterId: string;
        comp: TFTComp;
        placementStats: {
            totalGames: number;
            avgPlacement: number;
            top4Rate: number;
            top1Rate: number;
            placementPercentages: number[];
        };
    }> = [];

    // Create a map of placement stats by cluster ID
    const placementMap = new Map<string, CompPlacementData>();
    placementStats.results.forEach(result => {
        if (result.cluster && result.cluster !== '') {
            placementMap.set(result.cluster, result);
        }
    });

    // Process each comp from the comps data
    Object.entries(compsData.cluster_details).forEach(([clusterId, cluster]) => {
        // Extract units from units_string and filter for only TFT15_ units
        const units = cluster.units_string
            .split(', ')
            .filter(unit => unit.startsWith('TFT15_'))
            .map(unit => unit.replace('TFT15_', ''))
            .filter(unit => unit.length > 0);
        
        // Extract traits from traits_string
        const traits = cluster.traits_string
            .split(', ')
            .map(trait => trait.replace('TFT15_', ''))
            .filter(trait => trait.length > 0);
        
        // Get the main name (usually the first trait or unit)
        const mainName = cluster.name[0]?.name.replace('TFT15_', '') || `Comp ${clusterId}`;
        
                    const comp: TFTComp = {
                id: clusterId,
                name: `${mainName} Comp`,
                units,
                traits,
                avgPlacement: cluster.overall.avg,
                playCount: cluster.overall.count,
                difficulty: cluster.difficulty || 'Medium',
                levelling: cluster.levelling || 'Standard',
            stars: cluster.stars || [], // Add stars array from API data
            topUnits: cluster.name
                .filter(item => item.name.startsWith('TFT15_'))
                .map(item => ({
                    name: item.name.replace('TFT15_', ''),
                    type: item.type,
                    score: item.score
                })),
            builds: cluster.builds.map(build => ({
                unit: build.unit.replace('TFT15_', ''),
                count: build.count,
                avg: build.avg,
                buildName: build.buildName,
                num_items: build.num_items,
                score: build.score,
                place_change: build.place_change,
                unit_numitems_count: build.unit_numitems_count
            }))
        };

        // Get placement stats for this cluster
        const placementData = placementMap.get(clusterId);
        if (placementData) {
            const stats = calculatePlacementPercentages(placementData);
            mergedData.push({
                clusterId,
                comp,
                placementStats: {
                    totalGames: placementData.count,
                    avgPlacement: stats.avgPlacement, // Use calculated avg from placement stats
                    top4Rate: stats.top4Rate,
                    top1Rate: stats.top1Rate,
                    placementPercentages: stats.placementPercentages
                }
            });
        } else {
            // If no placement stats found, use the comp's default stats
            mergedData.push({
                clusterId,
                comp,
                placementStats: {
                    totalGames: comp.playCount,
                    avgPlacement: comp.avgPlacement,
                    top4Rate: 0, // Default values when no placement data available
                    top1Rate: 0,
                    placementPercentages: []
                }
            });
        }
    });

    return mergedData;
}

// Function to fetch and merge both datasets
export async function fetchCompsWithPlacementStats(rankLabel: string): Promise<{
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
}> {
    try {
        // Fetch both datasets in parallel
        const [compsResponse, placementResponse] = await Promise.all([
            fetchCompsStatsByRank(rankLabel),
            fetchPlacementStatsByRank(rankLabel)
        ]);

        const compsData = compsResponse.results.data as TFTData;
        const placementStats = placementResponse as CompPlacementStats;

        const mergedData = mergePlacementStatsWithComps(placementStats, compsData);
        
        return {
            mergedData,
            totalGames: placementStats.filter_adjustment.sample_size,
            sampleSize: placementStats.filter_adjustment.sample_size,
            rankFilter: placementStats.filter_adjustment.rank_filter
        };
    } catch (error) {
        console.error('Error fetching comps with placement stats:', error);
        throw new Error('Failed to fetch comps with placement stats');
    }
}

export interface TraitData {
    id: string;
    name: string;
    image: {
        full: string;
        sprite: string;
        group: string;
        x: number;
        y: number;
        w: number;
        h: number;
    };
}

export async function fetchTraitData(version: string): Promise<{ [key: string]: TraitData }> {
    try {
        const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/tft-trait.json`);
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching trait data:', error);
        return {};
    }
}

export function getTraitIconUrl(traitName: string, version: string): string {
    // Map trait names to their icon filenames
    const traitIconMap: { [key: string]: string } = {
        'Armorclad': 'Trait_Icon_9_Bastion.png',
        'Strong': 'Trait_Icon_4_Slayer.png',
        'Cutter': 'Trait_Icon_4_Executioner.png',
        'Marksman': 'Trait_Icon_14_Marksman.TFT_Set14.png',
        'Techie': 'Trait_Icon_14_Techie.TFT_Set14.png',
        'Controller': 'Trait_Icon_9_Strategist.png',
        'Supercharge': 'Trait_Icon_14_Amp.TFT_Set14.png',
        'Immortal': 'Trait_Icon_14_GoldenOx.TFT_Set14.png',
        // Add more mappings as needed
    };
    
    const iconFilename = traitIconMap[traitName] || `${traitName}.png`;
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-trait/${iconFilename}`;
}

export function testTraitMapping() {
    // Test trait names that might be in our data
    const testTraitNames = [
        'Armorclad',
        'Strong', 
        'Cutter',
        'Marksman',
        'Techie',
        'Controller',
        'Supercharge',
        'Immortal',
        'Assassin',
        'Mage',
        'Vanguard'
    ];
    

    
    // This would be called with actual trait data
    return testTraitNames;
}

export interface DetailedTraitData {
    id: string;
    trait: string;
    trait_details: {
        apiName: string;
        trait_name: string;
        en_name: string;
        description: string;
        levels: Array<{
            maxUnits: number;
            minUnits: number;
            style: number;
            trait_num: number;
            name: string;
            apiName: string;
        }>;
    };
    level: number;
    avg_place: number;
    frequency: {
        count: number;
        percent: number;
    };
}

export function loadDetailedTraitData(): DetailedTraitData[] {
    try {
        // For now, return empty array - we'll load this data in the component
        // The actual loading will be done in the component using import()
        return [];
    } catch (error) {
        console.error('Error loading detailed trait data:', error);
        return [];
    }
}

export function getTraitBreakpointInfo(traitName: string, breakpoint: string, detailedTraitData: DetailedTraitData[]) {
    // Clean the trait name - remove any suffixes like _1, _2, etc.
    const cleanTraitName = traitName.replace(/_\d+$/, '');
    const breakpointNum = parseInt(breakpoint) || 1;
    
    // Find the trait in our detailed data
    const traitEntry = detailedTraitData.find(entry => {
        const entryTraitName = entry.trait_details.trait_name.toLowerCase();
        const entryApiName = entry.trait_details.apiName.toLowerCase();
        const searchTraitName = cleanTraitName.toLowerCase();
        
        return entryTraitName.includes(searchTraitName) || 
               entryApiName.includes(searchTraitName) ||
               entryTraitName === searchTraitName;
    });
    
    if (traitEntry) {
        // Find the specific level/breakpoint by matching trait_num with the breakpoint number
        const level = traitEntry.trait_details.levels.find(l => l.trait_num === breakpointNum);
        
        if (level) {
            return {
                unitsRequired: level.minUnits,
                maxUnits: level.maxUnits,
                description: traitEntry.trait_details.description,
                traitName: traitEntry.trait_details.trait_name,
                levelName: level.name
            };
        }
        
        // If specific level not found, try to find the closest level
        const closestLevel = traitEntry.trait_details.levels.find(l => l.minUnits <= breakpointNum && l.maxUnits >= breakpointNum);
        
        if (closestLevel) {
            return {
                unitsRequired: closestLevel.minUnits,
                maxUnits: closestLevel.maxUnits,
                description: traitEntry.trait_details.description,
                traitName: traitEntry.trait_details.trait_name,
                levelName: closestLevel.name
            };
        }
        
        // If no level found, return the trait's general info
        return {
            unitsRequired: breakpointNum,
            maxUnits: undefined,
            description: traitEntry.trait_details.description,
            traitName: traitEntry.trait_details.trait_name,
            levelName: `${breakpointNum} ${traitEntry.trait_details.trait_name}`
        };
    }
    
    // Fallback: provide basic breakpoint information for TFT Set 15 traits
    const traitBreakpointMap: { [key: string]: { [key: number]: string } } = {
        'Destroyer': { 1: '1 Executioner', 2: '2 Executioner', 3: '3 Executioner', 4: '4 Executioner' },
        'Duelist': { 1: '1 Duelist', 2: '2 Duelist', 3: '3 Duelist', 4: '4 Duelist' },
        'Edgelord': { 1: '1 Edgelord', 2: '2 Edgelord', 3: '3 Edgelord', 4: '4 Edgelord' },
        'Heavyweight': { 1: '1 Heavyweight', 2: '2 Heavyweight', 3: '3 Heavyweight', 4: '4 Heavyweight' },
        'Juggernaut': { 1: '1 Juggernaut', 2: '2 Juggernaut', 3: '3 Juggernaut', 4: '4 Juggernaut' },
        'OldMentor': { 1: '1 Mentor', 2: '2 Mentor', 3: '3 Mentor', 4: '4 Mentor' },
        'SentaiRanger': { 1: '1 Mighty Mech', 2: '2 Mighty Mech', 3: '3 Mighty Mech', 4: '4 Mighty Mech' },
        'Strategist': { 1: '1 Strategist', 2: '2 Strategist', 3: '3 Strategist', 4: '4 Strategist' },
        'ElTigre': { 1: '1 The Champ', 2: '2 The Champ', 3: '3 The Champ', 4: '4 The Champ' },
        'Empyrean': { 1: '1 Wraith', 2: '2 Wraith', 3: '3 Wraith', 4: '4 Wraith' },
        'Luchador': { 1: '1 Luchador', 2: '2 Luchador', 3: '3 Luchador', 4: '4 Luchador' },
        'SoulFighter': { 1: '1 Soul Fighter', 2: '2 Soul Fighter', 3: '3 Soul Fighter', 4: '4 Soul Fighter' },
        'Bastion': { 1: '1 Bastion', 2: '2 Bastion', 3: '3 Bastion', 4: '4 Bastion' },
        'BattleAcademia': { 1: '1 Battle Academia', 2: '2 Battle Academia', 3: '3 Battle Academia', 4: '4 Battle Academia' },
        'Protector': { 1: '1 Protector', 2: '2 Protector', 3: '3 Protector', 4: '4 Protector' },
        'Spellslinger': { 1: '1 Sorcerer', 2: '2 Sorcerer', 3: '3 Sorcerer', 4: '4 Sorcerer' },
        'Prodigy': { 1: '1 Prodigy', 2: '2 Prodigy', 3: '3 Prodigy', 4: '4 Prodigy' },
        'StarGuardian': { 1: '1 Star Guardian', 2: '2 Star Guardian', 3: '3 Star Guardian', 4: '4 Star Guardian', 5: '5 Star Guardian', 6: '6 Star Guardian', 7: '7 Star Guardian' },
        'SupremeCells': { 1: '1 Supreme Cells', 2: '2 Supreme Cells', 3: '3 Supreme Cells', 4: '4 Supreme Cells' },
        'TheCrew': { 1: '1 The Crew', 2: '2 The Crew', 3: '3 The Crew', 4: '4 The Crew', 5: '5 The Crew', 6: '6 The Crew', 7: '7 The Crew' },
        'Rosemother': { 1: '1 Rosemother', 2: '2 Rosemother', 3: '3 Rosemother', 4: '4 Rosemother' },
        'Captain': { 1: '1 Rogue Captain', 2: '2 Rogue Captain', 3: '3 Rogue Captain', 4: '4 Rogue Captain' },
        'Sniper': { 1: '1 Sniper', 2: '2 Sniper', 3: '3 Sniper', 4: '4 Sniper' },
        'DragonFist': { 1: '1 Stance Master', 2: '2 Stance Master', 3: '3 Stance Master', 4: '4 Stance Master' },
        'GemForce': { 1: '1 Crystal Gambit', 2: '2 Crystal Gambit', 3: '3 Crystal Gambit', 4: '4 Crystal Gambit' },
        'MonsterTrainer': { 1: '1 Monster Trainer', 2: '2 Monster Trainer', 3: '3 Monster Trainer', 4: '4 Monster Trainer' }
    };
    
    const traitBreakpoints = traitBreakpointMap[cleanTraitName];
    const levelName = traitBreakpoints?.[breakpointNum] || `${breakpointNum} ${cleanTraitName}`;
    
    return {
        unitsRequired: breakpointNum,
        maxUnits: undefined,
        description: undefined,
        traitName: cleanTraitName,
        levelName: levelName
    };
}

export function decodeHtmlEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}

// Team planner codes for TFT Set 15 champions (from official data)
const TEAM_PLANNER_CODES = {
    'TFTSet15': {
        'Alistar': { traits: [ 'Bruiser', 'Golden Ox' ], championTier: 1, teamPlannerCode: '312' },
        'Annie': { traits: [ 'A.M.P', 'Golden Ox' ], championTier: 4, teamPlannerCode: '316' },
        'Aphelios': { traits: [ 'Golden Ox', 'Marksman' ], championTier: 4, teamPlannerCode: '71a' },
        'Aurora': { traits: [ 'Anima Squad', 'Dynamo' ], championTier: 5, teamPlannerCode: '30d' },
        'Brand': { traits: [ 'Street Demon', 'Techie' ], championTier: 4, teamPlannerCode: '2e1' },
        'Braum': { traits: [ 'Syndicate', 'Vanguard' ], championTier: 3, teamPlannerCode: '2f8' },
        'Cho\'Gath': { traits: [ 'BoomBot', 'Bruiser' ], championTier: 4, teamPlannerCode: '30a' },
        'Darius': { traits: [ 'Bruiser', 'Syndicate' ], championTier: 2, teamPlannerCode: '2e2' },
        'Dr. Mundo': { traits: [ 'Bruiser', 'Slayer', 'Street Demon' ], championTier: 1, teamPlannerCode: '2e3' },
        'Draven': { traits: [ 'Cypher', 'Rapidfire' ], championTier: 3, teamPlannerCode: '31c' },
        'Ekko': { traits: [ 'Strategist', 'Street Demon' ], championTier: 2, teamPlannerCode: '31f' },
        'Elise': { traits: [ 'Dynamo', 'Nitro' ], championTier: 3, teamPlannerCode: '2e4' },
        'Fiddlesticks': { traits: [ 'BoomBot', 'Techie' ], championTier: 3, teamPlannerCode: '2e5' },
        'Galio': { traits: [ 'Bastion', 'Cypher' ], championTier: 3, teamPlannerCode: '2e6' },
        'Gragas': { traits: [ 'Bruiser', 'Divinicorp' ], championTier: 3, teamPlannerCode: '302' },
        'Graves': { traits: [ 'Executioner', 'Golden Ox' ], championTier: 2, teamPlannerCode: '315' },
        'Illaoi': { traits: [ 'Anima Squad', 'Bastion' ], championTier: 2, teamPlannerCode: '2fd' },
        'Jarvan IV': { traits: [ 'Golden Ox', 'Slayer', 'Vanguard' ], championTier: 3, teamPlannerCode: '314' },
        'Jax': { traits: [ 'Bastion', 'Exotech' ], championTier: 1, teamPlannerCode: '305' },
        'Jhin': { traits: [ 'Dynamo', 'Exotech', 'Marksman' ], championTier: 2, teamPlannerCode: '300' },
        'Jinx': { traits: [ 'Marksman', 'Street Demon' ], championTier: 3, teamPlannerCode: '31e' },
        'Kindred': { traits: [ 'Marksman', 'Nitro', 'Rapidfire' ], championTier: 1, teamPlannerCode: '2fb' },
        'Kobuko': { traits: [ 'Bruiser', 'Cyberboss' ], championTier: 5, teamPlannerCode: '306' },
        'Kog\'Maw': { traits: [ 'BoomBot', 'Rapidfire' ], championTier: 1, teamPlannerCode: '303' },
        'LeBlanc': { traits: [ 'Cypher', 'Strategist' ], championTier: 2, teamPlannerCode: '2e8' },
        'Leona': { traits: [ 'Anima Squad', 'Vanguard' ], championTier: 4, teamPlannerCode: '30f' },
        'Miss Fortune': { traits: [ 'Dynamo', 'Syndicate' ], championTier: 4, teamPlannerCode: '2e9' },
        'Mordekaiser': { traits: [ 'Bruiser', 'Exotech', 'Techie' ], championTier: 3, teamPlannerCode: '311' },
        'Morgana': { traits: [ 'Divinicorp', 'Dynamo' ], championTier: 1, teamPlannerCode: '2ea' },
        'Naafiri': { traits: [ 'A.M.P', 'Exotech' ], championTier: 2, teamPlannerCode: '301' },
        'Neeko': { traits: [ 'Strategist', 'Street Demon' ], championTier: 4, teamPlannerCode: '2eb' },
        'Nidalee': { traits: [ 'A.M.P', 'Nitro' ], championTier: 1, teamPlannerCode: '2f9' },
        'Poppy': { traits: [ 'Bastion', 'Cyberboss' ], championTier: 1, teamPlannerCode: '308' },
        'Renekton': { traits: [ 'Bastion', 'Divinicorp', 'Overlord' ], championTier: 5, teamPlannerCode: '2ec' },
        'Rengar': { traits: [ 'Executioner', 'Street Demon' ], championTier: 3, teamPlannerCode: '2ed' },
        'Rhaast': { traits: [ 'Divinicorp', 'Vanguard' ], championTier: 2, teamPlannerCode: '317' },
        'Samira': { traits: [ 'A.M.P', 'Street Demon' ], championTier: 5, teamPlannerCode: '2ee' },
        'Sejuani': { traits: [ 'Bastion', 'Exotech' ], championTier: 4, teamPlannerCode: '307' },
        'Senna': { traits: [ 'Divinicorp', 'Slayer' ], championTier: 3, teamPlannerCode: '2ef' },
        'Seraphine': { traits: [ 'Anima Squad', 'Techie' ], championTier: 1, teamPlannerCode: '2fe' },
        'Shaco': { traits: [ 'Slayer', 'Syndicate' ], championTier: 1, teamPlannerCode: '2f0' },
        'Shyvana': { traits: [ 'Bastion', 'Nitro', 'Techie' ], championTier: 2, teamPlannerCode: '2fa' },
        'Skarner': { traits: [ 'BoomBot', 'Vanguard' ], championTier: 2, teamPlannerCode: '304' },
        'Sylas': { traits: [ 'Anima Squad', 'Vanguard' ], championTier: 1, teamPlannerCode: '30c' },
        'Twisted Fate': { traits: [ 'Rapidfire', 'Syndicate' ], championTier: 2, teamPlannerCode: '2f1' },
        'Urgot': { traits: [ 'BoomBot', 'Executioner' ], championTier: 5, teamPlannerCode: '30b' },
        'Varus': { traits: [ 'Executioner', 'Exotech' ], championTier: 3, teamPlannerCode: '2f2' },
        'Vayne': { traits: [ 'Anima Squad', 'Slayer' ], championTier: 2, teamPlannerCode: '30e' },
        'Veigar': { traits: [ 'Cyberboss', 'Techie' ], championTier: 2, teamPlannerCode: '2f3' },
        'Vex': { traits: [ 'Divinicorp', 'Executioner' ], championTier: 4, teamPlannerCode: '2f4' },
        'Vi': { traits: [ 'Cypher', 'Vanguard' ], championTier: 1, teamPlannerCode: '310' },
        'Viego': { traits: [ 'Golden Ox', 'Soul Killer', 'Techie' ], championTier: 5, teamPlannerCode: '313' },
        'Xayah': { traits: [ 'Anima Squad', 'Marksman' ], championTier: 4, teamPlannerCode: '2ff' },
        'Yuumi': { traits: [ 'A.M.P', 'Anima Squad', 'Strategist' ], championTier: 3, teamPlannerCode: '2fc' },
        'Zed': { traits: [ 'Cypher', 'Slayer' ], championTier: 4, teamPlannerCode: '2f5' },
        'Zeri': { traits: [ 'Exotech', 'Rapidfire' ], championTier: 4, teamPlannerCode: '2f6' },
        'Ziggs': { traits: [ 'Cyberboss', 'Strategist' ], championTier: 4, teamPlannerCode: '309' },
        'Zyra': { traits: [ 'Street Demon', 'Techie' ], championTier: 1, teamPlannerCode: '2f7' }
    }
};

// TFTSet15 configuration
const TFTSET15_CONFIG = {
    targetSlots: 10,
    teamPlannerCodePrefix: '02'
};

/**
 * Generate a team planner code string from a list of champions
 * @param champions Array of champion names
 * @returns Team planner code string ending with TFTSet15
 */
// Helper function to normalize champion names from comp data to team planner format
function normalizeChampionName(name: string): string {
    // Remove TFT15_ prefix if present
    const cleanName = name.replace(/^TFT15_/, '');
    
    // Handle specific cases where comp data uses different naming than team planner codes
    const nameMappings: { [key: string]: string } = {
        'MissFortune': 'Miss Fortune',
        'TwistedFate': 'Twisted Fate',
        'DrMundo': 'Dr. Mundo',
        'KogMaw': 'Kog\'Maw', // TFT15_KogMaw -> Kog'Maw (no apostrophe in comp data)
        'Jarvan': 'Jarvan IV', // TFT15_Jarvan -> Jarvan IV
        'JarvanIV': 'Jarvan IV',
        'Chogath': 'Cho\'Gath', // TFT15_Chogath -> Cho'Gath (no apostrophe in comp data)
        'ChoGath': 'Cho\'Gath', // Alternative spelling
        'Cho\'Gath': 'Cho\'Gath', // Already correct
        'LeBlanc': 'LeBlanc', // Already correct
        'Nidalee': 'Nidalee', // Already correct
        'Kobuko': 'Kobuko', // Already correct
        'Renekton': 'Renekton', // Already correct
        'Samira': 'Samira', // Already correct
        'Urgot': 'Urgot', // Already correct
        'Viego': 'Viego', // Already correct
        'Ziggs': 'Ziggs' // Already correct
    };
    
    return nameMappings[cleanName] || cleanName;
}

export function generateTeamPlannerCode(champions: string[]): string {

    
    // Sort champions by tier and name for consistent team codes
    const sortedChampions = champions
        .filter(championName => championName)
        .map(championName => {
            const normalized = normalizeChampionName(championName);
    
            return normalized;
        })
        .sort((a, b) => {
            const championA = TEAM_PLANNER_CODES.TFTSet15[a as keyof typeof TEAM_PLANNER_CODES.TFTSet15];
            const championB = TEAM_PLANNER_CODES.TFTSet15[b as keyof typeof TEAM_PLANNER_CODES.TFTSet15];
            
            if (!championA && !championB) return a.localeCompare(b);
            if (!championA) return 1;
            if (!championB) return -1;
            
            // First sort by tier
            if (championA.championTier !== championB.championTier) {
                return championA.championTier - championB.championTier;
            }
            
            // Then sort alphabetically within the same tier
            return a.localeCompare(b);
        });
    

    
    const codes: string[] = [];
    
    // Process sorted champions
    for (const championName of sortedChampions) {
        const championData = TEAM_PLANNER_CODES.TFTSet15[championName as keyof typeof TEAM_PLANNER_CODES.TFTSet15];

        if (championData) {
            codes.push(championData.teamPlannerCode);
        } else {
            codes.push('000'); // Unknown champion
        }
    }
    
    // Pad with '000' to reach exactly 10 slots
    while (codes.length < 10) {
        codes.push('000');
    }
    
    const result = TFTSET15_CONFIG.teamPlannerCodePrefix + codes.join('') + 'TFTSet15';

    
    // Combine prefix + champion codes + set identifier
    return result;
} 

export interface MatchData {
  metadata: {
    data_version: string;
    match_id: string;
    participants: string[];
  };
  info: {
    endOfGameResult: string;
    gameCreation: number;
    gameId: number;
    game_datetime: number;
    game_length: number;
    game_version: string;
    mapId: number;
    participants: PlayerData[];
    queueId: number;
    queue_id: number;
    tft_game_type: string;
    tft_set_core_name: string;
    tft_set_number: number;
  };
}

export interface PlayerData {
  companion: Record<string, unknown>;
  gold_left: number;
  last_round: number;
  level: number;
  missions: Record<string, unknown>;
  placement: number;
  players_eliminated: number;
  puuid: string;
  riotIdGameName: string;
  riotIdTagline: string;
  time_eliminated: number;
  total_damage_to_players: number;
  traits: Array<{
    name: string;
    num_units: number;
    style: number;
    tier_current: number;
    tier_total: number;
  }>;
  units: UnitData[];
  win: boolean;
}

export interface UnitData {
  character_id: string;
  itemNames: string[];
  name: string;
  rarity: number;
  tier: number;
}

export async function fetchMatchData(matchId: string): Promise<MatchData> {
  try {
    // Create a timeout promise that rejects after 5 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timed out after 5 seconds. Please try again.'));
      }, 5000);
    });

    // Create the fetch promise
    const apiUrl = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';
    const fetchPromise = fetch(`${apiUrl}/api/match/${matchId}`);
    
    // Race between the fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Match ID not found. Please check the ID and try again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching match data:', error);
    throw error;
  }
}

export function parseMatchDataForGameTab(matchData: MatchData) {
  // Sort participants by placement (1st to 8th)
  const sortedPlayers = matchData.info.participants.sort((a, b) => a.placement - b.placement);
  
  return sortedPlayers.map(player => {
    // Convert character_id to champion name (remove TFT15_ prefix)
    const champions = player.units.map(unit => {
      const championName = unit.character_id.replace('TFT15_', '');
      // Map tier to star level: tier 2 = normal, tier 3 = 3*, tier 4 = 4*
      const starLevel = unit.tier === 4 ? 4 : unit.tier === 3 ? 3 : unit.tier === 2 ? 2 : 1;
  
      return { name: championName, stars: starLevel };
    });
    
    return {
      playerName: player.riotIdGameName,
      placement: player.placement,
      champions: champions
    };
  });
} 

export interface MatchHistoryEntry {
  matchId: string;
  gameCreation: number;
  gameLength: number;
  placement: number;
  playerName: string;
  champions: Array<{
    name: string;
    stars: number;
    items: string[];
  }>;
  traits: Array<{
    name: string;
    num_units: number;
    tier_current: number;
    tier_total: number;
  }>;
}

export async function fetchMatchHistory(puuid: string, region: string): Promise<MatchHistoryEntry[]> {
  try {
    const apiUrl = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';
    const response = await fetch(`${apiUrl}/api/match-history/${puuid}?region=${region}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No match history found for this account.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error('Error fetching match history:', error);
    throw error;
  }
}

interface TftLeagueEntry {
  puuid: string
  leagueId: string
  queueType: string
  ratedTier?: string
  ratedRating?: number
  tier?: string
  rank?: string
  leaguePoints?: number
  wins: number
  losses: number
  hotStreak?: boolean
  veteran?: boolean
  freshBlood?: boolean
  inactive?: boolean
  miniSeries?: {
    losses: number;
    progress: string;
    target: number;
    wins: number;
  } | null
}

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:5001';

export const tftService = {
  async getTftLeagueData(puuid: string, userId: number): Promise<TftLeagueEntry[]> {
    const response = await fetch(`${API_BASE_URL}/api/tft-league/${puuid}?user_id=${userId}`)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch TFT league data')
    }

    return response.json()
  }
} 