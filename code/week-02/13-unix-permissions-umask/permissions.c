/*
 * CEN429 — Week 2 — Demo 13: Unix permissions, umask, and a setuid lab
 *
 * Usage: bin/linux/permissions sim    a pure simulation (also runs on Windows)
 *        bin/linux/permissions real   with real files, only under output/
 *                                     (Linux/WSL only; prints a note on Windows)
 *
 * sim  : A) the kernel's permission-check algorithm (owner -> group ->
 *           other, the first matching class decides), B) the umask table,
 *           C) setuid identity transitions (real/effective/saved UID) and
 *           two classic traps, D) the sticky bit.
 * real : Tries the same rules on the real kernel: creating a file with
 *        umask, the "owner can't read" paradox, the r vs x difference on a
 *        directory, an open descriptor being unaffected by a later
 *        permission change, and the process's Linux capabilities.
 *
 * SAFETY: no real setuid binary is EVER CREATED, no sudo is needed; setuid
 * is only explained through simulation. Every file lives under output/, and
 * the program opens the permissions back up at the end so the folder can be
 * deleted.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

/* ------------------------------------------------------------------ */
/* A) The kernel's permission check (simulation)                       */
/* ------------------------------------------------------------------ */

struct person {
    const char *name;
    unsigned uid;
    unsigned groups[3]; /* primary + supplementary groups; 0 = empty */
};
struct fileobj {
    const char *name;
    unsigned owner, group, mode;
    const char *owner_name, *group_name;
};

enum { READ = 4, WRITE = 2, EXECUTE = 1 };

static void mode_text(unsigned mode, char *t)
{
    const char *h = "rwxrwxrwx";
    for (int i = 0; i < 9; i++)
        t[i] = (mode & (0400u >> i)) ? h[i] : '-';
    t[9] = '\0';
}

/* 1 = allow, 0 = deny; *class_out says which class's bits were consulted */
static int check_permission(const struct person *p, const struct fileobj *f,
                            int request, const char **class_out)
{
    if (p->uid == 0) {
        *class_out = "root";
        /* CAP_DAC_OVERRIDE: read/write are free; execute still needs at
           least one x bit */
        if (request == EXECUTE)
            return (f->mode & 0111u) != 0;
        return 1;
    }
    unsigned bits;
    if (p->uid == f->owner) {
        *class_out = "owner";
        bits = (f->mode >> 6) & 7u;
    } else if (p->groups[0] == f->group || p->groups[1] == f->group ||
               p->groups[2] == f->group) {
        *class_out = "group";
        bits = (f->mode >> 3) & 7u;
    } else {
        *class_out = "other";
        bits = f->mode & 7u;
    }
    return (bits & (unsigned)request) != 0;
}

static void section_a(void)
{
    static const struct person alice = {"alice", 1001, {1001, 2001, 0}};
    static const struct person mark = {"mark", 1002, {1002, 2001, 0}};
    static const struct person zoe = {"zoe", 1003, {1003, 0, 0}};
    static const struct person root = {"root", 0, {0, 0, 0}};
    static const struct fileobj report = {"report.txt", 1001, 2001, 0640,
                                          "alice", "accounting"};
    static const struct fileobj paradox = {"paradox.txt", 1001, 2001, 0077,
                                           "alice", "accounting"};
    static const struct fileobj secret = {"secret.key", 1001, 1001, 0600,
                                          "alice", "alice"};
    static const struct {
        const struct person *p;
        const struct fileobj *f;
        int request;
    } s[] = {
        {&alice, &report, WRITE},  {&mark, &report, READ},
        {&mark, &report, WRITE},   {&zoe, &report, READ},
        {&alice, &paradox, READ},  {&mark, &paradox, READ},
        {&zoe, &paradox, READ},    {&mark, &secret, READ},
        {&root, &secret, READ},    {&root, &report, EXECUTE},
    };
    printf("A) Kernel permission check: the first matching class decides\n");
    printf("   (alice and mark are in the 'accounting' group; zoe is not)\n");
    printf("  %-7s %-8s %-13s %-14s %-11s %s\n", "process", "request", "file",
           "owner:group", "perms", "class -> decision");
    for (size_t i = 0; i < sizeof s / sizeof s[0]; i++) {
        char m[10];
        const char *class_out = "";
        int ok = check_permission(s[i].p, s[i].f, s[i].request, &class_out);
        mode_text(s[i].f->mode, m);
        char og[32];
        snprintf(og, sizeof og, "%s:%s", s[i].f->owner_name, s[i].f->group_name);
        printf("  %-7s %-8s %-13s %-14s %-11s %s -> %s\n", s[i].p->name,
               s[i].request == READ ? "read" : s[i].request == WRITE ? "write"
                                                                    : "execute",
               s[i].f->name, og, m, class_out, ok ? "ALLOW" : "DENY");
    }
    printf("   ^ alice CANNOT READ paradox.txt: the owner class was picked and\n"
           "     the owner bits are '---'; the group/other bits are never consulted.\n"
           "   ^ root skips the permission bits for read/write (CAP_DAC_OVERRIDE);\n"
           "     for execute it still needs at least one x bit.\n\n");
}

