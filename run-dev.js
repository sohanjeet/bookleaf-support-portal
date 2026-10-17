// Helper script to run server and client concurrently without third-party dependencies
const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('----------------------------------------------------');
console.log('  Starting BookLeaf Author Support Portal');
console.log('  Backend:  http://localhost:5000');
console.log('  Frontend: http://localhost:5173');
console.log('----------------------------------------------------');

const server = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'server'),
  stdio: 'inherit',
  shell: true,
});

const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'client'),
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  console.log('\nShutting down BookLeaf services...');
  server.kill();
  client.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
