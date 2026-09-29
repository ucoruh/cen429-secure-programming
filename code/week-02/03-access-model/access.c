/*
 * CEN429 — Week 2 — Demo 3: access control and formal model simulator
 *
 * Usage: bin/linux/access <policy.txt>
 *
 * Evaluates the same access requests against several models and shows the
 * decisions side by side:
 *   DAC       Access control matrix (the owner's permissions)
 *   BLP       Bell–LaPadula: CONFIDENTIALITY (no read up, no write down)
 *   BIBA      Biba strict integrity (no read down, no write up)
 *   BLP+BIBA  Both at once (data stays both secret and trusted)
 *   BIBA-LWM  Biba low-water-mark: reading is free, but once a subject reads
 *             a less trusted object its own level DROPS
 *   CW        Chinese Wall (Brewer–Nash): once a consultant reads one
 *             company's data, the other company in the same conflict class
 *             closes to them
 *
 * Label = (level, category set). Label A DOMINATES B (A dom B) if and only if
 * level(A) >= level(B) and categories(A) superset-of categories(B).
 *   BLP : read  -> subject dom object (the ss-property); write -> object dom subject (the *-property)
 *   BIBA: read  -> object dom subject;                    write -> subject dom object
 *
 * This is a SIMULATOR: it never touches a real file, it only applies the
 * rules in the policy file and prints "allow / deny".
 *
 * Policy file format (one rule per line; # starts a comment):
 *   MODEL   <BLP|BIBA|BLP+BIBA|BIBA-LWM|CW>       the active mandatory model
 *   LEVEL   <name> <number>                confidentiality/integrity level
 *   SUBJECT <name> <level> [cat1,cat2]      a user/process, level, categories
 *   OBJECT  <name> <level> [cat1,cat2]      a file/resource, level, categories
 *   COMPANY <object> <company> <class>      Chinese Wall: company and conflict class
 *                                           ("-" "-" = sanitized, open to everyone)
 *   RIGHT   <subject|*> <object|*> <r|w|rw> a DAC matrix cell (* = everyone)
 *   REQUEST <subject> <read|write> <object> an access to evaluate
 *
 * The effective decision = DAC AND (the active MAC model). This is exactly
 * BLP's "ds-property": even if the mandatory rule passes, the matrix
 * permission is also required.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

#define MAX_ENTRIES 64
#define NAME_LEN 32

struct labeled {
    char name[NAME_LEN];
    int level;
    unsigned cats;                 /* category set (bitmask) */
    char company[NAME_LEN], conflict_class[NAME_LEN];
    unsigned read_mask;             /* CW: the objects this subject has read (bits) */
    unsigned long long read_mask_hi; /* for objects 32..63 */
};

static struct { char name[NAME_LEN]; int level; } levels[MAX_ENTRIES];
static int level_count;
static char categories[32][NAME_LEN];
static int category_count;
static struct labeled subjects[MAX_ENTRIES];
static int subject_count;
static struct labeled objects[MAX_ENTRIES];
static int object_count;

/* DAC matrix: rights[s][o] = bit 1 (read) | bit 2 (write) */
static int rights[MAX_ENTRIES][MAX_ENTRIES];

/* The active MAC model: bit 1 = BLP, 2 = Biba, 4 = low-water-mark,
   8 = Chinese Wall */
static int model = 1;
static const char *model_name = "BLP";
static int show_labels; /* 1 once a category or company has been defined */

static int find_level(const char *name)
{
    for (int i = 0; i < level_count; i++)
        if (strcmp(levels[i].name, name) == 0)
            return levels[i].level;
    return -1;
}

static int find_index(struct labeled *t, int n, const char *name)
{
    for (int i = 0; i < n; i++)
        if (strcmp(t[i].name, name) == 0)
            return i;
    return -1;
}

static const char *level_name(int value)
{
    for (int i = 0; i < level_count; i++)
        if (levels[i].level == value)
            return levels[i].name;
    return "?";
}

