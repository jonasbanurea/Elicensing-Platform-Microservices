// Helper runner to ensure test-results folders exist and invoke k6 with proper env
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const scenario = process.argv[2] || process.env.SCENARIO || 'baseline';
const sut = (process.argv[3] || process.env.SUT || 'monolith').toLowerCase();
const testDate = process.env.TEST_DATE || new Date().toISOString().slice(0, 10);

const baseUrl = process.env.BASE_URL || (sut === 'microservices' ? 'http://localhost:8080' : 'http://localhost:3000');
const rootDir = path.resolve(__dirname, '..', '..');
const outDir = path.join(rootDir, 'test-results', testDate, sut, scenario);

fs.mkdirSync(outDir, { recursive: true });

function toShortPath(p) {
  if (process.platform !== 'win32') return p;
  try {
    // Convert to 8.3 short path to avoid issues with spaces when k6 parses paths
    const { stdout } = spawnSync('cmd', ['/c', 'for', '%I', 'in', `("${p}")`, 'do', '@echo', '%~sI'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const shortPath = stdout.trim();
    return shortPath || p;
  } catch (err) {
    return p;
  }
}

const summaryExport = toShortPath(path.join(outDir, 'summary-export.json'));
const csvExport = toShortPath(path.join(outDir, 'metrics.csv'));

// Stage the script into a temp directory without spaces to avoid k6 path parsing issues on Windows
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'k6-run-'));
const scriptPath = path.join(tempDir, 'jelita-scenarios.js');
fs.copyFileSync(path.join(__dirname, 'jelita-scenarios.js'), scriptPath);
const k6Cwd = tempDir;

console.log('==========================================');
console.log('Launching k6');
console.log(' scenario   :', scenario);
console.log(' sut        :', sut);
console.log(' base url   :', baseUrl);
console.log(' results dir:', outDir);
console.log('==========================================');

const args = [
  'run',
  '--summary-export',
  summaryExport,
  '--out',
  `csv=${csvExport}`,
  scriptPath,
];

const env = {
  ...process.env,
  BASE_URL: baseUrl,
  SUT: sut,
  TEST_DATE: testDate,
  SCENARIO: scenario,
  RESULTS_DIR: outDir,
};

const result = spawnSync('k6', args, { stdio: 'inherit', env, cwd: k6Cwd });

if (result.error) {
  console.error('Failed to start k6:', result.error.message);
  process.exit(1);
}

process.exit(result.status || 0);
