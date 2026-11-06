const path = require('path');

const mariaDbRoot = path.join(__dirname, '..', 'runtime', 'mariadb');
const mariaDbData = path.join(mariaDbRoot, 'data');

module.exports = {
  database: {
    executable: path.join(mariaDbRoot, 'bin', 'mysqld.exe'),
    config: path.join(mariaDbRoot, 'my.ini'),
    workingDirectory: mariaDbRoot,
    baseDirectory: mariaDbRoot,
    dataDirectory: mariaDbData,
    tempDirectory: path.join(mariaDbRoot, 'tmp'),
    errorLog: path.join(mariaDbData, 'mariadb-error.log'),
    host: '127.0.0.1',
    port: 3307
  },

  backend: {
    directory: path.join(__dirname, '..', 'backend'),
    host: '127.0.0.1',
    port: 8000,
    phpCommand: path.join(__dirname, '..', 'runtime', 'php', 'php.exe')
  },

  frontend: {
    buildFile: path.join(
      __dirname,
      '..',
      'frontend',
      'dist',
      'frontend',
      'browser',
      'index.csr.html'
    )
  },

  adminExecutable: path.join(mariaDbRoot, 'bin', 'mysqladmin.exe')
};