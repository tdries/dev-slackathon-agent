export function SlackLogo({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 124 124"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Slack"
    >
      <path
        d="M26 78a11 11 0 1 1 0-22h11v11a11 11 0 0 1-11 11z"
        fill="#E01E5A"
      />
      <path
        d="M31 78a11 11 0 0 1 22 0v27a11 11 0 1 1-22 0z"
        fill="#E01E5A"
      />
      <path
        d="M42 26a11 11 0 1 1 22 0v11H53a11 11 0 0 1-11-11z"
        fill="#36C5F0"
      />
      <path
        d="M42 31a11 11 0 0 1 0 22H15a11 11 0 1 1 0-22z"
        fill="#36C5F0"
      />
      <path
        d="M94 42a11 11 0 1 1 0 22H83V53a11 11 0 0 1 11-11z"
        fill="#2EB67D"
      />
      <path
        d="M89 42a11 11 0 0 1-22 0V15a11 11 0 1 1 22 0z"
        fill="#2EB67D"
      />
      <path
        d="M78 94a11 11 0 1 1-22 0V83h11a11 11 0 0 1 11 11z"
        fill="#ECB22E"
      />
      <path
        d="M78 89a11 11 0 0 1 0-22h27a11 11 0 1 1 0 22z"
        fill="#ECB22E"
      />
    </svg>
  );
}
