#pragma once

#include <sys/types.h>

#define O_RDONLY 0
#define O_WRONLY 1
#define O_CREAT  64
#define O_TRUNC  512
#define O_APPEND 1024

int open(const char *, int, ...);
int close(int);
ssize_t write(int, const void *, size_t);
ssize_t read(int, void *, size_t);
