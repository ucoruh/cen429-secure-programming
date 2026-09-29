/*
 * CEN429 — Week 2 — Demo 07: mini rule engine (inspired by YARA)
 *
 * Usage: bin/.../rule_engine <rules.txt> <file>...       (a summary per file)
 *        bin/.../rule_engine -a <rules.txt> <file>        (a detailed dump)
 *
 * A rule consists of named strings (text, or a hex pattern that may contain
 * wildcards) and a CONDITION that combines them:
 *
 *   rule Example {
 *     string $a = "text"
 *     hex    $b = { 4d 41 ?? 49 }       (?? = any byte)
 *     condition $a and ($b or #a >= 3)
 *   }
 *
 * Condition language: $id (did it appear at least once), #id <op> n (how many
 * times it appeared), and, or, not, ( ), "n of them", "all of them",
 * "any of them", true, false.
 *
 * The rule file is also an INPUT: if a limit is exceeded or the syntax is
 * broken, the line/rule is rejected. The program only reads; it never
 * modifies any file. This is a teaching tool; it does not replace real YARA.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "cen429_demo.h"

#define MAX_RULES 32
#define MAX_STRINGS 8
#define MAX_PATTERN 64
#define MAX_TOKENS 64
#define MAX_SIZE (1024 * 1024)

struct pattern {
    char id[16];                      /* without the '$' */
    unsigned char bytes[MAX_PATTERN];
    unsigned char wildcard[MAX_PATTERN]; /* 1: any byte matches at this position */
    size_t len;
    int count;                        /* scan result: how many times it appeared */
};

struct rule {
    char name[48];
    struct pattern strings[MAX_STRINGS];
    int nstr;
    char condition[256];
};

static struct rule rules[MAX_RULES];
static int rule_count;

/* ---------------- reading the rule file ---------------- */

static char *skip_space(char *s)
{
    while (*s == ' ' || *s == '\t')
        s++;
    return s;
}

/* Parses a "string $id = "text"" or "hex $id = { .. }" line. */
static int string_line(struct rule *k, char *s, int hex, int line_no)
{
    if (k->nstr >= MAX_STRINGS) {
        fprintf(stderr, "line %d: too many strings in the rule\n", line_no);
        return -1;
    }
    struct pattern *d = &k->strings[k->nstr];
    memset(d, 0, sizeof *d);
    s = skip_space(s);
    if (*s != '$') {
        fprintf(stderr, "line %d: expected '$id'\n", line_no);
        return -1;
    }
    s++;
    size_t n = 0;
    while ((isalnum((unsigned char)*s) || *s == '_') && n + 1 < sizeof d->id)
        d->id[n++] = *s++;
    d->id[n] = '\0';
    s = skip_space(s);
    if (n == 0 || *s != '=') {
        fprintf(stderr, "line %d: expected '$id ='\n", line_no);
        return -1;
    }
    s = skip_space(s + 1);
    if (!hex) {
        if (*s != '"') {
            fprintf(stderr, "line %d: expected quoted text\n",
                    line_no);
            return -1;
        }
        char *end = strchr(s + 1, '"');
        size_t m = end ? (size_t)(end - s - 1) : 0;
        if (!end || m == 0 || m > MAX_PATTERN) {
            fprintf(stderr, "line %d: the text is empty, too long, or unclosed\n",
                    line_no);
            return -1;
        }
        memcpy(d->bytes, s + 1, m);
        d->len = m;
    } else {
        if (*s != '{') {
            fprintf(stderr, "line %d: expected '{'\n", line_no);
            return -1;
        }
        s++;
        for (;;) {
            s = skip_space(s);
            if (*s == '}')
                break;
            if (d->len >= MAX_PATTERN || !s[0] || !s[1]) {
                fprintf(stderr, "line %d: the hex pattern is broken/too long\n", line_no);
                return -1;
            }
            if (s[0] == '?' && s[1] == '?') {
                d->wildcard[d->len++] = 1;
            } else if (isxdigit((unsigned char)s[0]) &&
                       isxdigit((unsigned char)s[1])) {
                char two[3];
                two[0] = s[0];
                two[1] = s[1];
                two[2] = '\0';
                d->bytes[d->len++] = (unsigned char)strtoul(two, NULL, 16);
            } else {
                fprintf(stderr, "line %d: invalid hex byte\n", line_no);
                return -1;
            }
            s += 2;
        }
        if (d->len == 0) {
            fprintf(stderr, "line %d: empty hex pattern\n", line_no);
            return -1;
        }
    }
    k->nstr++;
    return 0;
}

