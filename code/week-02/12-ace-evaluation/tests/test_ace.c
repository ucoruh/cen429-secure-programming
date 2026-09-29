/* Unit tests for week-02/12-ace-evaluation/ace.c.
 *
 * This program is pure computation over the file-scope `token`/`obj` structs, which this test
 * populates directly (bypassing the scenario-file parser) -- the same trick used by the other
 * demos' static-state tests. Every expected decision below is reasoned out by hand from the
 * rules listed in the file's own header comment (steps 1-6).
 */
#define main program_main
#include "../ace.c"
#undef main
#include "../../../common/test_check.h"

static void add_ace(int deny, const char *sid, int mask, int inherited)
{
    struct ace *a = &obj.ace[obj.ace_n++];
    a->deny = deny;
    a->inherited = inherited;
    snprintf(a->sid, NAME_LEN, "%s", sid);
    a->mask = mask;
    obj.dacl_kind = 0;
}

int main(void)
{
    /* --- parse_rights() / right_name(): round trip and invalid input ----------------------- */
    CHECK_EQ_INT(parse_rights("READ,WRITE"), H_READ | H_WRITE);
    CHECK_EQ_INT(parse_rights("FULL"), H_FULL);
    CHECK_EQ_INT(parse_rights("BOGUS"), -1);
    CHECK_EQ_INT(parse_rights(""), 0);
    CHECK_EQ_STR(right_name(H_FULL), "FULL");
    CHECK_EQ_STR(right_name(0), "-");
    CHECK_EQ_STR(right_name(H_READ | H_WRITE), "READ,WRITE");

    /* --- find_level(): the four names, and an unknown one ----------------------------------- */
    CHECK_EQ_INT(find_level("Low"), 0);
    CHECK_EQ_INT(find_level("Medium"), 1);
    CHECK_EQ_INT(find_level("High"), 2);
    CHECK_EQ_INT(find_level("System"), 3);
    CHECK_EQ_INT(find_level("Bogus"), -1);

    /* --- ace_class(): explicit deny < explicit allow < inherited deny < inherited allow ----- */
    {
        struct ace a;
        a.inherited = 0; a.deny = 1; CHECK_EQ_INT(ace_class(&a), 0);
        a.inherited = 0; a.deny = 0; CHECK_EQ_INT(ace_class(&a), 1);
        a.inherited = 1; a.deny = 1; CHECK_EQ_INT(ace_class(&a), 2);
        a.inherited = 1; a.deny = 0; CHECK_EQ_INT(ace_class(&a), 3);
    }

    /* --- is_canonical() / canonicalize() ---------------------------------------------------- */
    reset();
    add_ace(1, "A", H_READ, 0);           /* explicit deny */
    add_ace(0, "B", H_READ, 0);           /* explicit allow */
    add_ace(1, "C", H_READ, 1);           /* inherited deny */
    {
        int offender = -1;
        CHECK_EQ_INT(is_canonical(&offender), 1);
    }
    reset();
    add_ace(0, "B", H_READ, 0);           /* allow before deny: WRONG order */
    add_ace(1, "A", H_READ, 0);
    {
        int offender = -1;
        CHECK_EQ_INT(is_canonical(&offender), 0);
        CHECK_EQ_INT(offender, 1);
    }
    canonicalize();
    CHECK_EQ_STR(obj.ace[0].sid, "A");     /* the deny ACE now comes first */
    CHECK_EQ_STR(obj.ace[1].sid, "B");

    /* --- token_is_owner() / sid_matches(): direct user, group, deny-only group ------------- */
    reset();
    snprintf(token.user, NAME_LEN, "alice");
    snprintf(token.group[0], NAME_LEN, "Users");
    token.deny_only[0] = 0;
    snprintf(token.group[1], NAME_LEN, "Administrators");
    token.deny_only[1] = 1;
    token.group_n = 2;
    snprintf(obj.owner, NAME_LEN, "alice");
    CHECK_EQ_INT(token_is_owner(), 1);
    snprintf(obj.owner, NAME_LEN, "bob");
    CHECK_EQ_INT(token_is_owner(), 0);
    CHECK_EQ_INT(sid_matches("Everyone"), 1);
    CHECK_EQ_INT(sid_matches("alice"), 1);
    CHECK_EQ_INT(sid_matches("Users"), 1);               /* a normal group: matches ALLOW too */
    CHECK_EQ_INT(sid_matches("Administrators"), 2);       /* deny-only: matches DENY only */
    CHECK_EQ_INT(sid_matches("Nobody"), 0);

    /* --- has_owner_rights_ace() -------------------------------------------------------------- */
    reset();
    CHECK_EQ_INT(has_owner_rights_ace(), 0);
    add_ace(0, "OWNER_RIGHTS", H_READ_CONTROL, 0);
    CHECK_EQ_INT(has_owner_rights_ace(), 1);

    /* --- evaluate(): Mandatory Integrity Control runs BEFORE the DACL ---------------------- */
    reset();
    snprintf(token.user, NAME_LEN, "alice");
    token.integrity = 0;                    /* Low */
    obj.label = 1;                          /* Medium: token < object */
    obj.dacl_kind = 1;                      /* NULL DACL: would allow everything if reached */
    CHECK_EQ_INT(evaluate(H_WRITE), 0);      /* MIC denies before the DACL is even read */
    CHECK_EQ_INT(evaluate(H_READ), 1);       /* read is not a write-kind right: MIC passes it through */

    /* --- evaluate(): NULL DACL and EMPTY DACL ------------------------------------------------ */
    reset();
    snprintf(token.user, NAME_LEN, "alice");
    obj.dacl_kind = 1;
    CHECK_EQ_INT(evaluate(H_FULL), 1);        /* NULL DACL: everything to everyone */
    reset();
    snprintf(token.user, NAME_LEN, "alice");
    obj.dacl_kind = 2;
    CHECK_EQ_INT(evaluate(H_READ), 0);         /* EMPTY DACL: nothing to anyone */

    /* --- evaluate(): the TAKE_OWNERSHIP privilege bypasses the DACL ------------------------- */
    reset();
    snprintf(token.user, NAME_LEN, "alice");
    token.take_ownership_priv = 1;
    obj.dacl_kind = 2;                        /* an empty DACL would otherwise deny everything */
    CHECK_EQ_INT(evaluate(H_TAKE_OWNER), 1);

    /* --- evaluate(): the owner's implicit READ_CONTROL/WRITE_DAC (no OWNER_RIGHTS ACE) ----- */
    reset();
    snprintf(token.user, NAME_LEN, "alice");
    snprintf(obj.owner, NAME_LEN, "alice");
    obj.dacl_kind = 2;
    CHECK_EQ_INT(evaluate(H_READ_CONTROL), 1);

    /* --- evaluate(): the ACE walk -- first matching DENY stops the search immediately ------ */
    reset();
    snprintf(token.user, NAME_LEN, "alice");
    add_ace(0, "alice", H_FULL, 0);           /* allow first... */
    add_ace(1, "alice", H_WRITE, 0);          /* ...then a deny (out of canonical order) */
    CHECK_EQ_INT(evaluate(H_WRITE), 1);        /* the ALLOW is walked first: already granted */
    reset();
    snprintf(token.user, NAME_LEN, "alice");
    add_ace(1, "alice", H_WRITE, 0);          /* deny first: canonical order */
    add_ace(0, "alice", H_FULL, 0);
    CHECK_EQ_INT(evaluate(H_WRITE), 0);        /* the DENY is hit before the ALLOW is ever read */

    /* --- evaluate(): a deny-only group's ALLOW ACE never counts ---------------------------- */
    reset();
    snprintf(token.user, NAME_LEN, "alice");
    snprintf(token.group[0], NAME_LEN, "Administrators");
    token.deny_only[0] = 1;
    token.group_n = 1;
    add_ace(0, "Administrators", H_READ, 0);   /* an ALLOW for a deny-only group: skipped */
    CHECK_EQ_INT(evaluate(H_READ), 0);          /* the list ends, nothing granted */

    TEST_SUMMARY();
}
