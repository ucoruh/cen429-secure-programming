# CEN429 - Week 2 - Demo 3: access matrix and model simulator (Windows)
# Build first: ..\..\build.ps1   Then: .\demo.ps1
# A simulator; it never touches a real file or a system setting.
Set-Location $PSScriptRoot
$B = "bin\windows"
if (-not (Test-Path "$B\access.exe")) { "Build first: ..\..\build.ps1"; exit 1 }
$E = ".\$B\access.exe"
function Line { "--------------------------------------------------------------" }

Line; "STEP 0 - Pure DAC (access control matrix): the owner's permission decides"
"  Scenario: mobile payment app + security library"
& $E policy-matrix.txt
"   ^ app READ payment_key: not in the matrix -> DENY (least privilege)"

Line; "STEP 1 - Bell-LaPadula (CONFIDENTIALITY): no read up, no write down"
& $E policy-confidentiality.txt
"   ^ clerk READ operation: reading up -> DENY (cannot see secret information)"
"     general WRITE notice: writing down -> DENY (a leak is prevented)"

Line; "STEP 2 - Biba (INTEGRITY): no read down, no write up"
& $E policy-integrity.txt
"   ^ listener WRITE record: writing up -> DENY (dirty data must not corrupt clean data)"
"     processor READ incoming: reading down -> DENY (don't trust untrusted input)"

Line; "STEP 3 - BLP categories: level alone is not enough, you also need the compartment"
& $E policy-category.txt
"   ^ general READ asia_note: level is high enough but no ASIA category -> DENY"
"     analyst WRITE joint_archive: the object dominates the subject -> ALLOW"

Line; "STEP 4 - Biba low-water-mark: reading lowers the level"
& $E policy-lwm.txt
"   ^ the same request (processor WRITE record) is ALLOW first, DENY once incoming has been read"

Line; "STEP 5 - Chinese Wall: a wall between conflicting companies"
& $E policy-chinese-wall.txt
"   ^ the decision depends on history: once BankA is read, BankB is closed off"

Line; "Result: BLP protects confidentiality, Biba protects integrity; their directions are opposite."
"DAC is the permission the owner grants; MAC (BLP/Biba) is the system-wide limit on top of it."