static int load_rules(const char *path)
{
    FILE *f = fopen(path, "r");
    if (!f) {
        perror(path);
        return -1;
    }
    char line[512];
    int no = 0, inside = 0, failed = 0;
    struct rule *k = NULL;
    while (fgets(line, sizeof line, f)) {
        no++;
        line[strcspn(line, "\r\n")] = '\0';
        char *s = skip_space(line);
        if (*s == '\0' || *s == '#')
            continue;
        if (!inside && strncmp(s, "rule ", 5) == 0) {
            if (rule_count >= MAX_RULES) {
                fprintf(stderr, "line %d: too many rules\n", no);
                failed = 1;
                break;
            }
            k = &rules[rule_count];
            memset(k, 0, sizeof *k);
            if (sscanf(s + 5, "%47[A-Za-z0-9_]", k->name) != 1) {
                fprintf(stderr, "line %d: malformed rule name\n", no);
                failed = 1;
                break;
            }
            inside = 1;
        } else if (inside && strncmp(s, "string ", 7) == 0) {
            if (string_line(k, s + 7, 0, no) != 0)
                failed = 1;
        } else if (inside && strncmp(s, "hex ", 4) == 0) {
            if (string_line(k, s + 4, 1, no) != 0)
                failed = 1;
        } else if (inside && strncmp(s, "condition ", 10) == 0) {
            snprintf(k->condition, sizeof k->condition, "%s", s + 10);
        } else if (inside && *s == '}') {
            if (k->condition[0] == '\0') {
                fprintf(stderr, "line %d: rule has no condition\n", no);
                failed = 1;
            } else if (!failed) {
                rule_count++;
            }
            inside = 0;
        } else {
            fprintf(stderr, "line %d: unrecognized line\n", no);
            failed = 1;
        }
        if (failed)
            break;
    }
    fclose(f);
    if (failed || inside) {
        fprintf(stderr, "rule file REJECTED (broken or incomplete)\n");
        return -1;
    }
    return 0;
}

/* ---------------- scanning ---------------- */

static int matches_at(const unsigned char *v, const struct pattern *d)
{
    for (size_t j = 0; j < d->len; j++)
        if (!d->wildcard[j] && v[j] != d->bytes[j])
            return 0;
    return 1;
}

/* Counts how many times the pattern appears in the file (overlaps included). */
static int count_matches(const unsigned char *v, size_t n, const struct pattern *d)
{
    int c = 0;
    if (d->len > n)
        return 0;
    for (size_t i = 0; i + d->len <= n; i++)
        if (matches_at(v + i, d))
            c++;
    return c;
}

/* ---------------- condition evaluator (recursive descent) ---------------- */

struct parser {
    char *t[MAX_TOKENS];
    int n, i, error;
    const struct rule *k;
};

static const char *peek(struct parser *c)
{
    return c->i < c->n ? c->t[c->i] : "";
}

static const char *take(struct parser *c)
{
    return c->i < c->n ? c->t[c->i++] : "";
}

static int string_index(const struct rule *k, const char *id)
{
    for (int i = 0; i < k->nstr; i++)
        if (strcmp(k->strings[i].id, id) == 0)
            return i;
    return -1;
}

static int expr(struct parser *c);

static int primary(struct parser *c)
{
    const char *t = take(c);
    const struct rule *k = c->k;
    if (strcmp(t, "(") == 0) {
        int v = expr(c);
        if (strcmp(take(c), ")") != 0)
            c->error = 1;
        return v;
    }
    if (strcmp(t, "true") == 0)
        return 1;
    if (strcmp(t, "false") == 0)
        return 0;
    if (strcmp(t, "all") == 0 || strcmp(t, "any") == 0 ||
        isdigit((unsigned char)t[0])) {
        int needed = t[0] == 'a' && t[1] == 'l' ? k->nstr
                    : t[0] == 'a' ? 1 : atoi(t);
        if (strcmp(take(c), "of") != 0 || strcmp(take(c), "them") != 0) {
            c->error = 1;
            return 0;
        }
        int present = 0;
        for (int i = 0; i < k->nstr; i++)
            present += k->strings[i].count > 0;
        return present >= needed;
    }
    if (t[0] == '$' || t[0] == '#') {
        int x = string_index(k, t + 1);
        if (x < 0) {
            c->error = 1;
            return 0;
        }
        if (t[0] == '$')
            return k->strings[x].count > 0;
        const char *op = take(c);
        const char *num = take(c);
        if (!isdigit((unsigned char)num[0])) {
            c->error = 1;
            return 0;
        }
        int s = k->strings[x].count, m = atoi(num);
        if (strcmp(op, ">=") == 0) return s >= m;
        if (strcmp(op, ">") == 0)  return s > m;
        if (strcmp(op, "<=") == 0) return s <= m;
        if (strcmp(op, "<") == 0)  return s < m;
        if (strcmp(op, "==") == 0) return s == m;
        c->error = 1;
        return 0;
    }
    c->error = 1;
    return 0;
}

