# Contributing Guide

Thank you for considering contributing to the Virtual Try-On Catalog Generator! This guide will help you get started.

## 🎯 Ways to Contribute

### 1. **Bug Reports**
Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (browser, OS, Node version)

### 2. **Feature Requests**
Have an idea? Open an issue describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternative solutions considered
- How it benefits ecommerce users

### 3. **Code Contributions**
Want to contribute code? Great! Follow these steps:

## 🚀 Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR-USERNAME/virtual_try_on.git
cd virtual_try_on

# Install dependencies
pnpm install

# Copy environment file
cp env.example .env.local
# Add your API keys to .env.local

# Start development server
pnpm dev
```

## 📝 Coding Standards

### TypeScript
- Use TypeScript for all new code
- Avoid `any` types when possible
- Add JSDoc comments for complex functions

### React Components
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper TypeScript types for props

### Styling
- Use Tailwind CSS classes
- Follow existing naming conventions
- Keep responsive design in mind (mobile-first)
- Test on different screen sizes

### Example Good Code

```typescript
interface ModelUploadProps {
  onUpload: (file: File) => void
  maxFiles?: number
  acceptedFormats?: string[]
}

/**
 * Component for uploading model photos
 * @param onUpload - Callback when file is selected
 * @param maxFiles - Maximum number of files allowed
 * @param acceptedFormats - Array of accepted file extensions
 */
export function ModelUpload({ 
  onUpload, 
  maxFiles = 10,
  acceptedFormats = ['.jpg', '.png', '.heic']
}: ModelUploadProps) {
  // Component implementation
}
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Test with different image formats (JPG, PNG, HEIC)
- [ ] Test with various file sizes (small to large)
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test error states (API failures, network issues)
- [ ] Test with multiple browser types

### Before Submitting PR
- [ ] Code runs without errors
- [ ] No console warnings
- [ ] Tested on latest Chrome, Firefox, Safari
- [ ] Mobile responsive
- [ ] No TypeScript errors
- [ ] Code follows existing patterns

## 🔄 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Add comments for complex logic
   - Follow existing code style

3. **Test thoroughly**
   - Run the app locally
   - Test all affected features
   - Check for console errors

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

   Use conventional commits:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting)
   - `refactor:` - Code refactoring
   - `perf:` - Performance improvements
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a Pull Request on GitHub

6. **PR Description Template**
   ```markdown
   ## Description
   Brief description of what this PR does
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Performance improvement
   
   ## Testing
   How did you test this?
   
   ## Screenshots
   If applicable, add screenshots
   
   ## Checklist
   - [ ] Code follows project style
   - [ ] Tested on multiple browsers
   - [ ] No console errors
   - [ ] Documentation updated
   ```

## 🎨 UI/UX Guidelines

### Design Principles
- **Mobile-first**: Start with mobile, scale up
- **Accessibility**: Use semantic HTML, proper ARIA labels
- **Performance**: Optimize images, minimize re-renders
- **User feedback**: Show loading states, error messages, success toasts

### Component Structure
```
component/
├── index.tsx          # Main component
├── types.ts           # TypeScript interfaces
├── hooks.ts           # Custom hooks
└── utils.ts           # Helper functions
```

## 📚 Documentation

### When to Update Docs
- Adding new features → Update README.md
- Changing setup process → Update QUICKSTART.md
- Business use cases → Update ECOMMERCE_SETUP_GUIDE.md
- API changes → Update code comments

### Documentation Style
- Use clear, simple language
- Include code examples
- Add screenshots when helpful
- Keep it up-to-date with code changes

## 🐛 Debugging Tips

### Common Issues

**Images not generating**
```typescript
// Check API key
console.log('FAL_KEY exists:', !!process.env.FAL_KEY)

// Check request payload
console.log('FormData:', {
  mode: formData.get('mode'),
  hasModel: !!formData.get('model'),
  hasProduct: !!formData.get('product')
})
```

**State not updating**
```typescript
// Use functional updates for state depending on previous state
setGenerations((prev) => [...prev, newGeneration])

// Not: setGenerations([...generations, newGeneration])
```

**Performance issues**
```typescript
// Memoize expensive computations
const completedCount = useMemo(
  () => generations.filter(g => g.status === 'complete').length,
  [generations]
)
```

## 🏆 Recognition

Contributors will be:
- Listed in the README.md
- Mentioned in release notes
- Given credit in commit history

## 📞 Getting Help

- **Questions?** Open a discussion on GitHub
- **Stuck?** Check existing issues and PRs
- **Ideas?** Open an issue to discuss before coding

## 🤝 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Accept responsibility for mistakes

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Publishing private information
- Other unprofessional conduct

## 📋 Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority-high` - Urgent issues
- `wontfix` - Will not be implemented

## 🎯 Project Roadmap

### Short-term Goals
- [ ] Improve error handling
- [ ] Add batch processing UI
- [ ] Create video tutorials
- [ ] Add more prompt templates

### Long-term Goals
- [ ] Multi-language support
- [ ] Custom model training
- [ ] Advanced editing tools
- [ ] Analytics dashboard

### Want to help?
Check issues labeled `good first issue` or `help wanted`

## 💡 Tips for Success

1. **Start small** - Fix typos, improve docs, add tests
2. **Ask questions** - No question is too small
3. **Be patient** - Reviews take time
4. **Have fun** - Enjoy the process!

## 🙏 Thank You

Your contributions make this project better for everyone. Whether it's code, documentation, bug reports, or feature ideas - every contribution matters!

---

**Happy coding!** 🚀

