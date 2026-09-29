/*
 * CEN429 — Week 2 — Demo 4: attack tree cost calculator
 *
 * Usage: bin/linux/tree <tree.txt>
 *
 * Reads an attack tree and computes the "cheapest attack cost" for every
 * node, bottom-up:
 *   LEAF node : its cost is given in the file (e.g. person-days, equipment score)
 *   OR node   : picks the CHEAPEST of its children (whichever suits the attacker)
 *   AND node  : takes the SUM of its children (all of them are required)
 *
 * The root node's cost = the attacker's cheapest way to reach the goal. The
 * program also prints that cheapest path (the critical chain to defend).
 *
 * Input format (indentation = tree depth; two spaces is one level):
 *   GOAL: Obtain the payment key            # root (OR if no code is given)
 *     OR
 *       LEAF Decrypt the database  cost=8
 *       AND
 *         LEAF Get root            cost=3
 *         LEAF Find the DB key     cost=6
 *
 * This is a CALCULATOR; it never carries out an attack, it only adds numbers.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "cen429_demo.h"

#define MAX_NODES 256
#define MAX_CHILDREN 16
#define INF_COST 1000000000

enum node_type { LEAF, AND, OR };

struct node {
    enum node_type type;
    int indent;
    char name[80];
    int cost;                /* given for a leaf, computed for an internal node */
    int time;                /* time in days (an attribute, scenario-dependent) */
    int skill;               /* 1-5 expertise level (an attribute) */
    int children[MAX_CHILDREN];
    int child_count;
    int cheapest_child;      /* the cheapest child chosen at an OR node */
};

static struct node nodes[MAX_NODES];
static int node_count;

static int count_indent(const char *s)
{
    int i = 0;
    while (s[i] == ' ')
        i++;
    return i / 2;
}

/* Computes a subtree (recursively); writes the cheapest path into cheapest_child */
static int compute(int i)
{
    struct node *x = &nodes[i];
    if (x->type == LEAF)
        return x->cost;

    if (x->type == AND) {
        /* All of them are required: cost and time are SUMMED, skill is the
         * HIGHEST (the hardest step sets the expertise needed). */
        long total = 0, time = 0;
        int skill = 0;
        for (int c = 0; c < x->child_count; c++) {
            total += compute(x->children[c]);
            time += nodes[x->children[c]].time;
            if (nodes[x->children[c]].skill > skill)
                skill = nodes[x->children[c]].skill;
        }
        x->cost = total > INF_COST ? INF_COST : (int)total;
        x->time = (int)time;
        x->skill = skill;
    } else { /* OR */
        /* One is enough: the attacker picks the CHEAPEST branch; time/skill
         * are that branch's values (the path the attacker would actually take). */
        int cheapest = INF_COST, pick = -1;
        for (int c = 0; c < x->child_count; c++) {
            int m = compute(x->children[c]);
            if (m < cheapest) {
                cheapest = m;
                pick = x->children[c];
            }
        }
        x->cost = cheapest;
        x->cheapest_child = pick;
        if (pick >= 0) {
            x->time = nodes[pick].time;
            x->skill = nodes[pick].skill;
        }
    }
    return x->cost;
}

static void print_tree(int i, int depth)
{
    struct node *x = &nodes[i];
    for (int t = 0; t < depth; t++)
        printf("  ");
    const char *label = x->type == LEAF ? "" :
                        x->type == AND ? "[AND] " : "[OR] ";
    printf("%s%s  (cost=%d)\n", label, x->name, x->cost);
    for (int c = 0; c < x->child_count; c++)
        print_tree(x->children[c], depth + 1);
}

