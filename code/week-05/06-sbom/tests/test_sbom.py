# -*- coding: utf-8 -*-
# CEN429 - Week 5 - Demo 6 unit test (plain Python, stdlib only).
#
# Redirects sbom.py's OUTPUT/LIB_DIR/SBOM_PATH to a disposable temp folder
# (never the real demo output, never touching any real file) so the test can
# run build_jars()/build_sbom()/scan_for_vulnerabilities() in isolation and
# check the generated SBOM and the vulnerability match.
import hashlib
import json
import os
import shutil
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import sbom as demo  # noqa: E402

checks = 0
failures = 0


def check(condition, what):
    global checks, failures
    checks += 1
    if not condition:
        failures += 1
        print("FAIL: " + what)


def main():
    lab = tempfile.mkdtemp(prefix="cen429-sbom-test-")
    original_output, original_lib, original_sbom = demo.OUTPUT, demo.LIB_DIR, demo.SBOM_PATH
    try:
        demo.OUTPUT = lab
        demo.LIB_DIR = os.path.join(lab, "lib")
        demo.SBOM_PATH = os.path.join(lab, "sbom.cyclonedx.json")

        demo.build_jars()
        check(os.path.isdir(demo.LIB_DIR), "build_jars: creates the lib/ directory")
        jars = sorted(f for f in os.listdir(demo.LIB_DIR) if f.endswith(".jar"))
        check(len(jars) == len(demo.COMPONENTS),
              "build_jars: produces exactly one jar per declared component")
        check("log-core-2.14.0.jar" in jars,
              "build_jars: the vulnerable 'log-core' component's jar was created")

        components = demo.build_sbom()
        check(os.path.isfile(demo.SBOM_PATH), "build_sbom: writes the SBOM JSON file")
        check(len(components) == len(demo.COMPONENTS),
              "build_sbom: returns one component entry per jar")

        with open(demo.SBOM_PATH, encoding="utf-8") as f:
            bom = json.load(f)
        check(bom["bomFormat"] == "CycloneDX", "build_sbom: bomFormat is 'CycloneDX'")
        check(bom["specVersion"] == "1.5", "build_sbom: specVersion is '1.5'")
        check(len(bom["components"]) == len(demo.COMPONENTS),
              "build_sbom: the JSON file lists every component")

        by_name = {c["name"]: c for c in components}
        check(by_name["log-core"]["version"] == "2.14.0",
              "build_sbom: log-core's version is read back correctly from the manifest")
        check(by_name["log-core"]["purl"] == "pkg:maven/example.group/log-core@2.14.0",
              "build_sbom: the purl is assembled as pkg:maven/<group>/<name>@<version>")
        check(len(by_name["log-core"]["hashes"][0]["content"]) == 64,
              "build_sbom: the SHA-256 digest is 64 hex characters")

        # Independent hash check: recompute the digest ourselves and compare.
        jar_path = os.path.join(demo.LIB_DIR, "log-core-2.14.0.jar")
        independent_digest = hashlib.sha256(open(jar_path, "rb").read()).hexdigest()
        check(by_name["log-core"]["hashes"][0]["content"] == independent_digest,
              "build_sbom: the recorded SHA-256 matches an independently computed digest")

        # --- Vulnerability matching ---
        findings = demo.scan_for_vulnerabilities(components)
        found_names = sorted(c["name"] for c, _ in findings)
        check(found_names == ["json-tool", "log-core"],
              "scan_for_vulnerabilities: flags exactly the two known-vulnerable components")
        finding_map = {c["name"]: record for c, record in findings}
        check(finding_map["log-core"]["fixed_in"] == "2.17.1",
              "scan_for_vulnerabilities: reports the correct fixed-in version for log-core")

        # --- A component NOT on the vulnerable list must not be flagged ---
        check("record-library" not in finding_map,
              "scan_for_vulnerabilities: a component with no known bad version is not flagged")
        check("crypto-helper" not in finding_map,
              "scan_for_vulnerabilities: a component whose version isn't in the bad list is not flagged")

        # --- A hypothetical safe version of the same library must not match ---
        safe_component = {"name": "log-core", "version": "2.17.1"}
        check(demo.scan_for_vulnerabilities([safe_component]) == [],
              "scan_for_vulnerabilities: the FIXED version of a vulnerable library is not flagged")

        print(str(checks) + " checks, " + str(failures) + " failures")
        return 1 if failures else 0
    finally:
        demo.OUTPUT, demo.LIB_DIR, demo.SBOM_PATH = original_output, original_lib, original_sbom
        shutil.rmtree(lab, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
