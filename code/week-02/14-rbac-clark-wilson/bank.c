/*
 * CEN429 — Week 2 — Demo 14: RBAC + separation of duty + Clark–Wilson
 *
 * Usage: bin/linux/bank <scenario.txt>     (Windows: bin\windows\bank.exe)
 *
 * A small "account ledger" simulation. The access decision is made in two
 * layers:
 *   RBAC  : user -> role -> permission (TP). RBAC0 (assignment, session),
 *           RBAC1 (role hierarchy: INHERITS), RBAC2 (SSD static, DSD
 *           dynamic separation-of-duty constraints).
 *   Clark–Wilson: constrained data items (CDI: account balances) only
 *           change through certified transformation procedures (TP). The
 *           rule numbers appear in the output:
 *           E1 only a certified TP touches its own CDIs
 *           E2 the (user, TP, CDIs) triple must be authorized (RBAC, here)
 *           E3 the identity of the user running the TP is verified
 *           E4 whoever grants certification cannot run a TP
 *           C2 a TP moves a valid state to a valid state (e.g. balance >= 0)
 *           C3 separation of duty (the initiator != the approver)
 *           C4 every TP writes to an append-only ledger
 *           C5 UDI (external input) never reaches a CDI unvalidated
 *           C1 IVP: the integrity verification procedure checks consistency
 *
 * This is a SIMULATOR: it uses no file, network, or system setting; it only
 * reads the scenario file. There is no real money and no real account.
 *
 * Scenario file (one rule per line; # starts a comment):
 *   ROLE <role>                INHERITS <senior> <junior>   (RBAC1)
 *   GRANT <role> <TP>          SSD <role1> <role2>   DSD <role1> <role2>
 *   SSD_REMOVE <role1> <role2> USER <name>           ASSIGN <user> <role>
 *   SESSION <user> <role,role>                       CDI <name> <value>
 *   CERTIFIED <TP> <cdi,cdi|->                        APPROVAL_THRESHOLD <amount>
 *   START                      (setup ends; later lines are traced)
 *   SECTION <title...>         RUN <user> <TP> [arg...]
 *   CERTIFY <user> <TP> <cdi,cdi>
 *   DIRECT_WRITE <user> <cdi> <value>   LEDGER_DELETE <user> <no>
 * TPs: DEPOSIT <account> <amount>, WITHDRAW <account> <amount>,
 *      TRANSFER <source> <dest> <amount>, APPROVE <no>, IVP, LEDGER_READ,
 *      BAD_TRANSFER <source> <dest> <amount>  (a deliberately broken TP)
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

#define NAME_LEN 24
#define MAX_N 16
#define CERTIFIER_ROLE "CERTIFIER"

static char role_name[MAX_N][NAME_LEN];
static unsigned role_junior[MAX_N]; /* role_junior[r]: the roles r directly inherits */
static int role_n;

static struct { int role; char tp[NAME_LEN]; } grant[64];
static int grant_n;

static struct { int a, b, dynamic; } separation[MAX_N];
static int separation_n;

static struct {
    char name[NAME_LEN];
    unsigned assigned, active;
    int session;
} user[MAX_N];
static int user_n;

static struct { char name[NAME_LEN]; long long value; } cdi[MAX_N];
static int cdi_n;

static struct { char tp[NAME_LEN]; char cdis[96]; } cert[MAX_N];
static int cert_n;

enum { D_OPENING, D_DEPOSIT, D_WITHDRAW, D_TRANSFER, D_REQUEST };
static struct { int kind; long long amount; char text[80]; } ledger[128];
static int ledger_n;

static struct {
    char initiator[NAME_LEN];
    int source, dest, pending;
    long long amount;
} request[MAX_N];
static int request_n;

static long long approval_threshold = 5000;
static int tracing; /* 1 after START */
static int step_no;

/* ---------------------------- helpers ---------------------------- */

static int find_name(char t[][NAME_LEN], int n, const char *name)
{
    for (int i = 0; i < n; i++)
        if (name && strcmp(t[i], name) == 0)
            return i;
    return -1;
}

static int find_user(const char *name)
{
    for (int i = 0; i < user_n; i++)
        if (name && strcmp(user[i].name, name) == 0)
            return i;
    return -1;
}

static int find_cdi(const char *name)
{
    for (int i = 0; i < cdi_n; i++)
        if (name && strcmp(cdi[i].name, name) == 0)
            return i;
    return -1;
}

/* Expands a role set through the hierarchy: a senior role also carries its
   juniors' rights (RBAC1). */
