# Demo 02 — Entropy meter: how encrypted and packed content gives itself away

**Topic:** How malware hides (encryption, packing) and heuristic detection ·
**Week:** 2 · **Book:** Viega & Messier, Recipe 12.1 (the problem with software protection)

## What it shows

Shannon entropy measures how mixed up the byte values in a piece of data are (between 0 and 8 bit/byte). Plain
text and source code stay around 4-5 bits; compiled programs sit between 5 and 7; encrypted, compressed, or
random data is very close to 8. Antivirus products use this measurement as a sign of "packed/encrypted code",
and EDR products as a sign of "a process rapidly encrypting files" (ransomware).

The sample files are generated identically on both platforms by the `generate` program (no external
`gzip`/`openssl` needed): uniform, plain-text, machine-code-like synthetic, AES-256-GCM encrypted, and
high-entropy random files.

| Step | What happens? |
| --- | --- |
| 1 | The entropy of uniform, text, machine-code-like, encrypted, and random data is compared |
| 2 | The same content is measured plain, machine-code-like, and encrypted |
| 3 | A "mixed" file with an encrypted section hidden in the middle of text is scanned in 512-byte windows |
| 4 | The entropy jump when a file is encrypted "in place" is shown |

## Running it

First build all the demos once (inside the `code/` folder): Windows `.\build.ps1` · WSL / Linux `./build.sh` ·
Visual Studio: **File > Open > Folder** → `code` → choose a configuration → **Build > Build All**. Then, inside
this folder:

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

You can also measure your own files: `.\bin\windows\entropy.exe file1 file2` (Windows) or
`./bin/linux/entropy -p 1024 file` (a windowed map, Linux).

## Why it's safe

The program only **reads**. Samples are generated under `output/` inside this folder; encryption uses the
operating system's own crypto library with a fixed demo key (the key is not a secret value and protects no real
data).

## Try it yourself

- Measure a `.png`, a `.zip`, and a `.txt` file from your own computer. Why do the first two come out close to 8?
- Set the `-p` window size to 64 and to 4096. In a small window, why can't random data's entropy reach 8?
- Write a heuristic rule: "if entropy is greater than 7.2, it's suspicious." Which harmless file types would
  produce a false positive?
