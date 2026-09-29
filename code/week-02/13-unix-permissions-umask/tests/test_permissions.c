/* Unit tests for week-02/13-unix-permissions-umask/permissions.c.
 *
 * mode_text(), check_permission(), the setuid/setgid/setresuid simulators and can_delete() are
 * all pure, bounded functions, unrelated to the real filesystem -- safe to call in-process on
 * both platforms (the file's real-kernel section is guarded by #ifdef _WIN32/POSIX, but these
 * simulation functions are compiled unconditionally). Every expected result below is reasoned
 * out by hand from the rule stated next to each function in the source.
 */
#define main program_main
#include "../permissions.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- mode_text(): a few well-known modes ------------------------------------------------ */
    {
        char m[10];
        mode_text(0640, m); CHECK_EQ_STR(m, "rw-r-----");
        mode_text(0777, m); CHECK_EQ_STR(m, "rwxrwxrwx");
        mode_text(0000, m); CHECK_EQ_STR(m, "---------");
        mode_text(0600, m); CHECK_EQ_STR(m, "rw-------");
        mode_text(0755, m); CHECK_EQ_STR(m, "rwxr-xr-x");
    }

    /* --- check_permission(): root, owner, group, other, and the "paradox" ------------------- */
    {
        struct person alice = { "alice", 1001, { 1001, 2001, 0 } };
        struct person mark  = { "mark",  1002, { 1002, 2001, 0 } };
        struct person zoe   = { "zoe",   1003, { 1003, 0, 0 } };
        struct person root  = { "root",  0,    { 0, 0, 0 } };
        struct fileobj report  = { "report.txt",  1001, 2001, 0640, "alice", "accounting" };
        struct fileobj paradox = { "paradox.txt", 1001, 2001, 0077, "alice", "accounting" };
        const char *cls;

        CHECK_EQ_INT(check_permission(&alice, &report, WRITE, &cls), 1);   /* owner, w bit set */
        CHECK_EQ_STR(cls, "owner");
        CHECK_EQ_INT(check_permission(&mark, &report, READ, &cls), 1);     /* group, r bit set */
        CHECK_EQ_STR(cls, "group");
        CHECK_EQ_INT(check_permission(&mark, &report, WRITE, &cls), 0);    /* group, no w bit */
        CHECK_EQ_INT(check_permission(&zoe, &report, READ, &cls), 0);      /* other, no r bit */
        CHECK_EQ_STR(cls, "other");

        /* The paradox: alice OWNS paradox.txt, but its owner bits are '---' (mode 0077):
           the owner class is picked and the group/other bits (which DO allow read) are never
           consulted. */
        CHECK_EQ_INT(check_permission(&alice, &paradox, READ, &cls), 0);
        CHECK_EQ_STR(cls, "owner");
        CHECK_EQ_INT(check_permission(&mark, &paradox, READ, &cls), 1);    /* group CAN read it */

        /* root: read/write are free (CAP_DAC_OVERRIDE); execute still needs an x bit somewhere. */
        CHECK_EQ_INT(check_permission(&root, &report, READ, &cls), 1);
        CHECK_EQ_STR(cls, "root");
        CHECK_EQ_INT(check_permission(&root, &report, WRITE, &cls), 1);
        CHECK_EQ_INT(check_permission(&root, &report, EXECUTE, &cls), 0);   /* 0640: no x bit at all */
    }

    /* --- setuid identity transitions: the classic traps and their fixes -------------------- */
    {
        /* seteuid, TEMPORARY drop: the saved UID is untouched (still 0), so seteuid(0) can get
           root back -- exactly the C1 trap the demo's section_c() prints. */
        struct identity k;
        k.r = 1001; k.e = 0; k.s = 0;
        CHECK_EQ_INT(sim_seteuid(&k, 1001), 1);
        CHECK_EQ_INT(k.e, 1001);
        CHECK_EQ_INT(sim_seteuid(&k, 0), 1);          /* TRAP: 0 == the still-untouched saved UID */
    }
    {
        /* seteuid, PERMANENT drop first (all three identities become 1001): now 0 is neither
           the real, effective, nor saved UID -- seteuid(0) is refused (EPERM). */
        struct identity k;
        k.r = 1001; k.e = 1001; k.s = 1001;
        CHECK_EQ_INT(sim_seteuid(&k, 0), 0);
        CHECK_EQ_INT(k.e, 1001);                       /* refused: the effective UID did not move */
    }
    {
        /* setuid while effective==0: changes ALL THREE identities at once (the safe, permanent drop) */
        struct identity k = { 1001, 0, 0, 0, 0, 0 };
        CHECK_EQ_INT(sim_setuid(&k, 1001), 1);
        CHECK_EQ_INT(k.r, 1001); CHECK_EQ_INT(k.e, 1001); CHECK_EQ_INT(k.s, 1001);
    }
    {
        /* setuid while effective!=0 (already dropped): only the effective UID moves, and only to
           r or s -- the classic "temporary drop" trap: the saved UID is untouched. */
        struct identity k;
        k.r = 1001; k.e = 1001; k.s = 0;               /* saved UID still 0 from before the drop */
        CHECK_EQ_INT(sim_setuid(&k, 1001), 1);          /* 1001 == r: allowed, e stays 1001 */
        CHECK_EQ_INT(k.s, 0);                             /* TRAP: the saved UID is still root */
        CHECK_EQ_INT(sim_seteuid(&k, 0), 1);              /* and seteuid(0) can get it back */
    }
    {
        /* setresuid: in an unprivileged process, every new value must already be one of r/e/s. */
        struct identity k;
        k.r = 1001; k.e = 1001; k.s = 0;
        CHECK_EQ_INT(sim_setresuid(&k, 1001, 1001, 1001), 1);   /* 1001 is r and e: allowed */
        CHECK_EQ_INT(k.s, 1001);                                  /* now the saved UID is gone for good */
        k.r = 1001; k.e = 1001; k.s = 1001;
        CHECK_EQ_INT(sim_setresuid(&k, 1001, 9999, 1001), 0);     /* 9999 is none of r/e/s: EPERM */
    }
    {
        /* setgid: mirrors setuid's rule, on the GID triple. */
        struct identity k;
        k.gr = 0; k.ge = 0; k.gs = 0; k.e = 0;
        CHECK_EQ_INT(sim_setgid(&k, 65534), 1);          /* effective UID is still 0: all three move */
        CHECK_EQ_INT(k.gr, 65534); CHECK_EQ_INT(k.ge, 65534); CHECK_EQ_INT(k.gs, 65534);
    }

    /* --- can_delete(): the sticky bit protects OTHER users' files, not root, not the owner -- */
    CHECK_EQ_INT(can_delete(0, 01777, 0, 1001), 1);                /* root: always allowed */
    CHECK_EQ_INT(can_delete(1003, 0777, 0, 1001), 1);               /* no sticky bit: anyone with w+x */
    CHECK_EQ_INT(can_delete(1003, 01777, 0, 1001), 0);              /* sticky bit: not owner, not dir owner */
    CHECK_EQ_INT(can_delete(1001, 01777, 0, 1001), 1);              /* sticky bit, but IS the file's owner */
    CHECK_EQ_INT(can_delete(1003, 01777, 1003, 1001), 1);           /* sticky bit, but IS the dir's owner */
    CHECK_EQ_INT(can_delete(1003, 0700, 0, 1001), 0);                /* missing w+x for "other" entirely */

    TEST_SUMMARY();
}
