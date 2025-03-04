# Development Workflow

## Branch Strategy
- `main`: Production releases
- `dev`: Primary development branch
- Feature/fix branches: Created from `dev`

## Branch Naming Convention
Follow semantic versioning patterns:
- Features: `feat/description`
- Fixes: `fix/description`
- Documentation: `docs/description`
- Releases: `release/vX.Y.Z`

## Development Process
1. Create branch from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/your-feature
   ```

2. Make changes and commit following semantic commit messages:
   - `feat: add new feature`
   - `fix: resolve specific issue`
   - `docs: update documentation`
   - `chore: maintenance tasks`

3. Create PR to merge into `dev`
4. After PR review, merge into `dev`

## Release Process
1. Create release branch from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b release/vX.Y.Z
   ```

2. Update version:
   - Update `package.json` version
   - Run `npm install` to update `package-lock.json`

3. Update CHANGELOG.md:
   ```markdown
   ## [X.Y.Z] - YYYY-MM-DD

   ### Added
   - New features

   ### Changed
   - Improvements

   ### Fixed
   - Bug fixes
   ```

4. Create PR to merge release into `main`

5. After merge, create and push tag:
   ```bash
   git checkout main
   git pull origin main
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```

6. Create GitHub Release:
   - Title: vX.Y.Z: Brief Description
   - Description: Copy relevant CHANGELOG.md section
   - Target: main branch
   - Tag: vX.Y.Z

7. Sync `dev` with `main`:
   ```bash
   git checkout dev
   git merge main
   git push origin dev
   ```

## Example Release PR Description
```markdown
## Release vX.Y.Z

### Changes
- List major changes
- Include breaking changes if any

### Checklist
- [ ] Version bumped in package.json
- [ ] package-lock.json updated
- [ ] CHANGELOG.md updated
- [ ] Documentation updated if needed
```
```

Would you like me to:
1. Create this file in the repository?
2. Make any adjustments to the content?
3. Add any additional sections?