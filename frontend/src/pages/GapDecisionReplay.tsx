import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-decision-replay","title":"Decision Replay","description":"Prepare a professional advisory report for decision replay using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapDecisionReplay({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
