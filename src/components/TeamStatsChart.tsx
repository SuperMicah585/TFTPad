
import { ResponsiveLine } from '@nivo/line';
import type { RankAuditEvent } from '../services/teamStatsService';

// Extend the interface to include summoner_name that backend provides
interface RankAuditEventWithName extends RankAuditEvent {
  summoner_name?: string;
}
import type { LivePlayerData } from '../services/livePlayerService';

interface TeamStatsChartProps {
  data: RankAuditEvent[];
  memberNames: { [riotId: string]: string };
  liveData?: { [summonerName: string]: LivePlayerData };
  width?: number;
  height?: number;
  className?: string;
  maxXAxisLabels?: number;
  numGridLines?: number;
}

export function TeamStatsChart({ 
  data, 
  memberNames, 
  liveData,
  width = 600, 
  height = 400, 
  className = '',
  maxXAxisLabels = 5,
  numGridLines = 5
}: TeamStatsChartProps) {
  console.log('📊 TeamStatsChart received data:', data);
  console.log('👥 TeamStatsChart received memberNames:', memberNames);
  console.log('📊 Sample event riot_id:', data[0]?.riot_id);
  console.log('📊 Mapped summoner name for sample:', memberNames[data[0]?.riot_id]);
  
  // Check if we have any data (historic or live)
  const hasHistoricData = data && data.length > 0;
  const hasLiveData = liveData && Object.keys(liveData).length > 0;
  
  if (!hasHistoricData && !hasLiveData) {
    console.log('⚠️ No data available for chart (no historic or live data)');
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 ${className}`} style={{ width, height }}>
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-600 mb-1">No Rank Data</p>
          <p className="text-sm text-gray-500">Rank progression data will appear here</p>
        </div>
      </div>
    );
  }

  // Group data by summoner name (already provided by backend)
  const groupedData: { [summonerName: string]: RankAuditEventWithName[] } = {};
  
  // Process historic data if available
  if (hasHistoricData) {
    data.forEach((event: RankAuditEventWithName) => {
      // Backend already adds summoner_name to each event
      const summonerName = event.summoner_name || event.riot_id;
      if (!groupedData[summonerName]) {
        groupedData[summonerName] = [];
      }
      groupedData[summonerName].push(event);
    });

    // Sort each member's data by date
    Object.keys(groupedData).forEach(summonerName => {
      groupedData[summonerName].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  }
  
  // Always add entries for all members with live data, regardless of historic data
  if (hasLiveData) {
    Object.keys(liveData).forEach(summonerName => {
      if (!groupedData[summonerName]) {
        groupedData[summonerName] = [];
      }
    });
  }

  // Helper function to normalize summoner names for consistent key matching
  const normalizeSummonerName = (name: string): string => {
    // Remove any special characters and normalize to lowercase for comparison
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Create a reverse mapping from normalized names to original names
  const reverseMemberNames: { [normalizedName: string]: string } = {};
  Object.entries(memberNames).forEach(([, summonerName]) => {
    const normalizedName = normalizeSummonerName(summonerName);
    reverseMemberNames[normalizedName] = summonerName;
  });

  // Create a mapping from live data keys to member names
  const liveDataToMemberName: { [liveDataKey: string]: string } = {};
  if (liveData) {
    Object.keys(liveData).forEach(liveDataKey => {
      const normalizedLiveKey = normalizeSummonerName(liveDataKey);
      // Try to find a match in the reverse mapping
      if (reverseMemberNames[normalizedLiveKey]) {
        liveDataToMemberName[liveDataKey] = reverseMemberNames[normalizedLiveKey];
      } else {
        // If no match found, use the original key
        liveDataToMemberName[liveDataKey] = liveDataKey;
      }
    });
  }

  console.log('🔍 TeamStatsChart Key matching debug info:');
  console.log('  Member names:', memberNames);
  console.log('  Reverse member names:', reverseMemberNames);
  console.log('  Live data keys:', liveData ? Object.keys(liveData) : []);
  console.log('  Live data to member name mapping:', liveDataToMemberName);

  // Helper function to truncate long names
  const truncateName = (name: string, maxLength: number = 8) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  // Transform data for Nivo
  const chartData = Object.keys(groupedData).map((summonerName) => {
    const events = groupedData[summonerName];
    const memberName = truncateName(summonerName);
    
    console.log(`🔍 Processing ${summonerName} (${events.length} events):`);
    events.forEach((event, index) => {
      console.log(`  Event ${index + 1}: ${event.created_at} | ELO: ${event.elo} | W:${event.wins} L:${event.losses}`);
    });
    
    // Start with historical data
    let chartPoints = events
      .filter(event => {
        if (!event.created_at) return false;
        const date = new Date(event.created_at);
        return !isNaN(date.getTime()) && date.getTime() > 0;
      })
      .map((event) => {
        const date = new Date(event.created_at);
        console.log('Processing date:', event.created_at, '-> formatted:', date.toLocaleDateString());
        
        // Normalize the date to noon of the same day to avoid time-based duplicates
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
        
        return {
          x: normalizedDate, // Use normalized date to avoid time-based duplicates
          y: event.elo,
          date: event.created_at,
          timestamp: date.getTime(), // Keep original timestamp for sorting
          displayDate: date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
          displayTime: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          wins: event.wins,
          losses: event.losses,
          isLive: false
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp); // Sort chronologically (backend handles filtering)
    
    console.log(`📊 Chart points for ${summonerName} (${chartPoints.length} points):`);
    chartPoints.forEach((point, index) => {
      console.log(`  Point ${index + 1}: ${point.x.toDateString()} | ELO: ${point.y} | Display: ${point.displayDate}`);
    });
    
    // Note: Live data is no longer added to charts - only date-based data is shown
    
    // Only include series that have data points
    if (chartPoints.length === 0) {
      return null;
    }
    
    return {
      id: memberName,
      data: chartPoints
    };
  }).filter(series => series !== null);

  // Keep x-axis as Date objects for proper chronological sorting
  chartData.forEach(series => {
    series.data.forEach(point => {
      // Keep x as Date object for proper sorting, but ensure displayDate is available for tooltips
      if (point.isLive) {
        (point as any).x = 'Current';
      }
      // For non-live data, x remains as Date object
    });
  });
  
  console.log('🎨 Transformed chart data for Nivo:', chartData);
  console.log('📊 Chart data structure:', JSON.stringify(chartData, null, 2));
  console.log('📊 Chart data length:', chartData.length);
  console.log('📊 First series data:', chartData[0]?.data);
  console.log('📊 Grouped data keys:', Object.keys(groupedData));
  console.log('📊 Member names mapping:', memberNames);
  console.log('📊 Chart series IDs:', chartData.map(series => series.id));
  console.log('📊 Live data available:', liveData);
  console.log('📊 Live data keys:', liveData ? Object.keys(liveData) : []);
  console.log('📊 Live data keys vs grouped data keys comparison:');
  if (liveData) {
    Object.keys(liveData).forEach(key => {
      console.log(`  Live data key: "${key}" - Found in groupedData: ${key in groupedData}`);
    });
  }

  // Debug: Check for duplicates in final chart data
  console.log('🔍 Checking for duplicates in final chart data:');
  chartData.forEach((series, seriesIndex) => {
    console.log(`\n📊 Series ${seriesIndex}: ${series.id}`);
    const dates = new Set();
    const duplicates: Array<{ pointIndex: number; dateKey: string; point: any }> = [];
    
    series.data.forEach((point, pointIndex) => {
      const dateKey = point.x instanceof Date ? point.x.toDateString() : point.x;
      if (dates.has(dateKey)) {
        duplicates.push({ pointIndex, dateKey, point });
      } else {
        dates.add(dateKey);
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`❌ Found ${duplicates.length} duplicates in series ${series.id}:`);
      duplicates.forEach(dup => {
        console.log(`   Point ${dup.pointIndex}: ${dup.dateKey} - ELO: ${dup.point.y}`);
      });
    } else {
      console.log(`✅ No duplicates found in series ${series.id}`);
    }
  });



  // Debug: Check for invalid timestamps
  chartData.forEach((series, seriesIndex) => {
    series.data.forEach((point, pointIndex) => {
      if (typeof point.x === 'string') {
        const date = new Date(point.x);
        if (isNaN(date.getTime())) {
          console.error(`Invalid date at series ${seriesIndex}, point ${pointIndex}:`, point.x);
        }
      }
    });
  });

  // Calculate smart tick values for x-axis (configurable max labels)
  const calculateSmartTickValues = (maxLabels: number = 10) => {
    // Get all unique dates from all series
    const allDates = new Set<Date>();
    chartData.forEach(series => {
      series.data.forEach(point => {
        if (point.x instanceof Date) {
          allDates.add(point.x);
        }
      });
    });

    const sortedDates = Array.from(allDates).sort((a, b) => a.getTime() - b.getTime());
    
    if (sortedDates.length <= maxLabels) {
      // If maxLabels or fewer dates, show all
      return sortedDates;
    }

    // If more than maxLabels dates, show evenly spaced labels by index (visual spacing)
    const step = Math.floor(sortedDates.length / (maxLabels - 1)); // maxLabels - 1 intervals = maxLabels labels
    const smartTicks = [];
    
    for (let i = 0; i < sortedDates.length; i += step) {
      smartTicks.push(sortedDates[i]);
      if (smartTicks.length >= maxLabels) break;
    }
    
    // Always include the last date
    if (smartTicks[smartTicks.length - 1] !== sortedDates[sortedDates.length - 1]) {
      smartTicks[smartTicks.length - 1] = sortedDates[sortedDates.length - 1];
    }
    
    return smartTicks;
  };

  // Calculate grid values for y-axis (horizontal grid lines)
  const calculateGridYValues = (numGridLines: number = 5) => {
    // Get min and max ELO values from all data
    let minElo = Infinity;
    let maxElo = -Infinity;
    
    chartData.forEach(series => {
      series.data.forEach(point => {
        if (typeof point.y === 'number') {
          minElo = Math.min(minElo, point.y);
          maxElo = Math.max(maxElo, point.y);
        }
      });
    });
    
    if (minElo === Infinity || maxElo === -Infinity) {
      return [];
    }
    
    // Calculate evenly spaced grid lines
    const range = maxElo - minElo;
    const step = range / (numGridLines - 1);
    const gridValues = [];
    
    for (let i = 0; i < numGridLines; i++) {
      gridValues.push(minElo + (step * i));
    }
    
    return gridValues;
  };

  const smartTickValues = calculateSmartTickValues(maxXAxisLabels);
  const gridYValues = calculateGridYValues(numGridLines);

  // Check if we have any valid data points after filtering
  const hasValidData = chartData.length > 0 && chartData.some(series => series && series.data.length > 0);

  if (!hasValidData) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 ${className}`} style={{ width, height }}>
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-600 mb-1">No Valid Rank Data</p>
          <p className="text-sm text-gray-500">Valid rank progression data will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${className}`}>
      <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-xs">
        <div className="w-5 h-5 bg-purple-500 rounded-lg flex items-center justify-center">
          <svg className="w-3 h-3 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        Team Rank Progression
      </h5>
      
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {chartData.map((series, index) => (
            <div key={series.id} className="flex items-center gap-1 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
              ></div>
              <span className="text-gray-600 font-medium">{series.id}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: height }}>
        <ResponsiveLine
          curve="monotoneX"
          data={chartData}
          margin={{ top: 50, right: 80, bottom: 100, left: 80 }}
          colors={chartData.map((_, index) => `hsl(${index * 60}, 70%, 50%)`)}
          xScale={{ 
            type: 'time',
            format: '%m-%d',
            useUTC: false,
            precision: 'day'
          }}
          yScale={{ 
            type: 'linear', 
            min: 'auto', 
            max: 'auto', 
            stacked: false, 
            reverse: false 
          }}
          axisBottom={{ 
            legend: 'Date', 
            legendOffset: 70,
            legendPosition: 'middle',
            tickRotation: -45,
            tickSize: 5,
            tickPadding: 8,
            format: '%m/%d',
            tickValues: smartTickValues
          }}
          axisLeft={{ 
            legend: 'ELO Rating', 
            legendOffset: -50 
          }}
          gridYValues={gridYValues}
          enableGridX={false}
          enableGridY={true}
          pointSize={8}
          pointBorderWidth={1}
          pointLabelYOffset={-20}
          enableTouchCrosshair={true}
          useMesh={true}
          legends={[]}
          tooltip={({ point }) => (
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg min-w-[200px] text-center">
              <div className="font-semibold text-gray-800 mb-1 flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {point.seriesId}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-2 mb-1">
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="whitespace-nowrap">
                  {point.data.isLive ? String(point.data.x) : point.data.displayDate}
                </span>
                {point.data.isLive && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    LIVE
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mb-1">
                {point.data.displayTime}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-2">
                <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                ELO: {point.data.y}
              </div>
              {point.data.wins !== undefined && (
                <div className="text-sm text-gray-600 flex items-center justify-center gap-4 mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>{point.data.wins}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                    <span>{point.data.losses}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
} 