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
  if (!data || data.length === 0) {
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
  data.forEach(event => {
    const summonerName = memberNames[event.riot_id] || event.riot_id;
    if (!groupedData[summonerName]) {
      groupedData[summonerName] = [];
    }
    groupedData[summonerName].push(event);
  });

  // Helper function to truncate long names
  const truncateName = (name: string, maxLength: number = 8) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  // Create individual member data for average calculation
  const memberChartData = Object.keys(groupedData).map((summonerName, index) => {
    const events = groupedData[summonerName];
    const memberName = truncateName(memberNames[summonerName] || summonerName);
    
    // Start with historical data
    let chartPoints = events.map(event => ({
      x: event.created_at.split('T')[0],
      y: event.elo,
      wins: event.wins,
      losses: event.losses,
      isLive: false
    }));
    
    // Add live data point if available (find by riot_id in live data)
    let foundLiveData = null;
    if (liveData) {
      // Find the live data entry that matches this riot_id
      const liveDataEntry = Object.values(liveData).find(entry => entry.riot_id === summonerName);
      if (liveDataEntry) {
        foundLiveData = liveDataEntry;
        console.log(`✅ Found live data for riot_id ${summonerName}:`, foundLiveData);
      }
    }
    
    if (foundLiveData) {
      const livePoint = foundLiveData;
      chartPoints.push({
        x: 'Current',
        y: livePoint.elo,
        wins: livePoint.wins,
        losses: livePoint.losses,
        isLive: true
      });
    }
    
    return {
      id: memberName,
      color: `hsl(${index * 60}, 70%, 50%)`,
      data: chartPoints
    };
  });

  // Calculate average ELO data
  const calculateAverageChartData = () => {
    // Get all unique dates from all members (including live data)
    const allDates = new Set<string>();
    memberChartData.forEach(series => {
      series.data.forEach(point => {
        allDates.add(point.x as string);
      });
    });

    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort();

    // Calculate average ELO for each date
    const averageData = sortedDates.map(date => {
      const membersOnDate = memberChartData
        .map(series => series.data.find(point => point.x === date))
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

      // Check if this date has any live data points
      const hasLiveData = membersOnDate.some(point => (point as any).isLive);

      return {
        x: date,
        y: averageElo,
        memberCount: membersOnDate.length,
        totalWins: totalWins,
        totalLosses: totalLosses,
        isLive: hasLiveData
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
  console.log('📊 Member chart data (input for average):', memberChartData);
  console.log('📊 Member chart data with live points:', memberChartData.map(series => ({
    id: series.id,
    dataPoints: series.data.length,
    livePoints: series.data.filter(point => (point as any).isLive).length
  })));
  console.log('📊 Member names mapping:', memberNames);
  console.log('📊 Live data object:', liveData);

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
          margin={{ top: 50, right: 80, bottom: 100, left: 80 }}
          xScale={{ 
            type: 'point'
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
            tickPadding: 8
          }}
          axisLeft={{ 
            legend: 'Average ELO', 
            legendOffset: -50 
          }}
          pointSize={8}
          pointBorderWidth={1}
          pointLabelYOffset={-12}
          enableTouchCrosshair={true}
          useMesh={true}
          legends={[
            {
              anchor: 'top',
              direction: 'row',
              justify: false,
              translateX: 0,
              translateY: -20,
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
                  <span className="whitespace-nowrap">{point.data.x}</span>
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