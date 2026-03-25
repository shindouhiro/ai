---
name: create-dockerfile
description: A skill to create a Dockerfile and .dockerignore for a Node.js/Next.js application.
---

# Create Dockerfile Skill

When this skill is invoked, it writes a `Dockerfile` and a `.dockerignore` file into the root of the project to package the application.

## Execution Steps:
1. The `.dockerignore` excludes unnecessary files like `node_modules`, `.next`, `.git`, to speed up build and minimize context size.
2. The `Dockerfile` uses a multi-stage build approach (often starting from `node:alpine`) to build the project and create a minimal final layer, specially tuned for Next.js standalone mode if applicable. 
