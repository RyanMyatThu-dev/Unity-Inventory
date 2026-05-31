# AI Workflow Rules & Guidelines

This document establishes the operational workflow, security mandates, and engineering protocols required for AI agents (including opencode) working within this repository.

---

## 1. Context Exploration & Understanding First

Before initiating any code modifications, the AI agent must thoroughly map the codebase using discovery tools (`glob`, `grep`, `read`):
- **Inspect Surrounding Conventions**: Analyze neighboring files to learn localized imports, naming conventions, directory patterns, and style choices.
- **Dependency & Tech Validation**: Verify the existence of libraries, frameworks, or dependencies before importing them. Inspect project configuration files (`package.json`, `.csproj`, `tsconfig.json`) to confirm version bounds. Never assume a package is globally accessible.
- **Path Resolution**: Construct absolute paths using the workspace root prefix. Relative path variables are not supported by file management tools.

---

## 2. Planning & Alignment

When tasked with feature additions, structural changes, or bug resolution:
1. **Formulate a Grounded Plan**: Draft a clear, concise step-by-step strategy for the implementation.
2. **Self-Verification Loop**: Plan how changes will be validated. Identify existing testing suites, linter scripts, or build commands before implementing changes.
3. **Obtain Approval on Ambiguity**: If a requirement is ambiguous, propose options using the `question` tool. Never execute assumptions that expand the system's architectural scope without confirmation.

---

## 3. Implementation Protocols

- **Respect Existing Code Style**: Replicate the exact spacing, braces, formatting, and structural paradigms of the existing project.
- **Do Not Revert**: Never revert or rollback changes unless a compilation error occurs, or if the user explicitly requests a rollback.
- **Minimize Comments**: Write comments sparingly. Focus on explaining *why* a piece of complex logic is implemented, rather than *what* it is doing. Do not insert AI signature blocks, conversational logs, or change summaries in code comments.
- **No Conversation in Comments**: Code files must remain professional. Never communicate with the user or explain your thought process through source code comments.

---

## 4. Verification & Hardening

After modifying any project files, the following verification loop is mandatory:
1. **Compilation Check**: Run local build commands (e.g., `dotnet build` or `npm run build`) via the shell to verify that your changes did not introduce compilation errors.
2. **Linting & Code Quality**: Run local linting tools (e.g., `eslint` or linter plugins) to verify compliance with system standards.
3. **Execution Safety**: Do not commit secrets, database connection passwords, or Cloudinary API keys during changes. Always read configurations from active environment variables or `appsettings.json` variables.

---

## 5. Security & Safety Rules

- **Explain Critical Commands**: Before running any shell commands that can modify files, delete directories, or affect the system status (e.g., `git reset`, `rm -rf`, or database migrations), explain the command's purpose and potential side effects.
- **Background Processes**: Run long-running servers or watchers (e.g., `next dev` or `dotnet run`) in the background using the correct shell arguments.
- **Interactive Shell Rejection**: Avoid invoking interactive commands (e.g., `git rebase -i` or commands prompting for manual confirmation). Always supply quiet/silent flags (e.g., `npm init -y` or `dotnet restore --no-cache`) to prevent process hangs.
