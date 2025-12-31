/**
 * List of HTML tags that we want to ignore when finding the top level readable elements
 * These elements should not be chosen while rendering the hover player
 */
const IGNORE_LIST = [
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BUTTON",
  "LABEL",
  "SPAN",
  "IMG",
  "PRE",
  "SCRIPT",
];

/**
 * Check if an element is in the ignore list
 */
function isInIgnoreList(element: HTMLElement): boolean {
  return IGNORE_LIST.includes(element.tagName);
}

/**
 * Check if an element has non-empty text content
 */
function hasTextContent(element: HTMLElement): boolean {
  const text = element.textContent?.trim() || "";
  return text.length > 0;
}

/**
 * Get the number of element children (excluding text nodes and comments)
 */
function getElementChildCount(element: HTMLElement): number {
  return Array.from(element.children).filter(
    (child) => child.nodeType === Node.ELEMENT_NODE
  ).length;
}

/**
 * Check if an element contains only one child element chain leading to readable content
 * Returns the deepest element if true, otherwise null
 */
function getDeepestSingleChildElement(element: HTMLElement): HTMLElement {
  let current = element;

  while (getElementChildCount(current) === 1) {
    const child = current.children[0] as HTMLElement;
    if (!child || isInIgnoreList(child)) {
      break;
    }
    current = child;
  }

  return current;
}

/**
 * Find the top-level ancestor that has only single-child chain to this element
 */
function findTopLevelAncestor(element: HTMLElement, bodyElement: HTMLElement): HTMLElement {
  let current = element;
  let topLevel = element;

  while (current.parentElement && current.parentElement !== bodyElement) {
    const parent = current.parentElement;

    // If parent has only one element child, the parent becomes the top level
    if (getElementChildCount(parent) === 1) {
      topLevel = parent;
      current = parent;
    } else {
      break;
    }
  }

  return topLevel;
}

/**
 * Recursively find readable elements
 */
function findReadableElements(element: HTMLElement, bodyElement: HTMLElement, result: Set<HTMLElement>): void {
  // Skip if in ignore list
  if (isInIgnoreList(element)) {
    return;
  }

  // Skip if no text content
  if (!hasTextContent(element)) {
    return;
  }

  const children = Array.from(element.children) as HTMLElement[];
  const elementChildren = children.filter(child => child.nodeType === Node.ELEMENT_NODE);

  // Filter out ignored children for counting readable children
  const readableChildren = elementChildren.filter(child => !isInIgnoreList(child) && hasTextContent(child));

  if (readableChildren.length === 0) {
    // This is a leaf element with text, find its top-level ancestor
    const topLevel = findTopLevelAncestor(element, bodyElement);
    result.add(topLevel);
  } else if (readableChildren.length === 1) {
    // Single readable child - go deeper
    findReadableElements(readableChildren[0], bodyElement, result);
  } else {
    // Multiple readable children - each is potentially a top-level element
    for (const child of readableChildren) {
      findReadableElements(child, bodyElement, result);
    }
  }
}

/**
 *  Implement a function that returns all the top level readable elements on the page, keeping in mind the ignore list.
 *  Start Parsing inside the body element of the HTMLPage.
 */
export function getTopLevelReadableElementsOnPage(): HTMLElement[] {
  const body = document.body;
  const result = new Set<HTMLElement>();

  // Start from body's children
  const children = Array.from(body.children) as HTMLElement[];

  for (const child of children) {
    // Skip the root div (where React renders)
    if (child.id === "root") {
      continue;
    }

    findReadableElements(child, body, result);
  }

  // Convert Set to Array and return in document order
  const allElements = Array.from(result);

  // Sort by document position to maintain order
  allElements.sort((a, b) => {
    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
      return -1;
    } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    }
    return 0;
  });

  return allElements;
}
