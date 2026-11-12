/**
 * Native (Android) integration for TrackStack.
 *
 * Everything here is a no-op on the web build: the plugins are imported
 * lazily so the browser bundle never pays for them.
 */
import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();

/**
 * Wires up the native shell: status bar styling, the Android hardware back
 * button, the software keyboard and the splash screen.
 */
export async function initNative() {
  if (!isNative()) return;

  // Lets the stylesheet treat the native shell differently from a browser tab.
  document.body.classList.add('is-native');

  const [{ StatusBar, Style }, { Keyboard, KeyboardResize }, { App }] = await Promise.all([
    import('@capacitor/status-bar'),
    import('@capacitor/keyboard'),
    import('@capacitor/app'),
  ]);

  // Dark background, light text, and the web view starts below the bar.
  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: '#1e1a18' });
  await StatusBar.setOverlaysWebView({ overlay: false });

  // The keyboard floats over the page instead of resizing the layout, which
  // keeps the bottom tab dock where the thumb expects it.
  await Keyboard.setResizeMode({ mode: KeyboardResize.None });

  // The hardware back button walks the app's own history before it exits.
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack && window.history.length > 1) window.history.back();
    else App.exitApp();
  });
}

/**
 * A light haptic tap. Used sparingly, for actions that feel like pressing a
 * physical button.
 */
export async function tapFeedback() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Haptics are a nicety, never a requirement.
  }
}
