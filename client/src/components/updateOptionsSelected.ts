import { EnrollmentChartState } from "./types";

export default function updateOptionsSelected(options: Partial<{ subject: string, code: string, component: string }>,
    state: EnrollmentChartState) {
    let newSubject = options.subject ?? state.chartSubjectSelected;
    let newCode = options.code ?? state.chartCodeSelected;
    let newComponent = options.component ?? state.chartComponentSelected;

    const newCodes = state.courseOptions.get(newSubject) ?? new Map<string, string[]>();
    if(!newCodes.get(newCode)) newCode = newCodes.entries().next().value[0];

    const newComponents = (state.courseOptions.get(newSubject) ?? new Map<string, string[]>()).get(newCode) ?? [];
    if(!newComponents.includes(newComponent)) newComponent = newComponents[0];

    state.setChartSubjectSelected(newSubject);
    state.setChartCodeSelected(newCode);
    state.setChartComponentSelected(newComponent);
};
