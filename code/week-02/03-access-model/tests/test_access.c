/* Unit tests for week-02/03-access-model/access.c.
 *
 * dominates(), is_sanitized(), has_read()/mark_read() and chinese_wall() are pure/bounded
 * functions over the file-scope `subjects[]`/`objects[]` arrays, which this test populates
 * directly -- the same trick used for the other demos' static state. Every expected value below
 * is reasoned out by hand from the model's own definition (BLP/Biba "dominates" relation), never
 * by calling the function a second time.
 */
#define main program_main
#include "../access.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- dominates(): level and category-set comparison ------------------------------------ */
    CHECK_EQ_INT(dominates(2, 0x3, 1, 0x1), 1);   /* higher level, superset of categories */
    CHECK_EQ_INT(dominates(1, 0x1, 2, 0x1), 0);   /* lower level: never dominates */
    CHECK_EQ_INT(dominates(2, 0x1, 2, 0x3), 0);   /* same level, NOT a superset of categories */
    CHECK_EQ_INT(dominates(2, 0x3, 2, 0x3), 1);   /* equal label: dominates itself */
    CHECK_EQ_INT(dominates(3, 0x0, 0, 0x0), 1);   /* no categories at all: level alone decides */

    /* --- has_read()/mark_read(): bit index below and at/above 32 -------------------------- */
    {
        struct labeled s;
        memset(&s, 0, sizeof s);
        CHECK_EQ_INT(has_read(&s, 5), 0);
        mark_read(&s, 5);
        CHECK_EQ_INT(has_read(&s, 5), 1);
        CHECK_EQ_INT(has_read(&s, 6), 0);          /* only bit 5 set, not its neighbours */
        CHECK_EQ_INT(has_read(&s, 40), 0);
        mark_read(&s, 40);                          /* the >=32 path (read_mask_hi) */
        CHECK_EQ_INT(has_read(&s, 40), 1);
        CHECK_EQ_INT(has_read(&s, 5), 1);            /* the low-index bit is unaffected */
    }

    /* --- is_sanitized(): "-", empty, and a real class name --------------------------------- */
    {
        struct labeled o;
        memset(&o, 0, sizeof o);
        snprintf(o.conflict_class, NAME_LEN, "-");
        CHECK_EQ_INT(is_sanitized(&o), 1);
        o.conflict_class[0] = '\0';
        CHECK_EQ_INT(is_sanitized(&o), 1);
        snprintf(o.conflict_class, NAME_LEN, "OIL");
        CHECK_EQ_INT(is_sanitized(&o), 0);
    }

    /* --- chinese_wall(): the simultaneous-conflict and the *-property ---------------------- */
    {
        subject_count = 1;
        object_count = 3;
        memset(subjects, 0, sizeof subjects);
        memset(objects, 0, sizeof objects);
        snprintf(subjects[0].name, NAME_LEN, "consultant");
        snprintf(objects[0].name, NAME_LEN, "bankA_report");
        snprintf(objects[0].company, NAME_LEN, "BankA");
        snprintf(objects[0].conflict_class, NAME_LEN, "BANKING");
        snprintf(objects[1].name, NAME_LEN, "bankB_report");
        snprintf(objects[1].company, NAME_LEN, "BankB");
        snprintf(objects[1].conflict_class, NAME_LEN, "BANKING");
        snprintf(objects[2].name, NAME_LEN, "public_notice");
        snprintf(objects[2].company, NAME_LEN, "-");
        snprintf(objects[2].conflict_class, NAME_LEN, "-");

        char reason[96];
        /* Nothing read yet: reading BankA's report is free. */
        CHECK_EQ_INT(chinese_wall(0, 0, 0, reason, sizeof reason), 1);
        mark_read(&subjects[0], 0);

        /* Same company again: still free. */
        CHECK_EQ_INT(chinese_wall(0, 0, 0, reason, sizeof reason), 1);
        /* A competitor in the SAME conflict class: denied (the wall rule). */
        CHECK_EQ_INT(chinese_wall(0, 1, 0, reason, sizeof reason), 0);
        /* A sanitized object is always free to read, regardless of history. */
        CHECK_EQ_INT(chinese_wall(0, 2, 0, reason, sizeof reason), 1);
        /* The *-property: having read BankA's data, this subject may not WRITE to a
           sanitized (public) object either -- it could leak BankA's data into it. */
        CHECK_EQ_INT(chinese_wall(0, 2, 1, reason, sizeof reason), 0);
        /* Writing back to the SAME company's own object is fine. */
        CHECK_EQ_INT(chinese_wall(0, 0, 1, reason, sizeof reason), 1);
    }

    TEST_SUMMARY();
}
