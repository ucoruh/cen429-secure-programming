# CEN429 Secure Programming — Demo Code

> Türkçe sürüm: [README.md](README.md)

This folder contains the **working** source code for every demo and exercise in the lecture notes. Each week is a
folder (`week-01`, `week-02`, ...); each demo has its own subfolder. All demos work in **all three environments**:

- **Windows**: with Visual Studio 2022 Community (free), or from PowerShell
- **WSL**: Ubuntu inside Windows
- **Linux**: directly on Ubuntu or a similar distribution

The build system is CMake; Visual Studio opens the `code/` folder directly, and no separate project file is needed.

## Safety rules (read this first)

In this course we learn about attacks by **seeing** them; that is why every demo was written according to the
following rules:

- Demos only produce files **inside their own folder** (`bin/`, and `dokum/` when needed); the cleanup command deletes all of them.
- **No administrator privileges (sudo / "Run as administrator") are required**, and no operating-system setting is changed.
- The "attack" steps cause no real harm: they print a warning to the screen, or read a file inside the demo's own folder.
- Programs that are expected to crash are run in a restricted way: on Windows no error dialog pops up, on Linux no
  crash dump (core) is written, and every command has a time limit.
- Demos that need networking only work on your own computer (`localhost`); they never connect to any outside system.
- Try these techniques **only on your own computer and only on these demos**. Trying them without permission on
  systems that belong to someone else is a crime.

## Quick start

