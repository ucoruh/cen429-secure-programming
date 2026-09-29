/*
 * CEN429 - Week 4 - Demo 4: libFuzzer entry point.
 * libFuzzer provides main() itself; we only write the "test one input" function. The fuzzer
 * measures code coverage and automatically mutates the input, finding a crashing input within
 * seconds.
 *
 * Build: clang -fsanitize=fuzzer,address (Linux) / cl /fsanitize=fuzzer (MSVC).
 * A run is ALWAYS time-limited (-max_total_time), so the demo never hangs.
 */
#include <stddef.h>
#include <stdint.h>
#include "parser.h"

int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size)
{
    parse_document((const unsigned char *)data, size);
    return 0;
}
