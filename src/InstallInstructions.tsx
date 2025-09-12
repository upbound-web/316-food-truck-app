import { useState, useEffect } from 'react';

interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isMobile: boolean;
}

export function InstallInstructions({ onClose }: { onClose: () => void }) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isMobile: false
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    const isMobile = /Mobi|Android/i.test(userAgent);

    setDeviceInfo({
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      isMobile
    });
  }, []);

  const getDeviceSpecificInstructions = () => {
    if (deviceInfo.isIOS) {
      return (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center">
              <span className="mr-2">📱</span>
              iPhone/iPad (Safari)
            </h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">1</span>
                <span>Open this website in <strong>Safari</strong> browser</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">2</span>
                <span>Tap the <strong>Share</strong> button <svg className="w-4 h-4 inline mx-1" fill="currentColor" viewBox="0 0 20 20"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/></svg> at the bottom of the screen</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">3</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong> <svg className="w-4 h-4 inline mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">4</span>
                <span>Tap <strong>"Add"</strong> to confirm</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">✓</span>
                <span>The Coffee App icon will appear on your home screen!</span>
              </li>
            </ol>
          </div>
        </div>
      );
    } else if (deviceInfo.isAndroid) {
      return (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center">
              <span className="mr-2">🤖</span>
              Android (Chrome)
            </h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">1</span>
                <span>Open this website in <strong>Chrome</strong> browser</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">2</span>
                <span>Look for the <strong>"Install"</strong> banner at the bottom, or</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">3</span>
                <span>Tap the <strong>menu</strong> (⋮) in the top-right corner</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">4</span>
                <span>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">5</span>
                <span>Tap <strong>"Install"</strong> to confirm</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">✓</span>
                <span>The Coffee App will install like a native app!</span>
              </li>
            </ol>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-500">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center">
              <span className="mr-2">💻</span>
              Desktop (Chrome/Edge)
            </h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">1</span>
                <span>Look for an <strong>install icon</strong> ⬇️ in the address bar, or</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">2</span>
                <span>Click the <strong>menu</strong> (⋮) in the top-right corner</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">3</span>
                <span>Select <strong>"Install Coffee Ordering App"</strong></span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">4</span>
                <span>Click <strong>"Install"</strong> to confirm</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">✓</span>
                <span>The app will open in its own window!</span>
              </li>
            </ol>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M6 6h12l-3 9H9l-3-9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Install Coffee App</h2>
                <p className="text-sm text-gray-600">Get faster access to your favorite coffee</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Benefits */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Why install our app?</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-gray-700">Faster loading and offline access</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M6 6h12l-3 9H9l-3-9z" />
                  </svg>
                </div>
                <span className="text-gray-700">One-tap ordering from home screen</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
                  </svg>
                </div>
                <span className="text-gray-700">Full-screen app experience</span>
              </div>
            </div>
          </div>

          {/* Device-specific instructions */}
          {getDeviceSpecificInstructions()}

          {/* Troubleshooting */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Troubleshooting
            </h4>
            <div className="text-sm text-yellow-700 space-y-1">
              {deviceInfo.isIOS ? (
                <>
                  <p>• <strong>Must use Safari</strong> - Chrome/Firefox won't work for iOS installation</p>
                  <p>• Make sure you're on the latest iOS version if possible</p>
                  <p>• If "Add to Home Screen" doesn't appear, try refreshing the page</p>
                  <p>• Some older iOS devices may not support PWA installation</p>
                </>
              ) : (
                <>
                  <p>• Don't see the install option? Try using the latest version of your browser</p>
                  <p>• On older devices, you may need to bookmark the page instead</p>
                  <p>• Make sure you're using Chrome browser for best results</p>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-hover transition-colors"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to detect device type for external use
export function useDeviceType() {
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    const userAgent = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setDeviceType('ios');
    } else if (/Android/.test(userAgent)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  return deviceType;
}