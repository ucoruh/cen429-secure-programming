/*
 * CEN429 — Week 2 — Demo 12: Windows ACE evaluation simulator
 *
 * Usage: bin/linux/ace <scenario.txt>      (Windows: bin\windows\ace.exe)
 *
 * Shows, step by step, how Windows decides an access request against a
 * DACL. It works from a text file's access token, object owner, integrity
 * label, and ACE list; it NEVER TOUCHES a real file, user, or system
 * setting. This is a pure computation: it gives the same result on both
 * platforms.
 *
 * Modeled rules (simplified):
 *   1. Mandatory Integrity Control (MIC) runs BEFORE the DACL: a
 *      low-integrity token cannot write to a higher-labeled object.
 *   2. The TAKE_OWNERSHIP privilege (SeTakeOwnershipPrivilege) grants the
 *      TAKE_OWNER right without consulting the DACL.
 *   3. The object's owner is implicitly granted READ_CONTROL and
 *      WRITE_DAC; not granted if the DACL has an OWNER_RIGHTS ACE.
 *   4. NULL DACL: every request is accepted. An EMPTY DACL (0 ACEs):
 *      every request is denied.
 *   5. ACEs are walked IN ORDER; a SID not in the token is skipped. If a
 *      DENY ACE covers a requested right not yet granted, the request is
 *      denied immediately. ALLOW ACEs accumulate rights; once all are
 *      granted, the request is accepted. If the list ends with a right
 *      still missing, deny.
 *   6. "Deny-only" groups match only DENY ACEs.
 *
 * Scenario file (one rule per line; # starts a comment):
 *   SCENARIO <title...>             a new scenario (everything resets)
 *   TOKEN <user> [g1,g2]            the access token: user and groups
 *   DENYONLY <group>                make the group "deny-only" (the UAC filter)
 *   INTEGRITY <Low|Medium|High|System>   the token's integrity level
 *   PRIVILEGE TAKE_OWNERSHIP        add a privilege to the token
 *   OWNER <sid>                     the object's owner
 *   LABEL <level> [NO_READ]         the object's mandatory label (no read)
 *   DACL <NULL|EMPTY>               a NULL or empty DACL
 *   ACE <ALLOW|DENY> <sid> <rights> [INHERITED]   rights: comma-separated, see right_table
 *   CANONICAL                       sort the ACEs into canonical order
 *   BREAK_INHERITANCE <copy|remove> break inheritance (icacls /inheritance:d|r)
 *   REQUEST <rights>                evaluate and trace an access request
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

/* Simplified access rights (the real Windows constant is in the comment) */
enum {
    H_READ = 1 << 0,          /* FILE_GENERIC_READ   */
    H_WRITE = 1 << 1,         /* FILE_GENERIC_WRITE  */
    H_EXECUTE = 1 << 2,       /* FILE_GENERIC_EXECUTE */
    H_DELETE = 1 << 3,        /* DELETE              */
    H_READ_CONTROL = 1 << 4, /* READ_CONTROL        */
    H_WRITE_DAC = 1 << 5,    /* WRITE_DAC           */
    H_TAKE_OWNER = 1 << 6    /* WRITE_OWNER         */
};
#define H_FULL 0x7F
/* The rights covered by MIC's "no write" rule (simplified) */
#define H_WRITE_KIND (H_WRITE | H_DELETE | H_WRITE_DAC | H_TAKE_OWNER)

static const struct { const char *name; int bit; } right_table[] = {
    {"READ", H_READ},                 {"WRITE", H_WRITE},
    {"EXECUTE", H_EXECUTE},           {"DELETE", H_DELETE},
    {"READ_CONTROL", H_READ_CONTROL}, {"WRITE_DAC", H_WRITE_DAC},
    {"TAKE_OWNER", H_TAKE_OWNER},     {"FULL", H_FULL},
};
#define RIGHT_N (sizeof right_table / sizeof right_table[0])

#define MAX_ACE 32
#define MAX_GROUPS 16
#define NAME_LEN 24

struct ace {
    int deny;      /* 1 = DENY (access denial), 0 = ALLOW */
    int inherited; /* 1 = came by inheritance from the parent folder */
    char sid[NAME_LEN];
    int mask;
};

static struct {
    char user[NAME_LEN];
    char group[MAX_GROUPS][NAME_LEN];
    int deny_only[MAX_GROUPS];
    int group_n;
    int integrity;
    int take_ownership_priv;
} token;

static struct {
    char owner[NAME_LEN];
    int label;
    int no_read;
    int dacl_kind; /* 0 = a list, 1 = NULL DACL, 2 = empty DACL */
    struct ace ace[MAX_ACE];
    int ace_n;
} obj;

