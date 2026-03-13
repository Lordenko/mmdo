import { SimplexSolver, SimplexProblem } from "./simplex";

const solver = new SimplexSolver();

const problem: SimplexProblem = {
    type: "max",
    objective: [1, 1],
    constraints: [
        { coefficients: [2, 1], sign: "<=", rhs: 18 },
        { coefficients: [1, 2], sign: "<=", rhs: 16 }
    ]
};

solver.solve(problem);

// console.log("\n\n╔═══════════════════════════════════════════════════════╗");
// console.log("║             ПРИКЛАД 1  (тільки <=)                   ║");
// console.log("╚═══════════════════════════════════════════════════════╝\n");

// console.log("max Z = 3x1 + 5x2");
// console.log("Обмеження:");
// console.log("  x1         <= 4");
// console.log("       2x2   <= 12");
// console.log("  3x1 + 2x2  <= 18");
// console.log("  x1, x2 >= 0\n");

// const problem1: SimplexProblem = {
//     type: "max",
//     objective: [3, 5],
//     constraints: [
//         { coefficients: [1, 0], sign: "<=", rhs: 4 },
//         { coefficients: [0, 2], sign: "<=", rhs: 12 },
//         { coefficients: [3, 2], sign: "<=", rhs: 18 },
//     ],
// };

// solver.solve(problem1);

// console.log("\n\n╔═══════════════════════════════════════════════════════╗");
// console.log("║             ПРИКЛАД 2  (тільки <=)                   ║");
// console.log("╚═══════════════════════════════════════════════════════╝\n");

// console.log("max Z = 2x1 + 3x2");
// console.log("Обмеження:");
// console.log("  x1 + 2x2  <= 6");
// console.log("  2x1 + x2  <= 8");
// console.log("  x1, x2 >= 0\n");

// const problem2: SimplexProblem = {
//     type: "max",
//     objective: [2, 3],
//     constraints: [
//         { coefficients: [1, 2], sign: "<=", rhs: 6 },
//         { coefficients: [2, 1], sign: "<=", rhs: 8 },
//     ],
// };

// const solver2 = new SimplexSolver();
// solver2.solve(problem2);

// console.log("\n\n╔═══════════════════════════════════════════════════════╗");
// console.log("║    ПРИКЛАД 3  (мінімізація, обмеження >=)            ║");
// console.log("╚═══════════════════════════════════════════════════════╝\n");

// console.log("min Z = 2x1 + 3x2");
// console.log("Обмеження:");
// console.log("  x1 + x2   >= 4");
// console.log("  2x1 + 3x2 >= 6");
// console.log("  x1, x2 >= 0\n");

// const problem3: SimplexProblem = {
//     type: "min",
//     objective: [2, 3],
//     constraints: [
//         { coefficients: [1, 1], sign: ">=", rhs: 4 },
//         { coefficients: [2, 3], sign: ">=", rhs: 6 },
//     ],
// };

// const solver3 = new SimplexSolver();
// solver3.solve(problem3);

// console.log("\n\n╔═══════════════════════════════════════════════════════╗");
// console.log("║             ПРИКЛАД 4  (max, <=)                     ║");
// console.log("╚═══════════════════════════════════════════════════════╝\n");

// console.log("max Z = 5x1 + 4x2");
// console.log("Обмеження:");
// console.log("  6x1 + 4x2  <= 24");
// console.log("  x1  + 2x2  <= 6");
// console.log("  x1, x2 >= 0\n");

// const problem4: SimplexProblem = {
//     type: "max",
//     objective: [5, 4],
//     constraints: [
//         { coefficients: [6, 4], sign: "<=", rhs: 24 },
//         { coefficients: [1, 2], sign: "<=", rhs: 6 },
//     ],
// };

// solver4.solve(problem4);
