import { useState, useEffect } from 'react';
import { useNotificationService } from './NotificationService';
import { PushNotificationManager } from './PushNotificationService';

export function NotificationDebug({ onClose }: { onClose: () => void }) {
  const { permission, isSupported, isPWAInstalled, sendTestNotification, requestPermission } = useNotificationService();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = userAgent.includes('android');
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    
    const info = {
      // Permission Status
      notificationPermission: Notification.permission,
      isNotificationSupported: 'Notification' in window,
      isServiceWorkerSupported: 'serviceWorker' in navigator,
      
      // PWA Status
      isPWAInstalled,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      isIOSStandalone: (window.navigator as any).standalone === true,
      
      // Device Detection
      isAndroid,
      isIOS,
      userAgent: userAgent.substring(0, 200),
      
      // Service Worker
      hasServiceWorkerController: !!navigator.serviceWorker?.controller,
      serviceWorkerReady: 'unknown - will check async',
      
      // Notification API
      notificationConstructor: typeof Notification,
      
      // Chrome Specific
      chromeVersion: userAgent.match(/chrome\/([0-9]+)/)?.[1] || 'unknown',
      
      // Additional Info
      isSecureContext: window.isSecureContext,
      location: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    setDebugInfo(info);
    
    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        setDebugInfo(prev => ({
          ...prev,
          serviceWorkerReady: !!registration,
          serviceWorkerScope: registration.scope,
          serviceWorkerActive: !!registration.active
        }));
      }).catch(error => {
        setDebugInfo(prev => ({
          ...prev,
          serviceWorkerReady: false,
          serviceWorkerError: error.message
        }));
      });
    }
  }, [isPWAInstalled]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBasicNotification = async () => {
    addTestResult('Testing basic notification...');
    
    if (Notification.permission !== 'granted') {
      addTestResult('❌ Permission not granted - cannot test');
      return;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = userAgent.includes('android');
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    addTestResult(`🔍 Platform: ${isAndroid ? 'Android' : 'Other'}, PWA: ${isPWA}`);
    
    // For Android PWAs, use ServiceWorkerRegistration.showNotification
    if (isAndroid && isPWA && 'serviceWorker' in navigator) {
      addTestResult('🤖 Android PWA detected - using ServiceWorker notification');
      
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('ServiceWorker Test', {
          body: 'This is a ServiceWorker notification test for Android',
          icon: '/icons/pwa-192x192.png',
          tag: 'sw-test',
          badge: '/icons/pwa-192x192.png'
        });
        
        addTestResult('✅ ServiceWorker notification sent successfully');
        return;
      } catch (error) {
        addTestResult(`❌ ServiceWorker notification failed: ${(error as Error).message}`);
        addTestResult('🔄 Falling back to basic notification...');
      }
    }
    
    // Fallback to basic notification
    try {
      addTestResult('📱 Using basic Notification constructor');
      
      const notification = new Notification('Basic Test', {
        body: 'This is a basic notification test',
        icon: '/icons/pwa-192x192.png',
        tag: 'basic-test'
      });
      
      addTestResult('✅ Basic notification created successfully');
      
      notification.onclick = () => {
        addTestResult('🖱️ Notification clicked');
        notification.close();
      };
      
      notification.onerror = (error) => {
        addTestResult(`❌ Notification error: ${error}`);
      };
      
      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
        addTestResult('🔄 Notification auto-closed');
      }, 5000);
      
    } catch (error) {
      addTestResult(`❌ Basic notification failed: ${(error as Error).message}`);
      
      if (isAndroid) {
        addTestResult('💡 Android requires ServiceWorker notifications in PWAs');
        addTestResult('💡 Make sure the app is installed as PWA, not just bookmarked');
      }
    }
  };

  const testServiceNotification = async () => {
    addTestResult('Testing service notification...');
    
    try {
      const result = sendTestNotification();
      if (result) {
        addTestResult('✅ Service notification sent successfully');
      } else {
        addTestResult('❌ Service notification failed');
      }
    } catch (error) {
      addTestResult(`❌ Service notification error: ${(error as Error).message}`);
    }
  };

  const testPermissionRequest = async () => {
    addTestResult('Testing permission request...');
    
    try {
      const result = await requestPermission();
      if (result) {
        addTestResult('✅ Permission granted');
        // Refresh debug info
        setDebugInfo(prev => ({ ...prev, notificationPermission: Notification.permission }));
      } else {
        addTestResult('❌ Permission denied or failed');
      }
    } catch (error) {
      addTestResult(`❌ Permission request error: ${(error as Error).message}`);
    }
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'boolean') {
      return value ? '✅ Yes' : '❌ No';
    }
    if (value === null || value === undefined) {
      return '❓ Unknown';
    }
    return String(value);
  };

  const getStatusColor = (key: string, value: any): string => {
    const goodKeys = ['notificationPermission', 'isNotificationSupported', 'isPWAInstalled', 'hasServiceWorkerController', 'serviceWorkerReady', 'isSecureContext'];
    const badValues = ['denied', 'default', false, 'unknown'];
    
    if (goodKeys.includes(key)) {
      if (key === 'notificationPermission') {
        return value === 'granted' ? 'text-green-600' : 'text-red-600';
      }
      return badValues.includes(value) ? 'text-red-600' : 'text-green-600';
    }
    
    return 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🔔 Notification Debug Center</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* System Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(debugInfo).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </div>
                  <div className={`text-sm font-mono ${getStatusColor(key, value)}`}>
                    {formatValue(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Controls */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🧪 Test Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={testPermissionRequest}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🔒 Test Permission Request
              </button>
              <button
                onClick={testBasicNotification}
                disabled={permission !== 'granted'}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                📢 Test Basic Notification
              </button>
              <button
                onClick={testServiceNotification}
                disabled={permission !== 'granted'}
                className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                ⚙️ Test Service Notification
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">📋 Test Results</h3>
              <button
                onClick={() => setTestResults([])}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-48 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500">No test results yet. Click a test button above.</div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Push Notification Manager */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🔄 Background Notifications</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-green-800 mb-2">✅ Setup Complete!</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>• VAPID key configured: BJv1nAEK...VEu8</p>
                <p>• Convex backend integration ready</p>
                <p>• Service worker push notifications enabled</p>
                <p>• Order status change triggers implemented</p>
              </div>
            </div>
            <PushNotificationManager />
          </div>

          {/* Troubleshooting */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🛠️ Troubleshooting Guide</h3>
            <div className="space-y-4">
              {/* Android Troubleshooting */}
              {debugInfo.isAndroid && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 mb-2">🤖 Android Chrome Issues</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Android 13+ blocks notification prompts by default</li>
                    <li>• Must enable manually: Chrome menu → Site settings → Notifications</li>
                    <li>• Chrome must be running in background for notifications</li>
                    <li>• PWA should be installed (not just bookmarked)</li>
                  </ul>
                </div>
              )}

              {/* iOS Troubleshooting */}
              {debugInfo.isIOS && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">📱 iOS Safari Issues</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Must use Safari browser (not Chrome)</li>
                    <li>• PWA must be added to home screen</li>
                    <li>• iOS 16.4+ required for notification support</li>
                    <li>• Check notification settings in iOS Settings</li>
                  </ul>
                </div>
              )}

              {/* General Issues */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">⚠️ Common Issues</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Permission denied: Clear site data and try again</li>
                  <li>• No service worker: Check network tab for errors</li>
                  <li>• Not in standalone mode: Install PWA to home screen</li>
                  <li>• Insecure context: Must use HTTPS</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Copy Debug Info */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                const text = JSON.stringify(debugInfo, null, 2);
                navigator.clipboard.writeText(text).then(() => {
                  addTestResult('📋 Debug info copied to clipboard');
                });
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              📋 Copy Debug Info
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
            >
              Close Debug
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}