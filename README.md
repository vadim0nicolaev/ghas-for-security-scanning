# GitHub Advanced Security (GHAS) Demo Repository

This repository demonstrates GitHub's native security scanning capabilities for a "GitHub-native-first" CI/CD security strategy.

## Overview

This is a **proof-of-concept** Node.js application with **intentionally vulnerable code and dependencies** to demonstrate how GitHub Advanced Security features detect and report security issues.

> **WARNING**: This code contains intentional security vulnerabilities for demonstration purposes. **DO NOT deploy to production**.

## Security Features Demonstrated

| Feature | GitHub Native? | Workflow | Notes |
|---------|----------------|----------|-------|
| Secret Scanning | Yes | Repo settings | Detects hardcoded secrets |
| SAST (CodeQL) | Yes | `codeql.yml` | Static analysis for vulnerabilities |
| Dependency Alerts | Yes | `dependency-review.yml` | Vulnerable dependency detection |
| SBOM Generation | Yes | `sbom.yml` | SPDX/CycloneDX format |
| Container Scanning | Partial* | `container-scan.yml` | Trivy + SARIF upload |

*Container scanning uses Trivy (3rd party) but results appear in GitHub Security tab via SARIF upload.

## Repository Structure

```
.
├── .github/
│   └── workflows/
│       ├── codeql.yml           # SAST with CodeQL
│       ├── container-scan.yml   # Container image scanning with Trivy
│       ├── dependency-review.yml # PR dependency review
│       ├── sbom.yml             # SBOM generation and submission
│       └── security.yml         # Combined security pipeline
├── src/
│   └── index.js                 # Express server (with intentional vulnerabilities)
├── Dockerfile                   # Container definition (intentionally vulnerable base)
├── package.json                 # Dependencies (intentionally vulnerable versions)
└── README.md
```

## Intentional Vulnerabilities

### Code Vulnerabilities (SAST will detect)
- **SQL Injection**: Unsanitized user input in query (`/users` endpoint)
- **Command Injection**: Unsanitized input to `exec()` (`/ping` endpoint)
- **Path Traversal**: Unsanitized file path (`/file` endpoint)
- **XSS**: Reflected user input in HTML (`/search` endpoint)
- **Eval Injection**: User input passed to `eval()` (`/calculate` endpoint)
- **Hardcoded Secret**: JWT secret in source code

### Dependency Vulnerabilities (Dependabot will detect)
- `lodash@4.17.19` - Prototype pollution
- `axios@0.21.1` - SSRF vulnerability
- `minimist@1.2.5` - Prototype pollution
- `jsonwebtoken@8.5.1` - Various vulnerabilities
- `marked@2.0.0` - ReDoS and XSS vulnerabilities
- `node-fetch@2.6.1` - Various vulnerabilities

### Container Vulnerabilities (Trivy will detect)
- `node:14.17.0-alpine3.13` - Outdated Node.js and Alpine with known CVEs

## Setup Instructions

### 1. Enable GitHub Security Features

1. Go to **Settings** > **Code security and analysis**
2. Enable:
   - **Dependency graph** (usually enabled by default)
   - **Dependabot alerts**
   - **Dependabot security updates** (optional)
   - **Secret scanning**
   - **Push protection** (blocks commits with secrets)
   - **Code scanning** (CodeQL will be set up via workflow)

### 2. Push Code to GitHub

```bash
git add .
git commit -m "Add GHAS demo with intentional vulnerabilities"
git push origin main
```

### 3. Monitor Security Tab

After push, check the **Security** tab for:
- **Code scanning alerts** (CodeQL results)
- **Dependabot alerts** (vulnerable dependencies)
- **Secret scanning alerts** (if secrets detected)

## Workflows Explained

### `codeql.yml` - Static Application Security Testing (SAST)
- Runs on push/PR to main branches
- Uses CodeQL with `security-extended` queries
- Results appear in Security > Code scanning alerts

### `dependency-review.yml` - Dependency Review
- Runs on PRs only
- Blocks PRs introducing high-severity vulnerabilities
- Checks license compliance

### `sbom.yml` - Software Bill of Materials
- Generates SBOM in SPDX and CycloneDX formats
- Submits to GitHub Dependency Graph
- Stores artifacts with 90-day retention
- Generates container SBOM after image build

### `container-scan.yml` - Container Security
- Builds Docker image and scans with Trivy
- Uploads SARIF to GitHub Security tab
- Also scans Dockerfile for misconfigurations

### `security.yml` - Combined Security Pipeline
- npm audit for quick vulnerability check
- License compliance checking
- Summary of all security features

## Storage Strategy for SBOMs

1. **Short-term (CI/CD)**: GitHub Actions artifacts (30-90 days)
2. **Medium-term (Queryable)**: GitHub Dependency Graph via Dependency Submission API
3. **Long-term (Compliance)**: Consider mirroring to:
   - OCI artifact storage (immutable)
   - S3/GCS with versioning
   - Dedicated SBOM management platform

## Viewing Results

### Security Tab
Navigate to **Security** > **Overview** to see:
- Code scanning alerts (CodeQL + Trivy SARIF)
- Secret scanning alerts
- Dependabot alerts

### Dependency Graph
Navigate to **Insights** > **Dependency graph** to see:
- All dependencies
- Export SBOM (SPDX format)
- Submitted dependencies from CI

### Actions Artifacts
Check workflow runs for:
- SBOM files (SPDX, CycloneDX)
- Trivy scan results
- License reports
- npm audit results

## Extending to Multiple Repositories

For organization-wide adoption:

1. **Create reusable workflows** in a central `.github` repository
2. **Use organization rulesets** to require security checks
3. **Enable security features at org level** via organization settings
4. **Use GitHub API** to query security alerts across repos

## Cost Considerations

GitHub Advanced Security consists of:
- **GitHub Secret Protection**: Secret scanning + push protection
- **GitHub Code Security**: CodeQL, premium Dependabot features

Both are billed per active committer. For public repositories, these features are **free**.

## References

- [About code scanning](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning)
- [Exporting SBOM](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/exporting-a-software-bill-of-materials-for-your-repository)
- [About GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security)
- [Uploading SARIF files](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github)
- [Dependency Submission API](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/using-the-dependency-submission-api)
