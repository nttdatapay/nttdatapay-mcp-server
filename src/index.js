#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const docsPath = join(__dirname, '..', 'docs', 'payment-api-guides');

const server = new Server(
  {
    name: "payment-knowledge-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
      resources: {},  // Enable resource functionality
    },
  }
);

// Resource list definition
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  console.error("ListResources called");
  return {
    resources: [
      {
        uri: "payment://docs/flow",
        name: "Payment Processing Flow",
        description: "Detailed payment processing workflow and implementation guide",
        mimeType: "text/markdown"
      },
      {
        uri: "payment://docs/api-spec",
        name: "API Specification", 
        description: "Complete payment API specification and endpoint documentation",
        mimeType: "text/markdown"
      },
      {
        uri: "payment://docs/encryption",
        name: "Encryption Specification",
        description: "Payment data encryption requirements and security protocols",
        mimeType: "text/markdown"
      },
      {
        uri: "payment://docs/signature",
        name: "Signature Implementation Guide",
        description: "Payment request signature implementation and validation guide",
        mimeType: "text/markdown"
      },
      {
        uri: "payment://docs/error-codes",
        name: "Error Codes Reference",
        description: "Payment error codes, troubleshooting, and resolution guide",
        mimeType: "text/markdown"
      },
      {
        uri: "payment://docs/all",
        name: "All Payment Documentation",
        description: "All essential payment implementation documentation in one resource",
        mimeType: "text/markdown"
      }
    ]
  };
});

// Resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  console.error(`📖 ReadResource called: "${request.params.uri}"`);
  const { uri } = request.params;

  try {
    if (uri === "payment://docs/flow") {
      const content = await fs.readFile(join(docsPath, "get_payment_flow.md"), 'utf-8');
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: content
          }
        ]
      };
    }

    if (uri === "payment://docs/api-spec") {
      const content = await fs.readFile(join(docsPath, "get_api_specification.md"), 'utf-8');
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown", 
            text: content
          }
        ]
      };
    }

    if (uri === "payment://docs/encryption") {
      const content = await fs.readFile(join(docsPath, "get_encryption_specification.md"), 'utf-8');
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: content
          }
        ]
      };
    }

    if (uri === "payment://docs/signature") {
      const content = await fs.readFile(join(docsPath, "get_signature_guide.md"), 'utf-8');
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: content
          }
        ]
      };
    }

    if (uri === "payment://docs/error-codes") {
      const content = await fs.readFile(join(docsPath, "get_error_codes.md"), 'utf-8');
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: content
          }
        ]
      };
    }

    if (uri === "payment://docs/all") {
      const paymentFlow = await fs.readFile(join(docsPath, "get_payment_flow.md"), 'utf-8');
      const apiSpec = await fs.readFile(join(docsPath, "get_api_specification.md"), 'utf-8');
      const encryptionSpec = await fs.readFile(join(docsPath, "get_encryption_specification.md"), 'utf-8');
      const signatureGuide = await fs.readFile(join(docsPath, "get_signature_guide.md"), 'utf-8');
      const errorSpec = await fs.readFile(join(docsPath, "get_error_codes.md"), 'utf-8');

      const combinedContent = `# Payment API Implementation - Complete Documentation

## Payment Processing Flow
${paymentFlow}

## API Specification
${apiSpec}

## Encryption Specification (Mandatory Compliance)
${encryptionSpec}

## Signature Implementation Guide
${signatureGuide}

## Error Codes Reference
${errorSpec}`;

      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: combinedContent
          }
        ]
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  } catch (error) {
    throw new Error(`File reading error: ${error.message}`);
  }
});




// Prompt list definition
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  console.error("ListPrompts called");
  return {
    prompts: [
      {
        name: "prompt-demo-create-fruit-shop-app",
        description: "Create an online shop application for a fruit shop",
        arguments: []
      },
      {
        name: "prompt-visualize-payment-flow",
        description: "Visualize the payment flow in NDPSI",
        arguments: []
      },
      {
        name: "prompt-simple-diagram-payment-flow",
        description: "Create a simple diagram of the payment flow",
        arguments: []
      },
      {
        name: "prompt-Create-API-get-Atomtoken-in-typescript",
        description: "Create an API to get Atomtoken in typescript.",
        arguments: []
      }
    ]
  };
});

// Prompt execution
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  console.error(`🎯 GetPrompt called: "${request.params.name}"`);
  const { name } = request.params;

  if (name === "prompt-demo-create-fruit-shop-app") {
    return {
      messages: [
        { 
          role: "user", 
          content: { 
            type: "text", 
            text: "Please implement code with functionality for when a fruit shop creates an online shop using get_payment_context as reference. Output it as 2 files: backend and frontend. Let's make the frontend simple. Please create a ready-to-run solution. The backend functionality can be a minimal MVP."
          } 
        }
      ]
    };
  }

  if (name === "prompt-visualize-payment-flow") {
    return {
      messages: [
        { 
          role: "user", 
          content: { 
            type: "text", 
            text: "Easily visualize the payment flow in NDPSI as figure"
          } 
        }
      ]
    };
  }

  if (name === "prompt-simple-diagram-payment-flow") {
    return {
      messages: [
        { 
          role: "user", 
          content: { 
            type: "text", 
            text: "A simple diagram of the payment flow in NDPSI as mermaid base"
          } 
        }
      ]
    };
  }

  if (name === "prompt-Create-API-get-Atomtoken-in-typescript") {

    return {
      messages: [
        { 
          role: "user", 
          content: { 
            type: "text", 
            text: "Create a simple TypeScript function to get NDPSI AtomToken. No server setup needed - just a function I can call directly. Include a working example that runs immediately when I execute the file with npx tsx."
          } 
        }
      ]
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});

// Tool list definition
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error("ListTools called");
  return {
    tools: [
      {
        name: "get_payment_context",
        description: "Get complete payment implementation context including encryption specs, API documentation, error codes, signature guides, and payment processing flows", 
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      }
    ]
  };
});

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error(`⚡ CallTool called: "${request.params.name}"`);
  const { name, arguments: args } = request.params;
  
  if (name === "get_payment_context") {
    try {
      const paymentFlow = await fs.readFile(join(docsPath, "get_payment_flow.md"), 'utf-8');
      const apiSpec = await fs.readFile(join(docsPath, "get_api_specification.md"), 'utf-8');
      const encryptionSpec = await fs.readFile(join(docsPath, "get_encryption_specification.md"), 'utf-8');
      const signatureGuide = await fs.readFile(join(docsPath, "get_signature_guide.md"), 'utf-8');
      const errorSpec = await fs.readFile(join(docsPath, "get_error_codes.md"), 'utf-8');

      return {
        content: [
          {
            type: "text",
            text: `Payment API Implementation - Complete Context:

# Payment Processing Flow
${paymentFlow}

# API Specification
${apiSpec}

# Encryption Specification (Mandatory Compliance)
${encryptionSpec}

# Signature Implementation Guide
${signatureGuide}

# Error Codes Reference
${errorSpec}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`File reading error: ${error.message}`);
    }
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Server startup
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Server started");
}

main().catch(console.error);