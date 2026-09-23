#include "attendance.h"

double attendancePercentage(int attended, int held) {
    if (held <= 0) {
        return 0.0;
    }
    return (attended * 100.0) / held;
}

int classesYouCanMiss(int attended, int held, int requiredPercent) {
    if (requiredPercent <= 0) {
        return 0;
    }

    // Total classes we could hold while still meeting the requirement:
    //   attended / (held + missed) >= required / 100
    //   held + missed <= attended * 100 / required
    int maxTotalClasses = (attended * 100) / requiredPercent;
    int canMiss = maxTotalClasses - held;

    if (canMiss < 0) {
        return 0;
    }
    return canMiss;
}

int classesNeededToRecover(int attended, int held, int requiredPercent) {
    // Already meeting the requirement? Nothing to recover.
    if (attended * 100 >= requiredPercent * held) {
        return 0;
    }

    // 100% can never be reached again after a missed class.
    if (requiredPercent >= 100) {
        return -1;
    }

    // Attending "n" more classes in a row:
    //   (attended + n) / (held + n) >= required / 100
    //   n >= (required * held - 100 * attended) / (100 - required)
    int top = requiredPercent * held - 100 * attended;
    int bottom = 100 - requiredPercent;

    // Round up: a partial class still means one more class.
    int needed = top / bottom;
    if (top % bottom != 0) {
        needed = needed + 1;
    }
    return needed;
}
