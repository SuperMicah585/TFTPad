export interface TFTComp {
    id: string;
    name: string;
    units: string[];
    traits: string[];
    avgPlacement: number;
    playCount: number;
    difficulty: string;
    levelling: string;
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
            top_headliner: any[];
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
                build: any[];
                num_items: number;
                score: number;
                place_change: number;
                unit_numitems_count: number;
            }>;
            build_items: any;
            top_itemNames: any[];
            top_items: any[];
            trends: any[];
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
        
        // Filter for only TFT Set 14 champions (TFT14_ prefix)
        const filteredData: { [key: string]: ChampionData } = {};
        
        Object.entries(data.data).forEach(([key, champion]) => {
            const championData = champion as ChampionData;
            // Only include champions with TFT14_ prefix
            if (championData.id.startsWith('TFT14_')) {
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
        // Only create mappings for TFT14_ champions
        if (!champion.id.startsWith('TFT14_')) {
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
            // Extract units from units_string and filter for only TFT14_ units
            const units = cluster.units_string
                .split(', ')
                .filter(unit => unit.startsWith('TFT14_')) // Only include TFT14_ units
                .map(unit => unit.replace('TFT14_', ''))
                .filter(unit => unit.length > 0);
            
            // Extract traits from traits_string
            const traits = cluster.traits_string
                .split(', ')
                .map(trait => trait.replace('TFT14_', ''))
                .filter(trait => trait.length > 0);
            
            // Get the main name (usually the first trait or unit)
            const mainName = cluster.name[0]?.name.replace('TFT14_', '') || `Comp ${clusterId}`;
            
            const comp: TFTComp = {
                id: clusterId,
                name: `${mainName} Comp`,
                units,
                traits,
                avgPlacement: cluster.overall.avg,
                playCount: cluster.overall.count,
                difficulty: (cluster as any).difficulty || 'Medium',
                levelling: (cluster as any).levelling || 'Standard',
                topUnits: cluster.name
                    .filter(item => item.name.startsWith('TFT14_')) // Only include TFT14_ units in topUnits
                    .map(item => ({
                        name: item.name.replace('TFT14_', ''),
                        type: item.type,
                        score: item.score
                    })),
                builds: cluster.builds.map(build => ({
                    unit: build.unit.replace('TFT14_', ''),
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
export function analyzeProvidedPlacementData(rawData: any): {
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
    const placementStats = rawData as CompPlacementStats;
    
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
        // Extract units from units_string and filter for only TFT14_ units
        const units = cluster.units_string
            .split(', ')
            .filter(unit => unit.startsWith('TFT14_'))
            .map(unit => unit.replace('TFT14_', ''))
            .filter(unit => unit.length > 0);
        
        // Extract traits from traits_string
        const traits = cluster.traits_string
            .split(', ')
            .map(trait => trait.replace('TFT14_', ''))
            .filter(trait => trait.length > 0);
        
        // Get the main name (usually the first trait or unit)
        const mainName = cluster.name[0]?.name.replace('TFT14_', '') || `Comp ${clusterId}`;
        
        const comp: TFTComp = {
            id: clusterId,
            name: `${mainName} Comp`,
            units,
            traits,
            avgPlacement: cluster.overall.avg,
            playCount: cluster.overall.count,
            difficulty: (cluster as any).difficulty || 'Medium',
            levelling: (cluster as any).levelling || 'Standard',
            topUnits: cluster.name
                .filter(item => item.name.startsWith('TFT14_'))
                .map(item => ({
                    name: item.name.replace('TFT14_', ''),
                    type: item.type,
                    score: item.score
                })),
            builds: cluster.builds.map(build => ({
                unit: build.unit.replace('TFT14_', ''),
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
    
    console.log('Testing trait mapping for:', testTraitNames);
    
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
    
    // Fallback: assume the breakpoint number is the number of units required
    return {
        unitsRequired: breakpointNum,
        maxUnits: undefined,
        description: undefined,
        traitName: cleanTraitName,
        levelName: `${breakpointNum} ${cleanTraitName}`
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