# CEN429 - Week 2 - Demo 6: a TOCTOU race condition (Linux / WSL only)
# This demo is Unix-specific: it uses symbolic links, O_NOFOLLOW, and the POSIX file API.
# It does not build on Windows; run it inside WSL with the steps below.
Set-Location $PSScriptRoot
"This demo only runs on Linux / WSL (the TOCTOU symbolic-link race)."
""
"If WSL is installed, run it from this folder like this:"
"  wsl sh -c 'cd `"$($PWD.Path -replace '\\','/' -replace '^C:','/mnt/c')`" && sh ../../build.sh && sh demo.sh'"
""
"Or, in a WSL / Ubuntu terminal:"
"  cd <this folder>"
"  sh ../../build.sh    # build once"
"  sh demo.sh"
""
"A safe simulation cannot be done on Windows because creating a symbolic link"
"needs administrator privilege; no demo in this course ever needs that."
