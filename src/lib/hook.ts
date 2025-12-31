import { useState, useEffect } from "react";

/**
 * Gets bounding boxes for an element. This is implemented for you
 */
export function getElementBounds(elem: HTMLElement) {
  const bounds = elem.getBoundingClientRect();
  const top = bounds.top + window.scrollY;
  const left = bounds.left + window.scrollX;

  return {
    x: left,
    y: top,
    top,
    left,
    width: bounds.width,
    height: bounds.height,
  };
}

/**
 * Implement a function that checks if a point is inside an element
 */
export function isPointInsideElement(
  coordinate: { x: number; y: number },
  element: HTMLElement
): boolean {
  const bounds = getElementBounds(element);

  return (
    coordinate.x >= bounds.left &&
    coordinate.x <= bounds.left + bounds.width &&
    coordinate.y >= bounds.top &&
    coordinate.y <= bounds.top + bounds.height
  );
}

/**
 * Implement a function that returns the height of the first line of text in an element
 * We will later use this to size the HTML element that contains the hover player
 */
export function getLineHeightOfFirstLine(element: HTMLElement): number {
  // Walk through text nodes to find the first one with actual content
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  let textNode = walker.nextNode();

  // Find the first text node with non-whitespace content
  while (textNode) {
    const text = textNode.textContent || "";
    if (text.trim().length > 0) {
      break;
    }
    textNode = walker.nextNode();
  }

  if (!textNode || !textNode.parentElement) {
    // Fallback to element's computed style
    const computedStyle = window.getComputedStyle(element);
    const fontSize = parseFloat(computedStyle.fontSize);
    const lineHeight = computedStyle.lineHeight;

    if (lineHeight === "normal") {
      return fontSize * 1.2;
    }
    return parseFloat(lineHeight) || fontSize;
  }

  // Get the computed style of the parent element containing the text
  const parentElement = textNode.parentElement;
  const computedStyle = window.getComputedStyle(parentElement);
  const fontSize = parseFloat(computedStyle.fontSize);
  const lineHeight = computedStyle.lineHeight;

  // If line-height is "normal", use ~1.2 * fontSize
  if (lineHeight === "normal") {
    return fontSize * 1.2;
  }

  // If line-height is a number (like "1" or "1.5"), multiply by fontSize
  const lineHeightValue = parseFloat(lineHeight);

  // Check if it's a unitless number (e.g., "1") or a pixel value (e.g., "32px")
  if (lineHeight.endsWith("px")) {
    return lineHeightValue;
  }

  // Unitless line-height is a multiplier
  return fontSize * lineHeightValue;
}

export type HoveredElementInfo = {
  element: HTMLElement;
  top: number;
  left: number;
  heightOfFirstLine: number;
};

/**
 * Implement a React hook to be used to help to render hover player
 * Return the absolute coordinates on where to render the hover player
 * Returns null when there is no active hovered paragraph
 * Note: If using global event listeners, attach them window instead of document to ensure tests pass
 */
export function useHoveredParagraphCoordinate(
  parsedElements: HTMLElement[]
): HoveredElementInfo | null {
  const [hoveredInfo, setHoveredInfo] = useState<HoveredElementInfo | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Get mouse position with scroll offset
      const mouseX = event.clientX + window.scrollX;
      const mouseY = event.clientY + window.scrollY;

      const coordinate = { x: mouseX, y: mouseY };

      // Find which element is being hovered
      let foundElement: HTMLElement | null = null;

      for (const element of parsedElements) {
        if (isPointInsideElement(coordinate, element)) {
          foundElement = element;
          break;
        }
      }

      if (foundElement) {
        const bounds = getElementBounds(foundElement);
        const heightOfFirstLine = getLineHeightOfFirstLine(foundElement);

        setHoveredInfo({
          element: foundElement,
          top: bounds.top,
          left: bounds.left,
          heightOfFirstLine,
        });
      } else {
        setHoveredInfo(null);
      }
    };

    // Attach to window as per the note in the instructions
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [parsedElements]);

  return hoveredInfo;
}
