/*
 * CEN429 - Week 4 - Demo 4: interface of the small document parser.
 * The same interface is implemented by both the buggy (parser.c) and the fixed
 * (parser_secure.c) version, so the reproducer (replay.c) and the fuzzer (fuzz.c) can test
 * either version from a single source.
 *
 * Return value: >=0 the parse result, <0 invalid/rejected input.
 */
#ifndef CEN429_PARSER_H
#define CEN429_PARSER_H

#include <stddef.h>

int parse_document(const unsigned char *data, size_t n);

#endif