/* "NUCLEAR,EUROPE" -> a bitmask (new names get registered) */
static unsigned parse_categories(char *text)
{
    unsigned m = 0;
    if (!text)
        return 0;
    for (char *p = strtok(text, ","); p; p = strtok(NULL, ",")) {
        int i;
        for (i = 0; i < category_count; i++)
            if (strcmp(categories[i], p) == 0)
                break;
        if (i == category_count && category_count < 32)
            snprintf(categories[category_count++], NAME_LEN, "%s", p);
        if (i < 32)
            m |= 1u << i;
    }
    show_labels = 1;
    return m;
}

static const char *categories_text(unsigned m)
{
    static char t[2][160];
    static int s;
    char *b = t[s++ & 1];
    strcpy(b, "{");
    for (int i = 0; i < category_count; i++)
        if (m & (1u << i)) {
            if (b[1])
                strcat(b, ",");
            strcat(b, categories[i]);
        }
    strcat(b, "}");
    return b;
}

/* Does a dominate b? */
static int dominates(int sa, unsigned ka, int sb, unsigned kb)
{
    return sa >= sb && (ka & kb) == kb;
}

static int has_read(const struct labeled *s, int oi)
{
    return oi < 32 ? (s->read_mask >> oi) & 1u
                   : (int)((s->read_mask_hi >> (oi - 32)) & 1ULL);
}

static void mark_read(struct labeled *s, int oi)
{
    if (oi < 32)
        s->read_mask |= 1u << oi;
    else
        s->read_mask_hi |= 1ULL << (oi - 32);
}

static int is_sanitized(const struct labeled *o)
{
    return strcmp(o->conflict_class, "-") == 0 || o->conflict_class[0] == '\0';
}

/* The Chinese Wall decision; reason[] records the conflicting company */
static int chinese_wall(int si, int oi, int write, char *reason, size_t rb)
{
    const struct labeled *s = &subjects[si], *o = &objects[oi];
    reason[0] = '\0';
    /* Simple rule: every object already read must be either from the same
       company, or in a different conflict class (a sanitized object is
       always free) */
    if (!is_sanitized(o))
        for (int j = 0; j < object_count; j++) {
            const struct labeled *m = &objects[j];
            if (!has_read(s, j) || is_sanitized(m))
                continue;
            if (strcmp(m->conflict_class, o->conflict_class) == 0 &&
                strcmp(m->company, o->company) != 0) {
                snprintf(reason, rb, "%s already read; %s is in the same class (%s)",
                         m->company, o->company, o->conflict_class);
                return 0;
            }
        }
    if (!write)
        return 1;
    /* the *-property: if the subject has read another company's
       unsanitized data, it cannot write anywhere (so that information
       cannot leak across the wall) */
    for (int j = 0; j < object_count; j++) {
        const struct labeled *m = &objects[j];
        if (has_read(s, j) && !is_sanitized(m) &&
            strcmp(m->company, o->company) != 0) {
            snprintf(reason, rb, "%s's data could leak %s", m->company,
                     is_sanitized(o) ? "into a public object"
                                     : "out of this file");
            return 0;
        }
    }
    return 1;
}

