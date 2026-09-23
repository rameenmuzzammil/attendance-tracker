#include <iostream>
#include "../src/attendance.h"

int failures = 0;

void checkInt(const char* name, int actual, int expected) {
    if (actual == expected) {
        std::cout << "PASS: " << name << "\n";
    } else {
        std::cout << "FAIL: " << name << " (expected " << expected
                  << ", got " << actual << ")\n";
        failures = failures + 1;
    }
}

void checkPercent(const char* name, double actual, double expected) {
    double difference = actual - expected;
    if (difference < 0) {
        difference = -difference;
    }
    if (difference < 0.001) {
        std::cout << "PASS: " << name << "\n";
    } else {
        std::cout << "FAIL: " << name << " (expected " << expected
                  << ", got " << actual << ")\n";
        failures = failures + 1;
    }
}

int main() {
    // Percentage
    checkPercent("18 of 20 is 90%", attendancePercentage(18, 20), 90.0);
    checkPercent("15 of 20 is 75%", attendancePercentage(15, 20), 75.0);
    checkPercent("no classes held is 0%", attendancePercentage(0, 0), 0.0);

    // Classes you can still miss (75% rule)
    checkInt("15 of 18 can miss 2", classesYouCanMiss(15, 18, 75), 2);
    checkInt("18 of 20 can miss 4", classesYouCanMiss(18, 20, 75), 4);
    checkInt("exactly 75% can miss 0", classesYouCanMiss(15, 20, 75), 0);
    checkInt("below 75% can miss 0", classesYouCanMiss(10, 20, 75), 0);

    // Classes needed to recover (75% rule)
    checkInt("12 of 20 needs 12", classesNeededToRecover(12, 20, 75), 12);
    checkInt("10 of 20 needs 20", classesNeededToRecover(10, 20, 75), 20);
    checkInt("already above needs 0", classesNeededToRecover(18, 20, 75), 0);
    checkInt("100% required, missed one", classesNeededToRecover(9, 10, 100), -1);

    // Extra safety check: missing exactly "canMiss" classes keeps us at 75%+,
    // but missing one more does not.
    for (int held = 1; held <= 40; held++) {
        for (int attended = 0; attended <= held; attended++) {
            int canMiss = classesYouCanMiss(attended, held, 75);
            bool stillOk = attended * 100 >= 75 * (held + canMiss);
            bool oneMoreFails = attended * 100 < 75 * (held + canMiss + 1);
            if (canMiss > 0 && !stillOk) {
                std::cout << "FAIL: loop check A at " << attended << "/" << held << "\n";
                failures = failures + 1;
            }
            if (!oneMoreFails) {
                std::cout << "FAIL: loop check B at " << attended << "/" << held << "\n";
                failures = failures + 1;
            }
        }
    }
    std::cout << "Loop checks finished\n";

    if (failures > 0) {
        std::cout << failures << " test(s) failed\n";
        return 1;
    }
    std::cout << "All tests passed\n";
    return 0;
}
