/* Unit tests for week-02/14-rbac-clark-wilson/bank.c.
 *
 * This program is pure computation over file-scope arrays (roles, grants, separation
 * constraints, users, CDIs, certifications), which this test populates directly (bypassing the
 * scenario-file parser) -- the same trick used by the other demos' static-state tests. Every
 * expected result below is reasoned out by hand from the RBAC/Clark-Wilson rule named in the
 * file's own header comment (E1-E4, C1-C5).
 */
#define main program_main
#include "../bank.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- validate_amount(): UDI validation (C5) --------------------------------------------- */
    {
        long long v = -1;
        CHECK_EQ_INT(validate_amount("", &v), 0);                  /* empty */
        CHECK_EQ_INT(validate_amount("-500", &v), 0);               /* '-' is not a digit */
        CHECK_EQ_INT(validate_amount("12abc", &v), 0);              /* a non-digit character */
        CHECK_EQ_INT(validate_amount("0", &v), 0);                  /* below the 1..1000000 range */
        CHECK_EQ_INT(validate_amount("12345678", &v), 0);           /* 8 digits: too long (n > 7) */
        CHECK_EQ_INT(validate_amount("1000001", &v), 0);            /* one past the top of the range */
        CHECK_EQ_INT(validate_amount("250", &v), 1);
        CHECK_EQ_INT(v, 250);
        CHECK_EQ_INT(validate_amount("1000000", &v), 1);             /* the top of the range: valid */
        CHECK_EQ_INT(v, 1000000);
    }

    /* --- expand_roles(): RBAC1 role hierarchy (a senior role carries its juniors' rights) --- */
    {
        role_n = 2;
        snprintf(role_name[0], NAME_LEN, "SENIOR");
        snprintf(role_name[1], NAME_LEN, "JUNIOR");
        role_junior[0] = 1u << 1;    /* SENIOR inherits JUNIOR */
        role_junior[1] = 0;
        CHECK_EQ_INT(expand_roles(1u << 0), (1u << 0) | (1u << 1));  /* SENIOR -> also JUNIOR */
        CHECK_EQ_INT(expand_roles(1u << 1), 1u << 1);                  /* JUNIOR alone: unchanged */
    }

    /* --- roles_text(): formats an assigned-role bitmask ------------------------------------- */
    CHECK_EQ_STR(roles_text((1u << 0) | (1u << 1)), "SENIOR,JUNIOR");
    CHECK_EQ_STR(roles_text(0), "-");

    /* --- violates_separation(): SSD (static) and DSD (dynamic) constraints ------------------ */
    {
        separation_n = 2;
        separation[0].a = 0; separation[0].b = 1; separation[0].dynamic = 0;   /* SSD(SENIOR,JUNIOR) */
        separation[1].a = -1; separation[1].b = 1; separation[1].dynamic = 1;  /* a removed SSD entry */
        CHECK_EQ_INT(violates_separation((1u << 0) | (1u << 1), 0), 0);        /* hits constraint #0 */
        CHECK_EQ_INT(violates_separation(1u << 0, 0), -1);                       /* only one role: fine */
        CHECK_EQ_INT(violates_separation((1u << 0) | (1u << 1), 1), -1);         /* #1 was removed (a=-1) */
    }

    /* --- is_certified(): a TP certified for a specific CDI pair, and an uncertified one ----- */
    {
        cert_n = 1;
        snprintf(cert[0].tp, NAME_LEN, "TRANSFER");
        snprintf(cert[0].cdis, 96, "account_A,account_B");
        CHECK_EQ_INT(is_certified("TRANSFER", "account_A", "account_B"), 1);
        CHECK_EQ_INT(is_certified("TRANSFER", "account_A", NULL), 1);            /* only c1 checked */
        CHECK_EQ_INT(is_certified("TRANSFER", "account_X", NULL), 0);            /* not in the list */
        CHECK_EQ_INT(is_certified("WITHDRAW", "account_A", NULL), 0);            /* a different TP */
        CHECK_EQ_INT(is_certified("TRANSFER", "account_A", "account_X"), 0);     /* c2 not certified */
    }

    /* --- grand_total(): sums every CDI's value ---------------------------------------------- */
    {
        cdi_n = 2;
        snprintf(cdi[0].name, NAME_LEN, "account_A"); cdi[0].value = 12000;
        snprintf(cdi[1].name, NAME_LEN, "account_B"); cdi[1].value = 8000;
        CHECK_EQ_INT(grand_total(), 20000);
    }

    /* --- find_name()/find_user()/find_cdi(): lookups and the not-found case ----------------- */
    CHECK_EQ_INT(find_name(role_name, role_n, "SENIOR"), 0);
    CHECK_EQ_INT(find_name(role_name, role_n, "NOBODY"), -1);
    {
        user_n = 1;
        snprintf(user[0].name, NAME_LEN, "alice");
        CHECK_EQ_INT(find_user("alice"), 0);
        CHECK_EQ_INT(find_user("bob"), -1);
    }
    CHECK_EQ_INT(find_cdi("account_A"), 0);
    CHECK_EQ_INT(find_cdi("account_Z"), -1);

    TEST_SUMMARY();
}
