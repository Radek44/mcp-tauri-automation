import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Info, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const navigate = useNavigate();
  const [appInfo, setAppInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');

  const handleGetAppInfo = async () => {
    try {
      setLoading(true);
      const info = await invoke('get_app_info');
      setAppInfo(info);
    } catch (err) {
      console.error('Failed to get app info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateLoading = async (delayMs: number) => {
    try {
      setLoading(true);
      setLoadingMessage(`Simulating ${delayMs}ms delay...`);
      const result = await invoke<string>('simulate_loading', { delayMs });
      setLoadingMessage(result);
      setTimeout(() => setLoadingMessage(''), 3000);
    } catch (err) {
      console.error('Failed to simulate loading:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerError = async () => {
    try {
      await invoke('trigger_error');
    } catch (err) {
      setError(err as string);
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon size={48} className="text-primary-600" />
            <div>
              <h1 className="text-4xl font-display font-bold text-gray-900" data-testid="settings-title">
                Settings
              </h1>
              <p className="text-gray-600">Test Tauri backend commands and app settings</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
            data-testid="back-to-home"
          >
            Back to Home
          </button>
        </motion.div>

        {/* App Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-6"
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Info size={24} />
            App Information
          </h2>

          <button
            onClick={handleGetAppInfo}
            className="btn-primary mb-4"
            disabled={loading}
            data-testid="get-app-info-button"
          >
            {loading ? 'Loading...' : 'Get App Info'}
          </button>

          {appInfo && (
            <div className="bg-gray-50 p-4 rounded-lg" data-testid="app-info-display">
              <pre className="text-sm">{JSON.stringify(appInfo, null, 2)}</pre>
            </div>
          )}
        </motion.div>

        {/* Async Operations Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 mb-6"
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Loader2 size={24} />
            Async Operations
          </h2>

          <p className="text-gray-600 mb-4">
            Test asynchronous Tauri commands with simulated delays
          </p>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleSimulateLoading(1000)}
              className="btn-secondary"
              disabled={loading}
              data-testid="simulate-1s-button"
            >
              Simulate 1s
            </button>
            <button
              onClick={() => handleSimulateLoading(2000)}
              className="btn-secondary"
              disabled={loading}
              data-testid="simulate-2s-button"
            >
              Simulate 2s
            </button>
            <button
              onClick={() => handleSimulateLoading(3000)}
              className="btn-secondary"
              disabled={loading}
              data-testid="simulate-3s-button"
            >
              Simulate 3s
            </button>
          </div>

          {loadingMessage && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg" data-testid="loading-message">
              <p className="text-blue-800">{loadingMessage}</p>
            </div>
          )}
        </motion.div>

        {/* Error Handling Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle size={24} />
            Error Handling
          </h2>

          <p className="text-gray-600 mb-4">
            Test error handling for Tauri commands
          </p>

          <button
            onClick={handleTriggerError}
            className="btn-secondary text-red-600 hover:bg-red-50"
            data-testid="trigger-error-button"
          >
            Trigger Error
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mt-4" data-testid="error-message">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
