import { chromium } from 'playwright-core';

/**
 * Abre el navegador de las pruebas E2E de forma reproducible.
 *
 * - En Windows usa Edge, que ya está instalado en desarrollo y en GitHub Actions.
 * - En Linux/macOS usa el Chromium instalado por Playwright.
 * - E2E_BROWSER_CHANNEL permite forzar `msedge`, `chrome` o `chromium`.
 * - E2E_BROWSER_PATH permite indicar un ejecutable concreto.
 */
export function launchE2eBrowser() {
  const requestedChannel = process.env.E2E_BROWSER_CHANNEL?.trim();
  const executablePath = process.env.E2E_BROWSER_PATH?.trim();
  const channel = requestedChannel || (process.platform === 'win32' ? 'msedge' : undefined);

  return chromium.launch({
    headless: true,
    ...(channel && channel !== 'chromium' ? { channel } : {}),
    ...(executablePath ? { executablePath } : {}),
  });
}
