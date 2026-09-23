#ifndef ATTENDANCE_H
#define ATTENDANCE_H

// Attendance percentage, e.g. 18 attended out of 20 held -> 90.0
double attendancePercentage(int attended, int held);

// How many MORE classes can be missed while staying at or above requiredPercent.
// Returns 0 if no more classes can be missed.
int classesYouCanMiss(int attended, int held, int requiredPercent);

// How many classes in a row must be attended to reach requiredPercent.
// Returns 0 if already at or above the requirement.
// Returns -1 if it can never be reached (only possible when requiredPercent is 100).
int classesNeededToRecover(int attended, int held, int requiredPercent);

#endif
