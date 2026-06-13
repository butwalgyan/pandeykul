export default function LoadingSpinner({ className = 'h-96', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-4 border-primary/20 border-t-primary rounded-full animate-spin`}
      />
    </div>
  );
}