/* Evaluates one request against the models and prints a single line */
static void evaluate(const char *s_name, int write, const char *o_name)
{
    int si = find_index(subjects, subject_count, s_name);
    int oi = find_index(objects, object_count, o_name);
    if (si < 0 || oi < 0) {
        printf("  %-8s %-3s %-10s  ! undefined subject/object\n", s_name,
               write ? "W" : "R", o_name);
        return;
    }
    struct labeled *s = &subjects[si];
    const struct labeled *o = &objects[oi];
    int ss = s->level, os = o->level;
    unsigned sc = s->cats, oc = o->cats;

    /* DAC: is the relevant bit set in the matrix? (BLP's ds-property) */
    int dac = (rights[si][oi] & (write ? 2 : 1)) != 0;

    /* BLP (confidentiality): read  -> subject dom object (ss-property)
                               write -> object dom subject (*-property) */
    int blp = write ? dominates(os, oc, ss, sc) : dominates(ss, sc, os, oc);

    /* Biba (integrity): read  -> object dom subject (no read down)
                          write -> subject dom object (no write up) */
    int biba = write ? dominates(ss, sc, os, oc) : dominates(os, oc, ss, sc);
    if ((model & 4) && !write)
        biba = 1; /* low-water-mark: reading is free, the level will drop instead */

    char reason[96] = "";
    int cw = (model & 8) ? chinese_wall(si, oi, write, reason, sizeof reason) : 1;

    /* The MAC decision, according to the active model */
    int mac = 1;
    if (model & 1)
        mac = mac && blp;
    if (model & 2)
        mac = mac && biba;
    if (model & 8)
        mac = mac && cw;
    int allow = dac && mac;

    if (model & 8)
        printf("  %-10s %-3s %-12s  DAC:%-3s CW:%-3s  => %s%s%s\n", s_name,
               write ? "W" : "R", o_name, dac ? "YES" : "no",
               cw ? "OK" : "DENY", allow ? "ALLOW" : "DENY",
               reason[0] ? "\n     ^ " : "", reason);
    else
        printf("  %-7s(%-4.4s) %-3s %-12s(%-4.4s) DAC:%-3s BLP:%-3s "
               "BIBA:%-3s  => %s\n",
               s_name, level_name(ss), write ? "W" : "R", o_name, level_name(os),
               dac ? "YES" : "no", blp ? "OK" : "DENY", biba ? "OK" : "DENY",
               allow ? "ALLOW" : "DENY");

    if (!allow)
        return;
    /* Low-water-mark: if the object read is less trusted, the subject's
       label drops to the greatest lower bound (min level, category
       intersection) */
    if ((model & 4) && !write && !dominates(os, oc, ss, sc)) {
        int lower = ss < os ? ss : os;
        printf("     ^ low-water-mark: %s integrity %s -> %s\n", s_name,
               level_name(ss), level_name(lower));
        s->level = lower;
        s->cats = sc & oc;
    }
    if ((model & 8) && !write)
        mark_read(s, oi);
}

static void print_labels(void)
{
    printf("  Labels (level and category set):\n");
    for (int i = 0; i < subject_count; i++)
        printf("    subject %-12s (%s, %s)\n", subjects[i].name,
               level_name(subjects[i].level), categories_text(subjects[i].cats));
    for (int i = 0; i < object_count; i++) {
        if (model & 8)
            printf("    object  %-12s company=%s class=%s\n", objects[i].name,
                   objects[i].company, objects[i].conflict_class);
        else
            printf("    object  %-12s (%s, %s)\n", objects[i].name,
                   level_name(objects[i].level), categories_text(objects[i].cats));
    }
}

