import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { emitKeypressEvents } from "node:readline";
import { promisify } from "node:util";

const derive = promisify(scrypt);
export async function hashStudioPassword(password: string): Promise<string> {
  if (password.length < 16 || Buffer.byteLength(password) > 1024) throw new Error("Use a password of 16–1024 bytes (at least 16 characters).");
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${(await derive(password, salt, 64) as Buffer).toString("hex")}`;
}
export async function loadStudioPassword(path: string): Promise<(password: string) => Promise<boolean>> {
  const record = (await readFile(path, "utf8")).trim();
  const match = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/u.exec(record);
  if (!match) throw new Error("Invalid Studio password file. Create one with --create-password <path>.");
  const expected = Buffer.from(match[2]!, "hex");
  return async password => {
    if (Buffer.byteLength(password) > 1024) return false;
    return timingSafeEqual(await derive(password, match[1]!, 64) as Buffer, expected);
  };
}

function hiddenInput(prompt: string): Promise<string> {
  if (!process.stdin.isTTY) throw new Error("Run --create-password in an interactive terminal; passwords are never accepted as CLI arguments.");
  process.stdout.write(prompt);
  emitKeypressEvents(process.stdin);
  const previous = process.stdin.isRaw;
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = (error?: Error) => {
      process.stdin.off("keypress", onKey);
      process.stdin.setRawMode(previous);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error); else resolve(value);
    };
    const onKey = (text: string | undefined, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === "c") { finish(new Error("Cancelled")); return; }
      if (key.name === "return" || key.name === "enter") { finish(); return; }
      if (key.name === "backspace") { value = [...value].slice(0, -1).join(""); return; }
      if (!key.ctrl && text && !/[\x00-\x1f\x7f]/u.test(text) && Buffer.byteLength(value + text) <= 1024) value += text;
    };
    process.stdin.on("keypress", onKey);
  });
}
export async function createStudioPasswordFile(path: string): Promise<void> {
  const password = await hiddenInput("Studio password (at least 16 characters): ");
  const confirmation = await hiddenInput("Repeat password: ");
  if (password !== confirmation) throw new Error("Passwords do not match.");
  await writeFile(path, `${await hashStudioPassword(password)}\n`, { flag: "wx", mode: 0o600 });
}

export function studioLoginPage(message = ""): string {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>登录 · Hypit Studio</title>
  <style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#101211;color:#ecf0e9;font:16px system-ui,sans-serif;min-height:100svh;display:grid;place-items:center;padding:24px}main{width:100%;max-width:420px}small{color:#a5b4a1;letter-spacing:.14em}h1{font-size:36px;letter-spacing:-.04em;margin:18px 0 12px}p{color:#adb4ac;line-height:1.7}form{margin-top:36px}label{display:block;margin-bottom:10px;font-size:14px}input,button{width:100%;border-radius:10px;padding:14px;font:inherit}input{background:#1c201c;border:1px solid #495247;color:#fff}input:focus{outline:2px solid #c1e894;outline-offset:3px}button{margin-top:18px;border:0;background:#c1e894;color:#15220e;font-weight:650;cursor:pointer}footer{font-size:13px;color:#7e897b;margin-top:32px}.error{color:#ffb6a4;min-height:24px;font-size:14px}</style></head>
  <body><main><small>HYPIT / PERSONAL STUDIO</small><h1>回到你的创作空间</h1><p>登录后继续编辑视频、查看作品<br>或管理你的 API Key。</p><form method="post" action="/__studio/auth/login"><label for="password">访问密码</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="1024" autofocus><button type="submit">登录工作室</button><p class="error" role="alert">${message}</p></form><footer>个人工作区 · 登录状态最长保留 12 小时</footer></main></body></html>`;
}
