# NDPSI Payment Knowledge MCP Server

A Model Context Protocol (MCP) server that provides comprehensive NDPSI payment API documentation and implementation guidance for AI assistants. This server enables Claude and other MCP-compatible AI tools to access payment processing documentation, encryption specifications, API references, and implementation examples.

## Overview

This MCP server serves as a knowledge base for payment system implementation, providing structured access to:

- **Payment API Specifications** - Complete endpoint documentation and schemas
- **Encryption Standards** - Security requirements and implementation guidelines  
- **Processing Flows** - Step-by-step payment transaction workflows
- **Error Handling** - Comprehensive error codes and troubleshooting guides
- **Signature Implementation** - Request signing and validation procedures

## Use Cases

### API Implementation & Development
- **Language-specific implementations**: "How do I implement this payment API in TypeScript/Python/Java?"
- **Feature-by-feature guidance**: Get tailored code examples for specific payment functionalities
- **Best practices**: Access recommended patterns and security considerations

### Payment Flow Understanding
- **System architecture**: Understand server-client communication patterns in payment systems
- **Domain knowledge**: Get explanations of payment-specific concepts (e.g., "What is an atomToken?")
- **Process visualization**: Step-by-step breakdowns of complex payment workflows
- **Integration guidance**: Learn how different payment components interact

### Reference & Documentation
- **Quick lookups**: Instant access to API specifications and error codes
- **Implementation examples**: Ready-to-use code snippets and templates
- **Troubleshooting**: Error resolution guides and debugging tips

## Quick Start

### Claude Desktop (Recommended)

1. **Download Claude Desktop**
   - Available free at [claude.ai](https://claude.ai)
   - Works with both free and paid accounts

2. **Download the Extension**
   - Download the `.dxt` file from the [nttdatapay github](https://github.com/nttdatapay/mcp-agent)

3.⁠ ⁠**Install Extension**
   - **Easy method**: Right-click the ⁠ .dxt ⁠ file → "Open with" → Select Claude Desktop → Install
   - **Manual method**: Open Claude Desktop → Settings → Extensions → Advanced Settings → Install Extension → Select the ⁠ .dxt ⁠ file → Install

4. **Start Using**
   - Access tools via the tools menu in Claude
   - Try asking: "Visualize the payment flow in NDPSI"
   - Use prompts: Try "Create fruit shop app" to see the server in action
   - Reference resources: Ask Claude to check specific payment documentation

### Other AI Platforms

For integration with ChatGPT, GitHub Copilot, or other MCP-compatible platforms:

- Use the provided `src/index.js` server file
- Follow your platform's MCP server integration guide
- Ensure Node.js runtime availability

## Features

### Tools
- **`get_payment_context`** - Retrieve complete payment implementation documentation

### Prompts  
- **`demo-create-fruit-shop-app`** - Generate an e-commerce application example with NDPSI payment integration

### Resources
- **`payment://docs/flow`** - NDPSI Payment processing workflow documentation
- **`payment://docs/api-spec`** - Complete API specification
- **`payment://docs/encryption`** - Encryption and security requirements
- **`payment://docs/signature`** - Request signature implementation guide
- **`payment://docs/error-codes`** - Error codes and troubleshooting
- **`payment://docs/all`** - Combined documentation resource

## Security & Privacy

### What This MCP Server Accesses

- **Package contents only** - Limited to the `docs/` folder within the extension package
- **Static documentation** - Read-only access to included Markdown files
- **No external connections** - No internet access or external API calls

### Security Design

- **Principle of least privilege** - Accesses only packaged documentation files
- **Open source transparency** - Full source code available on GitHub
- **Local execution** - Runs as a local Node.js process within Claude Desktop
- **Standard permissions** - Uses only standard file access permissions granted by Claude Desktop

### Technical Considerations

- **Runtime environment** - Executes as a Node.js process with standard system permissions
- **File system access** - Limited to the extension's package directory
- **Process isolation** - Runs in Claude Desktop's managed extension environment



### Project Structure

```
payment-knowledge-mcp/
├── src/
│   └── index.js              # MCP server implementation
├── docs/
│   └── payment-api-guides/   # Documentation files
│       ├── get_payment_flow.md
│       ├── get_api_specification.md
│       ├── get_encryption_specification.md
│       ├── get_signature_guide.md
│       └── get_error_codes.md
├── manifest.json             # DXT extension configuration
├── package.json              # Node.js dependencies
└── README.md                 # This file
```


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with the Model Context Protocol** | **Compatible with Claude Desktop** | **Open Source**