static void process_line(char *line)
{
    line[strcspn(line, "\r\n")] = '\0';
    char *comment = strchr(line, '#');
    if (comment)
        *comment = '\0';
    char *k = strtok(line, " \t");
    if (!k)
        return;

    if (strcmp(k, "MODEL") == 0) {
        char *m = strtok(NULL, " \t");
        if (m && strcmp(m, "BLP") == 0) { model = 1; model_name = "BLP"; }
        else if (m && strcmp(m, "BIBA") == 0) { model = 2; model_name = "Biba"; }
        else if (m && strcmp(m, "BLP+BIBA") == 0) {
            model = 3;
            model_name = "BLP+Biba";
        } else if (m && strcmp(m, "BIBA-LWM") == 0) {
            model = 2 | 4;
            model_name = "Biba low-water-mark";
        } else if (m && strcmp(m, "CW") == 0) {
            model = 8;
            model_name = "Chinese Wall (Brewer-Nash)";
        }
    } else if (strcmp(k, "LEVEL") == 0) {
        char *name = strtok(NULL, " \t"), *v = strtok(NULL, " \t");
        if (name && v && level_count < MAX_ENTRIES) {
            snprintf(levels[level_count].name, NAME_LEN, "%s", name);
            levels[level_count].level = atoi(v);
            level_count++;
        }
    } else if (strcmp(k, "SUBJECT") == 0 || strcmp(k, "OBJECT") == 0) {
        char *name = strtok(NULL, " \t"), *lvl_tok = strtok(NULL, " \t");
        char *cat_tok = strtok(NULL, " \t");
        int level_val = lvl_tok ? find_level(lvl_tok) : -1;
        struct labeled *arr = (k[0] == 'S') ? subjects : objects;
        int *count = (k[0] == 'S') ? &subject_count : &object_count;
        if (name && level_val >= 0 && *count < MAX_ENTRIES) {
            memset(&arr[*count], 0, sizeof arr[*count]);
            snprintf(arr[*count].name, NAME_LEN, "%s", name);
            arr[*count].level = level_val;
            arr[*count].cats = cat_tok ? parse_categories(cat_tok) : 0;
            (*count)++;
        } else {
            fprintf(stderr, "  warning: undefined level '%s'\n", lvl_tok ? lvl_tok : "");
        }
    } else if (strcmp(k, "COMPANY") == 0) {
        char *obj_name = strtok(NULL, " \t"), *company = strtok(NULL, " \t");
        char *cls = strtok(NULL, " \t");
        int oi = obj_name ? find_index(objects, object_count, obj_name) : -1;
        if (oi >= 0 && company && cls) {
            snprintf(objects[oi].company, NAME_LEN, "%s", company);
            snprintf(objects[oi].conflict_class, NAME_LEN, "%s", cls);
            show_labels = 1;
        }
    } else if (strcmp(k, "RIGHT") == 0) {
        char *s = strtok(NULL, " \t"), *o = strtok(NULL, " \t");
        char *rw = strtok(NULL, " \t");
        if (!s || !o || !rw)
            return;
        int bit = (strchr(rw, 'r') ? 1 : 0) | (strchr(rw, 'w') ? 2 : 0);
        for (int i = 0; i < subject_count; i++)
            for (int j = 0; j < object_count; j++)
                if ((strcmp(s, "*") == 0 || strcmp(s, subjects[i].name) == 0) &&
                    (strcmp(o, "*") == 0 || strcmp(o, objects[j].name) == 0))
                    rights[i][j] |= bit;
    } else if (strcmp(k, "REQUEST") == 0) {
        char *s = strtok(NULL, " \t"), *verb = strtok(NULL, " \t");
        char *o = strtok(NULL, " \t");
        if (s && verb && o)
            evaluate(s, strcmp(verb, "write") == 0, o);
    }
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 2) {
        fprintf(stderr, "usage: %s <policy.txt>\n", argv[0]);
        return 2;
    }
    FILE *f = fopen(argv[1], "r");
    if (!f) {
        perror(argv[1]);
        return 1;
    }
    char line[256];
    /* We read the file twice so definitions are processed before requests:
       pass 1 handles LEVEL/SUBJECT/OBJECT/RIGHT; pass 2 handles only REQUEST
       (in order, because low-water-mark and Chinese Wall depend on HISTORY). */
    while (fgets(line, sizeof line, f))
        if (strncmp(line, "REQUEST", 7) != 0)
            process_line(line);
    rewind(f);
    printf("  Active mandatory (MAC) model: %s\n", model_name);
    if (show_labels)
        print_labels();
    if (model & 8)
        printf("  subject    action object        decisions (effective = DAC and CW)\n");
    else
        printf("  subject(level)  action object(level)        decisions "
               "(effective = DAC and MAC)\n");
    printf("  -------------------------------------------------------------\n");
    while (fgets(line, sizeof line, f))
        if (strncmp(line, "REQUEST", 7) == 0)
            process_line(line);
    fclose(f);
    return 0;
}
