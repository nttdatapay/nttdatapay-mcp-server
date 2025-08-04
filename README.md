# Markdown File Reader MCP

## インストール方法

<!-- ### 🚀 Claude Desktop（推奨）
1. [Releases](releases)から最新の`.dxt`ファイルをダウンロード
2. ダブルクリックでインストール
3. フォルダアクセス許可を設定 -->

### 💻 VS Code/GitHub Copilot  
1. VS Codeで`Ctrl+Shift+P` → "MCP: Open User Configuration"
2. 以下を追加：
```json
{
  "mcpServers": {
    "markdown-reader": {
      "command": "node",
      "args": ["path/to/src/index.js"]
    }
  }
}