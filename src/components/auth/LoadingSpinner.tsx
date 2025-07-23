

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`loader border-t-2 rounded-full border-yellow-500 bg-yellow-300 animate-spin aspect-square ${sizeClasses[size]} flex justify-center items-center text-yellow-700 ${className}`}>
      $
    </div>
  )
} 