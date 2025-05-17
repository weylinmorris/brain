import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { getDeviceName, getDeviceLocation } from '../build/utils/metadataUtils.js';

// Clean up global changes after each test
afterEach(() => {
  delete global.navigator;
  delete global.GeolocationPositionError;
});

test('getDeviceName returns user agent string', () => {
  Object.defineProperty(global, 'navigator', {
    configurable: true,
    value: { userAgent: 'TestAgent' },
  });
  assert.equal(getDeviceName(), 'TestAgent');
});

test('getDeviceName returns Unknown Device when no userAgent', () => {
  Object.defineProperty(global, 'navigator', {
    configurable: true,
    value: {},
  });
  assert.equal(getDeviceName(), 'Unknown Device');
});

test('getDeviceLocation returns null when geolocation unsupported', async () => {
  Object.defineProperty(global, 'navigator', {
    configurable: true,
    value: {},
  });
  const res = await getDeviceLocation();
  assert.equal(res, null);
});

test('getDeviceLocation resolves to lat/lng', async () => {
  Object.defineProperty(global, 'navigator', {
    configurable: true,
    value: {
      geolocation: {
        getCurrentPosition: (success) => {
          success({ coords: { latitude: 10, longitude: 20 } });
        },
      },
    },
  });
  const res = await getDeviceLocation();
  assert.deepEqual(res, { lat: 10, lng: 20 });
});

test('getDeviceLocation handles permission denied error', async () => {
  class MockGeoError extends Error {
    constructor(code) { super(); this.code = code; }
    static PERMISSION_DENIED = 1;
  }
  global.GeolocationPositionError = MockGeoError;
  Object.defineProperty(global, 'navigator', {
    configurable: true,
    value: {
      geolocation: {
        getCurrentPosition: (_s, err) => {
          err(new MockGeoError(MockGeoError.PERMISSION_DENIED));
        },
      },
    },
  });
  const res = await getDeviceLocation();
  assert.equal(res, null);
});
