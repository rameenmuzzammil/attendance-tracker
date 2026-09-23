# Attendance Tracker

A small web app that tracks attendance per subject and tells you how many classes
you can still miss (or how many you must attend) to stay above a required
percentage such as 75%.

The calculation logic is written in **C++** and compiled to **WebAssembly**, so it
runs in the browser. The page itself is plain HTML, CSS and JavaScript.

## Features
- Add subjects with classes held and classes attended
- Log a class as attended or missed with one click
- Live percentage, progress bar and a marker at the required percentage
- Tells you how many classes you can miss, or how many to attend to recover
- Adjustable required percentage (default 75%)
- Light and dark theme toggle (remembers your choice)
- Saves your data in the browser

## Project structure
```
src/          C++ logic (attendance.cpp) and WebAssembly wrapper
tests/        C++ unit tests
web/          HTML, CSS and JavaScript for the page
.github/      GitHub Actions workflow (test, build, deploy)
```

## DevOps flow
1. Push code to `main`
2. GitHub Actions compiles and runs the C++ unit tests
3. If tests pass, the C++ is built into WebAssembly
4. The site is deployed to GitHub Pages automatically
5. If a test fails, the pipeline stops and nothing is deployed

## Run the tests locally (needs a C++ compiler)
```
g++ -std=c++17 -o run_tests tests/test_attendance.cpp src/attendance.cpp
./run_tests
```
