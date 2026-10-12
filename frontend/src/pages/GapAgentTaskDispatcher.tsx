import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-agent-task-dispatcher","title":"Agent Task Dispatcher","description":"Prepare a professional advisory report for agent task dispatcher using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapAgentTaskDispatcher({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
