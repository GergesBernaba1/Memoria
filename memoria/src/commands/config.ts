import { getKey, loadConfig, saveConfig, setKey } from "../core/config.js";
import { requireWorkspace } from "../core/workspace.js";
import { logger } from "../utils/logger.js";

export interface ConfigGetOptions {
  cwd?: string;
}

export async function configGet(key: string | undefined, opts: ConfigGetOptions = {}): Promise<void> {
  const ws = await requireWorkspace(opts.cwd);
  const cfg = await loadConfig(ws.paths.configFile);
  if (!key) {
    logger.json(cfg);
    return;
  }
  const value = getKey(cfg, key);
  if (value === undefined) {
    logger.warn(`No value at '${key}'`);
    return;
  }
  if (typeof value === "string") logger.raw(value);
  else logger.json(value);
}

export interface ConfigSetOptions {
  cwd?: string;
}

export async function configSet(
  key: string,
  value: string,
  opts: ConfigSetOptions = {},
): Promise<void> {
  const ws = await requireWorkspace(opts.cwd);
  const cfg = await loadConfig(ws.paths.configFile);
  const next = setKey(cfg, key, value);
  await saveConfig(ws.paths.configFile, next);
  logger.success(`Set ${key}`);
}
