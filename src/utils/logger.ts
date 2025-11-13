import chalk from 'chalk';

export class Logger {
  private debugEnabled: boolean;

  constructor(debugEnabled = false) {
    this.debugEnabled = debugEnabled;
  }

  debug(...args: unknown[]): void {
    if (this.debugEnabled) {
      console.log(chalk.gray('[DEBUG]'), ...args);
    }
  }

  info(...args: unknown[]): void {
    console.log(...args);
  }

  error(...args: unknown[]): void {
    console.error(chalk.red('✗'), ...args);
  }

  success(...args: unknown[]): void {
    console.log(chalk.green('✓'), ...args);
  }

  warn(...args: unknown[]): void {
    console.warn(chalk.yellow('⚠'), ...args);
  }
}

