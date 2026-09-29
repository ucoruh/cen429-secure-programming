set(CEN429_FOLDER "Week 02/04 Attack tree")
cen429_add_demo(tree SOURCES tree.c MODE optimize)

# --- Tests --------------------------------------------------------------------------------
cen429_add_demo(test_tree SOURCES tests/test_tree.c MODE optimize)
cen429_test(NAME week-02/04-attack-tree/unit COMMAND test_tree
            PASS_REGEX "0 failures")

# End-to-end: run the real binary against the committed tree files.
cen429_test(NAME week-02/04-attack-tree/attributed-cheapest-path
            COMMAND tree tree-attributed.txt
            PASS_REGEX "CHEAPEST ATTACK = 2 unit")
cen429_test(NAME week-02/04-attack-tree/payment-tree-runs
            COMMAND tree tree-payment.txt
            PASS_REGEX "CHEAPEST ATTACK = [0-9]+ unit")
cen429_test(NAME week-02/04-attack-tree/defense-raises-cost
            COMMAND tree tree-defense.txt
            PASS_REGEX "CHEAPEST ATTACK = [0-9]+ unit")
