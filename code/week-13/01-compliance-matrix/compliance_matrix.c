/*
 * CEN429 - Week 13 - Demo 1: Compliance matrix validator (S17).
 * Each requirement line:  ID | STATUS | SECTION | EVIDENCE
 *   STATUS: met | delegated | not-met
 * Rules (an evaluator's point of view):
 *   * "met" but EVIDENCE is empty       -> FINDING (counted as not met).
 *   * "delegated" but EVIDENCE is empty -> FINDING (who/why/how must be written).
 *   * "not-met"                         -> residual risk (informational).
 * Exit code = number of findings.
 *
 * Usage: compliance_matrix [requirements.txt]   (without a file, the EMBEDDED sample is used)
 * SAFETY: only READS the given text file; no write/network/system operation.
 */
#include <stdio.h>
#include <string.h>

#define MAX_FIELDS 8
#define MAX_ROWS   64

/* Embedded sample matrix (used when no file is given). The second row is deliberately left
   WITHOUT evidence, so it becomes the demo's first finding. */
static const char *EMBEDDED_SAMPLE =
    "CEN429-DR-01|met|S8|T-05 test output\n"
    "CEN429-CR-02|met|S8|\n"                        /* <- no evidence: FINDING */
    "CEN429-DT-03|met|S11|T-11 test\n"
    "CEN429-AP-04|delegated|S14|MPA provides signed updates\n"
    "CEN429-AS-05|not-met|S12|residual risk: rooted device\n";

/* Trims leading/trailing whitespace from s, in place. */
static void trim(char *s)
{
    size_t n = strlen(s);
    while (n && (s[n - 1] == ' ' || s[n - 1] == '\r' || s[n - 1] == '\n' || s[n - 1] == '\t')) s[--n] = '\0';
    size_t i = 0;
    while (s[i] == ' ' || s[i] == '\t') i++;
    if (i) memmove(s, s + i, strlen(s + i) + 1);
}

/* Splits `text` in place on `delimiter`, writing up to max_fields pointers into `fields`.
 * A small, portable replacement for strtok_r/strtok_s: MSVC's strtok_s and glibc's strtok_r
 * are not the same function (different headers, different guarantees), so relying on either
 * one by name fails to link on the other platform. This loop needs neither: it walks the
 * buffer once, NUL-terminates each field in place, and never keeps hidden state, so it is
 * safe to call again immediately afterward (e.g. once per '\n' row, then once per '|' field
 * inside that row) without the two calls interfering with each other.
 * Returns the number of fields found (always >= 1, since even a delimiter-free string is one
 * field). Excess fields beyond max_fields are still consumed (so the scan finishes correctly)
 * but are not stored.
 */
static int split_fields(char *text, char delimiter, char *fields[], int max_fields)
{
    int count = 0;
    char *start = text;
    char *p = text;
    for (;;) {
        if (*p == delimiter || *p == '\0') {
            int at_end = (*p == '\0');
            *p = '\0';
            if (count < max_fields) fields[count++] = start;
            start = p + 1;
            if (at_end) break;
        }
        p++;
    }
    return count;
}

static int process_line(char *line, int *count_met, int *count_delegated, int *count_not_met)
{
    char *field[MAX_FIELDS];
    int n = split_fields(line, '|', field, MAX_FIELDS);
    if (n < 3) return 0;                 /* malformed row -> skip */
    char *id = field[0], *status = field[1], *evidence = (n >= 4) ? field[3] : (char *) "";
    trim(id); trim(status); trim(evidence);

    int finding = 0;
    if (strcmp(status, "met") == 0) {
        (*count_met)++;
        if (evidence[0] == '\0') {
            printf("  [FINDING] %-14s 'met' but EVIDENCE is empty -> counted as not met\n", id);
            finding = 1;
        } else {
            printf("  [OK]      %-14s met         (evidence: %s)\n", id, evidence);
        }
    } else if (strcmp(status, "delegated") == 0) {
        (*count_delegated)++;
        if (evidence[0] == '\0') {
            printf("  [FINDING] %-14s 'delegated' but who/why/how is missing\n", id);
            finding = 1;
        } else {
            printf("  [OK]      %-14s delegated   (%s)\n", id, evidence);
        }
    } else if (strcmp(status, "not-met") == 0) {
        (*count_not_met)++;
        printf("  [RISK]    %-14s not-met -> must be recorded as residual risk (%s)\n", id, evidence);
    } else {
        printf("  [FINDING] %-14s unknown status '%s'\n", id, status);
        return 1;
    }
    return finding;
}

int main(int argc, char **argv)
{
    char line[512];
    int findings = 0, met = 0, delegated = 0, not_met = 0;
    printf("=== Compliance matrix validation (S17) ===\n");

    if (argc > 1) {
        FILE *f = fopen(argv[1], "r");
        if (!f) { fprintf(stderr, "Could not open file: %s\n", argv[1]); return 2; }
        while (fgets(line, sizeof line, f))
            if (line[0] != '\n') findings += process_line(line, &met, &delegated, &not_met);
        fclose(f);
    } else {
        char copy[1024];
        strncpy(copy, EMBEDDED_SAMPLE, sizeof copy - 1);
        copy[sizeof copy - 1] = '\0';
        char *rows[MAX_ROWS];
        int row_count = split_fields(copy, '\n', rows, MAX_ROWS);
        for (int i = 0; i < row_count; i++) {
            if (rows[i][0] == '\0') continue;
            strncpy(line, rows[i], sizeof line - 1);
            line[sizeof line - 1] = '\0';
            findings += process_line(line, &met, &delegated, &not_met);
        }
    }

    printf("\nSummary: %d met, %d delegated, %d not-met | %d FINDING(s)\n", met, delegated, not_met, findings);
    if (findings) printf("A 'met' row with no evidence is the evaluator's first finding.\n");
    return findings;
}
