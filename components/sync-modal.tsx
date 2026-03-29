'use client';

import { useMemo, useState } from 'react';
import { CloudDownload, CloudUpload, KeyRound, LoaderCircle, X } from 'lucide-react';
import { Button } from './ui/button';
import { StarGroup, StarItem } from '@/lib/types';
import { pullDataFromSupabase, pushDataToSupabase } from '@/lib/sync';

interface SyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: StarItem[];
  groups: StarGroup[];
  setData: (newItems: StarItem[], newGroups: StarGroup[]) => void;
  onSyncSuccess?: () => void;
}

type SyncAction = 'push' | 'pull' | null;

export function SyncModal({ open, onOpenChange, items, groups, setData, onSyncSuccess }: SyncModalProps) {
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeAction, setActiveAction] = useState<SyncAction>(null);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);

  const isBusy = activeAction !== null;

  const canSubmit = useMemo(() => {
    return password.trim().length > 0 && !isBusy;
  }, [password, isBusy]);

  function closeModal() {
    if (isBusy) return;
    setShowOverwriteWarning(false);
    setStatusMessage('');
    onOpenChange(false);
  }

  async function runPush(allowOverwrite: boolean) {
    setStatusMessage('Syncing data to cloud...');
    setActiveAction('push');

    try {
      const result = await pushDataToSupabase(password, { items, groups }, allowOverwrite);

      if (result.requiresOverwriteConfirmation) {
        setShowOverwriteWarning(true);
        setStatusMessage('Cloud data already exists for this password. Confirm overwrite to continue.');
        return;
      }

      setShowOverwriteWarning(false);
      setStatusMessage('Push successful. Your local data is now synced to cloud.');
      onSyncSuccess?.();
    } catch (error) {
      setShowOverwriteWarning(false);
      setStatusMessage(error instanceof Error ? error.message : 'Failed to push data.');
    } finally {
      setActiveAction(null);
    }
  }

  async function handlePush() {
    if (!password.trim()) {
      setStatusMessage('Password is required.');
      return;
    }

    setShowOverwriteWarning(false);
    await runPush(false);
  }

  async function handleConfirmOverwrite() {
    await runPush(true);
  }

  async function handlePull() {
    if (!password.trim()) {
      setStatusMessage('Password is required.');
      return;
    }

    if (!confirm('Pull will replace your current local data. Continue?')) {
      return;
    }

    setShowOverwriteWarning(false);
    setStatusMessage('Fetching data from cloud...');
    setActiveAction('pull');

    try {
      const payload = await pullDataFromSupabase(password);
      setData(payload.items, payload.groups);
      setStatusMessage('Pull successful. Local data updated from cloud.');
      onSyncSuccess?.();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to pull data.');
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <div>
      {open && (
        <div
          className="fixed inset-0 bg-card/50 backdrop-blur-xs flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-background rounded-lg px-4 py-2 w-full max-w-md border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-2">
              <h2 className="font-semibold text-lg">Cloud Sync</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeModal}
                className="w-10 h-10 p-2"
                disabled={isBusy}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4 p-2">
              <div>
                <label htmlFor="sync-password" className="block text-sm font-medium mb-1 text-muted-foreground">
                  Sync Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="sync-password"
                    type="password"
                    placeholder="Enter sync password"
                    className="border border-border rounded-lg pl-9 p-2 w-full focus:outline-none focus:ring-2 focus:ring-ring"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isBusy}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your password is hashed in the browser before push/pull.
                </p>
              </div>

              {statusMessage && (
                <div className="text-sm rounded-lg border border-border p-2 bg-muted/30">
                  {statusMessage}
                </div>
              )}

              {showOverwriteWarning && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 space-y-3">
                  <p className="text-sm">
                    Existing cloud data found for this password. Overwrite it?
                  </p>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowOverwriteWarning(false)}
                      disabled={isBusy}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleConfirmOverwrite}
                      disabled={isBusy}
                    >
                      {activeAction === 'push' ? (
                        <>
                          <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                          Overwriting...
                        </>
                      ) : (
                        'Confirm Overwrite'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-background p-2 border-t border-border flex justify-end gap-2">
              <Button variant="outline" onClick={handlePull} disabled={!canSubmit || isBusy}>
                {activeAction === 'pull' ? (
                  <>
                    <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                    Pulling...
                  </>
                ) : (
                  <>
                    <CloudDownload className="w-4 h-4 mr-2" />
                    Pull
                  </>
                )}
              </Button>
              <Button onClick={handlePush} disabled={!canSubmit || isBusy}>
                {activeAction === 'push' ? (
                  <>
                    <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                    Pushing...
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4 mr-2" />
                    Push
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}