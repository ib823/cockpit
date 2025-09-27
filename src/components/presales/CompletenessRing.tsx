// Completeness Ring Component - Visual progress indicator for requirements completion
'use client';


interface CompletenessRingProps {
  score: number;           // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'w-12 h-12',
    svg: 'w-12 h-12',
    stroke: 2,
    radius: 18,
    textSize: 'text-xs'
  },
  md: {
    container: 'w-16 h-16', 
    svg: 'w-16 h-16',
    stroke: 3,
    radius: 26,
    textSize: 'text-sm'
  },
  lg: {
    container: 'w-24 h-24',
    svg: 'w-24 h-24', 
    stroke: 4,
    radius: 38,
    textSize: 'text-base'
  }
};

function getScoreColor(score: number): { ring: string; background: string; text: string } {
  if (score >= 80) {
    return {
      ring: 'stroke-green-500',
      background: 'bg-green-50', 
      text: 'text-green-700'
    };
  } else if (score >= 60) {
    return {
      ring: 'stroke-amber-500',
      background: 'bg-amber-50',
      text: 'text-amber-700'
    };
  } else {
    return {
      ring: 'stroke-red-500', 
      background: 'bg-red-50',
      text: 'text-red-700'
    };
  }
}

function getScoreStatus(score: number): string {
  if (score >= 80) return 'Ready';
  if (score >= 60) return 'Good'; 
  if (score >= 40) return 'Partial';
  return 'Started';
}

export function CompletenessRing({ 
  score, 
  size = 'md', 
  showLabel = true, 
  className = '' 
}: CompletenessRingProps) {
  const config = sizeConfig[size];
  const colors = getScoreColor(score);
  const status = getScoreStatus(score);
  
  // SVG circle calculations
  const circumference = 2 * Math.PI * config.radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className={`relative ${config.container}`}>
        {/* Background circle */}
        <div className={`absolute inset-0 rounded-full ${colors.background}`} />
        
        {/* Progress SVG */}
        <svg className={`${config.svg} transform -rotate-90`} viewBox="0 0 100 100">
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={config.radius}
            stroke="currentColor"
            strokeWidth={config.stroke}
            fill="none"
            className="text-gray-200"
          />
          
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={config.radius}
            stroke="currentColor"
            strokeWidth={config.stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-500 ease-out ${colors.ring}`}
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-semibold tabular-nums ${config.textSize} ${colors.text}`}>
            {score}%
          </span>
        </div>
      </div>
      
      {showLabel && (
        <div className="text-center">
          <div className={`text-xs font-medium ${colors.text}`}>
            {status}
          </div>
          <div className="text-xs text-gray-500">
            Completeness
          </div>
        </div>
      )}
    </div>
  );
}

// Alternative linear progress bar version
interface CompletenessBarProps {
  score: number;
  showDetails?: boolean;
  className?: string;
}

export function CompletenessBar({ score, showDetails = true, className = '' }: CompletenessBarProps) {
  const colors = getScoreColor(score);
  const status = getScoreStatus(score);

  return (
    <div className={`space-y-2 ${className}`}>
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-900">Completeness</span>
          <span className={`font-semibold ${colors.text}`}>
            {score}% {status}
          </span>
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ease-out ${
            score >= 80 ? 'bg-green-500' : 
            score >= 60 ? 'bg-amber-500' : 
            'bg-red-500'
          }`}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );
}

export default CompletenessRing;