static unsigned expand_roles(unsigned m)
{
    unsigned before;
    do {
        before = m;
        for (int r = 0; r < role_n; r++)
            if (m & (1u << r))
                m |= role_junior[r];
    } while (m != before);
    return m;
}

static const char *roles_text(unsigned m)
{
    static char t[160];
    t[0] = '\0';
    for (int r = 0; r < role_n; r++)
        if (m & (1u << r)) {
            if (t[0])
                strcat(t, ",");
            strcat(t, role_name[r]);
        }
    return t[0] ? t : "-";
}

/* Does set m violate a separation-of-duty constraint? returns the index of
   the violated constraint */
static int violates_separation(unsigned m, int dynamic)
{
    for (int i = 0; i < separation_n; i++)
        if (separation[i].dynamic == dynamic && separation[i].a >= 0 &&
            (m & (1u << separation[i].a)) && (m & (1u << separation[i].b)))
            return i;
    return -1;
}

static void ledger_add(int kind, long long amount, const char *text)
{
    if (ledger_n < 128) {
        ledger[ledger_n].kind = kind;
        ledger[ledger_n].amount = amount;
        snprintf(ledger[ledger_n].text, 80, "%s", text);
        ledger_n++;
    }
    if (tracing)
        printf("     C4 ledger #%d: %s\n", ledger_n, text);
}

/* C5: external input (UDI) -> an amount. Only unsigned decimal digits
   between 1..1000000 are accepted; everything else is rejected. */
static int validate_amount(const char *m, long long *v)
{
    size_t n = m ? strlen(m) : 0;
    if (n == 0) {
        printf("     C5 UDI empty -> DENY\n");
        return 0;
    }
    for (size_t i = 0; i < n; i++)
        if (m[i] < '0' || m[i] > '9') {
            printf("     C5 UDI \"%s\": a non-digit character -> DENY\n", m);
            return 0;
        }
    if (n > 7) {
        printf("     C5 UDI \"%s\": too long -> DENY\n", m);
        return 0;
    }
    *v = atoll(m);
    if (*v < 1 || *v > 1000000) {
        printf("     C5 UDI \"%s\": outside 1..1000000 -> DENY\n", m);
        return 0;
    }
    printf("     C5 UDI \"%s\" -> %lld valid\n", m, *v);
    return 1;
}

/* E1: is the TP certified for the given CDIs? */
static int is_certified(const char *tp, const char *c1, const char *c2)
{
    for (int i = 0; i < cert_n; i++) {
        if (strcmp(cert[i].tp, tp) != 0)
            continue;
        char k[100];
        snprintf(k, sizeof k, ",%s,", cert[i].cdis);
        char a[NAME_LEN + 2], b[NAME_LEN + 2];
        snprintf(a, sizeof a, ",%s,", c1 ? c1 : "");
        snprintf(b, sizeof b, ",%s,", c2 ? c2 : "");
        if ((!c1 || strstr(k, a)) && (!c2 || strstr(k, b)))
            return 1;
    }
    return 0;
}

static long long grand_total(void)
{
    long long t = 0;
    for (int i = 0; i < cdi_n; i++)
        t += cdi[i].value;
    return t;
}

/* --------------------------- the access-check chain -------------------------- */

/* E3 + E4 + E2 + E1. 1 = the TP may run */
static int check_access(int u, const char *username, const char *tp,
                        const char *c1, const char *c2)
{
    if (u < 0) {
        printf("     E3 identity: '%s' is not recognized -> DENY\n", username);
        return 0;
    }
    if (!user[u].session) {
        printf("     E3 %s has no open session -> DENY\n", username);
        return 0;
    }
    int cr = find_name(role_name, role_n, CERTIFIER_ROLE);
    if (cr >= 0 && (user[u].assigned & (1u << cr))) {
        printf("     E4 %s is a certifier; cannot run a TP -> DENY\n",
               username);
        return 0;
    }
    unsigned active = expand_roles(user[u].active);
    int grantor = -1;
    for (int i = 0; i < grant_n; i++)
        if (strcmp(grant[i].tp, tp) == 0 && (active & (1u << grant[i].role))) {
            grantor = grant[i].role;
            break;
        }
    printf("     E3 identity verified; active roles: %s\n",
           roles_text(active));
    if (grantor < 0) {
        printf("     E2 (%s, %s): not present in any active role -> DENY\n",
               username, tp);
        return 0;
    }
    printf("     E2 (%s, %s): PRESENT, role %s\n", username, tp, role_name[grantor]);
    if (!is_certified(tp, c1, c2)) {
        printf("     E1 %s is not certified for these CDIs -> DENY\n", tp);
        return 0;
    }
    printf("     E1 %s is a certified TP; only it touches the CDIs\n", tp);
    return 1;
}

