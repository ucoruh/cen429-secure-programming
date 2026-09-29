# Demo 7 — Safe deserialization (ObjectInputFilter)

**Topic:** Unsafe deserialization (CWE-502) · **Week:** 5 · **Book:** no direct
recipe (Java-specific); an extension of Viega & Messier's "trust no input"
principle (Recipe 3.1)

## What it shows

Decoding **untrusted** data with Java's object serialization, without a filter, is
dangerous: the incoming byte stream can construct classes we never expected. In real
attacks these classes chain together (a "gadget chain") all the way to remote code
execution.

This demo does **not** write a malicious chain; it only shows the defense:

- **BAD:** no filter. `ObjectInputStream` builds every class in the stream — the
  expected `Setting` and the unexpected `OtherClass` are both accepted.
- **GOOD:** `ObjectInputFilter` allow-lists only the **expected** classes
  (`"SerializationDemo$Setting;java.base/*;!*"`). The expected class passes; the
  unexpected one is **rejected** (`InvalidClassException`).

## The best fix

- Where possible, use **data formats** (JSON, Protobuf) instead of Java
  serialization; they carry data, not code.
- If you must use it, **allow-list** the classes with `ObjectInputFilter`, and also
  cap depth, array size and reference count (`maxdepth`, `maxarray`, `maxrefs`).

## Running it

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

Only **JDK 17/21** is needed. **No download required.**

## Why it's safe

- Both classes (`Setting`, `OtherClass`) are **harmless**; they only hold data. There
  is no gadget chain, no file operation, no command execution, no network access.
- Serialization happens entirely in memory (`byte[]`); nothing is written to disk.

## Try it yourself

1. Add `OtherClass` to the filter too (`SerializationDemo$Setting;SerializationDemo$OtherClass;...`).
   Do both get through now? Why must an allow-list end with a reject-by-default (`!*`)?
2. Add a depth limit to the filter (`maxdepth=5`). What changes for nested objects?
3. Build the same scenario with JSON instead (a field map). Why is JSON closed to this
   class of attack, being "data, not code"?
