# CEN429 - Week 5 - Demo 5: code obfuscation (Windows).
# The main part (string hiding + reflection) needs NO DOWNLOAD.
# For the optional ProGuard part run first: .\prepare.ps1
Set-Location $PSScriptRoot
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    "JDK not found (javac missing)."
    "Install: Eclipse Temurin JDK 21 (https://adoptium.net)."
    exit 1
}
function Line { "==============================================================" }
if (Test-Path output) { Remove-Item -Recurse -Force output }
New-Item -ItemType Directory -Force bin, output | Out-Null
& javac --release 17 -d bin PlainConstant.java HiddenConstant.java `
    DirectCall.java ReflectionCall.java
if ($LASTEXITCODE -ne 0) { "Compile error"; exit 1 }

Line; "PART A - Static string hiding (plain vs XOR-hidden)"; Line
"Run-time output (both produce the same string):"
& java -cp bin PlainConstant
& java -cp bin HiddenConstant
""
"javap: the PLAIN constant shows up in the bytecode as plain text ->"
(& javap -c -p -cp bin PlainConstant | Select-String "server-key") |
    ForEach-Object { "   $_" }
"javap: the same string is SEARCHED FOR in the HIDDEN constant (should not be found) ->"
if (& javap -c -p -cp bin HiddenConstant | Select-String "server-key") {
    "   (unexpected: the string showed up)"
} else {
    "   NOT FOUND: the string is only embedded as a byte array (good)."
}

Line; "PART B - Hiding a method call via reflection"; Line
& java -cp bin DirectCall
& java -cp bin ReflectionCall
""
"javap: the DIRECT call shows 'invokestatic hiddenOperation' ->"
(& javap -c -p -cp bin DirectCall | Select-String "Method hiddenOperation") |
    ForEach-Object { "   $_" }
"javap: REFLECTION has NO direct call; only getDeclaredMethod/invoke show up ->"
if (& javap -c -p -cp bin ReflectionCall | Select-String "invokestatic.*hiddenOperation") {
    "   (unexpected: a direct call showed up)"
} else {
    "   No direct 'invokestatic hiddenOperation' call."
    (& javap -c -p -cp bin ReflectionCall |
        Select-String "getDeclaredMethod|invoke:") |
        ForEach-Object { "   $_" }
}
"   NOTE (honestly): the method is STILL defined in the class (javap -p lists it);"
"   reflection hides the 'call link', it is not protection by itself."

Line; "PART C - Shrinking + obfuscating with ProGuard (optional)"; Line
if (-not (Test-Path lib\proguard.jar)) {
    "ProGuard not present. To enable it: .\prepare.ps1"
    "Rule table and -keep examples: README.md and the lecture page."
    exit 0
}
Push-Location bin
& jar --create --file ..\output\sample.jar .
Pop-Location
"Running ProGuard (proguard.pro)..."
& java -jar lib\proguard.jar '@proguard.pro' 2>&1 | Select-Object -Last 3
"BEFORE (members):"
(& javap -p -cp output\sample.jar DirectCall) | ForEach-Object { "   $_" }
New-Item -ItemType Directory -Force output\plain | Out-Null
Push-Location output\plain
& jar -xf ..\sample-obfuscated.jar
Pop-Location
"AFTER (the unused private member was removed by shrinking):"
(& javap -p -cp output\plain DirectCall) | ForEach-Object { "   $_" }
"The -keep rule protected 'main'; 'hiddenOperation' was shrunk/inlined away."