| Task | Windows (PowerShell) | WSL / Linux |
| --- | --- | --- |
| Build all demos (inside `code/`) | `.\build.ps1` | `./build.sh` |
| Run a demo (inside the demo's folder) | `.\demo.ps1` — or double-click `demo.cmd` | `sh demo.sh` |
| Delete build output | `.\build.ps1 temizle` | `./build.sh temizle` |

Every demo folder contains the same files:

| File | What it's for |
| --- | --- |
| `*.c` | The flawed version and the fixed (`*_guvenli.c`) version |
| `CMakeLists.txt` | Which versions are built from the same source, and with which build settings |
| `demo.ps1`, `demo.cmd` | Runs the demo step by step on Windows, with explanations (the flow shown in class) |
| `demo.sh` | The same flow, for WSL / Linux |
| `README.md` | What the demo shows, what it doesn't touch, and what you can try on your own |

Compiled programs are written under `bin\windows\` or `bin/linux/` inside the demo's own folder.

## Setup A — Windows and Visual Studio 2022 Community

1. Download [Visual Studio 2022 Community](https://visualstudio.microsoft.com/tr/vs/community/). During setup, on
   the **Workloads** tab select **Desktop development with C++**. In the details pane on the right, make sure
   **C++ AddressSanitizer** and **C++ CMake tools for Windows** are checked (they are checked by default).
   CMake is not installed separately; it comes bundled with Visual Studio.
2. If you also want to build the same project from Visual Studio using WSL, additionally select the
   **Linux and embedded development with C++** workload and follow Setup B.
3. Clone the repository (Visual Studio: **Git > Clone Repository**, or Git for Windows):

   ```powershell
   mkdir C:\Dersler; cd C:\Dersler
   git clone https://github.com/ucoruh/cen429-secure-programming.git
   ```

   A short, local path (e.g. `C:\Dersler\...`) is recommended. In folders synced by OneDrive or Google Drive,
   files can get locked during the build.

### Two ways to open it in Visual Studio

**Way 1 — Open Folder (recommended).**
Use **File > Open > Folder** to select the `code` folder. Visual Studio reads the `CMakePresets.json` file. From
the configuration dropdown at the top, select **Windows (MSVC)**, then **Build > Build All**. To run a program in
the debugger, select it from the **Select Startup Item** dropdown at the top and press F5. To pass arguments to
the program, switch to the **CMake Targets View** in Solution Explorer, right-click the target, choose **Add
Debug Configuration**, and add the following to the `launch.vs.json` file that opens:

```json
"args": [ "AAAAAAAAAAAAAAAAB" ],
"currentDir": "${workspaceRoot}\\week-01\\03-tasma-giris"
```

**Way 2 — Classic solution file.**
In PowerShell, run `.\build.ps1` once inside the `code` folder, then open the
`code\build\windows-msvc\cen429_demolar.sln` file. Projects are grouped into folders such as
**Hafta 01 / 03 Tasma giris**. Right-click a project, choose **Set as Startup Project**, type the arguments into
the **Properties > Debugging > Command Arguments** field, and press F5. The working folder is automatically the
demo's own folder.

### From the command line (PowerShell)

```powershell
cd C:\Dersler\cen429-secure-programming\code
.\build.ps1
cd week-01\03-tasma-giris
.\demo.ps1
```

If PowerShell says "running scripts is disabled on this system," you don't need to change any settings:
double-click the `demo.cmd` file, or type `powershell -ExecutionPolicy Bypass -File .\demo.ps1`.

## Setup B — WSL (Ubuntu inside Windows)

1. Open PowerShell on Windows and run this once (the computer may restart):

   ```powershell
   wsl --install -d Ubuntu-24.04
   ```

2. Once Ubuntu has started up, install the required tools (this installs only into the Ubuntu inside WSL, and does
   not touch Windows):

   ```bash
   sudo apt update
   sudo apt install -y build-essential gdb valgrind strace ltrace cmake ninja-build rsync zip \
                       binutils sqlite3 libsqlite3-dev openssl libssl-dev python3
   ```

3. Clone the repository into your home folder inside Ubuntu (the Linux filesystem is much faster than working
   under `/mnt/c`, and it keeps file permissions correct), build it and try a demo:

   ```bash
   cd ~
   git clone https://github.com/ucoruh/cen429-secure-programming.git
   cd cen429-secure-programming/code
   ./build.sh
   cd week-01/03-tasma-giris
   sh demo.sh
   ```

To build with WSL from Visual Studio, select **WSL (GCC)** from the configuration dropdown in Way 1; run the
compiled programs with `sh demo.sh` in the WSL terminal.

## Setup C — Linux

Steps 2 and 3 of Setup B apply exactly the same way. CMake 3.16 or later is sufficient. The demos have been
tested with Ubuntu 20.04 (GCC 9) and Ubuntu 24.04 (GCC 13).

## Different versions from the same source: build modes

In the demos, the same `.c` file is compiled several times, each with different settings. This way you see, side
by side, how the same bug behaves under each protection. The suffix on the program's name tells you the mode:

| Mode | Program name | GCC (Linux / WSL) | MSVC (Windows) | What it shows |
| --- | --- | --- | --- | --- |
| `korumasiz` | `giris` | `-O0` | `/Od` | The bug in its rawest form |
| `optimize` | `parola_memset` | `-O2` | `/O2` | Release build; the compiler reorders the code |
| `asan` | `giris_asan` | `-fsanitize=address` | `/fsanitize=address` | A tool that catches the memory error at run time |
| `denetimli` | `giris_denetimli` | `-D_FORTIFY_SOURCE=2` | `_s` functions such as `strcpy_s` | The library's bounds checking |
| `guvenli` | `giris_guvenli` | `-O2` | `/O2` | The fixed version of the source code |

All the settings live in a single place: the `cen429_ornek()` function in the `cmake/cen429.cmake` file.

## Folder structure

```text
code/
├── CMakeLists.txt        # week-* klasörlerini kendiliğinden ekler
├── CMakePresets.json     # Visual Studio yapılandırmaları: Windows (MSVC), WSL (GCC), Linux (GCC)
├── build.ps1 / build.sh  # hepsini derle (ya da "temizle")
├── cmake/cen429.cmake    # derleme modları
├── common/               # bütün demoların ortak başlıkları ve betik yardımcıları
└── week-01/
    ├── 01-path-kandirma/
    ├── 02-bellekte-parola/
    ├── 03-tasma-giris/
    └── 04-isaretli-uzunluk/
```

To build only certain weeks: `cmake -S . -B build/tek -DCEN429_HAFTALAR="week-01;week-03"`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `CMake not found` (Windows) | In the Visual Studio installer, select the **Desktop development with C++** workload |
| `clang_rt.asan_dynamic-x86_64.dll not found` | Run the `*_asan.exe` programs with `demo.ps1` or from inside `bin\windows\`; the build copies this file there. If it's still missing, add the **C++ AddressSanitizer** component to the installation |
| `cmake: command not found` (WSL) | `sudo apt install cmake build-essential` |
| ASan keeps printing `DEADLYSIGNAL` (newer Linux kernels) | `demo.sh` prevents this by itself; when running manually use `setarch $(uname -m) -R ./bin/linux/giris_asan ...` |
| `Permission denied` (WSL) | Run the script with `sh demo.sh`; clone the repository under `~` instead of `/mnt/c` |
| `Cannot restore timestamp` (Windows) | You're in a synced (OneDrive / Drive) folder: rerun `.\build.ps1`, or move the repository to a local folder |