static const char *level_name[] = {"Low", "Medium", "High", "System"};

static void reset(void)
{
    memset(&token, 0, sizeof token);
    memset(&obj, 0, sizeof obj);
    token.integrity = 1;
    obj.label = 1;
    snprintf(obj.owner, NAME_LEN, "%s", "-");
}

static int find_level(const char *s)
{
    for (int i = 0; i < 4; i++)
        if (s && strcmp(s, level_name[i]) == 0)
            return i;
    return -1;
}

/* "READ,WRITE" -> a bitmask; -1 if an unknown name appears */
static int parse_rights(const char *text)
{
    char copy[128];
    int mask = 0;
    snprintf(copy, sizeof copy, "%s", text ? text : "");
    for (char *p = strtok(copy, ","); p; p = strtok(NULL, ",")) {
        int found = 0;
        for (size_t i = 0; i < RIGHT_N; i++)
            if (strcmp(p, right_table[i].name) == 0) {
                mask |= right_table[i].bit;
                found = 1;
            }
        if (!found)
            return -1;
    }
    return mask;
}

/* a bitmask -> "READ,WRITE" (FULL is written as one word) */
static const char *right_name(int mask)
{
    static char buf[4][96];
    static int slot;
    char *t = buf[slot++ & 3];
    t[0] = '\0';
    if (mask == H_FULL)
        return strcpy(t, "FULL");
    if (mask == 0)
        return strcpy(t, "-");
    for (size_t i = 0; i + 1 < RIGHT_N; i++)
        if (mask & right_table[i].bit) {
            if (t[0])
                strcat(t, ",");
            strcat(t, right_table[i].name);
        }
    return t;
}

/* An ACE's canonical-order class: explicit DENY < explicit ALLOW < inherited DENY < inherited ALLOW */
static int ace_class(const struct ace *a)
{
    return a->inherited * 2 + (a->deny ? 0 : 1);
}

static int is_canonical(int *offender)
{
    for (int i = 1; i < obj.ace_n; i++)
        if (ace_class(&obj.ace[i]) < ace_class(&obj.ace[i - 1])) {
            *offender = i;
            return 0;
        }
    return 1;
}

static void canonicalize(void)
{
    /* A stable insertion sort: ACEs within the same class keep their order */
    for (int i = 1; i < obj.ace_n; i++) {
        struct ace a = obj.ace[i];
        int j = i - 1;
        while (j >= 0 && ace_class(&obj.ace[j]) > ace_class(&a)) {
            obj.ace[j + 1] = obj.ace[j];
            j--;
        }
        obj.ace[j + 1] = a;
    }
}

static int has_owner_rights_ace(void)
{
    for (int i = 0; i < obj.ace_n; i++)
        if (strcmp(obj.ace[i].sid, "OWNER_RIGHTS") == 0)
            return 1;
    return 0;
}

static int token_is_owner(void)
{
    if (strcmp(token.user, obj.owner) == 0)
        return 1;
    for (int i = 0; i < token.group_n; i++)
        if (!token.deny_only[i] && strcmp(token.group[i], obj.owner) == 0)
            return 1;
    return 0;
}

/* Is the ACE's SID present in the token? 0 = no, 1 = yes,
   2 = present but deny-only (matches only DENY ACEs) */
static int sid_matches(const char *sid)
{
    if (strcmp(sid, "Everyone") == 0 || strcmp(sid, token.user) == 0)
        return 1;
    if (strcmp(sid, "OWNER_RIGHTS") == 0)
        return token_is_owner();
    for (int i = 0; i < token.group_n; i++)
        if (strcmp(sid, token.group[i]) == 0)
            return token.deny_only[i] ? 2 : 1;
    return 0;
}

static void print_ace(int no, const struct ace *a)
{
    printf("    %d. %-5s %-14s %s%s\n", no, a->deny ? "DENY" : "ALLOW",
           a->sid, right_name(a->mask), a->inherited ? "  (inherited)" : "");
}