/* ------------------------------------------------------------------ */
/* B) The umask table                                                  */
/* ------------------------------------------------------------------ */

static void section_b(void)
{
    const unsigned requested[] = {0666, 0777, 0600};
    const unsigned masks[] = {000, 002, 022, 077};
    printf("B) umask: the real permission = requested & ~umask (Recipe 2.7)\n");
    printf("  %-9s", "requested");
    for (int j = 0; j < 4; j++)
        printf(" umask %03o   ", masks[j]);
    printf("\n");
    for (int i = 0; i < 3; i++) {
        printf("  %04o     ", requested[i]);
        for (int j = 0; j < 4; j++) {
            char m[10];
            mode_text(requested[i] & ~masks[j], m);
            printf(" %s   ", m);
        }
        printf("\n");
    }
    printf("   ^ fopen() always requests 0666: with umask 000 the file becomes\n"
           "     WRITABLE BY EVERYONE. Open a sensitive file with open(..., 0600).\n\n");
}

/* ------------------------------------------------------------------ */
/* C) setuid identity transitions (Linux rules, simulated)             */
/* ------------------------------------------------------------------ */

struct identity {
    unsigned r, e, s;      /* real, effective, saved UID */
    unsigned gr, ge, gs;   /* real, effective, saved GID */
};

static void print_identity(const char *step, const struct identity *k, int result)
{
    printf("    %-30s r/e/s=%u/%u/%u g=%u %s\n", step, k->r, k->e, k->s,
           k->ge, result ? "ok" : "EPERM");
}

/* seteuid(u): if the effective UID is 0, any value; otherwise u must be r or s */
static int sim_seteuid(struct identity *k, unsigned u)
{
    if (k->e == 0 || u == k->r || u == k->s) {
        k->e = u;
        return 1;
    }
    return 0;
}

/* setuid(u): if the effective UID is 0, changes ALL THREE at once; otherwise
   only the effective UID (if u is r or s). This is exactly where the trap is. */
static int sim_setuid(struct identity *k, unsigned u)
{
    if (k->e == 0) {
        k->r = k->e = k->s = u;
        return 1;
    }
    if (u == k->r || u == k->s) {
        k->e = u;
        return 1;
    }
    return 0;
}

/* setresuid(r,e,s): in an unprivileged process every new value must be one
   of the current r/e/s; the recommended path, since the result is explicit */
static int sim_setresuid(struct identity *k, unsigned r, unsigned e, unsigned s)
{
    if (k->e != 0) {
        unsigned y[3];
        y[0] = r;
        y[1] = e;
        y[2] = s;
        for (int i = 0; i < 3; i++)
            if (y[i] != k->r && y[i] != k->e && y[i] != k->s)
                return 0;
    }
    k->r = r;
    k->e = e;
    k->s = s;
    return 1;
}

