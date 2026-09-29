/* Unit tests for week-13/01-compliance-matrix/compliance_matrix.c.
 *
 * trim(), split_fields() and process_line() are pure text-processing helpers: no file, network
 * or system call, so they are safe to call directly and repeatedly in-process. Expected values
 * below are computed by hand from the rule text in the source comment, never by calling the
 * function under test with different input and trusting its own output.
 */
#define main program_main
#include "../compliance_matrix.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- trim(): leading/trailing whitespace ------------------------------------------------ */
    {
        char s[] = "  hello  ";
        trim(s);
        CHECK_EQ_STR(s, "hello");
    }
    {
        char s[] = "no-change";
        trim(s);
        CHECK_EQ_STR(s, "no-change");
    }
    {
        char s[] = "\t tabs-and-spaces \t";
        trim(s);
        CHECK_EQ_STR(s, "tabs-and-spaces");
    }
    {
        char s[] = "line-ending\r\n";
        trim(s);
        CHECK_EQ_STR(s, "line-ending");
    }
    {
        char s[] = "   ";               /* all whitespace -> empty */
        trim(s);
        CHECK_EQ_STR(s, "");
    }
    {
        char s[] = "";                  /* already empty */
        trim(s);
        CHECK_EQ_STR(s, "");
    }

    /* --- split_fields(): normal, boundary, empty, delimiter-not-present, max_fields cap ----- */
    {
        char text[] = "CEN429-DR-01|met|S8|evidence text";
        char *field[8];
        int n = split_fields(text, '|', field, 8);
        CHECK_EQ_INT(n, 4);
        CHECK_EQ_STR(field[0], "CEN429-DR-01");
        CHECK_EQ_STR(field[1], "met");
        CHECK_EQ_STR(field[2], "S8");
        CHECK_EQ_STR(field[3], "evidence text");
    }
    {
        /* Exactly 3 fields: no evidence column at all (not even an empty trailing one). */
        char text[] = "CEN429-AS-05|not-met|S12";
        char *field[8];
        int n = split_fields(text, '|', field, 8);
        CHECK_EQ_INT(n, 3);
    }
    {
        /* Empty string is still one (empty) field, never zero. */
        char text[] = "";
        char *field[4];
        int n = split_fields(text, '|', field, 4);
        CHECK_EQ_INT(n, 1);
        CHECK_EQ_STR(field[0], "");
    }
    {
        /* No delimiter present at all: the whole string is field 0. */
        char text[] = "no-delimiter-here";
        char *field[4];
        int n = split_fields(text, '|', field, 4);
        CHECK_EQ_INT(n, 1);
        CHECK_EQ_STR(field[0], "no-delimiter-here");
    }
    {
        /* max_fields cap: 5 fields present, room for only 2 -> stored count stops at 2, but the
           scan still consumes every delimiter (no crash, no leftover unterminated field). */
        char text[] = "a|b|c|d|e";
        char *field[2];
        int n = split_fields(text, '|', field, 2);
        CHECK_EQ_INT(n, 2);
        CHECK_EQ_STR(field[0], "a");
        CHECK_EQ_STR(field[1], "b");
    }
    {
        /* Splitting the embedded multi-row sample on '\n' (as main() does for the no-file path)
           recovers exactly 5 non-empty rows plus one trailing empty row after the final '\n'. */
        char copy[512];
        strncpy(copy, EMBEDDED_SAMPLE, sizeof copy - 1);
        copy[sizeof copy - 1] = '\0';
        char *rows[16];
        int n = split_fields(copy, '\n', rows, 16);
        CHECK_EQ_INT(n, 6);
        CHECK_EQ_STR(rows[5], "");
        CHECK(strncmp(rows[0], "CEN429-DR-01", 12) == 0);
    }

    /* --- process_line(): every status, evidence present/absent, malformed, unknown status ---- */
    {
        char line[] = "CEN429-DR-01|met|S8|T-05 test output";
        int met = 0, delegated = 0, not_met = 0;
        int finding = process_line(line, &met, &delegated, &not_met);
        CHECK_EQ_INT(finding, 0);
        CHECK_EQ_INT(met, 1);
    }
    {
        /* met with EMPTY evidence -> the rule's first finding. */
        char line[] = "CEN429-CR-02|met|S8|";
        int met = 0, delegated = 0, not_met = 0;
        int finding = process_line(line, &met, &delegated, &not_met);
        CHECK_EQ_INT(finding, 1);
        CHECK_EQ_INT(met, 1);
    }
    {
        char line[] = "CEN429-AP-04|delegated|S14|MPA provides signed updates";
        int met = 0, delegated = 0, not_met = 0;
        int finding = process_line(line, &met, &delegated, &not_met);
        CHECK_EQ_INT(finding, 0);
        CHECK_EQ_INT(delegated, 1);
    }
    {
        /* delegated with EMPTY evidence -> finding (who/why/how missing). */
        char line[] = "CEN429-XX-09|delegated|S10|";
        int met = 0, delegated = 0, not_met = 0;
        int finding = process_line(line, &met, &delegated, &not_met);
        CHECK_EQ_INT(finding, 1);
        CHECK_EQ_INT(delegated, 1);
    }
    {
        /* not-met is informational (residual risk), never a finding by itself. */
        char line[] = "CEN429-AS-05|not-met|S12|residual risk: rooted device";
        int met = 0, delegated = 0, not_met = 0;
        int finding = process_line(line, &met, &delegated, &not_met);
        CHECK_EQ_INT(finding, 0);
        CHECK_EQ_INT(not_met, 1);
    }
    {
        /* Exactly 3 fields (no evidence column at all) behaves like empty evidence. */
        char line[] = "CEN429-ZZ-01|met|S8";
        int met = 0, delegated = 0, not_met = 0;
        int finding = process_line(line, &met, &delegated, &not_met);
        CHECK_EQ_INT(finding, 1);
    }
    {
        /* Unknown status word -> a finding, and NONE of the three counters move. */
        char line[] = "CEN429-QQ-07|reviewing|S9|note";
        int met = 0, delegated = 0, not_met = 0;
        int finding = process_line(line, &met, &delegated, &not_met);
        CHECK_EQ_INT(finding, 1);
        CHECK_EQ_INT(met + delegated + not_met, 0);
    }
    {
        /* Malformed row (fewer than 3 fields, e.g. free text with no '|' at all): skipped
           silently, no finding, no counter moves -- this is what lets main() tolerate a blank or
           free-text line in a hand-edited requirements file without crashing or miscounting. */
        char line[] = "this row has no pipe separators";
        int met = 0, delegated = 0, not_met = 0;
        int finding = process_line(line, &met, &delegated, &not_met);
        CHECK_EQ_INT(finding, 0);
        CHECK_EQ_INT(met + delegated + not_met, 0);
    }
    {
        /* Surrounding whitespace on every field is trimmed before comparison. */
        char line[] = "  CEN429-WS-01  |  met  |  S8  |  evidence with spaces  ";
        int met = 0, delegated = 0, not_met = 0;
        int finding = process_line(line, &met, &delegated, &not_met);
        CHECK_EQ_INT(finding, 0);
        CHECK_EQ_INT(met, 1);
    }
    {
        /* A field at the edge of the 512-byte line buffer (too long a single field) is still
           split and trimmed correctly, with no overflow (the buffer itself is caller-owned and
           sized by main(); this only checks split_fields()/trim() do not corrupt it). */
        char line[512];
        char long_id[400];
        memset(long_id, 'A', sizeof long_id - 1);
        long_id[sizeof long_id - 1] = '\0';
        snprintf(line, sizeof line, "%s|met|S8|evidence", long_id);
        int met = 0, delegated = 0, not_met = 0;
        int finding = process_line(line, &met, &delegated, &not_met);
        CHECK_EQ_INT(finding, 0);
        CHECK_EQ_INT(met, 1);
    }

    TEST_SUMMARY();
}
