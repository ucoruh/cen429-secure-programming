/*
 * CEN429 — Week 2 — Demo 07: harmless sample files for the rule engine
 *
 * Usage: bin/.../rule_samples <folder>
 *
 * NONE of the generated files are executable; all of them are plain text.
 *   clean.txt    an ordinary lecture plan: should match no rule
 *   guide.txt    a harmless setup guide; naturally contains the words
 *                "download" and "run" (a false-positive candidate)
 *   capsule.bin  text resembling Demo 1's toy CAPSULE format
 *   variant.bin  a modified version of the capsule: a different header, and
 *                the marker is "BLUE_CATS" (underscore instead of hyphen)
 *   notes.txt    a notes file that contains the word "TODO" four times
 */
#include <stdio.h>
#include "cen429_demo.h"

static int write_file(const char *folder, const char *name, const char *text)
{
    char path[512];
    snprintf(path, sizeof path, "%s/%s", folder, name);
    FILE *f = fopen(path, "wb");      /* binary mode: identical bytes on both platforms */
    if (!f) {
        perror(path);
        return -1;
    }
    fputs(text, f);
    return fclose(f);
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 2) {
        fprintf(stderr, "usage: %s <folder>\n", argv[0]);
        return 2;
    }
    const char *dir = argv[1];
    int h = 0;
    h |= write_file(dir, "clean.txt",
             "Weekly lecture plan\n"
             "Week 1: introduction and threat modeling\n"
             "Week 2: malware and security models\n");
    h |= write_file(dir, "guide.txt",
             "Setup guide\n"
             "1. Download the program from the official site.\n"
             "2. Verify its signature, then run the installer.\n"
             "3. Check for updates on first launch.\n");
    h |= write_file(dir, "capsule.bin",
             "CAPSULE/1\n"
             "DECODER: ALGO=xs32 SEED=1a2b3c4d DECODE\n"
             "body: text imitating download and run commands\n"
             "marker: BLUE-CATS-42 (a harmless course example)\n");
    h |= write_file(dir, "variant.bin",
             "CAPSULE/1\n"
             "BODY LEN=64\n"
             "marker: BLUE_CATS-42 (underscore instead of hyphen)\n");
    h |= write_file(dir, "notes.txt",
             "TODO: finish the report\n"
             "TODO: try demo 07\n"
             "TODO: review the rules\n"
             "TODO: study for the quiz\n");
    if (h != 0)
        return 1;
    printf("  5 sample files generated under %s/\n", dir);
    return 0;
}