/* setgid(g): if the effective UID is not 0, can only move to the real/saved GID */
static int sim_setgid(struct identity *k, unsigned g)
{
    if (k->e == 0) {
        k->gr = k->ge = k->gs = g;
        return 1;
    }
    if (g == k->gr || g == k->gs) {
        k->ge = g;
        return 1;
    }
    return 0;
}

#define ALICE 1001u
#define SERVICE 65534u

static void set_identity(struct identity *k, unsigned r, unsigned e, unsigned s,
                         unsigned g)
{
    k->r = r;
    k->e = e;
    k->s = s;
    k->gr = k->ge = k->gs = g;
}

static void section_c(void)
{
    struct identity k;
    printf("C) setuid simulation: alice (uid 1001) runs a setuid program\n"
           "   owned by root. After exec: effective=saved=0.\n");

    printf("  C1) Temporary drop: seteuid(1001) -> the saved UID is still 0\n");
    set_identity(&k, ALICE, 0, 0, ALICE);
    print_identity("exec (setuid root)", &k, 1);
    print_identity("seteuid(1001)", &k, sim_seteuid(&k, ALICE));
    print_identity("[attacker code] seteuid(0)", &k, sim_seteuid(&k, 0));
    printf("    => TRAP: the attacker GOT root BACK (the saved UID is 0)\n");

    printf("  C2) Permanent drop: setuid(1001) while effective is 0\n");
    set_identity(&k, ALICE, 0, 0, ALICE);
    print_identity("exec (setuid root)", &k, 1);
    print_identity("setuid(1001)", &k, sim_setuid(&k, ALICE));
    print_identity("[attacker code] seteuid(0)", &k, sim_seteuid(&k, 0));
    printf("    => SAFE: all three identities are 1001, there is no way back\n");

    printf("  C3) Drop temporarily first, THEN try setuid(1001)\n");
    set_identity(&k, ALICE, 0, 0, ALICE);
    print_identity("seteuid(1001)", &k, sim_seteuid(&k, ALICE));
    print_identity("setuid(1001) [unprivileged]", &k, sim_setuid(&k, ALICE));
    print_identity("[attacker code] seteuid(0)", &k, sim_seteuid(&k, 0));
    printf("    => TRAP: an unprivileged setuid() only changes the effective UID\n");
    set_identity(&k, ALICE, 0, 0, ALICE);
    print_identity("seteuid(1001)", &k, sim_seteuid(&k, ALICE));
    print_identity("setresuid(1001,1001,1001)", &k,
               sim_setresuid(&k, ALICE, ALICE, ALICE));
    print_identity("[attacker code] seteuid(0)", &k, sim_seteuid(&k, 0));
    printf("    => FIX: use setresuid to set all three explicitly at once\n");

    printf("  C4) A service starting as root wants to become 'nobody' (65534)\n");
    set_identity(&k, 0, 0, 0, 0);
    print_identity("start (root)", &k, 1);
    print_identity("WRONG ORDER: setuid(65534)", &k, sim_setuid(&k, SERVICE));
    print_identity("setgid(65534)", &k, sim_setgid(&k, SERVICE));
    printf("    => TRAP: the group is still 0 (the root group); the group\n"
           "       should have been dropped first\n");
    set_identity(&k, 0, 0, 0, 0);
    print_identity("RIGHT ORDER: setgroups + setgid", &k, sim_setgid(&k, SERVICE));
    print_identity("setuid(65534)", &k, sim_setuid(&k, SERVICE));
    printf("    => CORRECT: supplementary groups and the GID first, the UID "
           "last (Recipe 1.3)\n\n");
}

/* ------------------------------------------------------------------ */
/* D) The sticky bit                                                   */
/* ------------------------------------------------------------------ */

/* The right to delete/rename an entry in a directory: needs w+x on the
   directory; if the sticky bit is set, also needs to own the file or the
   directory (except root). The FILE's own permissions do NOT decide deletion! */
static int can_delete(unsigned who, unsigned dir_mode, unsigned dir_owner,
                      unsigned file_owner)
{
    if (who == 0)
        return 1;
    if ((dir_mode & 03u) != 03u) /* w and x for "other" (simplified) */
        return 0;
    if ((dir_mode & 01000u) && who != file_owner && who != dir_owner)
        return 0;
    return 1;
}

