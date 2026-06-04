type DoneDanaDoneLogoProps = {
  className?: string
  markClassName?: string
  showWordmark?: boolean
  wordmarkClassName?: string
}

export default function DoneDanaDoneLogo({
  className = '',
  markClassName = 'h-8 w-auto',
  showWordmark = true,
  wordmarkClassName = 'font-display text-lg font-bold',
}: DoneDanaDoneLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`} aria-label="DoneDanaDone">
      <svg
        viewBox="0 0 280 92"
        className={markClassName}
        role="img"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 12H42C72.9 12 98 37.1 98 46C98 54.9 72.9 80 42 80H12V12Z"
          fill="currentColor"
          stroke="currentColor"
          strokeOpacity="0.24"
          strokeWidth="1.25"
        />
        <path
          d="M82 12H112C142.9 12 168 37.1 168 46C168 54.9 142.9 80 112 80H82V12Z"
          fill="currentColor"
          stroke="currentColor"
          strokeOpacity="0.24"
          strokeWidth="1.25"
        />
        <path
          d="M166 46C172.5 23.5 198.5 12 234 12C231.5 39.5 205 50.5 166 46Z"
          fill="currentColor"
          stroke="currentColor"
          strokeOpacity="0.24"
          strokeWidth="1.25"
        />
        <path
          d="M166 46C205 41.5 231.5 52.5 234 80C198.5 80 172.5 68.5 166 46Z"
          fill="currentColor"
          stroke="currentColor"
          strokeOpacity="0.24"
          strokeWidth="1.25"
        />
        <path
          d="M252 25L259.7 40.3L276 46L259.7 51.7L252 67L244.3 51.7L228 46L244.3 40.3L252 25Z"
          fill="#ffc400"
        />
      </svg>
      {showWordmark ? <span className={wordmarkClassName}>DoneDanaDone</span> : null}
    </span>
  )
}
