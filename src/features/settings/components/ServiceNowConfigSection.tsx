'use client';

import React, { useState } from 'react';
import { Server, CheckCircle, XCircle, Loader2, RefreshCw, Play } from 'lucide-react';
import type { ServiceNowConfigForm, AuthMethod, ServiceNowTestStep } from '@/types';
import {
  useUserRole,
  useServiceNowConfig,
  useUpdateServiceNowConfig,
  useTestServiceNowConnection,
  useTriggerServiceNowSync,
  useServiceNowSyncStatus,
} from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DEFAULT_FORM: ServiceNowConfigForm = {
  instance_url: '',
  auth_method: 'basic',
  username: '',
  password: '',
  client_id: '',
  client_secret: '',
};

export const ServiceNowConfigSection: React.FC = () => {
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const isAdmin = userRole?.role === 'admin';
  const { data: config, isLoading: configLoading } = useServiceNowConfig(isAdmin);
  const { data: syncStatus } = useServiceNowSyncStatus(isAdmin);

  const updateConfig = useUpdateServiceNowConfig();
  const testConnection = useTestServiceNowConnection();
  const triggerSync = useTriggerServiceNowSync();

  const [draftForm, setDraftForm] = useState<ServiceNowConfigForm | null>(null);
  const [testSteps, setTestSteps] = useState<ServiceNowTestStep[]>([]);
  const [showTestResults, setShowTestResults] = useState(false);
  const form =
    draftForm ??
    (config?.is_configured
      ? {
          ...DEFAULT_FORM,
          instance_url: config.instance_url || '',
          auth_method: config.auth_method || 'basic',
          username: config.username || '',
        }
      : DEFAULT_FORM);

  const updateForm = (updates: Partial<ServiceNowConfigForm>) => {
    setDraftForm((current) => ({ ...(current ?? form), ...updates }));
  };

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync(form);
    } catch {
      // Error handled by mutation
    }
  };

  const handleTest = async () => {
    setTestSteps([]);
    setShowTestResults(true);
    try {
      const result = await testConnection.mutateAsync(form);
      setTestSteps(result.steps);
    } catch {
      setTestSteps([{ name: 'Connection', status: 'failed', message: 'Request failed' }]);
    }
  };

  const handleSync = async (syncType: 'full' | 'incremental') => {
    try {
      await triggerSync.mutateAsync(syncType);
    } catch {
      // Error handled by mutation
    }
  };

  const latestSync = syncStatus?.[0];
  const isSyncRunning = latestSync?.status === 'running';

  if (roleLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
          <Server className="w-5 h-5 mr-2 text-slate-400" />
          ServiceNow Integration
        </h2>
        <Card className="p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </Card>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
          <Server className="w-5 h-5 mr-2 text-slate-400" />
          ServiceNow Integration
        </h2>
        <Card className="p-4 bg-slate-50 dark:bg-slate-900/50">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            ServiceNow configuration is restricted to admin users.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your account can still use the application, but only admins can view or update the integration settings.
          </p>
        </Card>
      </section>
    );
  }

  if (configLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
          <Server className="w-5 h-5 mr-2 text-slate-400" />
          ServiceNow Integration
        </h2>
        <Card className="p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
        <Server className="w-5 h-5 mr-2 text-slate-400" />
        ServiceNow Integration
      </h2>

      {/* Configuration Card */}
      <Card className="divide-y divide-slate-100 dark:divide-slate-700">
        {/* Instance URL */}
        <div className="p-4">
          <label className="block">
            <span className="font-medium text-slate-900 dark:text-white">Instance URL</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Your ServiceNow instance URL (e.g., https://dev12345.service-now.com)
            </p>
            <input
              type="url"
              value={form.instance_url}
              onChange={(e) => updateForm({ instance_url: e.target.value })}
              autoComplete="url"
              placeholder="https://dev12345.service-now.com"
              className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </label>
        </div>

        {/* Auth Method */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Authentication Method</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">OAuth 2.0 is recommended for production</p>
          </div>
          <div className="flex gap-2">
            {(['basic', 'oauth'] as AuthMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => updateForm({ auth_method: method })}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  form.auth_method === method
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400'
                }`}
              >
                {method === 'oauth' ? 'OAuth 2.0' : 'Basic Auth'}
              </button>
            ))}
          </div>
        </div>

        {/* Username */}
        <div className="p-4">
          <label className="block">
            <span className="font-medium text-slate-900 dark:text-white">Username</span>
            <input
              type="text"
              value={form.username}
              onChange={(e) => updateForm({ username: e.target.value })}
              autoComplete="username"
              placeholder="admin.user"
              className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </label>
        </div>

        {/* Password */}
        <div className="p-4">
          <label className="block">
            <span className="font-medium text-slate-900 dark:text-white">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => updateForm({ password: e.target.value })}
              autoComplete="current-password"
              placeholder={config?.is_configured ? '••••••••' : 'Enter password'}
              className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </label>
        </div>

        {/* OAuth Fields (conditional) */}
        {form.auth_method === 'oauth' && (
          <>
            <div className="p-4">
              <label className="block">
                <span className="font-medium text-slate-900 dark:text-white">Client ID</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  From ServiceNow: System OAuth &gt; Application Registry
                </p>
                <input
                  type="text"
                  value={form.client_id || ''}
                  onChange={(e) => updateForm({ client_id: e.target.value })}
                  autoComplete="off"
                  placeholder="oauth_client_id"
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </label>
            </div>
            <div className="p-4">
              <label className="block">
                <span className="font-medium text-slate-900 dark:text-white">Client Secret</span>
                <input
                  type="password"
                  value={form.client_secret || ''}
                  onChange={(e) => updateForm({ client_secret: e.target.value })}
                  autoComplete="current-password"
                  placeholder={config?.is_configured ? '••••••••' : 'Enter client secret'}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </label>
            </div>
          </>
        )}

        {/* Test Connection */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testConnection.isPending || !form.instance_url || !form.username}
            >
              {testConnection.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>
            {config?.last_test_success !== null && config?.last_test_success !== undefined && (
              <Badge variant={config.last_test_success ? 'default' : 'destructive'}>
                {config.last_test_success ? 'Connected' : 'Failed'}
              </Badge>
            )}
          </div>

          {/* Test Steps Results */}
          {showTestResults && testSteps.length > 0 && (
            <div className="mt-3 space-y-1 text-sm bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md">
              {testSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {step.status === 'passed' ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : step.status === 'skipped' ? (
                    <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <span
                    className={
                      step.status === 'passed'
                        ? 'text-slate-700 dark:text-slate-300'
                        : step.status === 'skipped'
                        ? 'text-slate-500 dark:text-slate-400'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    <strong>{step.name}:</strong> {step.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="p-4 flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={updateConfig.isPending || !form.instance_url || !form.username || !form.password}
          >
            {updateConfig.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Configuration
          </Button>
          {updateConfig.isSuccess && (
            <span className="text-sm text-green-600 dark:text-green-400">Configuration saved!</span>
          )}
          {updateConfig.isError && (
            <span className="text-sm text-red-600 dark:text-red-400">
              Failed to save: {(updateConfig.error as Error)?.message || 'Unknown error'}
            </span>
          )}
        </div>
      </Card>

      {/* Sync Controls Card */}
      {config?.is_configured && (
        <Card className="divide-y divide-slate-100 dark:divide-slate-700">
          <div className="p-4">
            <h3 className="font-medium text-slate-900 dark:text-white mb-3">Data Synchronization</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Sync incident data from your ServiceNow instance to the local database.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync('incremental')}
                disabled={isSyncRunning || triggerSync.isPending}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncRunning ? 'animate-spin' : ''}`} />
                Incremental Sync
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync('full')}
                disabled={isSyncRunning || triggerSync.isPending}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Full Sync
              </Button>
              {triggerSync.isSuccess && triggerSync.data && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Run: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{triggerSync.data.command}</code>
                </span>
              )}
            </div>
          </div>

          {/* Sync History */}
          {syncStatus && syncStatus.length > 0 && (
            <div className="p-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Recent Syncs</h4>
              <div className="space-y-2">
                {syncStatus.slice(0, 3).map((sync) => (
                  <div
                    key={sync.id}
                    className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-900/50 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          sync.status === 'completed'
                            ? 'default'
                            : sync.status === 'running'
                            ? 'secondary'
                            : sync.status === 'failed'
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {sync.status}
                      </Badge>
                      <span className="text-slate-600 dark:text-slate-400 capitalize">{sync.sync_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      {sync.records_processed > 0 && <span>{sync.records_processed} records</span>}
                      {sync.started_at && (
                        <span className="text-xs">
                          {new Date(sync.started_at).toLocaleDateString()}{' '}
                          {new Date(sync.started_at).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {latestSync?.error_message && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">{latestSync.error_message}</p>
              )}
            </div>
          )}
        </Card>
      )}
    </section>
  );
};

export default ServiceNowConfigSection;
