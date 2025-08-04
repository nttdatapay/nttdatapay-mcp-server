#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema 
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


// docpath整理
// import.meta.url
// ↓
// "file:///C:/Users/xxxx/project/src/index.js"
// ↓ fileURLToPath()
// "C:\\Users\\xxxx\\project\\src\\index.js"  (__filename)
// ↓ dirname()  
// "C:\\Users\\xxxx\\project\\src"  (__dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// src/index.js から見て ../docs/payment-api-guides/
const docsPath = join(__dirname, '..', 'docs', 'payment-api-guides');



const server = new Server(
  {
    name: "markdown-context-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// プロンプト一覧定義
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  console.error("📋 ListPrompts called");
  return {
    prompts: [
      {
        name: "payment-api-context",
        description: "決済API実装時の必須全コンテキスト",
        arguments: []
      },
      {
        name: "payment-api-spec-context", 
        description: "決済API仕様の詳細",
        arguments: []
      },
      {
        name: "payment-encryption-context", 
        description: "決済データ暗号化の詳細仕様",
        arguments: []
      },
      {
        name: "payment-error-codes-context",
        description: "決済エラーコードと対処法", 
        arguments: []
      },
      {
        name: "payment-signature-context",
        description: "決済リクエスト署名の実装ガイド",
        arguments: []
      }
    ]
  };
});

// プロンプト実行（正しいハンドラー）
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  console.error(`🎯 GetPrompt called: "${request.params.name}"`);
  const { name } = request.params;

  if (name === "payment-api-context") {
    try {
      const apiSpec = await fs.readFile(join(docsPath, "get_api_specification.md"), 'utf-8');
      const encryptionSpec = await fs.readFile(join(docsPath, "get_encryption_specification.md"), 'utf-8');
      const errorSpec = await fs.readFile(join(docsPath, "get_error_codes.md"), 'utf-8');
      const paymentFlow = await fs.readFile(join(docsPath, "get_payment_flow.md"), 'utf-8');
      const signatureGuide = await fs.readFile(join(docsPath, "get_signature_guide.md"), 'utf-8');

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `決済API実装時の必須コンテキスト：

# 暗号化仕様（必須遵守）
${encryptionSpec}

# API仕様
${apiSpec}

# エラースペック
${errorSpec}

# 決済処理の流れ
${paymentFlow}

# 署名仕様
${signatureGuide}

上記の仕様を厳密に守って、セキュアな決済処理を実装してください。`
            }
          }
        ]
      };
    } catch (error) {
      throw new Error(`コンテキストファイル読み取りエラー: ${error.message}`);
    }
  }

  // 他のプロンプト処理...
  if (name === "payment-api-spec-context") {
    const apiSpec = await fs.readFile(join(docsPath, "get_api_specification.md"), 'utf-8');
    return {
      messages: [
        { role: "user", content: { type: "text", text: `決済API仕様：\n${apiSpec}` } }
      ]
    };
  }

  if (name === "payment-encryption-context") {
    const encryptionSpec = await fs.readFile(join(docsPath, "get_encryption_specification.md"), 'utf-8');
    return {
      messages: [
        { role: "user", content: { type: "text", text: `暗号化仕様：\n${encryptionSpec}` } }
      ]
    };
  }

  if (name === "payment-error-codes-context") {
    const errorCodes = await fs.readFile(join(docsPath, "get_error_codes.md"), 'utf-8');
    return {
      messages: [
        { role: "user", content: { type: "text", text: `エラーコード：\n${errorCodes}` } }
      ]
    };
  }

  if (name === "payment-signature-context") {
    const signatureGuide = await fs.readFile(join(docsPath, "get_signature_guide.md"), 'utf-8');
    return {
      messages: [
        { role: "user", content: { type: "text", text: `署名ガイド：\n${signatureGuide}` } }
      ]
    };
  }

  throw new Error(`未知のプロンプト: ${name}`);
});

// ツール一覧定義（1つだけ！）
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error("🔧 ListTools called");
  return {
    tools: [
      {
        name: "get_payment_context",
        description: "決済API、支払い処理、クレジットカード決済の実装に必要な暗号化仕様、API仕様、エラーコード、署名ガイドの全情報を取得", 
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "read_markdown_file",
        description: "指定されたMarkdownファイルを読み取る",
        inputSchema: {
          type: "object", 
          properties: {
            file_path: { type: "string", description: "読み取るファイルのパス" }
          },
          required: ["file_path"]
        }
      }
    ]
  };
});

// ツール実行（正しいハンドラー） ツール一覧定義のnameが飛んでくる
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error(`⚡ CallTool called: "${request.params.name}"`);
  const { name, arguments: args } = request.params;
  
  if (name === "get_payment_context") {
    try {
      const apiSpec = await fs.readFile(join(docsPath, "get_api_specification.md"), 'utf-8');
      const encryptionSpec = await fs.readFile(join(docsPath, "get_encryption_specification.md"), 'utf-8');
      const errorSpec = await fs.readFile(join(docsPath, "get_error_codes.md"), 'utf-8');
      const paymentFlow = await fs.readFile(join(docsPath, "get_payment_flow.md"), 'utf-8');
      const signatureGuide = await fs.readFile(join(docsPath, "get_signature_guide.md"), 'utf-8');

      return {
        content: [
          {
            type: "text",
            text: `決済API実装の必須コンテキスト:

# 暗号化仕様（必須遵守）
${encryptionSpec}

# API仕様  
${apiSpec}

# エラースペック
${errorSpec}

# 決済処理の流れ
${paymentFlow}

# 署名仕様
${signatureGuide}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`ファイル読み取りエラー: ${error.message}`);
    }
  }
  
  if (name === "read_markdown_file") {
    try {
      const content = await fs.readFile(args.file_path, 'utf-8');
      return {
        content: [{ type: "text", text: `ファイル内容:\n${content}` }]
      };
    } catch (error) {
      throw new Error(`ファイル読み取りエラー: ${error.message}`);
    }
  }
  
  throw new Error(`未知のツール: ${name}`);
});

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Markdown Context Server started");
}

main().catch(console.error);