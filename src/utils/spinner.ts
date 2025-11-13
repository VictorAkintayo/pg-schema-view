import chalk from 'chalk';

export class Spinner {
  private interval?: NodeJS.Timeout;
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private frameIndex = 0;
  public message: string;

  constructor(message: string) {
    this.message = message;
  }

  start(): void {
    process.stdout.write('\x1B[?25l'); // Hide cursor
    this.interval = setInterval(() => {
      const frame = this.frames[this.frameIndex % this.frames.length];
      process.stdout.write(`\r${chalk.cyan(frame)} ${this.message}`);
      this.frameIndex++;
    }, 80);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    process.stdout.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r');
    process.stdout.write('\x1B[?25h'); // Show cursor
  }

  succeed(message?: string): void {
    this.stop();
    if (message) {
      console.log(chalk.green('✓'), message);
    }
  }

  fail(message?: string): void {
    this.stop();
    if (message) {
      console.error(chalk.red('✗'), message);
    }
  }
}