/* Prints the cheapest path (only the chosen branches) */
static void cheapest_path(int i, int depth)
{
    struct node *x = &nodes[i];
    for (int t = 0; t < depth; t++)
        printf("  ");
    printf("-> %s (cost=%d)\n", x->name, x->cost);
    if (x->type == AND)
        for (int c = 0; c < x->child_count; c++)
            cheapest_path(x->children[c], depth + 1);
    else if (x->type == OR && x->cheapest_child >= 0)
        cheapest_path(x->cheapest_child, depth + 1);
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc != 2) {
        fprintf(stderr, "usage: %s <tree.txt>\n", argv[0]);
        return 2;
    }
    FILE *f = fopen(argv[1], "r");
    if (!f) {
        perror(argv[1]);
        return 1;
    }
    char line[256];
    int parent_stack[64];
    parent_stack[0] = -1;

    while (fgets(line, sizeof line, f) && node_count < MAX_NODES) {
        line[strcspn(line, "\r\n")] = '\0';
        char *start = line + strspn(line, " ");
        if (start[0] == '\0' || start[0] == '#')
            continue;
        int indent = count_indent(line);
        struct node *x = &nodes[node_count];
        memset(x, 0, sizeof *x);
        x->indent = indent;
        x->cheapest_child = -1;

        if (strncmp(start, "GOAL:", 5) == 0) {
            x->type = OR;
            snprintf(x->name, sizeof x->name, "%s", start + 6);
        } else if (strncmp(start, "AND", 3) == 0 &&
                   (start[3] == '\0' || start[3] == ' ')) {
            x->type = AND;
            char *label = start + 3 + strspn(start + 3, " ");
            snprintf(x->name, sizeof x->name, "%s [all required]",
                     label[0] ? label : "AND");
        } else if (strncmp(start, "OR", 2) == 0 &&
                   (start[2] == '\0' || start[2] == ' ')) {
            x->type = OR;
            char *label = start + 2 + strspn(start + 2, " ");
            snprintf(x->name, sizeof x->name, "%s [one is enough]",
                     label[0] ? label : "OR");
        } else if (strncmp(start, "LEAF", 4) == 0) {
            x->type = LEAF;
            char *cost_p = strstr(start, "cost=");
            x->cost = cost_p ? atoi(cost_p + 5) : 0;
            char *time_p = strstr(start, "time=");
            x->time = time_p ? atoi(time_p + 5) : 0;
            char *skill_p = strstr(start, "skill=");
            x->skill = skill_p ? atoi(skill_p + 6) : 0;
            /* The name is the part before the first attribute. */
            char *name_start = start + 4 + strspn(start + 4, " ");
            char *cut = cost_p;
            if (time_p && (!cut || time_p < cut)) cut = time_p;
            if (skill_p && (!cut || skill_p < cut)) cut = skill_p;
            size_t len = cut ? (size_t)(cut - name_start) : strlen(name_start);
            while (len > 0 && name_start[len - 1] == ' ')
                len--;
            snprintf(x->name, sizeof x->name, "%.*s", (int)len, name_start);
        } else {
            continue;
        }

        /* Find the parent: the most recent node one indent level shallower */
        if (indent > 0) {
            int p = parent_stack[indent - 1];
            if (p >= 0 && nodes[p].child_count < MAX_CHILDREN)
                nodes[p].children[nodes[p].child_count++] = node_count;
        }
        parent_stack[indent] = node_count;
        node_count++;
    }
    fclose(f);
    if (node_count == 0) {
        fprintf(stderr, "empty tree\n");
        return 1;
    }

    compute(0);
    printf("  Attack tree (leaf cost = e.g. person-day effort):\n\n");
    print_tree(0, 1);
    printf("\n  CHEAPEST ATTACK = %d unit(s). The chain the defender should\n"
           "  break first (the weakest point):\n\n", nodes[0].cost);
    cheapest_path(0, 1);
    if (nodes[0].time > 0 || nodes[0].skill > 0)
        printf("\n  This cheapest path's other attributes: total time=%d days, "
               "skill required=%d/5.\n", nodes[0].time, nodes[0].skill);
    return 0;
}