static void print_state(void)
{
    printf("  Token : %s  groups: Everyone", token.user);
    for (int i = 0; i < token.group_n; i++)
        printf(", %s%s", token.group[i], token.deny_only[i] ? "(deny-only)" : "");
    printf("\n          integrity: %s%s\n", level_name[token.integrity],
           token.take_ownership_priv ? "  privilege: TAKE_OWNERSHIP" : "");
    printf("  Object: owner=%s  label=%s%s  ", obj.owner,
           level_name[obj.label], obj.no_read ? "+no-read" : "");
    if (obj.dacl_kind == 1) {
        printf("DACL: NULL (there is no DACL)\n");
    } else if (obj.dacl_kind == 2 || obj.ace_n == 0) {
        printf("DACL: EMPTY (0 ACE)\n");
    } else {
        int offender = 0;
        int c = is_canonical(&offender);
        printf("DACL: %d ACE", obj.ace_n);
        if (c)
            printf(" (canonical: YES)\n");
        else
            printf(" (canonical: NO, ACE #%d)\n", offender + 1);
        for (int i = 0; i < obj.ace_n; i++)
            print_ace(i + 1, &obj.ace[i]);
    }
}

/* Evaluates the access request; traces every step. 1 = allow, 0 = deny */
static int evaluate(int request)
{
    int granted = 0;
    printf("  Request %s:\n", right_name(request));

    /* 1. Mandatory Integrity Control (MIC) — before the DACL */
    if (token.integrity < obj.label) {
        int forbidden = H_WRITE_KIND | (obj.no_read ? H_READ | H_EXECUTE : 0);
        if (request & forbidden) {
            printf("    MIC: token %s < object %s; %s forbidden\n",
                   level_name[token.integrity], level_name[obj.label],
                   right_name(request & forbidden));
            printf("  => DENY  (MIC: the DACL was never consulted)\n");
            return 0;
        }
        printf("    MIC: token %s < object %s; the requested right "
               "is not a write-type, passes\n",
               level_name[token.integrity], level_name[obj.label]);
    }

    /* 2. Privilege: SeTakeOwnershipPrivilege */
    if ((request & H_TAKE_OWNER) && token.take_ownership_priv) {
        granted |= H_TAKE_OWNER;
        printf("    Privilege TAKE_OWNERSHIP: TAKE_OWNER granted without the DACL\n");
    }

    /* 3. The owner's implicit rights */
    if (token_is_owner()) {
        if (has_owner_rights_ace()) {
            printf("    Owner: an OWNER_RIGHTS ACE exists; NO implicit right\n");
        } else if (request & (H_READ_CONTROL | H_WRITE_DAC)) {
            granted |= request & (H_READ_CONTROL | H_WRITE_DAC);
            printf("    Owner: implicit %s granted\n",
                   right_name(request & (H_READ_CONTROL | H_WRITE_DAC)));
        }
    }
    if (granted == request) {
        printf("  => ALLOW  (the DACL was not needed)\n");
        return 1;
    }

    /* 4. NULL and empty DACL */
    if (obj.dacl_kind == 1) {
        printf("    DACL NULL: the object has no DACL at all -> every right to everyone\n");
        printf("  => ALLOW  (DANGER: including TAKE_OWNER and WRITE_DAC!)\n");
        return 1;
    }
    if (obj.dacl_kind == 2 || obj.ace_n == 0) {
        printf("    DACL EMPTY: there is no ACE at all -> no right to anyone\n");
        printf("  => DENY  (missing: %s)\n", right_name(request & ~granted));
        return 0;
    }

    /* 5. Walk the ACEs in order */
    for (int i = 0; i < obj.ace_n; i++) {
        const struct ace *a = &obj.ace[i];
        int e = sid_matches(a->sid);
        printf("    ACE %d %-5s %-14s-> ", i + 1, a->deny ? "DENY" : "ALLOW",
               a->sid);
        if (e == 0) {
            printf("SID not in the token, skip\n");
            continue;
        }
        if (e == 2 && !a->deny) {
            printf("a deny-only group; an ALLOW ACE does not count\n");
            continue;
        }
        if (a->deny) {
            int denied = a->mask & request & ~granted;
            if (denied) {
                printf("matched; %s denied\n", right_name(denied));
                printf("  => DENY  (ACE %d: later ACEs are never consulted)\n",
                       i + 1);
                return 0;
            }
            printf("matched; does not touch the requested right\n");
            continue;
        }
        int extra = a->mask & request & ~granted;
        granted |= a->mask & request;
        if (extra)
            printf("granted %s (missing: %s)\n", right_name(extra),
                   right_name(request & ~granted));
        else
            printf("matched; no new right\n");
        if (granted == request) {
            printf("  => ALLOW  (every requested right was granted)\n");
            return 1;
        }
    }
    printf("  => DENY  (the list ended; missing: %s)\n", right_name(request & ~granted));
    return 0;
}