static int not_expr(struct parser *c)
{
    if (strcmp(peek(c), "not") == 0) {
        take(c);
        return !not_expr(c);
    }
    return primary(c);
}

static int and_expr(struct parser *c)
{
    int v = not_expr(c);
    while (strcmp(peek(c), "and") == 0) {
        take(c);
        int r = not_expr(c);          /* resolve both: let the syntax be checked */
        v = v && r;
    }
    return v;
}

static int expr(struct parser *c)
{
    int v = and_expr(c);
    while (strcmp(peek(c), "or") == 0) {
        take(c);
        int r = and_expr(c);
        v = v || r;
    }
    return v;
}

/* Evaluates the condition: 1 matched, 0 did not match, -1 a syntax error. */
static int evaluate_condition(const struct rule *k)
{
    char copy[600];
    size_t j = 0;
    /* Add spaces around parentheses so they split into separate tokens */
    for (const char *s = k->condition; *s && j + 4 < sizeof copy; s++) {
        if (*s == '(' || *s == ')') {
            copy[j++] = ' ';
            copy[j++] = *s;
            copy[j++] = ' ';
        } else {
            copy[j++] = *s;
        }
    }
    copy[j] = '\0';
    struct parser c;
    memset(&c, 0, sizeof c);
    c.k = k;
    for (char *t = strtok(copy, " \t"); t; t = strtok(NULL, " \t")) {
        if (c.n >= MAX_TOKENS)
            return -1;
        c.t[c.n++] = t;
    }
    int v = expr(&c);
    if (c.error || c.i != c.n)
        return -1;
    return v;
}

/* ---------------- main flow ---------------- */

static unsigned char *read_file(const char *path, size_t *len)
{
    FILE *f = fopen(path, "rb");
    if (!f)
        return NULL;
    unsigned char *v = malloc(MAX_SIZE + 1);
    size_t n = v ? fread(v, 1, MAX_SIZE + 1, f) : 0;
    fclose(f);
    if (!v || n > MAX_SIZE) {
        free(v);
        return NULL;
    }
    *len = n;
    return v;
}

static const char *short_name(const char *path)
{
    const char *s1 = strrchr(path, '/');
    const char *s2 = strrchr(path, '\\');
    const char *s = s1 > s2 ? s1 : s2;
    return s ? s + 1 : path;
}

static void scan(const char *path, int detail)
{
    size_t n = 0;
    unsigned char *v = read_file(path, &n);
    if (!v) {
        printf("  %-13s ERROR unreadable/too large\n", short_name(path));
        return;
    }
    char matched_list[512] = "";
    int matched = 0;
    if (detail)
        printf("  %s (%zu bytes)\n", short_name(path), n);
    for (int r = 0; r < rule_count; r++) {
        struct rule *k = &rules[r];
        for (int i = 0; i < k->nstr; i++)
            k->strings[i].count = count_matches(v, n, &k->strings[i]);
        int result = evaluate_condition(k);
        if (detail) {
            printf("    %-22s ", k->name);
            for (int i = 0; i < k->nstr; i++)
                printf("$%s=%d ", k->strings[i].id, k->strings[i].count);
            printf("-> %s\n", result < 0 ? "CONDITION ERROR"
                              : result ? "MATCHED" : "-");
        }
        if (result == 1) {
            size_t L = strlen(matched_list);     /* append without overflowing */
            snprintf(matched_list + L, sizeof matched_list - L, "%s%.47s",
                     matched++ ? ", " : "", k->name);
        }
    }
    if (!detail)
        printf("  %-13s %s\n", short_name(path), matched ? matched_list : "(no match)");
    free(v);
}

int main(int argc, char **argv)
{
    demo_prepare();
    int detail = argc > 1 && strcmp(argv[1], "-a") == 0;
    int first = detail ? 2 : 1;
    if (argc - first < 2) {
        fprintf(stderr, "usage: %s [-a] <rules.txt> <file>...\n",
                argv[0]);
        return 2;
    }
    if (load_rules(argv[first]) != 0)
        return 1;
    if (!detail)
        printf("  %d rule(s) loaded\n", rule_count);
    for (int i = first + 1; i < argc; i++)
        scan(argv[i], detail);
    return 0;
}
