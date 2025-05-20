export default async function requestUserAgentClientHints(window: Window) {
  if (!window.isSecureContext) {
    throw new Error(
      'User-Agent Client Hints API not available - `window.isSecureContext` = false'
    );
  }

  if (!('userAgentData' in window.navigator)) {
    throw new Error(
      'User-Agent Client Hints API not available - `navigator.userAgentData` = undefined'
    );
  }

  const data = await window.navigator.userAgentData.getHighEntropyValues([
    'architecture',
    'model',
    'platform',
    'platformVersion',
    'fullVersionList',
  ]);

  // Map Windows version, see:
  // https://learn.microsoft.com/en-us/microsoft-edge/web-platform/how-to-detect-win11
  if (data.platform === 'Windows') {
    const [major, minor, patch] = data.platformVersion.split('.').map(Number);
    if (major >= 13) {
      data.platformVersion = `11.${minor}.${patch}`;
    } else if (major >= 1) {
      data.platformVersion = `10.${minor}.${patch}`;
    } else {
      data.platformVersion = `7.${minor}.${patch}`;
    }
  }

  return data as Readonly<UserAgentHighEntropyValues>;
}
