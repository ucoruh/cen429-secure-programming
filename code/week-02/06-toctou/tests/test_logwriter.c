/* Unit tests for week-02/06-toctou/logwriter.c (Unix only -- symbolic links, O_NOFOLLOW).
 *
 * write_safe()/write_unsafe() only ever write inside a scratch folder this test creates and
 * removes itself (tests/tmp/), never touching a system path. These tests call the functions
 * directly (no race window): they check the NON-racy, deterministic behaviour documented in the
 * file's own header comment -- a target that is ALREADY a symbolic link at call time is rejected
 * by both versions (the real TOCTOU exploit needs the swap to happen DURING the delay, which is
 * exercised by attack.sh/demo.sh, not by this in-process test).
 */
#define main program_main
#include "../logwriter.c"
#undef main
#include "../../../common/test_check.h"
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

#define DIR "tests/tmp"

static long file_size(const char *path)
{
    struct stat st;
    if (stat(path, &st) != 0)
        return -1;
    return (long)st.st_size;
}

static int read_all(const char *path, char *out, size_t cap)
{
    FILE *f = fopen(path, "rb");
    if (!f)
        return -1;
    size_t n = fread(out, 1, cap - 1, f);
    fclose(f);
    out[n] = '\0';
    return (int)n;
}

int main(void)
{
    mkdir(DIR, 0700);   /* ignore EEXIST: the folder may already exist from a previous run */

    /* --- write_safe(): a normal, regular target ------------------------------------------- */
    {
        const char *target = DIR "/plain.log";
        unlink(target);
        CHECK_EQ_INT(write_safe(target, "line one"), 0);
        char buf[256];
        read_all(target, buf, sizeof buf);
        CHECK_EQ_STR(buf, "line one\n");
        CHECK_EQ_INT(write_safe(target, "line two"), 0);        /* O_APPEND: a second line */
        read_all(target, buf, sizeof buf);
        CHECK_EQ_STR(buf, "line one\nline two\n");
        struct stat st;
        CHECK_EQ_INT(stat(target, &st) == 0, 1);          /* the file really exists */
        /* NOTE: the requested mode (0600, passed to open()) is not re-checked here: on a
           DrvFs-mounted path (WSL's /mnt/c/..., which is where this test may run from -- see
           code/README.en.md's "clone under ~" note) the Windows filesystem does not honour Unix
           permission bits, so st_mode would reflect DrvFs's own mapping, not write_safe()'s
           open() call. The call succeeding (checked above/below) is what this test can portably
           assert; the actual O_NOFOLLOW rejection is exercised later in this file, on real ext4
           behaviour that IS portable (lstat() correctly reports S_ISLNK either way). */
        unlink(target);
    }

    /* --- write_safe(): an already-existing symbolic link is REFUSED (O_NOFOLLOW) ---------- */
    {
        const char *real_target = DIR "/real.txt";
        const char *link = DIR "/via_link.log";
        unlink(real_target);
        unlink(link);
        FILE *f = fopen(real_target, "w");
        fputs("protected data\n", f);
        fclose(f);
        CHECK_EQ_INT(symlink("real.txt", link), 0);
        CHECK_EQ_INT(write_safe(link, "attacker payload"), 1);   /* rejected: not 0 */
        char buf[256];
        read_all(real_target, buf, sizeof buf);
        CHECK_EQ_STR(buf, "protected data\n");                    /* untouched by the rejected write */
        unlink(link);
        unlink(real_target);
    }

    /* --- write_safe(): an empty text argument still writes just the newline --------------- */
    {
        const char *target = DIR "/empty.log";
        unlink(target);
        CHECK_EQ_INT(write_safe(target, ""), 0);
        CHECK_EQ_INT((int)file_size(target), 1);                  /* just "\n" */
        unlink(target);
    }

    /* --- write_unsafe(): a normal, regular target (same happy path as write_safe) --------- */
    {
        const char *target = DIR "/plain_unsafe.log";
        unlink(target);
        CHECK_EQ_INT(write_unsafe(target, "hello"), 0);
        char buf[256];
        read_all(target, buf, sizeof buf);
        CHECK_EQ_STR(buf, "hello\n");
        unlink(target);
    }

    /* --- write_unsafe(): WITHOUT a race, it also sees the pre-existing symlink and refuses -- */
    {
        const char *real_target = DIR "/real2.txt";
        const char *link = DIR "/via_link2.log";
        unlink(real_target);
        unlink(link);
        FILE *f = fopen(real_target, "w");
        fputs("also protected\n", f);
        fclose(f);
        CHECK_EQ_INT(symlink("real2.txt", link), 0);
        CHECK_EQ_INT(write_unsafe(link, "attacker payload"), 1);  /* the lstat() check catches it */
        char buf[256];
        read_all(real_target, buf, sizeof buf);
        CHECK_EQ_STR(buf, "also protected\n");
        unlink(link);
        unlink(real_target);
    }

    /* --- both versions: a target whose parent folder does not exist --------------------- */
    CHECK_EQ_INT(write_safe(DIR "/no-such-subdir/x.log", "x"), 1);
    CHECK_EQ_INT(write_unsafe(DIR "/no-such-subdir/x.log", "x"), 1);

    rmdir(DIR);   /* only succeeds once every file above was cleaned up; harmless otherwise */

    TEST_SUMMARY();
}
