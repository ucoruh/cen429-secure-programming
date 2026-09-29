/*
 * CEN429 - Week 9 - Demo 1: Manual obfuscation and cost measurement (COMMON INTERFACE)
 *
 * Two versions implement the same interface:
 *   grant_access(token) -> GRANTED for a valid synthetic token, DENIED otherwise.
 * clean.c      : readable, unprotected version.
 * obfuscated.c : same behavior; hand-applied flattening + opaque predicate + encoded constant.
 *
 * SAFETY: The example is entirely synthetic; it cannot harm the student's computer.
 * No file/network/system operation; it only uses its own memory/CPU time.
 */
#ifndef CEN429_W9_COMMON_H
#define CEN429_W9_COMMON_H

#define GRANTED 1
#define DENIED  0

/* Valid synthetic token (NOT a real secret): "CEN429-OK" */
int grant_access(const char *token);

#endif
