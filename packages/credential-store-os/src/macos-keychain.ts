import koffi from "koffi";
import type { OsCredentialDeleter, OsCredentialReader, OsCredentialWriter } from "./store.js";

// Use the same file-based generic-password items as security(1), without putting secrets in argv.
// This module is loaded only on macOS, just as the Windows filesystem bridge is platform-local.
const security = koffi.load("/System/Library/Frameworks/Security.framework/Security");
const core = koffi.load("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation");
const add = security.func("int32_t SecKeychainAddGenericPassword(void *keychain, uint32_t serviceLength, const void *service, uint32_t accountLength, const void *account, uint32_t length, const void *data, _Out_ void **item)");
const find = security.func("int32_t SecKeychainFindGenericPassword(void *keychain, uint32_t serviceLength, const void *service, uint32_t accountLength, const void *account, _Out_ uint32_t *length, _Out_ void **data, _Out_ void **item)");
const update = security.func("int32_t SecKeychainItemModifyAttributesAndData(void *item, const void *attributes, uint32_t length, const void *data)");
const remove = security.func("int32_t SecKeychainItemDelete(void *item)");
const freeContent = security.func("int32_t SecKeychainItemFreeContent(void *attributes, void *data)");
const release = core.func("void CFRelease(void *value)");
const notFound = -25300;
const duplicateItem = -25299;

function check(status: number, operation: string): void {
  if (status !== 0) throw new Error(`OS credential ${operation} failed (${status})`);
}

/** A supplied native keychain handle permits isolated testing; null uses the user's keychains. */
export function macosKeychainBackend(keychain: unknown = null): {
  readonly read: OsCredentialReader;
  readonly write: OsCredentialWriter;
  readonly remove: OsCredentialDeleter;
} {
  return {
    async read(service, account) {
      const name = Buffer.from(service, "utf8"), key = Buffer.from(account, "utf8");
      const length = [0], data: unknown[] = [null];
      const status = find(keychain, name.length, name, key.length, key, length, data, null) as number;
      if (status === notFound) return undefined;
      check(status, "lookup");
      try {
        const bytes = Buffer.from(koffi.decode(data[0], "uint8_t", length[0]!));
        try { return bytes.toString("utf8"); }
        finally { bytes.fill(0); }
      } finally { if (data[0] !== null) freeContent(null, data[0]); }
    },
    async write(service, account, secret) {
      const name = Buffer.from(service, "utf8"), key = Buffer.from(account, "utf8");
      const bytes = Buffer.from(secret, "utf8");
      try {
        const status = add(keychain, name.length, name, key.length, key, bytes.length, bytes, null) as number;
        if (status !== duplicateItem) { check(status, "write"); return; }
        const item: unknown[] = [null];
        check(find(keychain, name.length, name, key.length, key, null, null, item) as number, "lookup");
        try { check(update(item[0], null, bytes.length, bytes) as number, "write"); }
        finally { release(item[0]); }
      } finally { bytes.fill(0); }
    },
    async remove(service, account) {
      const name = Buffer.from(service, "utf8"), key = Buffer.from(account, "utf8");
      const item: unknown[] = [null];
      const status = find(keychain, name.length, name, key.length, key, null, null, item) as number;
      if (status === notFound) return false;
      check(status, "lookup");
      try { check(remove(item[0]) as number, "delete"); return true; }
      finally { release(item[0]); }
    },
  };
}
