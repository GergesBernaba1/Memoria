import chalk from "chalk";

function fmt(prefix: string, color: (s: string) => string, msg: string): string {
  return `${color(prefix)} ${msg}`;
}

export const logger = {
  info(msg: string): void {
    console.log(fmt("i", chalk.cyan, msg));
  },
  success(msg: string): void {
    console.log(fmt("ok", chalk.green, msg));
  },
  warn(msg: string): void {
    console.warn(fmt("warn", chalk.yellow, msg));
  },
  error(msg: string): void {
    console.error(fmt("err", chalk.red, msg));
  },
  raw(msg: string): void {
    console.log(msg);
  },
  json(value: unknown): void {
    console.log(JSON.stringify(value, null, 2));
  },
};
