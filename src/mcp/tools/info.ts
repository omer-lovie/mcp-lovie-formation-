import { registerTool, ToolDefinition } from './index';
import { FormationSessionStore } from '../state/FormationSessionStore';
import { getResourceContent, FORMATION_RESOURCES } from '../resources/index';
import { validationError } from '../errors';

// Map friendly topic names to resource URIs
const TOPIC_MAP: Record<string, string> = {
  guide: 'formation://guide',
  pricing: 'formation://pricing',
  'company-types': 'formation://company-types',
  faq: 'formation://faq',
  requirements: 'formation://requirements',
  'incorporation-process': 'formation://incorporation-process',
};

// formation_get_info tool
export const formationGetInfoTool: ToolDefinition = {
  name: 'formation_get_info',
  description: 'Get information about Lovie formation services, pricing, company types, requirements, or FAQs. Use this to answer user questions about the formation process.',
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        enum: ['guide', 'pricing', 'company-types', 'faq', 'requirements', 'incorporation-process'],
        description: 'The topic to get information about: "guide" (step-by-step formation guide), "pricing" (Lovie pricing and Delaware fees), "company-types" (LLC vs C-Corp comparison), "faq" (frequently asked questions), "requirements" (what information is needed), "incorporation-process" (how our legal team incorporates your company)',
      },
    },
    required: ['topic'],
  },
};

const handleFormationGetInfo = async (
  args: Record<string, unknown>,
  _store: FormationSessionStore
) => {
  const topic = args.topic as string;

  const uri = TOPIC_MAP[topic];
  if (!uri) {
    const validTopics = Object.keys(TOPIC_MAP).join(', ');
    throw validationError('topic', `Invalid topic. Valid options: ${validTopics}`);
  }

  const content = getResourceContent(uri);
  if (!content) {
    throw validationError('topic', `Content not found for topic: ${topic}`);
  }

  // Find the resource metadata
  const resource = FORMATION_RESOURCES.find((r) => r.uri === uri);

  return {
    topic,
    title: resource?.name || topic,
    description: resource?.description || '',
    content,
  };
};

// formation_list_info_topics tool
export const formationListInfoTopicsTool: ToolDefinition = {
  name: 'formation_list_info_topics',
  description: 'List all available information topics that can be retrieved with formation_get_info.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

const handleFormationListInfoTopics = async (
  _args: Record<string, unknown>,
  _store: FormationSessionStore
) => {
  const topics = FORMATION_RESOURCES.map((r) => {
    const topic = Object.entries(TOPIC_MAP).find(([_, uri]) => uri === r.uri)?.[0];
    return {
      topic,
      name: r.name,
      description: r.description,
    };
  });

  return {
    topics,
    usage: 'Call formation_get_info with a topic to get detailed information.',
  };
};

// Register tools
export function registerInfoTools(): void {
  registerTool(formationGetInfoTool, handleFormationGetInfo);
  registerTool(formationListInfoTopicsTool, handleFormationListInfoTopics);
}
