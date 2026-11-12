# KeedoHub QA Infrastructure - Setup & Test Guide

This document provides exact Windows PowerShell commands for setting up and running the local Firebase emulator test suite for KeedoHub.

## Prerequisites

### Checking Tool Availability

```powershell
# Check Java availability (JRE 11+ required for Firebase Emulator)
java -version

# Check Firebase CLI availability
npx firebase --version

# Check Node.js availability
node --version
npm --version
```

### Manual Installation (Do NOT run automatically)

If Java or Firebase CLI are missing, install them manually:

**Java (JRE 11+):**
- Download from https://adoptium.net/ or https://www.oracle.com/java/
- Install and ensure `java` is on your PATH

**Firebase CLI:**
```powershell
npm install -g firebase-tools
# Then authenticate (does not connect to production for testing)
firebase login --no-localhost
```

## Starting the Local Firebase Emulators

```powershell
# From the project root (C:\artkidoo\PROJ)
npm run emulators:start
```

This starts Auth, Firestore, Storage, and Functions emulators on localhost with project ID `demo-keedohub`.

Ports used:
| Service | Port |
|---------|------|
| Auth | 9099 |
| Firestore | 8080 |
| Functions | 5001 |
| Storage | 9199 |
| Emulator UI | 4000 |

## Running Each Test Suite Separately

### Firestore Rules Tests
```powershell
npm run test:firestore-rules
```

### Phase 3C Firestore Rules Tests
```powershell
npm run test:firestore-phase3c
```

### Storage Rules Tests
```powershell
npm run test:storage-rules
```

### Cloud Functions Tests
```powershell
npm run test:functions
```

## Running the Complete Test Suite

```powershell
npm run test:firebase
```

This runs all four test suites in sequence: Firestore → Phase 3C → Storage → Functions.

## Stopping the Emulators

```powershell
npm run emulators:stop
```

## Important Safety Notes

- **Never deploy Firebase**: Do not run `firebase deploy`
- **Never connect to production**: All tests use project ID `demo-keedohub`
- **Never modify live Firebase data**: Tests run only against local emulators
- **Production database configuration is preserved**: The named database `ai-studio-lyricalentbrandl-85ee0d5d-6fc2-41f3-a410-3e059e509c38` is referenced only for emulator routing
- **No production credentials**: `GOOGLE_APPLICATION_CREDENTIALS` is deleted in test helpers

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `java` not found | Install Java JRE 11+ manually |
| `firebase` not found | Run `npm install -g firebase-tools` |
| Emulator connection refused | Ensure emulators are started with `npm run emulators:start` |
| Test times out | Emulators may not be running; start them first |
| Port already in use | Stop existing emulators with `npm run emulators:stop` |

## Test Coverage Summary

| Test Suite | Coverage |
|------------|----------|
| Firestore Rules | Admin permissions, client ownership, cross-client isolation, workspace access, suspended accounts, projects, tasks, deliverables, internal notes, audit logs, service catalog, unauthenticated access |
| Storage Rules | Artist/Brand private assets, workspace ownership, client uploads, request attachments, published deliverables, unpublished restrictions, admin-only files, unauthorized access, invalid files |
| Cloud Functions | Auth/authz, invalid inputs, client profile updates, admin role management, service management, production requests, deliverable reviews |