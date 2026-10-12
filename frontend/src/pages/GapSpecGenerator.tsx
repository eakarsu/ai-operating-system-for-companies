import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-spec-generator","title":"Spec Generator","description":"Prepare a professional advisory report for spec generator using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapSpecGenerator({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
