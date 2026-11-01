/**
 * iOS home-screen apps (standalone, default status bar) start the web view
 * below the status bar, yet some iOS versions still report the full status
 * bar height as env(safe-area-inset-top). Padding by it again leaves an empty
 * band above the lesson header. The web view being shorter than the screen
 * by at least the inset tells us the status bar is already outside the page.
 */
export function isTopInsetRedundant({
  standalone,
  screenHeight,
  screenWidth,
  viewportHeight,
  viewportWidth,
  insetTop,
}: {
  standalone: boolean;
  screenHeight: number;
  screenWidth: number;
  viewportHeight: number;
  viewportWidth: number;
  insetTop: number;
}): boolean {
  if (!standalone || insetTop <= 0) return false;
  // Portrait only. Landscape screen sizes swap between browsers.
  if (viewportWidth > viewportHeight) return false;
  const screenTall = Math.max(screenHeight, screenWidth);
  return screenTall - viewportHeight >= insetTop - 2;
}
