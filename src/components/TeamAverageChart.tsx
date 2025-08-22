import { ResponsiveLine } from '@nivo/line';
import type { RankAuditEvent } from '../services/teamStatsService';
import type { LivePlayerData } from '../services/livePlayerService';

interface TeamAverageChartProps {
  data: RankAuditEvent[];
  memberNames: { [riotId: string]: string };
  liveData?: { [summonerName: string]: LivePlayerData };
  height?: number;
  className?: string;
}

export function TeamAverageChart({ 
  data, 
  memberNames, 
  liveData,
  height = 400, 
  className = '' 
}: TeamAverageChartProps) {
  // Check if we have any data (historic or live)
  const hasHistoricData = data && data.length > 0;
  const hasLiveData = liveData && Object.keys(liveData).length > 0;
  
  if (!hasHistoricData && !hasLiveData) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-100 p-6 ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <p className="text-gray-500">No team average data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Group data by summoner name
  const groupedData: { [summonerName: string]: RankAuditEvent[] } = {};
  
  // Process historic data if available
  if (hasHistoricData) {
    data.forEach(event => {
      // Use the mapped summoner name from memberNames, or fall back to riot_id
      const summonerName = memberNames[event.riot_id] || event.riot_id;
      if (!groupedData[summonerName]) {
        groupedData[summonerName] = [];
      }
      groupedData[summonerName].push(event);
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

  console.log('🔍 Key matching debug info:');
  console.log('  Member names:', memberNames);
  console.log('  Reverse member names:', reverseMemberNames);
  console.log('  Live data keys:', liveData ? Object.keys(liveData) : []);
  console.log('  Live data to member name mapping:', liveDataToMemberName);

  // Helper function to truncate long names
  const truncateName = (name: string, maxLength: number = 8) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  // Create individual member data for average calculation
  const memberChartData = Object.keys(groupedData).map((summonerName, index) => {
    const events = groupedData[summonerName];
    const memberName = truncateName(summonerName);
    
    // Start with historical data
    let chartPoints = events.map(event => {
      const date = new Date(event.created_at);
      return {
        x: date, // Use Date object for time scale
        y: event.elo,
        wins: event.wins,
        losses: event.losses,
        isLive: false,
        displayDate: date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
      };
    });
    
    // Note: Live data is no longer added to charts - only date-based data is shown
    
    // Only include series that have data points
    if (chartPoints.length === 0) {
      return null;
    }
    
    return {
      id: memberName,
      color: `hsl(${index * 60}, 70%, 50%)`,
      data: chartPoints
    };
  }).filter(series => series !== null);

  // Calculate average ELO data
  const calculateAverageChartData = () => {
    // Get all unique dates from all members
    const allDates = new Set<Date>();
    memberChartData.forEach(series => {
      series.data.forEach(point => {
        if (point.x instanceof Date) {
          allDates.add(point.x);
        }
      });
    });

    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort((a, b) => a.getTime() - b.getTime());

    // Calculate average ELO for each date
    const averageData = sortedDates.map(date => {
      const membersOnDate = memberChartData
        .map(series => series.data.find(point => {
          if (point.x instanceof Date) {
            return point.x.toDateString() === date.toDateString();
          }
          return false;
        }))
        .filter(point => point !== undefined);

      if (membersOnDate.length === 0) return null;

      const totalElo = membersOnDate.reduce((sum, point) => sum + (point?.y as number), 0);
      const averageElo = Math.round(totalElo / membersOnDate.length);

      // Calculate total wins and losses for the team on this date
      const totalWins = membersOnDate.reduce((sum, point) => {
        return sum + ((point as any).wins || 0);
      }, 0);
      
      const totalLosses = membersOnDate.reduce((sum, point) => {
        return sum + ((point as any).losses || 0);
      }, 0);
      
      // Log details for the most recent date
      if (date.toDateString() === sortedDates[sortedDates.length - 1].toDateString()) {
        console.log('📊 Team Average - Most recent date calculation:', {
          date: date.toDateString(),
          membersOnDate: membersOnDate.map(p => ({
            wins: (p as any).wins,
            losses: (p as any).losses
          })),
          totalWins: totalWins,
          totalLosses: totalLosses
        });
      }

      // Check if this date has any live data points
      const hasLiveData = membersOnDate.some(point => (point as any).isLive);

      return {
        x: date,
        y: averageElo,
        memberCount: membersOnDate.length,
        totalWins: totalWins,
        totalLosses: totalLosses,
        isLive: hasLiveData,
        displayDate: date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
      };
    }).filter(point => point !== null);

    return [{
      id: 'Team Average',
      color: '#3B82F6', // Blue color for team average
      data: averageData
    }];
  };

  const averageChartData = calculateAverageChartData();
  console.log('📊 Team Average chart data:', averageChartData);
  console.log('📊 Team Average live data points:', averageChartData[0]?.data.filter(point => (point as any).isLive));
  
  // Log the latest data point details
  if (averageChartData[0] && averageChartData[0].data.length > 0) {
    const latestPoint = averageChartData[0].data[averageChartData[0].data.length - 1];
    console.log('📊 Team Average - Latest point:', {
      date: latestPoint.x,
      totalWins: latestPoint.totalWins,
      totalLosses: latestPoint.totalLosses,
      memberCount: latestPoint.memberCount
    });
  }
  console.log('📊 Member chart data (input for average):', memberChartData);
  console.log('📊 Member chart data with live points:', memberChartData.map(series => ({
    id: series.id,
    dataPoints: series.data.length,
    livePoints: series.data.filter(point => (point as any).isLive).length
  })));
  console.log('📊 Member names mapping:', memberNames);
  console.log('📊 Live data object:', liveData);
  console.log('📊 Grouped data keys:', Object.keys(groupedData));
  console.log('📊 Live data keys vs grouped data keys comparison:');
  if (liveData) {
    Object.keys(liveData).forEach(key => {
      console.log(`  Live data key: "${key}" - Found in groupedData: ${key in groupedData}`);
    });
  }

  // Calculate smart tick values for x-axis (max 10 labels with even visual spacing)
  const calculateSmartTickValues = () => {
    if (!averageChartData[0] || averageChartData[0].data.length === 0) {
      return [];
    }

    const allDates = averageChartData[0].data.map(point => point.x as Date);
    
    if (allDates.length <= 10) {
      // If 10 or fewer dates, show all
      return allDates;
    }

    // If more than 10 dates, show evenly spaced labels by index (visual spacing)
    const step = Math.floor(allDates.length / 9); // 9 intervals = 10 labels
    const smartTicks = [];
    
    for (let i = 0; i < allDates.length; i += step) {
      smartTicks.push(allDates[i]);
      if (smartTicks.length >= 10) break;
    }
    
    // Always include the last date
    if (smartTicks[smartTicks.length - 1] !== allDates[allDates.length - 1]) {
      smartTicks[smartTicks.length - 1] = allDates[allDates.length - 1];
    }
    
    return smartTicks;
  };

  const smartTickValues = calculateSmartTickValues();

  return (
    <div className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${className}`}>
      <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-xs">
        <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center">
          <svg className="w-3 h-3 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        Team Average Performance
      </h5>
      
      <div style={{ height: height }}>
        <ResponsiveLine
          curve="monotoneX"
          
          data={averageChartData}
          margin={{ top: 120, right: 80, bottom: 100, left: 80 }}
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
            legend: 'Average ELO', 
            legendOffset: -50 
          }}
          pointSize={8}
          pointBorderWidth={1}
          pointLabelYOffset={-20}
          enableTouchCrosshair={true}
          useMesh={true}
          legends={[
            {
              anchor: 'top',
              direction: 'row',
              justify: false,
              translateX: 0,
              translateY: -40,
              itemWidth: 120,
              itemHeight: 20,
              symbolShape: 'circle',
              symbolSize: 12,
              itemTextColor: '#666',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: '#000'
                  }
                }
              ]
            }
          ]}
                      tooltip={({ point }) => (
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg min-w-[200px] text-center">
                <div className="font-semibold text-gray-800 mb-1 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Team Average
                </div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-2 mb-1">
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="whitespace-nowrap">{point.data.displayDate || (point.data.x instanceof Date ? point.data.x.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) : String(point.data.x))}</span>
                  {point.data.isLive && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      LIVE
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-2">
                  <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Average ELO: {point.data.y}
                </div>
                {point.data.totalWins !== undefined && point.data.totalLosses !== undefined && (
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-4 mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>{point.data.totalWins}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                      <span>{point.data.totalLosses}</span>
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