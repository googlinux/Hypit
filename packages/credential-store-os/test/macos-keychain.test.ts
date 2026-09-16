import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { credentialRef } from "@hypit/runtime";
import { OsCredentialStore } from "../src/store.js";

test("macOS credentials roundtrip and update natively without a child process", { skip: process.platform !== "darwin" }, async t => {
  const { default: koffi } = await import("koffi");
  const { macosKeychainBackend } = await import("../src/macos-keychain.js");
  const security = koffi.load("/System/Library/Frameworks/Security.framework/Security");
  const core = koffi.load("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation");
  const create = security.func("int32_t SecKeychainCreate(const char *path, uint32_t length, const void *password, uint8_t prompt, void *access, _Out_ void **keychain)");
  const remove = security.func("int32_t SecKeychainDelete(void *keychain)");
  const release = core.func("void CFRelease(void *value)");
  const root = await mkdtemp(join(tmpdir(), "hypit-keychain-test-"));
  const keychain: unknown[] = [null];
  t.after(async () => {
    try {
      if (keychain[0] !== null) {
        try { assert.equal(remove(keychain[0]), 0); }
        finally { release(keychain[0]); }
      }
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  const password = Buffer.from("synthetic-test-keychain-password");
  // An isolated, explicitly addressed keychain: never read or write the user's real credentials.
  assert.equal(create(join(root, "test.keychain"), password.length, password, 0, null, keychain), 0);
  const forbidden = () => { throw new Error("Credential operation must not create a child process"); };
  for (const name of ["exec", "execFile", "spawn", "execSync", "execFileSync", "spawnSync"] as const) t.mock.method(childProcess, name, forbidden);
  syncBuiltinESMExports();
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
  const store = new OsCredentialStore({ service: "hypit-test-服务", ...macosKeychainBackend(keychain[0]) });
  const ref = credentialRef("os", "account.测试");
  assert.equal(await store.resolve(ref), undefined);
  for (const secret of ["first secret", '{"access":"synthetic","refresh":"replacement"}\n秘密\0tail\n']) {
    await store.put(ref, { secret });
    assert.deepEqual(await store.resolve(ref), { secret });
  }
  const other = new OsCredentialStore({ service: "different-service", ...macosKeychainBackend(keychain[0]) });
  assert.equal(await other.resolve(ref), undefined);
  assert.equal(await store.delete(ref), true);
  assert.equal(await store.delete(ref), false);
  assert.equal(await store.resolve(ref), undefined);
});
