const { spawn } = require('child_process');

const [command, ...args] = process.argv.slice(2);
const environments = {
  start: 'development',
  build: 'production',
  test: 'test',
};

if (!environments[command]) {
  console.error(`Comando do Create React App nao reconhecido: ${command || '(vazio)'}`);
  process.exit(1);
}

process.env.NODE_ENV = environments[command];
process.env.BABEL_ENV = environments[command];
require('react-scripts/config/env');

if (!process.env.REACT_APP_API_URL && process.env.VITE_API_URL) {
  process.env.REACT_APP_API_URL = process.env.VITE_API_URL;
}

const script = require.resolve(`react-scripts/scripts/${command}`);
const child = spawn(process.execPath, [script, ...args], {
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (error) => {
  console.error(`Nao foi possivel iniciar o Create React App: ${error.message}`);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  process.exitCode = code === null ? (signal ? 1 : 0) : code;
});
