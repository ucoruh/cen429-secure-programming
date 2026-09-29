/*
 * CEN429 - Week 13 - Demo 2: Requirement quality checker.
 * Is a requirement "good"? Flags vague / unverifiable phrasing:
 *   - vague words ("should be secure", "good", "appropriate", "sufficiently", "as required")
 *   - no measurable basis (no number and no concrete technical term)
 * Exit code = number of weak requirements.
 * SAFE: plain text analysis; no file/network/system operation.
 */
#include <stdio.h>
#include <string.h>
#include <ctype.h>

static const char *VAGUE_PHRASES[] = {
    "should be secure", "well managed", "should be good", "properly",
    "sufficiently", "as required", "as much as possible", "should be robust", NULL
};
/* Measurability hints: a number, a unit, or a concrete standard/technical term. */
static const char *CONCRETE_TERMS[] = {
    "aes", "gcm", "sha-256", "sha256", "relro", "pie", "bit", "128", "256",
    "tls 1.3", "hmac", "pbkdf2", "ed25519", "static analysis", "checksec", NULL
};

static void to_lower(const char *s, char *out, size_t n)
{
    size_t i = 0;
    for (; s[i] && i + 1 < n; i++) out[i] = (char) tolower((unsigned char) s[i]);
    out[i] = '\0';
}
static int contains_any(const char *haystack, const char *const *list)
{
    for (int i = 0; list[i]; i++) if (strstr(haystack, list[i])) return 1;
    return 0;
}
static int has_digit(const char *h)
{
    for (; *h; h++) if (isdigit((unsigned char) *h)) return 1;
    return 0;
}

static int check_requirement(const char *requirement)
{
    char low[512];
    to_lower(requirement, low, sizeof low);
    int vague = contains_any(low, VAGUE_PHRASES);
    int measurable = has_digit(low) || contains_any(low, CONCRETE_TERMS);
    int weak = vague || !measurable;
    printf("  [%s] %s\n", weak ? "WEAK" : " OK ", requirement);
    if (weak) {
        if (vague) printf("        reason: vague phrase (not verifiable). Rewrite it as measurable/testable.\n");
        else       printf("        reason: no measurable basis (add a number or a concrete technical term).\n");
    }
    return weak;
}

int main(int argc, char **argv)
{
    printf("=== Requirement quality check ===\n");
    if (argc > 1) {
        int weak = 0;
        for (int i = 1; i < argc; i++) weak += check_requirement(argv[i]);
        printf("\n%d weak requirement(s).\n", weak);
        return weak;
    }
    const char *sample[] = {
        "The application should be secure.",
        "Keys should be well managed.",
        "The release build must be produced with a stack protector, PIE and full RELRO.",
        "Every Class C asset at rest must be encrypted with at least 128-bit AES-GCM.",
        "Data should be stored properly.",
    };
    int weak = 0, n = (int) (sizeof sample / sizeof sample[0]);
    for (int i = 0; i < n; i++) weak += check_requirement(sample[i]);
    printf("\nSummary: %d/%d requirements are WEAK. A weak requirement cannot be tested -> fix it first.\n", weak, n);
    return weak;
}