static void section_d(void)
{
    printf("D) The sticky bit: deleting someone else's file in a shared directory\n");
    const struct {
        unsigned mode;
        const char *text;
        unsigned who;
        const char *event;
    } s[] = {
        {0777, "drwxrwxrwx", 1003, "zoe deletes alice's file"},
        {01777, "drwxrwxrwt", 1003, "zoe deletes alice's file"},
        {01777, "drwxrwxrwt", 1001, "alice deletes her own file"},
    };
    for (int i = 0; i < 3; i++)
        printf("  shared/ (%s)  %-34s -> %s\n", s[i].text, s[i].event,
               can_delete(s[i].who, s[i].mode, 0, 1001) ? "ALLOW" : "DENY");
    printf("   ^ Deletion is the DIRECTORY's permission, not the file's; "
           "that's why /tmp is 1777.\n");
}

static int simulate(void)
{
    section_a();
    section_b();
    section_c();
    section_d();
    return 0;
}

/* ------------------------------------------------------------------ */
/* Trying it on the real kernel (POSIX only)                           */
/* ------------------------------------------------------------------ */
#ifdef _WIN32
static int real_kernel(void)
{
    printf("This step needs the POSIX file API (umask, chmod, fstat).\n"
           "Windows has no umask: a new file's permission comes by\n"
           "INHERITANCE from the parent folder. demo.ps1 shows this with\n"
           "icacls; try the same step on the real kernel with 'sh demo.sh'\n"
           "inside WSL.\n");
    return 0;
}
#else
#include <errno.h>
#include <fcntl.h>
#include <unistd.h>
#include <dirent.h>
#include <sys/stat.h>
#include <sys/types.h>

#define OUTDIR "output"

static void print_mode(const char *path)
{
    struct stat st;
    char m[10];
    if (stat(path, &st) != 0) {
        printf("    %-26s (stat: %s)\n", path, strerror(errno));
        return;
    }
    mode_text((unsigned)st.st_mode & 0777u, m);
    printf("    %-26s %s (%04o)\n", path, m, (unsigned)st.st_mode & 0777u);
}

static void create_file(const char *path, mode_t mode)
{
    unlink(path);
    int fd = open(path, O_WRONLY | O_CREAT | O_EXCL, mode);
    if (fd < 0) {
        printf("    %s: %s\n", path, strerror(errno));
        return;
    }
    if (write(fd, "demo data\n", 10) != 10)
        printf("    %s: incomplete write\n", path);
    close(fd);
}

static void try_read(const char *label, const char *path)
{
    int fd = open(path, O_RDONLY);
    if (fd < 0) {
        printf("    %-38s -> DENY (%s)\n", label, strerror(errno));
        return;
    }
    close(fd);
    printf("    %-38s -> ALLOW\n", label);
}

static void print_capabilities(void)
{
    static const struct { int bit; const char *name; } y[] = {
        {0, "CAP_CHOWN"},        {1, "CAP_DAC_OVERRIDE"},
        {2, "CAP_DAC_READ_SEARCH"}, {3, "CAP_FOWNER"},
        {7, "CAP_SETUID"},       {10, "CAP_NET_BIND_SERVICE"},
        {21, "CAP_SYS_ADMIN"},
    };
    FILE *f = fopen("/proc/self/status", "r");
    char line[256];
    unsigned long long cap = 0;
    int found = 0;
    if (!f) {
        printf("    could not read /proc/self/status\n");
        return;
    }
    while (fgets(line, sizeof line, f))
        if (strncmp(line, "CapEff:", 7) == 0) {
            cap = strtoull(line + 7, NULL, 16);
            found = 1;
        }
    fclose(f);
    if (!found)
        return;
    printf("    CapEff = %016llx  (effective capabilities)\n", cap);
    for (size_t i = 0; i < sizeof y / sizeof y[0]; i++)
        printf("      %-22s %s\n", y[i].name,
               (cap >> y[i].bit) & 1ULL ? "yes" : "no");
}

