#!/bin/bash
echo "Creating backup..."
git add .
git commit -m "Backup: $(date)"
git push origin feature/auth-and-ui-redesign
echo "Backup complete!"
