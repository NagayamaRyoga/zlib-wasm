#include <webassembly.h>
#include <stdlib.h>
#include <memory.h>

#include <zlib.h>

#include "import.h"

#define RAW_DATA_SIZE ((uInt)2 * 1024 * 1024)

static unsigned char *make_random_bytes(uInt size) {
    unsigned char *buffer = malloc(size);

    for (uInt i = 0; i < size; i++) {
        buffer[i] = rand() >> 1;
    }

    return buffer;
}

export int run_test(void) {
    // Make a random byte sequence
    srand(0);
    unsigned char *raw_bytes = make_random_bytes(RAW_DATA_SIZE);

    int level = 9;

    // Deflate the random sequence
    uLongf deflated_size = compressBound(RAW_DATA_SIZE);
    unsigned char *deflated_bytes = malloc(deflated_size);
    compress2(deflated_bytes, &deflated_size, raw_bytes, RAW_DATA_SIZE, level);

    // Inflate the random sequence
    uLongf inflated_size = RAW_DATA_SIZE;
    unsigned char *inflated_bytes = malloc(RAW_DATA_SIZE);
    uncompress(inflated_bytes, &inflated_size, deflated_bytes, deflated_size);

    // Validation
    if (inflated_size != RAW_DATA_SIZE || memcmp(inflated_bytes, raw_bytes, RAW_DATA_SIZE) != 0) {
        return 1;
    }

    // Release the buffers
    free(deflated_bytes);
    free(raw_bytes);

    return 0;
}
