# Contributing to EwPlayer

Thank you for your interest in contributing to EwPlayer! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Git
- Windows 10/11 for development
- Basic knowledge of React, TypeScript, and Electron

### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/EWPlayer-A-Freemium-Video-Player.git
cd VideoPlayerElectron

# Install dependencies
npm install
cd src/renderer && npm install

# Start development
npm start
```

## 📋 Development Workflow

### 1. Choose an Issue
- Check [GitHub Issues](https://github.com/jamesk9526/EWPlayer-A-Freemium-Video-Player/issues) for open tasks
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it

### 2. Create a Branch
```bash
# Create a feature branch
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/issue-number-description
```

### 3. Make Changes
- Follow the existing code style and architecture
- Write clear, concise commit messages
- Test your changes thoroughly
- Update documentation if needed

### 4. Commit and Push
```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add new feature description"

# Push to your fork
git push origin feature/your-feature-name
```

### 5. Create a Pull Request
- Go to the original repository
- Click "New Pull Request"
- Provide a clear description of your changes
- Reference any related issues
- Wait for review and address feedback

## 🏗️ Architecture Guidelines

### Code Organization
- **Main Process**: Electron main process code in `src/main/`
- **Renderer Process**: React components in `src/renderer/src/`
- **Shared Code**: Common utilities and types in appropriate shared folders
- **IPC Communication**: All inter-process communication through secure IPC channels

### File Structure
```
src/
├── main/                    # Electron main process
│   ├── ipc/                # IPC handlers (organized by feature)
│   ├── windows/            # Window management
│   ├── menus/              # Context menus
│   └── main.ts             # Application entry
├── renderer/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── types/          # TypeScript definitions
│   │   └── App.tsx         # Main app component
│   └── package.json
└── preload/                # Preload scripts
```

### Naming Conventions
- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase (e.g., `VideoCard.tsx`)
- **Functions**: camelCase (e.g., `handleVideoSelect`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_VOLUME`)
- **Types**: PascalCase with descriptive names (e.g., `VideoMetadata`)

## 💻 Coding Standards

### TypeScript
- Use strict TypeScript settings
- Define interfaces for all data structures
- Avoid `any` type - use proper type definitions
- Use union types for related constants

### React
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for expensive components
- Follow React best practices for performance

### Electron
- Secure IPC communication
- Validate all inputs in main process
- Handle errors gracefully
- Follow Electron security guidelines

### CSS
- Use CSS modules or styled-components
- Follow BEM methodology for class names
- Maintain consistent spacing and colors
- Ensure responsive design

## 🧪 Testing

### Unit Tests
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Testing Guidelines
- Write tests for utility functions
- Test component behavior
- Mock external dependencies
- Aim for good test coverage

## 📚 Documentation

### Code Comments
- Add JSDoc comments for public APIs
- Document complex logic
- Explain non-obvious decisions
- Keep comments up to date

### README Updates
- Update README.md for new features
- Document configuration options
- Provide usage examples
- Update screenshots if UI changes

## 🔧 Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

### Examples
```
feat: add multi-player window support
fix: resolve video playback stuttering
docs: update installation instructions
refactor: reorganize IPC handlers
```

## 🚨 Issue Reporting

### Bug Reports
- Use the bug report template
- Include steps to reproduce
- Provide system information
- Attach relevant logs

### Feature Requests
- Describe the problem you're solving
- Explain your proposed solution
- Consider alternative approaches
- Provide mockups if applicable

## 📋 Pull Request Process

### Before Submitting
- [ ] Code follows the style guidelines
- [ ] Tests pass and coverage is maintained
- [ ] Documentation is updated
- [ ] Commit messages are clear and descriptive
- [ ] No merge conflicts with main branch

### PR Description
- Clearly describe the changes
- Reference related issues
- Explain the rationale behind decisions
- Include screenshots for UI changes

### Review Process
- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged
- Your contribution will be acknowledged

## 🎯 Areas for Contribution

### High Priority
- Bug fixes and stability improvements
- Performance optimizations
- UI/UX enhancements
- Documentation improvements

### Medium Priority
- New features (video editing, subtitles)
- Testing infrastructure
- Build and deployment improvements
- Cross-platform compatibility

### Low Priority
- Code refactoring
- Dependency updates
- Minor UI improvements
- Documentation translations

## 📞 Getting Help

- **Discussions**: Use [GitHub Discussions](https://github.com/jamesk9526/EWPlayer-A-Freemium-Video-Player/discussions) for questions
- **Issues**: Report bugs or request features
- **Discord**: Join our community Discord (if available)

## 📄 License

By contributing to EwPlayer, you agree that your contributions will be licensed under the same ISC License that covers the project.

Thank you for contributing to EwPlayer! 🎬</content>
<parameter name="filePath">c:\Users\James\Documents\GitHub\VideoPlayerElectron\CONTRIBUTING.md