static void do_transfer(int k, int h, long long v, long long incoming,
                        const char *note_text)
{
    char m[80];
    long long ek = cdi[k].value, eh = cdi[h].value;
    cdi[k].value -= v;
    cdi[h].value += incoming;
    printf("     TP: %s %lld->%lld, %s %lld->%lld\n", cdi[k].name, ek,
           cdi[k].value, cdi[h].name, eh, cdi[h].value);
    snprintf(m, sizeof m, "TRANSFER %s->%s %lld%s", cdi[k].name, cdi[h].name, v,
             note_text);
    ledger_add(D_TRANSFER, v, m);
}

static void run_ivp(void)
{
    long long expected = 0;
    int negative = 0;
    for (int i = 0; i < ledger_n; i++) {
        if (ledger[i].kind == D_OPENING || ledger[i].kind == D_DEPOSIT)
            expected += ledger[i].amount;
        else if (ledger[i].kind == D_WITHDRAW)
            expected -= ledger[i].amount;
    }
    for (int i = 0; i < cdi_n; i++) {
        printf("     IVP %-8s = %lld%s\n", cdi[i].name, cdi[i].value,
               cdi[i].value < 0 ? "  (NEGATIVE!)" : "");
        negative |= cdi[i].value < 0;
    }
    long long t = grand_total();
    printf("     IVP expected total from the ledger %lld, found %lld\n",
           expected, t);
    if (t == expected && !negative)
        printf("  => CONSISTENT (C1: the CDIs are in a valid state)\n");
    else
        printf("  => INCONSISTENT! difference %lld: a TP is broken, or a "
               "CDI changed outside a TP\n", t - expected);
}

static void run_tp(char *username, char *tp, char *a1, char *a2, char *a3)
{
    int u = find_user(username);
    long long v = 0;
    int k = -1, h = -1;

    if (strcmp(tp, "DEPOSIT") == 0 || strcmp(tp, "WITHDRAW") == 0) {
        k = find_cdi(a1);
        if (!check_access(u, username, tp, a1, NULL))
            goto deny;
        if (k < 0 || !validate_amount(a2, &v))
            goto deny;
        char m[80];
        if (tp[0] == 'W' && cdi[k].value < v) {
            printf("     C2 %s's balance %lld < %lld: an invalid state "
                   "-> DENY\n", cdi[k].name, cdi[k].value, v);
            goto deny;
        }
        long long before = cdi[k].value;
        cdi[k].value += tp[0] == 'D' ? v : -v;
        printf("     TP: %s %lld->%lld\n", cdi[k].name, before, cdi[k].value);
        snprintf(m, sizeof m, "%s %s %lld", tp, cdi[k].name, v);
        ledger_add(tp[0] == 'D' ? D_DEPOSIT : D_WITHDRAW, v, m);
    } else if (strcmp(tp, "TRANSFER") == 0 || strcmp(tp, "BAD_TRANSFER") == 0) {
        k = find_cdi(a1);
        h = find_cdi(a2);
        if (!check_access(u, username, tp, a1, a2))
            goto deny;
        if (k < 0 || h < 0 || k == h || !validate_amount(a3, &v))
            goto deny;
        if (tp[0] == 'T' && tp[1] == 'R' && tp[2] == 'A' && v > approval_threshold) {
            if (request_n >= MAX_N)
                goto deny;
            request[request_n].source = k;
            request[request_n].dest = h;
            request[request_n].amount = v;
            request[request_n].pending = 1;
            snprintf(request[request_n].initiator, NAME_LEN, "%s", username);
            request_n++;
            printf("     %lld > the approval threshold %lld: request #%d "
                   "opened, a second person must approve\n", v, approval_threshold, request_n);
            char m[80];
            snprintf(m, sizeof m, "REQUEST #%d %s->%s %lld (%s)", request_n,
                     cdi[k].name, cdi[h].name, v, username);
            ledger_add(D_REQUEST, v, m);
            printf("  => PENDING\n");
            return;
        }
        if (cdi[k].value < v) {
            printf("     C2 %s's balance is insufficient -> DENY\n", cdi[k].name);
            goto deny;
        }
        if (strcmp(tp, "BAD_TRANSFER") == 0)
            do_transfer(k, h, v, v - v / 100, ""); /* loses 1% without a trace */
        else
            do_transfer(k, h, v, v, "");
    } else if (strcmp(tp, "APPROVE") == 0) {
        int no = a1 ? atoi(a1) : 0;
        if (!check_access(u, username, tp, NULL, NULL))
            goto deny;
        if (no < 1 || no > request_n || !request[no - 1].pending) {
            printf("     request #%d does not exist or is closed -> DENY\n", no);
            goto deny;
        }
        if (strcmp(request[no - 1].initiator, username) == 0) {
            printf("     C3 the initiator (%s) cannot approve their own "
                   "request -> DENY\n", username);
            goto deny;
        }
        printf("     C3 initiator %s, approver %s: different people\n",
               request[no - 1].initiator, username);
        k = request[no - 1].source;
        h = request[no - 1].dest;
        v = request[no - 1].amount;
        if (cdi[k].value < v) {
            printf("     C2 %s's balance is insufficient -> DENY\n", cdi[k].name);
            goto deny;
        }
        request[no - 1].pending = 0;
        char note_text[40];
        snprintf(note_text, sizeof note_text, " (request #%d, approved by %s)", no,
                 username);
        do_transfer(k, h, v, v, note_text);
    } else if (strcmp(tp, "IVP") == 0) {
        if (!check_access(u, username, tp, NULL, NULL))
            goto deny;
        run_ivp();
        return;
    } else if (strcmp(tp, "LEDGER_READ") == 0) {
        if (!check_access(u, username, tp, NULL, NULL))
            goto deny;
        for (int i = 0; i < ledger_n; i++)
            printf("     #%-2d %s\n", i + 1, ledger[i].text);
    } else {
        printf("     unknown TP '%s' -> DENY\n", tp);
        goto deny;
    }
    printf("  => OK\n");
    return;
deny:
    printf("  => DENY\n");
}

