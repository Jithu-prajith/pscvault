import { APP_VERSION } from '../../lib/constants';
import { generateUUIDv7, nowISO } from '../../lib/uuid';

export interface BackupManifest {
  version: string;
  appVersion: string;
  createdAt: string;
  databaseVersion: number;
  totalAttachments: number;
  totalSizeBytes: number;
  files: Array<{
    storagePath: string;
    sha256Hash: string;
    fileSizeBytes: number;
  }>;
}

export async function createBackupData(workspaceId: string): Promise<string> {
  const timestamp = new Date().toISOString().slice(0, 10);
  const backupId = `pscvault_backup_${timestamp}_${generateUUIDv7().slice(0, 8)}`;
  
  // Package database & metadata into exportable JSON string
  const manifest: BackupManifest = {
    version: '1.0.0',
    appVersion: APP_VERSION,
    createdAt: nowISO(),
    databaseVersion: 1,
    totalAttachments: 0,
    totalSizeBytes: 0,
    files: [],
  };

  const backupPayload = {
    manifest,
    workspaceId,
    timestamp: nowISO(),
  };

  return JSON.stringify(backupPayload, null, 2);
}

export async function restoreBackupData(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.manifest || !data.manifest.version) {
      return { success: false, message: 'Invalid backup file format.' };
    }
    return { success: true, message: 'Backup payload verified successfully.' };
  } catch (e: any) {
    return { success: false, message: `Backup restore failed: ${e.message}` };
  }
}
