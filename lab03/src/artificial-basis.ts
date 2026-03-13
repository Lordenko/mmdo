export type ConstraintSign = "<=" | ">=" | "=";
export type ObjectiveType = "max" | "min";

export interface Constraint {
    coefficients: number[];
    sign: ConstraintSign;
    rhs: number;
}

export interface LPProblem {
    type: ObjectiveType;
    objective: number[];
    constraints: Constraint[];
}

export interface LPResult {
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

function formatNum(v: number): string {
    const r = round(v, 4);
    if (Math.abs(r) < 1e-9) return "0";
    if (Number.isInteger(r)) return r.toString();
    return r.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

export class ArtificialBasisSolver {
    private numOriginalVars: number = 0;
    private numSlack: number = 0;
    private numArtificial: number = 0;
    private totalVars: number = 0;

    private tableau: number[][] = [];
    private basis: number[] = [];
    private basisCost: number[] = [];
    private varNames: string[] = [];
    private costs: number[] = [];

    private isMin: boolean = false;
    private artificialIndices: number[] = [];

    solve(problem: LPProblem): LPResult {
        this.isMin = problem.type === "min";
        this.numOriginalVars = problem.objective.length;

        this.numSlack = 0;
        this.numArtificial = 0;

        const constraintsNorm = problem.constraints.map((c) => {
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

        for (const c of constraintsNorm) {
            if (c.sign === "<=") {
                this.numSlack++;
            } else if (c.sign === ">=") {
                this.numSlack++;
                this.numArtificial++;
            } else {
                this.numArtificial++;
            }
        }

        this.totalVars = this.numOriginalVars + this.numSlack + this.numArtificial;

        this.varNames = [];
        for (let i = 1; i <= this.numOriginalVars; i++) this.varNames.push(`x${i}`);
        for (let i = 1; i <= this.numSlack; i++) this.varNames.push(`x${this.numOriginalVars + i}`);
        for (let i = 1; i <= this.numArtificial; i++) this.varNames.push(`x${this.numOriginalVars + this.numSlack + i}`);

        this.costs = new Array(this.totalVars).fill(0);
        for (let j = 0; j < this.numOriginalVars; j++) {
            this.costs[j] = this.isMin ? -problem.objective[j] : problem.objective[j];
        }

        const artStart = this.numOriginalVars + this.numSlack;
        for (let i = 0; i < this.numArtificial; i++) {
            this.costs[artStart + i] = -BIG_M;
        }

        const m = constraintsNorm.length;
        this.tableau = [];
        this.basis = [];
        this.basisCost = [];
        this.artificialIndices = [];

        let slackIdx = this.numOriginalVars;
        let artIdx = this.numOriginalVars + this.numSlack;

        for (let i = 0; i < m; i++) {
            const row = new Array(this.totalVars + 1).fill(0);
            const c = constraintsNorm[i];

            for (let j = 0; j < this.numOriginalVars; j++) {
                row[j] = c.coefficients[j] ?? 0;
            }

            if (c.sign === "<=") {
                row[slackIdx] = 1;
                this.basis.push(slackIdx);
                this.basisCost.push(0);
                slackIdx++;
            } else if (c.sign === ">=") {
                row[slackIdx] = -1;
                slackIdx++;
                row[artIdx] = 1;
                this.basis.push(artIdx);
                this.basisCost.push(-BIG_M);
                this.artificialIndices.push(artIdx);
                artIdx++;
            } else {
                row[artIdx] = 1;
                this.basis.push(artIdx);
                this.basisCost.push(-BIG_M);
                this.artificialIndices.push(artIdx);
                artIdx++;
            }

            row[this.totalVars] = c.rhs;
            this.tableau.push(row);
        }

        console.log("═══════════════════════════════════════════════════════════");
        console.log("  МЕТОД ШТУЧНОГО БАЗИСУ (Big-M)");
        console.log("═══════════════════════════════════════════════════════════");
        console.log(`\nТип задачі: ${problem.type === "max" ? "МАКСИМІЗАЦІЯ" : "МІНІМІЗАЦІЯ"}`);
        console.log(`Кількість змінних: ${this.numOriginalVars}`);
        console.log(`Кількість обмежень: ${m}`);
        console.log(`Балансові змінні: ${this.numSlack}`);
        console.log(`Штучні змінні: ${this.numArtificial}`);

        if (this.isMin) {
            console.log(`\nПерехід: F' = -F → max`);
        }

        console.log(`\nКоефіцієнти ЦФ (для max): [${this.costs.map(c => {
            if (Math.abs(c + BIG_M) < EPS) return "-M";
            return formatNum(c);
        }).join(", ")}]`);

        console.log(`\n── Початкова симплекс-таблиця ──`);
        this.printTableau();

        let iterations = 0;
        const MAX_ITER = 100;

        while (iterations < MAX_ITER) {
            const delta = this.computeDelta();

            let pivotCol = -1;
            let minDelta = -EPS;
            for (let j = 0; j < this.totalVars; j++) {
                if (delta[j] < minDelta) {
                    minDelta = delta[j];
                    pivotCol = j;
                }
            }

            if (pivotCol === -1) {
                break;
            }

            let pivotRow = -1;
            let minRatio = Infinity;
            for (let i = 0; i < m; i++) {
                const elem = this.tableau[i][pivotCol];
                if (elem > EPS) {
                    const ratio = this.tableau[i][this.totalVars] / elem;
                    if (ratio < minRatio - EPS) {
                        minRatio = ratio;
                        pivotRow = i;
                    }
                }
            }

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
                `\n── Ітерація ${iterations}: ведучий стовпець = ${this.varNames[pivotCol]}, ведучий рядок = ${this.varNames[this.basis[pivotRow]]}, ведучий елемент = ${formatNum(pivotElement)} ──`
            );

            this.pivot(pivotRow, pivotCol);

            this.basis[pivotRow] = pivotCol;
            this.basisCost[pivotRow] = this.costs[pivotCol];

            this.printTableau();
        }

        for (const ai of this.artificialIndices) {
            const basisRow = this.basis.indexOf(ai);
            if (basisRow !== -1) {
                const val = this.tableau[basisRow][this.totalVars];
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

        let objectiveValue = 0;
        for (let i = 0; i < this.numOriginalVars; i++) {
            objectiveValue += problem.objective[i] * variables[i];
        }
        objectiveValue = round(objectiveValue);

        console.log("\n═══════════════════════════════════════════════════════════");
        console.log("  РЕЗУЛЬТАТ");
        console.log("═══════════════════════════════════════════════════════════");
        console.log(`\nОптимальне значення ЦФ: F = ${objectiveValue}`);
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

    /**
     * Обчислення оцінок індексного рядка:
     * Δⱼ = Σ(c_Bi * a_ij) - c_j
     */
    private computeDelta(): number[] {
        const m = this.tableau.length;
        const delta = new Array(this.totalVars + 1).fill(0);

        for (let j = 0; j <= this.totalVars; j++) {
            let sum = 0;
            for (let i = 0; i < m; i++) {
                sum += this.basisCost[i] * this.tableau[i][j];
            }
            if (j < this.totalVars) {
                delta[j] = sum - this.costs[j];
            } else {
                delta[j] = sum; // Δ₀ = Σ(c_Bi * b_i) — значення ЦФ
            }
        }

        return delta;
    }

    /** Крок Жордана-Гауса */
    private pivot(pivotRow: number, pivotCol: number): void {
        const rows = this.tableau.length;
        const cols = this.totalVars + 1;
        const pivotVal = this.tableau[pivotRow][pivotCol];

        // Ділимо ведучий рядок на ведучий елемент
        for (let j = 0; j < cols; j++) {
            this.tableau[pivotRow][j] /= pivotVal;
        }

        // Зануляємо ведучий стовпець в інших рядках
        for (let i = 0; i < rows; i++) {
            if (i === pivotRow) continue;
            const factor = this.tableau[i][pivotCol];
            if (Math.abs(factor) < EPS) continue;
            for (let j = 0; j < cols; j++) {
                this.tableau[i][j] -= factor * this.tableau[pivotRow][j];
            }
        }
    }

    /** Красивий вивід симплекс-таблиці */
    private printTableau(): void {
        const m = this.tableau.length;
        const colWidth = 10;

        const delta = this.computeDelta();

        // Заголовок: C_B | Базис | A0 | A1 | ... | An
        let header = "C_B".padEnd(7) + "Базис".padEnd(7) + "│";
        header += "A0".padStart(colWidth) + "│";
        for (let j = 0; j < this.totalVars; j++) {
            header += this.varNames[j].padStart(colWidth);
        }
        const lineLen = header.length;
        console.log("─".repeat(lineLen));

        // Рядок з коефіцієнтами ЦФ
        let costHeader = "".padEnd(7) + "".padEnd(7) + "│";
        costHeader += "–".padStart(colWidth) + "│";
        for (let j = 0; j < this.totalVars; j++) {
            const c = this.costs[j];
            let cs: string;
            if (Math.abs(c + BIG_M) < EPS) cs = "-M";
            else cs = formatNum(c);
            costHeader += cs.padStart(colWidth);
        }
        console.log(costHeader);
        console.log("─".repeat(lineLen));
        console.log(header);
        console.log("─".repeat(lineLen));

        // Рядки таблиці
        for (let i = 0; i < m; i++) {
            // C_B
            let cbStr: string;
            if (Math.abs(this.basisCost[i] + BIG_M) < EPS) cbStr = "-M";
            else cbStr = formatNum(this.basisCost[i]);

            let line = cbStr.padEnd(7) + this.varNames[this.basis[i]].padEnd(7) + "│";
            // A0 (RHS)
            line += formatNum(this.tableau[i][this.totalVars]).padStart(colWidth) + "│";
            for (let j = 0; j < this.totalVars; j++) {
                line += formatNum(this.tableau[i][j]).padStart(colWidth);
            }
            console.log(line);
        }

        // Індексний рядок (Δ)
        console.log("─".repeat(lineLen));
        let deltaLine = "".padEnd(7) + "Δ".padEnd(7) + "│";
        deltaLine += formatNum(delta[this.totalVars]).padStart(colWidth) + "│";
        for (let j = 0; j < this.totalVars; j++) {
            deltaLine += formatNum(delta[j]).padStart(colWidth);
        }
        console.log(deltaLine);
        console.log("─".repeat(lineLen));
    }
}
