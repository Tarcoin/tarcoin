# Contributing to Tarcoin

Thank you for your interest in contributing to Tarcoin! We welcome contributions from the community and are excited to build together.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)
- [Community](#community)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful, inclusive, and constructive environment. Harassment, discrimination, or abusive behavior of any kind will not be tolerated.

---

## How Can I Contribute?

### 🐛 Reporting Bugs
If you find a bug, please open an issue on GitHub with the following information:
- A clear and descriptive title
- Steps to reproduce the bug
- Expected vs. actual behavior
- Your operating system and Tarcoin version
- Any relevant logs or screenshots

### 💡 Suggesting Features
Have an idea to improve Tarcoin? Open a GitHub issue tagged with `enhancement` and describe:
- The problem your feature solves
- How you envision the feature working
- Any alternative solutions you considered

### 🔧 Submitting Code
We accept Pull Requests for:
- Bug fixes
- New features
- Documentation improvements
- Performance optimizations
- Test coverage improvements

---

## Development Setup

### Prerequisites
- **Linux / macOS / WSL** (Windows Subsystem for Linux)
- **Git** 2.x or higher
- **GCC / Clang** compiler
- **Node.js** 18+ (for Explorer, API, Website, Mining Pool)
- **CMake** 3.18+
- **Boost** 1.74+

### Clone the Repository
```bash
git clone https://github.com/tarcoin/tarcoin.git
cd tarcoin
```

### Build the Core Node
```bash
cd blockchain_core/tarcoin-core
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build -j$(nproc)
```

### Run the Explorer / API / Website
```bash
cd api && npm install && npm run dev
cd explorer && npm install && npm run dev
cd website && npm install && npm run dev
```

---

## Submitting Changes

1. **Fork** the repository on GitHub.
2. **Create a branch** for your change:
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. **Commit your changes** with a clear, descriptive commit message:
   ```bash
   git commit -m "feat: add support for multi-signature transactions"
   ```
4. **Push** your branch to your fork:
   ```bash
   git push origin feature/my-new-feature
   ```
5. **Open a Pull Request** against the `master` branch.

### Commit Message Format
We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:
- `feat:` — A new feature
- `fix:` — A bug fix
- `docs:` — Documentation changes only
- `chore:` — Maintenance tasks
- `test:` — Adding or updating tests
- `refactor:` — Code changes that neither fix a bug nor add a feature

---

## Style Guidelines

### C++ (Core Node)
- Follow the existing Bitcoin Core style guide
- Use 4-space indentation
- Keep functions small and focused
- Add comments for complex logic

### TypeScript / JavaScript (Explorer, API, Website)
- Use TypeScript strict mode
- Follow ESLint rules defined in the project
- Use `async/await` over raw Promises
- Write JSDoc comments for exported functions

---

## Community

- **Website:** [https://tarcoin.org](https://tarcoin.org)
- **Block Explorer:** [https://explorer.tarcoin.org](https://explorer.tarcoin.org)
- **Mining Pool:** [https://pool.tarcoin.org](https://pool.tarcoin.org)
- **GitHub Issues:** [https://github.com/tarcoin/tarcoin/issues](https://github.com/tarcoin/tarcoin/issues)

We appreciate every contribution, big or small. Thank you for helping make Tarcoin better!
