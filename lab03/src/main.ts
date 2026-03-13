import { ArtificialBasisSolver, LPProblem } from "./artificial-basis";

const solver = new ArtificialBasisSolver();
const problem: LPProblem = {
    type: "max",
    objective: [2, 2],
    constraints: [
        { coefficients: [3, -2], sign: ">=", rhs: -6 },
        { coefficients: [1, 1], sign: ">=", rhs: 3 },
        { coefficients: [1, 0], sign: "<=", rhs: 3 },
        { coefficients: [0, 1], sign: "<=", rhs: 5 },
    ],
};
solver.solve(problem);

// // ═══════════════════════════════════════════════════════════
// //  ПРИКЛАД 1 — з методички (розділ 3.1)
// //  F(x1, x2) = 5x1 + 30x2 → min
// //  x1 + 2x2 ≥ 50
// //  x2 ≥ 5
// //  5x1 + 2x2 ≥ 150
// //  x1, x2 ≥ 0
// //
// //  Очікуваний результат: x1 = 40, x2 = 5, Fmin = 350
// // ═══════════════════════════════════════════════════════════

// console.log("╔═══════════════════════════════════════════════════════╗");
// console.log("║  ПРИКЛАД 1 — Задача з методички                      ║");
// console.log("╚═══════════════════════════════════════════════════════╝\n");

// console.log("min F = 5x₁ + 30x₂");
// console.log("Обмеження:");
// console.log("  x₁ + 2x₂  ≥ 50");
// console.log("       x₂   ≥ 5");
// console.log("  5x₁ + 2x₂ ≥ 150");
// console.log("  x₁, x₂ ≥ 0\n");

// const solver1 = new ArtificialBasisSolver();
// const problem1: LPProblem = {
//     type: "min",
//     objective: [5, 30],
//     constraints: [
//         { coefficients: [1, 2], sign: ">=", rhs: 50 },
//         { coefficients: [0, 1], sign: ">=", rhs: 5 },
//         { coefficients: [5, 2], sign: ">=", rhs: 150 },
//     ],
// };
// solver1.solve(problem1);

// // ═══════════════════════════════════════════════════════════
// //  ПРИКЛАД 2 — змішані обмеження (<=, >=, =)
// //  F(x1, x2) = 2x1 + x2 → max
// //  x1 + x2 <= 10
// //  x1 + 2x2 >= 6
// //  x1 - x2 = 2
// //  x1, x2 >= 0
// //
// //  Очікуваний результат: x1 = 6, x2 = 4, Fmax = 16
// // ═══════════════════════════════════════════════════════════

// console.log("\n\n╔═══════════════════════════════════════════════════════╗");
// console.log("║  ПРИКЛАД 2 — Змішані обмеження (<=, >=, =)           ║");
// console.log("╚═══════════════════════════════════════════════════════╝\n");

// console.log("max F = 2x₁ + x₂");
// console.log("Обмеження:");
// console.log("  x₁ + x₂   ≤ 10");
// console.log("  x₁ + 2x₂  ≥ 6");
// console.log("  x₁ - x₂   = 2");
// console.log("  x₁, x₂ ≥ 0\n");

// const solver2 = new ArtificialBasisSolver();
// const problem2: LPProblem = {
//     type: "max",
//     objective: [2, 1],
//     constraints: [
//         { coefficients: [1, 1], sign: "<=", rhs: 10 },
//         { coefficients: [1, 2], sign: ">=", rhs: 6 },
//         { coefficients: [1, -1], sign: "=", rhs: 2 },
//     ],
// };
// solver2.solve(problem2);

// // ═══════════════════════════════════════════════════════════
// //  ПРИКЛАД 3 — задача мінімізації з >=
// //  F(x1, x2) = 2x1 + 3x2 → min
// //  x1 + x2 >= 4
// //  2x1 + 3x2 >= 6
// //  x1, x2 >= 0
// //
// //  Очікуваний результат: x1 = 4, x2 = 0, Fmin = 8
// // ═══════════════════════════════════════════════════════════

// console.log("\n\n╔═══════════════════════════════════════════════════════╗");
// console.log("║  ПРИКЛАД 3 — Мінімізація з >= обмеженнями            ║");
// console.log("╚═══════════════════════════════════════════════════════╝\n");

// console.log("min F = 2x₁ + 3x₂");
// console.log("Обмеження:");
// console.log("  x₁ + x₂   ≥ 4");
// console.log("  2x₁ + 3x₂ ≥ 6");
// console.log("  x₁, x₂ ≥ 0\n");

// const solver3 = new ArtificialBasisSolver();
// const problem3: LPProblem = {
//     type: "min",
//     objective: [2, 3],
//     constraints: [
//         { coefficients: [1, 1], sign: ">=", rhs: 4 },
//         { coefficients: [2, 3], sign: ">=", rhs: 6 },
//     ],
// };
// solver3.solve(problem3);

// // ═══════════════════════════════════════════════════════════
// //  ПРИКЛАД 4 — тільки <= (класичний симплекс, без штучних)
// //  F(x1, x2) = 3x1 + 5x2 → max
// //  x1 <= 4
// //  2x2 <= 12
// //  3x1 + 2x2 <= 18
// //  x1, x2 >= 0
// //
// //  Очікуваний результат: x1 = 2, x2 = 6, Fmax = 36
// // ═══════════════════════════════════════════════════════════

// console.log("\n\n╔═══════════════════════════════════════════════════════╗");
// console.log("║  ПРИКЛАД 4 — Тільки <= (без штучних змінних)         ║");
// console.log("╚═══════════════════════════════════════════════════════╝\n");

// console.log("max F = 3x₁ + 5x₂");
// console.log("Обмеження:");
// console.log("  x₁         ≤ 4");
// console.log("       2x₂   ≤ 12");
// console.log("  3x₁ + 2x₂  ≤ 18");
// console.log("  x₁, x₂ ≥ 0\n");

// const solver4 = new ArtificialBasisSolver();
// const problem4: LPProblem = {
//     type: "max",
//     objective: [3, 5],
//     constraints: [
//         { coefficients: [1, 0], sign: "<=", rhs: 4 },
//         { coefficients: [0, 2], sign: "<=", rhs: 12 },
//         { coefficients: [3, 2], sign: "<=", rhs: 18 },
//     ],
// };
// solver4.solve(problem4);
