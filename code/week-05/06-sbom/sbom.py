# -*- coding: utf-8 -*-
# CEN429 - Week 5 - Demo 6: Software Bill of Materials (SBOM) generation
#
# The demo produces a CycloneDX 1.5 JSON SBOM from its own synthetic jars
# (output/lib/): name, version, purl and SHA-256 for each component. It then
# matches them against a small, SYNTHETIC "known vulnerable versions" list and
# warns.
#
# NO DOWNLOAD REQUIRED (uses only the built-in zipfile, hashlib, json). Every
# component name and version is synthetic; not a real library or CVE. The real
# incident (Log4Shell, 2021) is only DESCRIBED in the README and the lecture page.
import hashlib
import json
import os
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(HERE, "output")
LIB_DIR = os.path.join(OUTPUT, "lib")
SBOM_PATH = os.path.join(OUTPUT, "sbom.cyclonedx.json")

# Synthetic components: (group, name, version). All made up.
COMPONENTS = [
    ("example.group", "record-library", "1.2.0"),
    ("example.group", "json-tool", "2.5.1"),
    ("example.group", "log-core", "2.14.0"),
    ("example.group", "crypto-helper", "3.0.4"),
]

# Synthetic "known vulnerable versions" list (not a real CVE database).
VULNERABLE = {
    "log-core": {
        "versions": ["2.0.0", "2.14.0", "2.15.0"],
        "id": "CEN429-2026-0001",
        "description": "Remote code execution via a formatted message (synthetic example).",
        "fixed_in": "2.17.1",
    },
    "json-tool": {
        "versions": ["2.5.1"],
        "id": "CEN429-2026-0002",
        "description": "Unsafe deserialization (synthetic example).",
        "fixed_in": "2.6.0",
    },
}


def line():
    print("-" * 62)


def build_jars():
    """Create the synthetic jar files (each one a small zip)."""
    if not os.path.isdir(LIB_DIR):
        os.makedirs(LIB_DIR)
    for group, name, version in COMPONENTS:
        path = os.path.join(LIB_DIR, name + "-" + version + ".jar")
        manifest = (
            "Manifest-Version: 1.0\r\n"
            "Implementation-Title: " + name + "\r\n"
            "Implementation-Version: " + version + "\r\n"
            "Implementation-Vendor-Id: " + group + "\r\n\r\n"
        )
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("META-INF/MANIFEST.MF", manifest)
            # A tiny placeholder class file so the content differs per component.
            z.writestr("example/Class.txt", "synthetic content: " + name + version)


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def read_manifest(path):
    """Read name and version from a jar's manifest (fall back to the file name)."""
    name, version, group = None, None, "example.group"
    try:
        with zipfile.ZipFile(path) as z:
            text = z.read("META-INF/MANIFEST.MF").decode("utf-8", "replace")
        for entry in text.splitlines():
            if entry.startswith("Implementation-Title:"):
                name = entry.split(":", 1)[1].strip()
            elif entry.startswith("Implementation-Version:"):
                version = entry.split(":", 1)[1].strip()
            elif entry.startswith("Implementation-Vendor-Id:"):
                group = entry.split(":", 1)[1].strip()
    except (KeyError, zipfile.BadZipFile):
        pass
    if not name or not version:
        base = os.path.basename(path)[:-4]
        name, _, version = base.rpartition("-")
    return group, name, version


def build_sbom():
    components = []
    for filename in sorted(os.listdir(LIB_DIR)):
        if not filename.endswith(".jar"):
            continue
        path = os.path.join(LIB_DIR, filename)
        group, name, version = read_manifest(path)
        digest = sha256(path)
        purl = "pkg:maven/" + group + "/" + name + "@" + version
        components.append({
            "type": "library",
            "group": group,
            "name": name,
            "version": version,
            "purl": purl,
            "hashes": [{"alg": "SHA-256", "content": digest}],
        })
    bom = {
        "bomFormat": "CycloneDX",
        "specVersion": "1.5",
        "version": 1,
        "metadata": {"component": {
            "type": "application",
            "name": "cen429-sample-app",
            "version": "0.1.0",
        }},
        "components": components,
    }
    with open(SBOM_PATH, "w", encoding="utf-8") as f:
        json.dump(bom, f, ensure_ascii=False, indent=2)
    return components


def scan_for_vulnerabilities(components):
    findings = []
    for c in components:
        record = VULNERABLE.get(c["name"])
        if record and c["version"] in record["versions"]:
            findings.append((c, record))
    return findings


def main():
    build_jars()
    components = build_sbom()

    line()
    print("STEP 1 - CycloneDX 1.5 SBOM generated from the jars in lib/")
    print("   Output: " + os.path.relpath(SBOM_PATH, HERE))
    print("   " + str(len(components)) + " component(s) found:")
    print("   %-22s %-8s %s" % ("name", "version", "SHA-256 (first 16)"))
    for c in components:
        print("   %-22s %-8s %s..." % (
            c["name"], c["version"], c["hashes"][0]["content"][:16]))

    line()
    print("STEP 2 - purl (package URL) examples")
    for c in components:
        print("   " + c["purl"])

    line()
    print("STEP 3 - Matching against the (synthetic) known-vulnerable-version list")
    findings = scan_for_vulnerabilities(components)
    if not findings:
        print("   No warnings.")
    for c, record in findings:
        print("   [WARNING] " + c["name"] + " " + c["version"]
              + "  (" + record["id"] + ")")
        print("             " + record["description"])
        print("             Fix: upgrade to >= " + record["fixed_in"] + ".")

    line()
    print("Result: an SBOM (CycloneDX/SPDX) is a machine-readable answer to 'which")
    print("component, which version'. Matched against vulnerability databases, it")
    print("answers 'am I affected?' in seconds the next time there is a Log4Shell.")


if __name__ == "__main__":
    sys.exit(main())