static void process_line(char *line, int line_no)
{
    line[strcspn(line, "\r\n")] = '\0';
    char *comment = strchr(line, '#');
    if (comment)
        *comment = '\0';
    char *k = strtok(line, " \t");
    if (!k)
        return;
    char *a1 = strtok(NULL, " \t");
    char *a2 = strtok(NULL, " \t");
    char *a3 = strtok(NULL, " \t");
    char *a4 = strtok(NULL, " \t");

    if (strcmp(k, "SCENARIO") == 0) {
        reset();
        printf("\n== SCENARIO:");
        /* print the rest of the title (the pieces after strtok) */
        if (a1)
            printf(" %s", a1);
        if (a2)
            printf(" %s", a2);
        if (a3)
            printf(" %s", a3);
        if (a4)
            printf(" %s", a4);
        for (char *p = strtok(NULL, " \t"); p; p = strtok(NULL, " \t"))
            printf(" %s", p);
        printf(" ==\n");
    } else if (strcmp(k, "TOKEN") == 0 && a1) {
        snprintf(token.user, NAME_LEN, "%s", a1);
        token.group_n = 0;
        if (a2)
            for (char *p = strtok(a2, ","); p && token.group_n < MAX_GROUPS;
                 p = strtok(NULL, ",")) {
                snprintf(token.group[token.group_n], NAME_LEN, "%s", p);
                token.deny_only[token.group_n++] = 0;
            }
    } else if (strcmp(k, "DENYONLY") == 0 && a1) {
        for (int i = 0; i < token.group_n; i++)
            if (strcmp(token.group[i], a1) == 0)
                token.deny_only[i] = 1;
    } else if (strcmp(k, "INTEGRITY") == 0 && find_level(a1) >= 0) {
        token.integrity = find_level(a1);
    } else if (strcmp(k, "PRIVILEGE") == 0 && a1 &&
               strcmp(a1, "TAKE_OWNERSHIP") == 0) {
        token.take_ownership_priv = 1;
    } else if (strcmp(k, "OWNER") == 0 && a1) {
        snprintf(obj.owner, NAME_LEN, "%s", a1);
    } else if (strcmp(k, "LABEL") == 0 && find_level(a1) >= 0) {
        obj.label = find_level(a1);
        obj.no_read = a2 && strcmp(a2, "NO_READ") == 0;
    } else if (strcmp(k, "DACL") == 0 && a1) {
        obj.dacl_kind = strcmp(a1, "NULL") == 0 ? 1 : 2;
        obj.ace_n = 0;
    } else if (strcmp(k, "ACE") == 0 && a1 && a2 && a3) {
        int m = parse_rights(a3);
        if (m < 0 || obj.ace_n >= MAX_ACE ||
            (strcmp(a1, "ALLOW") != 0 && strcmp(a1, "DENY") != 0)) {
            fprintf(stderr, "  line %d: invalid ACE\n", line_no);
            return;
        }
        struct ace *entry = &obj.ace[obj.ace_n++];
        entry->deny = strcmp(a1, "DENY") == 0;
        entry->inherited = a4 && strcmp(a4, "INHERITED") == 0;
        snprintf(entry->sid, NAME_LEN, "%s", a2);
        entry->mask = m;
        obj.dacl_kind = 0;
    } else if (strcmp(k, "CANONICAL") == 0) {
        canonicalize();
        printf("  -- ACEs sorted into canonical order --\n");
    } else if (strcmp(k, "BREAK_INHERITANCE") == 0 && a1) {
        int copy = strcmp(a1, "copy") == 0, n = 0;
        for (int i = 0; i < obj.ace_n; i++) {
            if (obj.ace[i].inherited && !copy)
                continue;
            obj.ace[n] = obj.ace[i];
            obj.ace[n++].inherited = 0;
        }
        printf("  -- inheritance broken: inherited ACEs %s --\n",
               copy ? "converted to explicit ACEs" : "removed");
        obj.ace_n = n;
    } else if (strcmp(k, "REQUEST") == 0 && a1) {
        int m = parse_rights(a1);
        if (m <= 0) {
            fprintf(stderr, "  line %d: invalid right '%s'\n", line_no, a1);
            return;
        }
        print_state();
        evaluate(m);
    } else {
        fprintf(stderr, "  line %d: not understood: %s\n", line_no, k);
    }
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 2) {
        fprintf(stderr, "usage: %s <scenario.txt>\n", argv[0]);
        return 2;
    }
    FILE *f = fopen(argv[1], "r");
    if (!f) {
        perror(argv[1]);
        return 1;
    }
    char line[256];
    int no = 0;
    reset();
    while (fgets(line, sizeof line, f))
        process_line(line, ++no);
    fclose(f);
    return 0;
}
