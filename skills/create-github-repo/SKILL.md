---
name: create-github-repo
description: A skill to create a new GitHub repository using the GitHub CLI (gh), add a GitHub Action for building a Docker image, and push local code to it.
---

# Create GitHub Repo Skill

When this skill is invoked, it sets up a GitHub Action workflow to automatically build a Docker image, creates a new remote repository on GitHub using the GitHub CLI (`gh`), and automatically pushes the current local project to it.

## Prerequisites:
- The GitHub CLI (`gh`) must be installed and authenticated (`gh auth login`).
- Git must be installed.

## Execution Steps:
1. **Initialize Git (if not already initialized)**:
   Run `git init` in the project root.
2. **Setup GitHub Actions for Docker**:
   Copy the `docker-build.yml` template located at `.agent/skills/create-github-repo/references/docker-build.yml`.
   Create the directory `.github/workflows/` (if needed) and place the file inside it. Open the placed copied file and replace the placeholder `<repository-name>` with the actual name of the project.
3. **Stage and Commit**:
   Run `git add .` followed by `git commit -m "feat: init project and add docker build action"` (you can customize the commit message if needed).
4. **Create and Push via SSH**:
   Run the following commands to create the repository on GitHub, switch the remote to SSH to circumvent local network or proxy issues, and push the code:
   ```bash
   # Create the repository (it will add the remote origin)
   gh repo create <repository-name> --public --source=. --remote=origin

   # Get the GitHub username and update the origin URL to use SSH
   GITHUB_USER=$(gh api user -q .login)
   git remote set-url origin git@github.com:$GITHUB_USER/<repository-name>.git

   # Push to the remote
   git push -u origin HEAD
   ```
   *Note: Replace `<repository-name>` with the name of the project. You can change `--public` to `--private` if the user requests a private repository.*
