import { vscForeground } from "..";

interface ContinueLogoProps {
  height?: number;
  width?: number;
}

export default function ContinueLogo({
  height = 36,
  width,
}: ContinueLogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--vscode-foreground, currentColor)" }}>
      <svg
        width={height ? height * 0.6 : 24}
        height={height ? height * 0.6 : 24}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M5 10H17V15C17 17.7614 14.7614 20 12 20H10C7.23858 20 5 17.7614 5 15V10Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M17 11H18.5C19.8807 11 21 12.1193 21 13.5C21 14.8807 19.8807 16 18.5 16H17" stroke="currentColor" stroke-width="1.5"/>
        <path d="M9 3C9 3 8 4.5 9 5.5C10 6.5 10 7.5 9 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M13 3C13 3 12 4.5 13 5.5C14 6.5 14 7.5 13 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="4" y1="20" x2="18" y2="20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span style={{ fontSize: height ? height * 0.5 : "18px", fontWeight: "bold", fontFamily: "Outfit, Inter, sans-serif" }}>
        Code Bhau
      </span>
    </div>
  );
}
