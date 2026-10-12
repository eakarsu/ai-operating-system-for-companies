import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-connector-marketplace","title":"Live Connector Marketplace","description":"Prepare a professional advisory report for live connector marketplace using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfConnectorMarketplace({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
