export type ConstraintSign = "<=" | ">=" | "=";
export type ObjectiveType = "max" | "min";

export interface Constraint {
    coefficients: number[];
    sign: ConstraintSign;
    rhs: number;
}

export interface SimplexProblem {
    type: ObjectiveType;
    objective: number[];
    constraints: Constraint[];
}

export interface SimplexResult {
    feasible: boolean;
    unbounded: boolean;
    objectiveValue: number;
    variables: number[];
    iterations: number;
}

const BIG_M = 1e6;
const EPS = 1e-9;

function round(v: number, decimals = 6): number {
    const f = Math.pow(10, decimals);
    return Math.round(v * f) / f;
}

export class SimplexSolver {
    private numOriginalVars: number = 0;
    private numSlack: number = 0;
    private numArtificial: number = 0;
    private totalVars: number = 0;

    private tableau: number[][] = [];
    private basis: number[] = [];
    private varNames: string[] = [];

    private isMin: boolean = false;
    private artificialIndices: number[] = [];

    solve(problem: SimplexProblem): SimplexResult {
        this.isMin = problem.type === "min";
        this.numOriginalVars = problem.objective.length;

        this.numSlack = 0;
        this.numArtificial = 0;
        const constraintsNormalized = problem.constraints.map((c) => {
            let coeffs = [...c.coefficients];
            let rhs = c.rhs;
            let sign = c.sign;
            if (rhs < 0) {
                coeffs = coeffs.map((v) => -v);
                rhs = -rhs;
                if (sign === "<=") sign = ">=";
                else if (sign === ">=") sign = "<=";
            }
            return { coefficients: coeffs, sign, rhs };
        });

        for (const c of constraintsNormalized) {
            if (c.sign === "<=") {
                this.numSlack++;
            } else if (c.sign === ">=") {
                this.numSlack++;
                this.numArtificial++;
            } else {
                this.numArtificial++;
            }
        }

        this.totalVars =
            this.numOriginalVars + this.numSlack + this.numArtificial;

        this.varNames = [];
        for (let i = 1; i <= this.numOriginalVars; i++) this.varNames.push(`x${i}`);
        for (let i = 1; i <= this.numSlack; i++) this.varNames.push(`s${i}`);
        for (let i = 1; i <= this.numArtificial; i++) this.varNames.push(`a${i}`);

        const m = constraintsNormalized.length;
        this.tableau = [];
        this.basis = [];
        this.artificialIndices = [];

        let slackIdx = this.numOriginalVars;
        let artIdx = this.numOriginalVars + this.numSlack;

        for (let i = 0; i < m; i++) {
            const row = new Array(this.totalVars + 1).fill(0);
            const c = constraintsNormalized[i];

            for (let j = 0; j < this.numOriginalVars; j++) {
                row[j] = c.coefficients[j] ?? 0;
            }

            if (c.sign === "<=") {
                row[slackIdx] = 1;
                this.basis.push(slackIdx);
                slackIdx++;
            } else if (c.sign === ">=") {
                row[slackIdx] = -1;
                slackIdx++;
                row[artIdx] = 1;
                this.basis.push(artIdx);
                this.artificialIndices.push(artIdx);
                artIdx++;
            } else {
                row[artIdx] = 1;
                this.basis.push(artIdx);
                this.artificialIndices.push(artIdx);
                artIdx++;
            }

            row[this.totalVars] = c.rhs;

            this.tableau.push(row);
        }

        const zRow = new Array(this.totalVars + 1).fill(0);
        for (let j = 0; j < this.numOriginalVars; j++) {
            zRow[j] = this.isMin ? problem.objective[j] : -problem.objective[j];
        }
        for (const ai of this.artificialIndices) {
            zRow[ai] = BIG_M;
        }
        this.tableau.push(zRow);

        for (let i = 0; i < m; i++) {
            if (this.artificialIndices.includes(this.basis[i])) {
                for (let j = 0; j <= this.totalVars; j++) {
                    this.tableau[m][j] -= BIG_M * this.tableau[i][j];
                }
            }
        }

        console.log("═══════════════════════════════════════════════════════════");
        console.log("  МЕТОД СИМПЛЕКС-ТАБЛИЦЬ");
        console.log("═══════════════════════════════════════════════════════════");
        console.log(`\nТип задачі: ${problem.type === "max" ? "МАКСИМІЗАЦІЯ" : "МІНІМІЗАЦІЯ"}`);
        console.log(`Кількість змінних: ${this.numOriginalVars}`);
        console.log(`Кількість обмежень: ${m}`);
        console.log(`Баланcові змінні: ${this.numSlack}`);
        console.log(`Штучні змінні: ${this.numArtificial}`);

        let iterations = 0;
        const MAX_ITER = 100;

        console.log(`\n── Початкова симплекс-таблиця ──`);
        this.printTableau();

        while (iterations < MAX_ITER) {
            const pivotCol = this.findPivotColumn();
            if (pivotCol === -1) {
                break;
            }

            const pivotRow = this.findPivotRow(pivotCol);
            if (pivotRow === -1) {
                console.log("\n⚠ Цільова функція НЕОБМЕЖЕНА.");
                return {
                    feasible: false,
                    unbounded: true,
                    objectiveValue: NaN,
                    variables: [],
                    iterations,
                };
            }

            iterations++;
            const pivotElement = this.tableau[pivotRow][pivotCol];
            console.log(
                `\n── Ітерація ${iterations}: ведучий елемент [${this.varNames[this.basis[pivotRow]]} → ${this.varNames[pivotCol]}] = ${round(pivotElement)} ──`
            );

            this.pivot(pivotRow, pivotCol);

            this.basis[pivotRow] = pivotCol;

            this.printTableau();
        }

        const zRowFinal = this.tableau[m];
        let objectiveValue = zRowFinal[this.totalVars];

        for (const ai of this.artificialIndices) {
            const basisRowIdx = this.basis.indexOf(ai);
            if (basisRowIdx !== -1) {
                const val = this.tableau[basisRowIdx][this.totalVars];
                if (Math.abs(val) > EPS) {
                    console.log("\n⚠ Задача НЕ МАЄ ДОПУСТИМОГО розв'язку (штучна змінна залишилась у базисі з ненульовим значенням).");
                    return {
                        feasible: false,
                        unbounded: false,
                        objectiveValue: NaN,
                        variables: [],
                        iterations,
                    };
                }
            }
        }

        const variables: number[] = new Array(this.numOriginalVars).fill(0);
        for (let i = 0; i < m; i++) {
            const bVar = this.basis[i];
            if (bVar < this.numOriginalVars) {
                variables[bVar] = round(this.tableau[i][this.totalVars]);
            }
        }

        objectiveValue = round(this.isMin ? -objectiveValue : objectiveValue);

        console.log("\n═══════════════════════════════════════════════════════════");
        console.log("  РЕЗУЛЬТАТ");
        console.log("═══════════════════════════════════════════════════════════");
        console.log(`\nОптимальне значення ЦФ: Z = ${objectiveValue}`);
        console.log("Значення змінних:");
        for (let i = 0; i < this.numOriginalVars; i++) {
            console.log(`  x${i + 1} = ${variables[i]}`);
        }
        console.log(`Кількість ітерацій: ${iterations}`);

        return {
            feasible: true,
            unbounded: false,
            objectiveValue,
            variables,
            iterations,
        };
    }

