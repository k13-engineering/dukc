#include "duktape.h"
#include <stdio.h>

int main(int argc, char *argv[]) {
  if(argc < 3) {
    fprintf(stderr, "invalid arguments\n");
    return -1;
  }
  
  duk_context *ctx = duk_create_heap_default();
  if (!ctx) {
    fprintf(stderr, "failed to create head\n");
    return -1;  
  }
  
  printf("argv[1] = %s\n", argv[1]);
  fflush(stdout);
  
  FILE* in = fopen(argv[1], "r");
  if(!in) {
    fprintf(stderr, "failed to open input file\n");
    return -1;
  }
  fseek(in, 0, SEEK_END);
  size_t inputSize = ftell(in);
  printf("inputSize = %i\n", inputSize);
  fflush(stdout);
  uint8_t* inputBuffer = malloc(inputSize + 1);
  fseek(in, 0, SEEK_SET);
  fread(inputBuffer, inputSize, 1, in);
  fclose(in);
  inputBuffer[inputSize] = '\0';
  
  duk_compile_string(ctx, DUK_COMPILE_EVAL, inputBuffer);
  duk_dump_function(ctx);
  
  free(inputBuffer);
  
  duk_size_t count;
  void* data;
  data = duk_get_buffer(ctx, 0, &count);
  
  FILE* out = fopen(argv[2], "w");
  if(!out) {
    fprintf(stderr, "failed to open output file\n");
    return -1;
  }
  fwrite(data, count, 1, out);
  fclose(out);
    
  return 0;
}
