/* Unit tests for week-02/10-log-injection/logtool.c.
 *
 * escape() is a pure, bounded function -- safe to call in-process; every expected output below is
 * worked out by hand from its own rules (printable ASCII passes through, '\\' doubles, everything
 * else becomes \xNN, the field is capped at 64 input bytes). read_file()/write_unsafe()/
 * write_safe()/count() do real file I/O, only under tests/tmp/ (this test's own scratch folder).
 */
#define main program_main
#include "../logtool.c"
#undef main
#include "../../../common/test_check.h"
#ifdef _WIN32
#include <direct.h>
#else
#include <sys/stat.h>
#endif

#define TMP "tests/tmp"

static void write_bytes(const char *path, const void *v, size_t n)
{
    FILE *f = fopen(path, "wb");
    fwrite(v, 1, n, f);
    fclose(f);
}

int main(void)
{
#ifdef _WIN32
    _mkdir(TMP);
#else
    mkdir(TMP, 0700);
#endif

    /* --- escape(): normal, empty, backslash, control bytes, boundary/truncation ------------ */
    {
        char out[256];
        escape((const unsigned char *)"alice", 5, out, sizeof out);
        CHECK_EQ_STR(out, "alice");
        escape((const unsigned char *)"", 0, out, sizeof out);
        CHECK_EQ_STR(out, "");
        escape((const unsigned char *)"a\\b", 3, out, sizeof out);
        CHECK_EQ_STR(out, "a\\\\b");                            /* the backslash doubles */
    }
    {
        unsigned char name[4] = { 'b', 'o', 'b', 0x0A };         /* an embedded line ending */
        char out[256];
        escape(name, 4, out, sizeof out);
        CHECK_EQ_STR(out, "bob\\x0A");
    }
    {
        unsigned char nul[1] = { 0x00 };
        char out[256];
        escape(nul, 1, out, sizeof out);
        CHECK_EQ_STR(out, "\\x00");
        unsigned char high[1] = { 0xFF };
        escape(high, 1, out, sizeof out);
        CHECK_EQ_STR(out, "\\xFF");                               /* uppercase hex */
    }
    {
        /* exactly 64 printable bytes: no truncation marker */
        unsigned char sixtyfour[64];
        memset(sixtyfour, 'A', 64);
        char out[256];
        escape(sixtyfour, 64, out, sizeof out);
        CHECK_EQ_INT((int)strlen(out), 64);
        CHECK(strstr(out, "...") == NULL);
    }
    {
        /* 65 printable bytes: truncated to 64 + "..." */
        unsigned char sixtyfive[65];
        memset(sixtyfive, 'A', 65);
        char out[256];
        escape(sixtyfive, 65, out, sizeof out);
        CHECK_EQ_INT((int)strlen(out), 67);
        CHECK_EQ_INT(memcmp(out + 64, "...", 3), 0);
    }
    {
        /* the very long fixture (5000 bytes): still capped at 64 + "..." */
        unsigned char many[5000];
        memset(many, 'A', 5000);
        char out[256];
        escape(many, 5000, out, sizeof out);
        CHECK_EQ_INT((int)strlen(out), 67);
    }

    /* --- read_file(): normal and a missing file --------------------------------------------- */
    {
        write_bytes(TMP "/in.bin", "hi\nthere", 8);
        unsigned char buf[64];
        long n = read_file(TMP "/in.bin", buf, sizeof buf);
        CHECK_EQ_INT((int)n, 8);
        CHECK_EQ_INT(memcmp(buf, "hi\nthere", 8), 0);
        unsigned char b2[8];
        CHECK_EQ_INT((int)read_file(TMP "/does-not-exist.bin", b2, sizeof b2), -1);
    }

    /* --- write_unsafe(): injects a forged second line -------------------------------------- */
    {
        const char *log = TMP "/unsafe.log";
        remove(log);
        unsigned char name[10] = { 'b', 'o', 'b', 0x0A, 'F', 'O', 'R', 'G', 'E', 'D' };
        write_unsafe(log, name, 10);
        char expected[128];
        snprintf(expected, sizeof expected, "%s AUDIT login user=bob\nFORGED result=FAILURE\n",
                 TIMESTAMP);
        FILE *f = fopen(log, "rb");
        char actual[128] = { 0 };
        size_t n = fread(actual, 1, sizeof actual - 1, f);
        fclose(f);
        CHECK_EQ_INT((int)n, (int)strlen(expected));
        CHECK_EQ_STR(actual, expected);
    }

    /* --- write_safe(): the same injection attempt stays a single, escaped line ------------- */
    {
        const char *log = TMP "/safe.log";
        remove(log);
        unsigned char name[10] = { 'b', 'o', 'b', 0x0A, 'F', 'O', 'R', 'G', 'E', 'D' };
        write_safe(log, name, 10);
        char expected[128];
        snprintf(expected, sizeof expected,
                 "%s AUDIT login user=bob\\x0AFORGED result=FAILURE\n", TIMESTAMP);
        FILE *f = fopen(log, "rb");
        char actual[128] = { 0 };
        size_t n = fread(actual, 1, sizeof actual - 1, f);
        fclose(f);
        CHECK_EQ_STR(actual, expected);
        int newlines = 0;
        for (size_t i = 0; i < n; i++)
            if (actual[i] == '\n')
                newlines++;
        CHECK_EQ_INT(newlines, 1);                                 /* guaranteed a single line */
    }

    /* --- count(): return codes for a real log vs. a missing file --------------------------- */
    CHECK_EQ_INT(count(TMP "/safe.log"), 0);
    CHECK_EQ_INT(count(TMP "/does-not-exist.log"), 1);

    TEST_SUMMARY();
}