/* ------------------------------ parser ---------------------------- */

static void process_line(char *line)
{
    line[strcspn(line, "\r\n")] = '\0';
    char *comment = strchr(line, '#');
    if (comment)
        *comment = '\0';
    char *t[16] = {0};
    int n = 0;
    for (char *p = strtok(line, " \t"); p && n < 16; p = strtok(NULL, " \t"))
        t[n++] = p;
    if (n == 0)
        return;
    char *k = t[0];

    if (strcmp(k, "SECTION") == 0) {
        printf("\n==");
        for (int i = 1; i < n; i++)
            printf(" %s", t[i]);
        printf(" ==\n");
        return;
    }
    if (strcmp(k, "START") == 0) {
        tracing = 1;
        printf("Setup: %d role(s), %d user(s), %d CDI(s), %d certified TP(s), "
               "approval threshold %lld\n", role_n, user_n, cdi_n, cert_n, approval_threshold);
        for (int i = 0; i < user_n; i++)
            printf("  %-7s assigned roles: %s\n", user[i].name,
                   roles_text(user[i].assigned));
        printf("  CDI total (opening): %lld\n", grand_total());
        ledger_add(D_OPENING, grand_total(), "OPENING total");
        return;
    }
    if (tracing) {
        /* A RUN line is printed as "user TP arg...", other commands as-is */
        printf("[%02d]", ++step_no);
        for (int i = strcmp(k, "RUN") == 0 ? 1 : 0; i < n; i++)
            printf(" %s", t[i]);
        printf("\n");
    }

    if (strcmp(k, "ROLE") == 0 && n >= 2 && role_n < MAX_N) {
        snprintf(role_name[role_n++], NAME_LEN, "%s", t[1]);
    } else if (strcmp(k, "INHERITS") == 0 && n >= 3) {
        int a = find_name(role_name, role_n, t[1]), b = find_name(role_name, role_n, t[2]);
        if (a >= 0 && b >= 0)
            role_junior[a] |= 1u << b;
    } else if (strcmp(k, "GRANT") == 0 && n >= 3 && grant_n < 64) {
        int r = find_name(role_name, role_n, t[1]);
        if (r >= 0) {
            grant[grant_n].role = r;
            snprintf(grant[grant_n++].tp, NAME_LEN, "%s", t[2]);
            if (tracing)
                printf("     admin: role %s was granted %s\n", t[1],
                       t[2]);
        }
    } else if ((strcmp(k, "SSD") == 0 || strcmp(k, "DSD") == 0) && n >= 3 &&
               separation_n < MAX_N) {
        separation[separation_n].a = find_name(role_name, role_n, t[1]);
        separation[separation_n].b = find_name(role_name, role_n, t[2]);
        separation[separation_n++].dynamic = k[0] == 'D';
    } else if (strcmp(k, "SSD_REMOVE") == 0 && n >= 3) {
        int a = find_name(role_name, role_n, t[1]), b = find_name(role_name, role_n, t[2]);
        for (int i = 0; i < separation_n; i++)
            if (!separation[i].dynamic && ((separation[i].a == a &&
                separation[i].b == b) || (separation[i].a == b &&
                separation[i].b == a)))
                separation[i].a = -1;
        printf("     admin: SSD(%s,%s) was removed (misconfiguration)\n",
               t[1], t[2]);
    } else if (strcmp(k, "USER") == 0 && n >= 2 && user_n < MAX_N) {
        snprintf(user[user_n++].name, NAME_LEN, "%s", t[1]);
    } else if (strcmp(k, "ASSIGN") == 0 && n >= 3) {
        int u = find_user(t[1]), r = find_name(role_name, role_n, t[2]);
        if (u < 0 || r < 0) {
            printf("     undefined user/role -> DENY\n");
            return;
        }
        unsigned merged = expand_roles(user[u].assigned | (1u << r));
        int b = violates_separation(merged, 0);
        if (b >= 0) {
            if (tracing)
                printf("     SSD(%s,%s): %s cannot hold both"
                       " -> DENY\n  => DENY\n", role_name[separation[b].a],
                       role_name[separation[b].b], t[1]);
            return;
        }
        user[u].assigned |= 1u << r;
        if (tracing)
            printf("     UA: %s is now %s\n  => OK\n", t[1],
                   roles_text(user[u].assigned));
    } else if (strcmp(k, "SESSION") == 0 && n >= 3) {
        int u = find_user(t[1]);
        if (u < 0) {
            printf("     E3 identity: '%s' is not recognized -> DENY\n  => DENY\n",
                   t[1]);
            return;
        }
        unsigned m = 0;
        for (char *p = strtok(t[2], ","); p; p = strtok(NULL, ",")) {
            int r = find_name(role_name, role_n, p);
            if (r < 0 || !(expand_roles(user[u].assigned) & (1u << r))) {
                printf("     role %s is not assigned to %s -> DENY\n  => DENY\n", p,
                       t[1]);
                return;
            }
            m |= 1u << r;
        }
        int b = violates_separation(expand_roles(m), 1);
        if (b >= 0) {
            printf("     DSD(%s,%s): both cannot be active in the same "
                   "session -> DENY\n  => DENY\n", role_name[separation[b].a],
                   role_name[separation[b].b]);
            return;
        }
        user[u].active = m;
        user[u].session = 1;
        printf("     session opened; active: %s\n  => OK\n",
               roles_text(expand_roles(m)));
    } else if (strcmp(k, "CDI") == 0 && n >= 3 && cdi_n < MAX_N) {
        snprintf(cdi[cdi_n].name, NAME_LEN, "%s", t[1]);
        cdi[cdi_n++].value = atoll(t[2]);
    } else if ((strcmp(k, "CERTIFIED") == 0 && n >= 3) ||
               (strcmp(k, "CERTIFY") == 0 && n >= 4)) {
        int at_runtime = strcmp(k, "CERTIFY") == 0; /* CERTIFY: at run time */
        const char *tp = at_runtime ? t[2] : t[1];
        const char *c = at_runtime ? t[3] : t[2];
        if (at_runtime) {
            int u = find_user(t[1]), cr = find_name(role_name, role_n, CERTIFIER_ROLE);
            if (u < 0 || cr < 0 || !(user[u].assigned & (1u << cr))) {
                printf("     C2 only a certifier may certify a TP -> DENY\n"
                       "  => DENY\n");
                return;
            }
            printf("     C2 %s certified the %s TP for {%s}\n",
                   t[1], tp, c);
        }
        if (cert_n < MAX_N) {
            snprintf(cert[cert_n].tp, NAME_LEN, "%s", tp);
            snprintf(cert[cert_n++].cdis, 96, "%s", c);
        }
        if (at_runtime)
            printf("  => OK\n");
    } else if (strcmp(k, "APPROVAL_THRESHOLD") == 0 && n >= 2) {
        approval_threshold = atoll(t[1]);
    } else if (strcmp(k, "DIRECT_WRITE") == 0 && n >= 4) {
        printf("     E1 CDI '%s' only changes through a certified TP"
               " -> DENY\n  => DENY\n", t[2]);
    } else if (strcmp(k, "LEDGER_DELETE") == 0 && n >= 3) {
        printf("     C4 the ledger is append-only; no TP ever deletes a "
               "record\n  => DENY\n");
    } else if (strcmp(k, "RUN") == 0 && n >= 3) {
        run_tp(t[1], t[2], t[3], t[4], t[5]);
    } else {
        fprintf(stderr, "  not understood: %s\n", k);
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
    while (fgets(line, sizeof line, f))
        process_line(line);
    fclose(f);
    return 0;
}
