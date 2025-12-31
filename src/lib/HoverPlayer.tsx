import { useState, useEffect, useRef } from "react";
import { getTopLevelReadableElementsOnPage } from "./parser";
import { useHoveredParagraphCoordinate } from "./hook";
import { speechify } from "./play";

// This is a simple play button SVG that you can use in your hover player
const PlayButton = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    id="play-icon"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      cursor: "pointer",
      background: "#6B78FC",
      borderRadius: "50%",
    }}
    {...props}
  >
    <path
      d="M16.3711 11.3506C16.8711 11.6393 16.8711 12.361 16.3711 12.6497L10.3711 16.1138C9.87109 16.4024 9.24609 16.0416 9.24609 15.4642L9.24609 8.53603C9.24609 7.95868 9.87109 7.59784 10.3711 7.88651L16.3711 11.3506Z"
      fill="white"
    />
  </svg>
);

/**
 * Implement a hover player that appears next to the paragraph when the user hovers over it
 * The hover player should contain a play button that when clicked, should play the text of the paragraph
 * This component should make use of the useHoveredParagraphCoordinate hook to get information about the hovered paragraph
 */
export default function HoverPlayer() {
  const [parsedElements, setParsedElements] = useState<HTMLElement[]>([]);
  const [isHoveringPlayer, setIsHoveringPlayer] = useState(false);
  const [lastHoveredInfo, setLastHoveredInfo] = useState<{
    element: HTMLElement;
    top: number;
    left: number;
    heightOfFirstLine: number;
  } | null>(null);

  // Parse elements on mount
  useEffect(() => {
    const elements = getTopLevelReadableElementsOnPage();
    setParsedElements(elements);
  }, []);

  // Get hovered element info
  const hoveredInfo = useHoveredParagraphCoordinate(parsedElements);

  // Update lastHoveredInfo when hovering a paragraph
  useEffect(() => {
    if (hoveredInfo) {
      setLastHoveredInfo(hoveredInfo);
    } else if (!isHoveringPlayer) {
      // Only clear if we're not hovering the player
      setLastHoveredInfo(null);
    }
  }, [hoveredInfo, isHoveringPlayer]);

  // Handle play button click
  const handlePlay = () => {
    const infoToUse = hoveredInfo || lastHoveredInfo;
    if (infoToUse?.element) {
      speechify(infoToUse.element);
    }
  };

  // Use either current hover or last hover (if hovering player)
  const displayInfo = hoveredInfo || (isHoveringPlayer ? lastHoveredInfo : null);

  // Don't render if nothing to show
  if (!displayInfo) {
    return null;
  }

  // Position the play button to the left of the element, vertically centered on the first line
  const buttonSize = 24;
  const offset = 8; // Gap between button and text

  const style: React.CSSProperties = {
    position: "absolute",
    top: displayInfo.top + (displayInfo.heightOfFirstLine - buttonSize) / 2,
    left: displayInfo.left - buttonSize - offset,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px", // Extra padding for easier hovering
  };

  return (
    <div
      id="hover-player"
      style={style}
      onMouseEnter={() => setIsHoveringPlayer(true)}
      onMouseLeave={() => setIsHoveringPlayer(false)}
    >
      <PlayButton onClick={handlePlay} />
    </div>
  );
}
