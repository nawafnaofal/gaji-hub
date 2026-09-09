<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DatabaseBackup extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'db:backup {--path= : Custom backup directory path}';

    /**
     * The console command description.
     */
    protected $description = 'Create a MySQL database backup dump file';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔄 Starting database backup...');

        $dbName = config('database.connections.mysql.database');
        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');
        $dbHost = config('database.connections.mysql.host');
        $dbPort = config('database.connections.mysql.port', 3306);

        $backupDir = $this->option('path') ?: storage_path('backups');

        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
        $filename = "{$dbName}_backup_{$timestamp}.sql";
        $filepath = "{$backupDir}/{$filename}";

        // Build mysqldump command
        $command = sprintf(
            'mysqldump --host=%s --port=%s --user=%s --password=%s --single-transaction --routines --triggers --quick %s > %s',
            escapeshellarg($dbHost),
            escapeshellarg($dbPort),
            escapeshellarg($dbUser),
            escapeshellarg($dbPass),
            escapeshellarg($dbName),
            escapeshellarg($filepath)
        );

        $returnCode = null;
        $output = [];
        exec($command . ' 2>&1', $output, $returnCode);

        if ($returnCode === 0 && file_exists($filepath) && filesize($filepath) > 0) {
            $sizeKb = round(filesize($filepath) / 1024, 2);
            $this->info("✅ Backup berhasil disimpan: {$filepath} ({$sizeKb} KB)");
            
            Log::info('[BACKUP] Database backup created successfully', [
                'file' => $filepath,
                'size_kb' => $sizeKb,
                'database' => $dbName,
            ]);

            // Cleanup old backups (keep last 7)
            $this->cleanupOldBackups($backupDir, $dbName);

            return Command::SUCCESS;
        } else {
            $errorMsg = implode("\n", $output);
            $this->error("❌ Backup gagal: {$errorMsg}");
            
            Log::error('[BACKUP] Database backup failed', [
                'database' => $dbName,
                'error' => $errorMsg,
            ]);

            // Clean up empty file if exists
            if (file_exists($filepath) && filesize($filepath) === 0) {
                unlink($filepath);
            }

            return Command::FAILURE;
        }
    }

    /**
     * Remove old backups, keeping only the latest N files.
     */
    protected function cleanupOldBackups(string $directory, string $dbName, int $keep = 7): void
    {
        $files = glob("{$directory}/{$dbName}_backup_*.sql");
        
        if (count($files) <= $keep) return;

        // Sort by modification time (oldest first)
        usort($files, fn($a, $b) => filemtime($a) - filemtime($b));

        $toDelete = array_slice($files, 0, count($files) - $keep);

        foreach ($toDelete as $file) {
            unlink($file);
            $this->line("   🗑 Cleaned up old backup: " . basename($file));
        }

        if (count($toDelete) > 0) {
            Log::info('[BACKUP] Cleaned up old backups', ['deleted_count' => count($toDelete)]);
        }
    }
}
