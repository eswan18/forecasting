#!/usr/bin/env bash
set -euo pipefail
set -x   # echo commands before execution

echo "📦 Checking for outdated dependencies..."
# Use npm outdated --json and Node to pull out just the package names
mapfile -t outdated < <(
  npm outdated --json --depth=0 2>/dev/null \
    | node -e "
      let stdin = '';
      process.stdin.on('data', c => stdin += c);
      process.stdin.on('end', () => {
        try {
          const o = JSON.parse(stdin);
          Object.keys(o).forEach(pkg => console.log(pkg));
        } catch(e) { /* no outdated deps or parse error */ }
      });
    "
)

if [ ${#outdated[@]} -eq 0 ]; then
  echo "✅ All dependencies are up-to-date."
  exit 0
fi

for pkg in "${outdated[@]}"; do
  echo
  echo "🔄 Updating $pkg → latest..."
  npm install "$pkg@latest"

  echo "🔨 Running build..."
  if npm run build; then
    echo "✅ Build succeeded after updating $pkg"
  else
    echo "❌ Build failed after updating $pkg. Please fix errors and re-run."
    exit 1
  fi
done

echo
echo "🎉 All outdated dependencies have been updated successfully!"