static int real_kernel(void)
{
    int root = geteuid() == 0;
    mkdir(OUTDIR, 0700);
    printf("Real kernel, process uid=%u gid=%u%s\n", (unsigned)getuid(),
           (unsigned)getgid(), root ? "  (ROOT!)" : "");
    if (root)
        printf("  NOTE: you are running as root. The kernel skips permission\n"
               "  bits for root (CAP_DAC_OVERRIDE); the DENYs below become\n"
               "  ALLOWs. Try it as a normal user: that is least privilege.\n");

    printf("\nR1) umask for real: open(..., 0666) and open(..., 0600)\n");
    const struct { mode_t mask; mode_t request; const char *name; } u[] = {
        {022, 0666, OUTDIR "/umask022-0666.txt"},
        {077, 0666, OUTDIR "/umask077-0666.txt"},
        {000, 0666, OUTDIR "/umask000-0666.txt"},
        {000, 0600, OUTDIR "/umask000-0600.txt"},
    };
    mode_t old_umask = umask(022);
    for (size_t i = 0; i < sizeof u / sizeof u[0]; i++) {
        umask(u[i].mask);
        create_file(u[i].name, u[i].request);
        print_mode(u[i].name);
    }
    umask(old_umask);
    printf("   ^ umask 000 + 0666 = writable by everyone; an explicit 0600\n"
           "     stays open only to the owner no matter what the umask is.\n");

    printf("\nR2) The owner-can't-read paradox: chmod 0077 (----rwxrwx)\n");
    const char *p = OUTDIR "/paradox.txt";
    create_file(p, 0600);
    chmod(p, 0077);
    print_mode(p);
    try_read("open(O_RDONLY) as the owner", p);
    chmod(p, 0600);

    printf("\nR3) The r vs x difference on a directory (x = enter, r = list)\n");
    const char *d = OUTDIR "/locked";
    mkdir(d, 0700);
    create_file(OUTDIR "/locked/note.txt", 0600);
    chmod(d, 0600); /* rw- : can list but not enter */
    print_mode(d);
    DIR *dp = opendir(d);
    printf("    %-38s -> %s\n", "list (opendir/readdir)",
           dp ? "ALLOW" : "DENY");
    if (dp)
        closedir(dp);
    try_read("open locked/note.txt", OUTDIR "/locked/note.txt");
    chmod(d, 0300); /* -wx : cannot list or enter by listing, but a known name opens */
    print_mode(d);
    dp = opendir(d);
    printf("    %-38s -> %s\n", "list (opendir/readdir)",
           dp ? "ALLOW" : "DENY");
    if (dp)
        closedir(dp);
    try_read("open locked/note.txt (the name is known)",
                 OUTDIR "/locked/note.txt");
    chmod(d, 0700);

    printf("\nR4) An open descriptor is a capability: permission is checked at open() time\n");
    const char *t = OUTDIR "/descriptor.txt";
    create_file(t, 0600);
    int fd = open(t, O_RDONLY);
    chmod(t, 0000);
    print_mode(t);
    try_read("a new open(O_RDONLY)", t);
    char buf[32] = {0};
    ssize_t n = fd >= 0 ? read(fd, buf, sizeof buf - 1) : -1;
    printf("    %-38s -> %s\n", "read() from an fd opened BEFORE",
           n > 0 ? "ALLOW (data was read)" : "DENY");
    if (fd >= 0)
        close(fd);
    chmod(t, 0600);
    printf("   ^ chmod does not revoke an open descriptor: the authority isn't\n"
           "     temporary, it lasts as long as the descriptor does (watch out "
           "for complete mediation).\n");

    printf("\nR5) This process's Linux capabilities\n");
    print_capabilities();
    return 0;
}
#endif

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc == 2 && strcmp(argv[1], "sim") == 0)
        return simulate();
    if (argc == 2 && strcmp(argv[1], "real") == 0)
        return real_kernel();
    fprintf(stderr, "usage: %s sim|real\n", argv[0]);
    return 2;
}
