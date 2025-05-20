import { GlobalWindow } from 'happy-dom';
import requestUserAgentClientHints from './userAgentClientHints.ts';

describe('requestUserAgentClientHints', () => {
  let window: Window;

  beforeEach(() => {
    window = new GlobalWindow() as unknown as Window;
  });

  it('throws if `isSecureContext` = false, `navigator.userAgentData` = undefined', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
    });
    await expect(requestUserAgentClientHints(window)).rejects.toThrowError(
      'User-Agent Client Hints API not available - `window.isSecureContext` = false'
    );
  });

  it('throws if `isSecureContext` = true, `navigator.userAgentData` = undefined', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
    });
    await expect(requestUserAgentClientHints(window)).rejects.toThrowError(
      'User-Agent Client Hints API not available - `navigator.userAgentData` = undefined'
    );
  });

  it('returns data and maps windows version', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
    });
    Object.defineProperty(window.navigator, 'userAgentData', {
      value: {
        getHighEntropyValues: () => {
          return Promise.resolve({
            architecture: 'x86',
            brands: [
              {
                brand: 'Chromium',
                version: '136',
              },
              {
                brand: 'Microsoft Edge',
                version: '136',
              },
            ],
            mobile: false,
            model: '',
            platform: 'Windows',
            platformVersion: '19.0.0',
            fullVersionList: [
              {
                brand: 'Chromium',
                version: '136.0.7103.113',
              },
              {
                brand: 'Microsoft Edge',
                version: '136.0.3240.76',
              },
            ],
          } satisfies UserAgentHighEntropyValues);
        },
      },
    });
    const data = await requestUserAgentClientHints(window);
    expect(data).not.toBeUndefined();
    expect(data?.platformVersion).toBe('11.0.0');
    expect(data?.platform).toBe('Windows');
    expect(data?.architecture).toBe('x86');
    expectTypeOf(data).toEqualTypeOf<Readonly<UserAgentHighEntropyValues>>();
  });
});
