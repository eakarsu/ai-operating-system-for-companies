import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-embeddings-index","title":"Embedding Index for Semantic Recall","description":"Prepare a professional advisory report for embedding index for semantic recall using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfEmbeddingsIndex({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
