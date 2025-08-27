import { ResponsiveLine } from '@nivo/line';
import type { PlayerRankAuditEvent } from '../services/playerStatsService';

interface PlayerEloChartProps {
  data: PlayerRankAuditEvent[];
  liveData?: any; // Current live data from league API
  height?: number;
  className?: string;
  maxXAxisLabels?: number;
}

export function PlayerEloChart({ data, liveData, height = 500, className = '', maxXAxisLabels = 5 }: PlayerEloChartProps) {
  // Function to convert rank to ELO (same as backend)
  const rankToElo = (rankStr: string): number => {
    if (!rankStr || rankStr === 'UNRANKED') return 0;
    
    const parts = rankStr.split(' ');
    if (parts.length < 2) return 0;
    
    const tier = parts[0].toLowerCase();
    const rank = parts[1];
    const lp = parseInt(parts[2]) || 0;
    
    const tierValues: { [key: string]: number } = {
      'iron': 0,
      'bronze': 400,
      'silver': 800,
      'gold': 1200,
      'platinum': 1600,
      'emerald': 2000,
      'diamond': 2400,
      'master': 2800,
      'grandmaster': 2800,
      'challenger': 2800
    };
    
    const rankValues: { [key: string]: number } = {
      'IV': 0,
      'III': 100,
      'II': 200,
      'I': 300
    };
    
    const tierValue = tierValues[tier] || 0;
    
    // For Master+ tiers, don't add rank values, just use LP directly
    if (tier === 'master' || tier === 'grandmaster' || tier === 'challenger') {
      return tierValue + lp;
    }
    
    const rankValue = rankValues[rank] || 0;
    return tierValue + rankValue + lp;
  };

  // Check if we have any data (historic or live)
  const hasHistoricData = data && data.length > 0;
  const hasLiveData = liveData && liveData.tier;

  if (!hasHistoricData && !hasLiveData) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-600">No ELO data available</p>
      </div>
    );
  }

  // Transform data for Nivo chart
  const chartData = [
    {
      id: 'ELO Rating',
      color: '#3B82F6',
      data: [
        // Add historic data points if available
        ...(hasHistoricData ? data
          .filter(event => {
            if (!event.created_at) return false;
            const date = new Date(event.created_at);
            return !isNaN(date.getTime()) && date.getTime() > 0;
          })
          .map((event, index) => {
            const date = new Date(event.created_at);
            console.log('Processing date:', event.created_at, '-> formatted:', date.toLocaleDateString());
            return {
              x: `${date.toLocaleDateString()} ${index}`, // Use formatted date with index for uniqueness
              y: event.elo,
              date: event.created_at,
              timestamp: date.getTime(), // Keep timestamp for sorting
              displayDate: date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
              displayTime: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              wins: event.wins,
              losses: event.losses,
              isLive: false
            };
          })
          .sort((a, b) => a.timestamp - b.timestamp) // Sort chronologically (backend handles filtering)
          .map((item, index) => ({
            ...item,
            x: `${item.displayDate} ${index}` // Recreate x value with new index
          })) : []),
        // Add live data point if available
        ...(hasLiveData ? [{
          x: 'Current',
          y: rankToElo(`${liveData.tier} ${liveData.rank} ${liveData.leaguePoints}`),
          date: new Date().toISOString(),
          displayDate: 'Current',
          displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          wins: liveData.wins,
          losses: liveData.losses,
          isLive: true
        }] : [])
      ]
    }
  ];

  // Calculate smart tick values for x-axis (configurable max labels)
  const calculateSmartTickValues = (maxLabels: number = 5) => {
    const allDates = chartData[0].data.map(point => point.displayDate);
    const uniqueDates = [...new Set(allDates)];
    
    if (uniqueDates.length <= maxLabels) {
      // If maxLabels or fewer dates, show all
      return uniqueDates.map(date => {
        if (date === 'Current') return 'Current';
        // Find the first data point for this date and use its exact x value
        const firstPointForDate = chartData[0].data.find(point => point.displayDate === date);
        return firstPointForDate ? firstPointForDate.x : date;
      });
    }

    // If more than maxLabels dates, show evenly spaced labels by index (visual spacing)
    const step = Math.floor(uniqueDates.length / (maxLabels - 1)); // maxLabels - 1 intervals = maxLabels labels
    const smartTicks = [];
    
    for (let i = 0; i < uniqueDates.length; i += step) {
      const date = uniqueDates[i];
      if (date === 'Current') {
        smartTicks.push('Current');
      } else {
        // Find the first data point for this date and use its exact x value
        const firstPointForDate = chartData[0].data.find(point => point.displayDate === date);
        smartTicks.push(firstPointForDate ? firstPointForDate.x : date);
      }
      if (smartTicks.length >= maxLabels) break;
    }
    
    // Always include the last date
    if (smartTicks[smartTicks.length - 1] !== uniqueDates[uniqueDates.length - 1]) {
      const lastDate = uniqueDates[uniqueDates.length - 1];
      if (lastDate === 'Current') {
        smartTicks[smartTicks.length - 1] = 'Current';
      } else {
        const firstPointForDate = chartData[0].data.find(point => point.displayDate === lastDate);
        smartTicks[smartTicks.length - 1] = firstPointForDate ? firstPointForDate.x : lastDate;
      }
    }
    
    return smartTicks;
  };

  const smartTickValues = calculateSmartTickValues(maxXAxisLabels);

  console.log('Chart data being passed to Nivo:', chartData);

  // Check if we have any valid data points after filtering
  const hasValidData = chartData[0] && chartData[0].data.length > 0;

  if (!hasValidData) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-600">No valid ELO data available</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${className}`}>
      <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-xs">
        <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center">
          <svg className="w-3 h-3 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        ELO Progression
      </h5>
      
      <div style={{ height: height }}>
        <ResponsiveLine
          data={chartData}
          margin={{ top: 120, right: 80, bottom: 100, left: 80 }}
          xScale={{ 
            type: 'point'
          }}
          yScale={{ 
            type: 'linear', 
            min: 'auto', 
            max: 'auto',
            stacked: false 
          }}
          curve="monotoneX"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 8,
            tickRotation: -45,
            legend: 'Date',
            legendOffset: 70,
            legendPosition: 'middle',
            // Show smart labels - max 10 labels at even intervals
            tickValues: smartTickValues,
            // Custom tick format to show just the date part
            format: (value) => {
              if (value === 'Current') return 'Current';
              // Extract just the date part (before the space and index)
              return value.split(' ')[0];
            }
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'ELO Rating',
            legendOffset: -60,
            legendPosition: 'middle'
          }}
          pointSize={8}
          pointBorderWidth={1}
          pointLabelYOffset={-20}
          useMesh={true}
          legends={[
            {
              anchor: 'top',
              direction: 'row',
              justify: false,
              translateX: 0,
              translateY: -40,
              itemsSpacing: 0,
              itemDirection: 'left-to-right',
              itemWidth: 120,
              itemHeight: 20,
              symbolSize: 12,
              symbolShape: 'circle',
              symbolBorderColor: 'rgba(0, 0, 0, .5)',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemBackground: 'rgba(0, 0, 0, .03)',
                    itemOpacity: 1
                  }
                }
              ]
            }
          ]}
          tooltip={({ point }) => (
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg min-w-[200px] text-center">
              <div className="font-semibold text-gray-800 flex items-center justify-center gap-2 mb-1">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="whitespace-nowrap">{point.data.displayDate}</span>
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
          theme={{
            axis: {
              domain: {
                line: {
                  stroke: '#ddd',
                  strokeWidth: 1
                }
              },
              ticks: {
                line: {
                  stroke: '#ddd',
                  strokeWidth: 1
                },
                text: {
                  fill: '#666',
                  fontSize: 11
                }
              },
              legend: {
                text: {
                  fill: '#666',
                  fontSize: 12,
                  fontWeight: 600
                }
              }
            },
            grid: {
              line: {
                stroke: '#f0f0f0',
                strokeWidth: 1
              }
            }
          }}
        />
      </div>
    </div>
  );
} 