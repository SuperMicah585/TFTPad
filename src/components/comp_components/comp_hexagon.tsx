interface CompHexagonProps {
  champion?: {
    name: string;
    imageUrl: string;
    tier: number;
  };
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  isSelected?: boolean;
  starLevel?: number; // 0 = no stars, 3 = 3-star, 4 = 4-star
}

export function CompHexagon({ champion, onClick, isSelected, starLevel = 0 }: CompHexagonProps) {
  const getTierBackgroundColor = (tier: number): string => {
    const tierColors = {
      1: 'bg-gray-400',
      2: 'bg-green-400', 
      3: 'bg-blue-400',
      4: 'bg-purple-400',
      5: 'bg-yellow-400',
    };
    return tierColors[tier as keyof typeof tierColors] || 'bg-gray-400';
  };

  if (champion) {
    console.log(`CompHexagon for ${champion.name}: starLevel=${starLevel}`);
    {console.log(champion.tier)}
    return (
      <div className="relative">
        {/* Star overlay for starred units - positioned outside the hex */}
        {starLevel > 0 && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 flex flex-row gap-0.5 z-10">
            {Array.from({ length: starLevel }, (_, starIndex) => (
              <svg 
                key={starIndex} 
                className={`w-4 h-4 fill-current drop-shadow-lg stroke-black stroke-1 ${
                  starLevel === 4 ? 'text-green-400' : 'text-yellow-400'
                }`} 
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ))}
          </div>
        )}
        <div
          className={`w-20 p-1 ${isSelected ? 'hover:cursor-pointer hover:bg-orange-500' : ''} ${getTierBackgroundColor(champion.tier)}`}
          style={{
            aspectRatio: '1 / 0.866',
            clipPath: 'polygon(50% -50%, 100% 50%, 50% 150%, 0% 50%)'
          }}
          onClick={onClick}
        >
          <div
            className="w-full h-full relative overflow-hidden"
            style={{
              clipPath: 'polygon(50% -50%, 100% 50%, 50% 150%, 0% 50%)'
            }}
          >
            <img
              src={champion.imageUrl}
              alt={champion.name}
              className="w-full h-full object-cover object-center scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-600';
                fallback.textContent = champion.name;
                target.parentNode?.appendChild(fallback);
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
              <div className="text-white font-semibold text-xs text-center px-1 leading-tight max-w-full truncate">
                {champion.name}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-20 bg-gray-200 p-1"
      style={{
        aspectRatio: '1 / 0.866',
        clipPath: 'polygon(50% -50%, 100% 50%, 50% 150%, 0% 50%)'
      }}
      onClick={onClick}
    >
      <div
        className="w-full h-full bg-gray-300"
        style={{
          clipPath: 'polygon(50% -50%, 100% 50%, 50% 150%, 0% 50%)'
        }}
      />
    </div>
  );
}