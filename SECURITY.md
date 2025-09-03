# Security Policy

## Supported Versions

We take security seriously and actively maintain security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in EwPlayer, please help us by reporting it responsibly.

### How to Report

1. **Do not** create a public GitHub issue for security vulnerabilities
2. Email security reports to: [jamesk9526@users.noreply.github.com](mailto:jamesk9526@users.noreply.github.com)
3. Include detailed information about the vulnerability
4. Allow reasonable time for us to respond and fix the issue

### What to Include

Please include the following information in your report:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact and severity
- Any suggested fixes or mitigations
- Your contact information for follow-up

### Our Response Process

1. **Acknowledgment**: We'll acknowledge receipt within 48 hours
2. **Investigation**: We'll investigate and validate the vulnerability
3. **Fix Development**: We'll develop and test a fix
4. **Disclosure**: We'll coordinate disclosure with you
5. **Release**: We'll release the fix and security advisory

## Security Considerations

### For Users
- Download EwPlayer only from official sources
- Keep your system and antivirus software up to date
- Be cautious with video files from untrusted sources
- Regularly update to the latest version

### For Developers
- Follow secure coding practices
- Validate all inputs, especially file paths
- Use secure IPC communication
- Implement proper error handling
- Keep dependencies updated

## Known Security Features

### Electron Security
- Context isolation enabled
- Node integration disabled in renderer
- Secure preload scripts
- Sandboxed renderer processes

### Data Protection
- Local storage for user preferences
- No data collection or telemetry
- Secure file handling
- Proper permission management

### Network Security
- No external network requests
- Local-only operation
- Secure FFmpeg integration
- Safe file association handling

## Security Updates

Security updates will be:
- Released as soon as possible
- Documented in release notes
- Announced through GitHub releases
- Marked with appropriate severity levels

## Contact

For security-related questions or concerns:
- Email: [jamesk9526@users.noreply.github.com](mailto:jamesk9526@users.noreply.github.com)
- GitHub Security Advisories: [Report here](https://github.com/jamesk9526/EWPlayer-A-Freemium-Video-Player/security/advisories/new)

Thank you for helping keep EwPlayer secure!
