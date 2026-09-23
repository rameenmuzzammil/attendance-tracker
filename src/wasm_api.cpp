// Thin wrapper that exposes the attendance functions to JavaScript
// when this project is compiled to WebAssembly.
#include "attendance.h"

extern "C" {

double wasm_percentage(int attended, int held) {
    return attendancePercentage(attended, held);
}

int wasm_can_miss(int attended, int held, int requiredPercent) {
    return classesYouCanMiss(attended, held, requiredPercent);
}

int wasm_need_recover(int attended, int held, int requiredPercent) {
    return classesNeededToRecover(attended, held, requiredPercent);
}

}
