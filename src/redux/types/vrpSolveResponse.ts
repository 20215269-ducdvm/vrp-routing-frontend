import {SolutionData} from "./solutionData";

export interface VrpSolveResponse {
    problemType: string;
    status: string;
    message: string;
    solution: SolutionData | undefined;
}