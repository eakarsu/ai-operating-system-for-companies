import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-intent-graph","title":"Org-Wide Intent Graph","description":"Prepare a professional advisory report for org-wide intent graph using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfIntentGraph({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
