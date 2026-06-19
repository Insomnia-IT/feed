import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prettierCli = resolve(rootDir, 'node_modules/prettier/bin/prettier.cjs');
const stylelintCli = resolve(rootDir, 'node_modules/stylelint/bin/stylelint.mjs');

const run = (command, args, options = {}) =>
    spawnSync(command, args, {
        cwd: rootDir,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        ...options
    });

const stagedResult = run('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']);

if (stagedResult.status !== 0) {
    process.stderr.write(stagedResult.stderr);
    process.exit(stagedResult.status ?? 1);
}

const stagedFiles = stagedResult.stdout.split('\0').filter(Boolean);
const prettierPattern = /\.(?:ts|tsx|js|jsx|json|md)$/u;
const stylelintPattern = /\.(?:css|scss|less)$/u;
const targetFiles = stagedFiles.filter((file) => prettierPattern.test(file) || stylelintPattern.test(file));
const formattedFiles = [];

for (const file of targetFiles) {
    const stagedContentResult = run('git', ['show', `:${file}`], { encoding: null });
    if (stagedContentResult.status !== 0) {
        process.stderr.write(stagedContentResult.stderr);
        process.exit(stagedContentResult.status ?? 1);
    }

    const stagedContent = stagedContentResult.stdout;
    const formatterArgs = prettierPattern.test(file)
        ? [prettierCli, '--stdin-filepath', file]
        : [stylelintCli, '--stdin-filename', file, '--fix'];
    const formatResult = run(process.execPath, formatterArgs, {
        encoding: null,
        input: stagedContent,
        windowsHide: true,
        shell: false
    });

    if (formatResult.error || formatResult.status !== 0) {
        if (formatResult.error) {
            console.error(formatResult.error);
        }
        process.stderr.write(formatResult.stderr ?? '');
        process.exit(formatResult.status ?? 1);
    }

    const indexEntryResult = run('git', ['ls-files', '-s', '--', file]);
    const mode = indexEntryResult.stdout.match(/^(\d+)\s/u)?.[1];
    if (indexEntryResult.status !== 0 || !mode) {
        process.stderr.write(indexEntryResult.stderr);
        process.exit(indexEntryResult.status ?? 1);
    }

    formattedFiles.push({
        file,
        mode,
        original: stagedContent,
        formatted: formatResult.stdout
    });
}

for (const { file, mode, original, formatted } of formattedFiles) {
    const hashResult = run('git', ['hash-object', '-w', '--stdin'], {
        input: formatted,
        encoding: 'utf8'
    });
    if (hashResult.status !== 0) {
        process.stderr.write(hashResult.stderr);
        process.exit(hashResult.status ?? 1);
    }

    const hash = hashResult.stdout.trim();
    const updateResult = run('git', ['update-index', '--cacheinfo', mode, hash, file]);
    if (updateResult.status !== 0) {
        process.stderr.write(updateResult.stderr);
        process.exit(updateResult.status ?? 1);
    }

    try {
        const workingTreeContent = await readFile(resolve(rootDir, file));
        if (workingTreeContent.equals(original)) {
            await writeFile(resolve(rootDir, file), formatted);
        }
    } catch {
        // The staged blob remains authoritative if the working-tree file is unavailable.
    }
}