    private findPivotColumn(): number {
        const zRow = this.tableau[this.tableau.length - 1];
        let minVal = -EPS;
        let minIdx = -1;
        for (let j = 0; j < this.totalVars; j++) {
            if (zRow[j] < minVal) {
                minVal = zRow[j];
                minIdx = j;
            }
        }
        return minIdx;
    }

    private findPivotRow(pivotCol: number): number {
        const m = this.tableau.length - 1;
        let minRatio = Infinity;
        let minRow = -1;

        for (let i = 0; i < m; i++) {
            const elem = this.tableau[i][pivotCol];
            if (elem > EPS) {
                const ratio = this.tableau[i][this.totalVars] / elem;
                if (ratio < minRatio - EPS) {
                    minRatio = ratio;
                    minRow = i;
                }
            }
        }
        return minRow;
    }

    private pivot(pivotRow: number, pivotCol: number): void {
        const rows = this.tableau.length;
        const cols = this.totalVars + 1;
        const pivotVal = this.tableau[pivotRow][pivotCol];

        for (let j = 0; j < cols; j++) {
            this.tableau[pivotRow][j] /= pivotVal;
        }

        for (let i = 0; i < rows; i++) {
            if (i === pivotRow) continue;
            const factor = this.tableau[i][pivotCol];
            if (Math.abs(factor) < EPS) continue;
            for (let j = 0; j < cols; j++) {
                this.tableau[i][j] -= factor * this.tableau[pivotRow][j];
            }
        }
    }

    private printTableau(): void {
        const m = this.tableau.length - 1;
        const colWidth = 10;

        let header = "Базис".padEnd(8) + "│";
        for (let j = 0; j < this.totalVars; j++) {
            header += this.varNames[j].padStart(colWidth);
        }
        header += "│" + "  RHS".padStart(colWidth);
        console.log("─".repeat(header.length));
        console.log(header);
        console.log("─".repeat(header.length));

        for (let i = 0; i < m; i++) {
            let line = this.varNames[this.basis[i]].padEnd(8) + "│";
            for (let j = 0; j < this.totalVars; j++) {
                line += formatNum(this.tableau[i][j]).padStart(colWidth);
            }
            line += "│" + formatNum(this.tableau[i][this.totalVars]).padStart(colWidth);
            console.log(line);
        }

        console.log("─".repeat(header.length));
        let zLine = "Z".padEnd(8) + "│";
        for (let j = 0; j < this.totalVars; j++) {
            zLine += formatNum(this.tableau[m][j]).padStart(colWidth);
        }
        zLine += "│" + formatNum(this.tableau[m][this.totalVars]).padStart(colWidth);
        console.log(zLine);
        console.log("─".repeat(header.length));
    }
}

function formatNum(v: number): string {
    const r = round(v, 4);
    if (Math.abs(r) < 1e-9) return "0";
    if (Number.isInteger(r)) return r.toString();
    return r.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}
