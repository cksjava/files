const fs = require("fs/promises");
const path = require("path");

async function walkFiles(rootDir, onFile) {
  const stack = [rootDir];

  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const ent of entries) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.isFile()) await onFile(p);
    }
  }
}

module.exports = { walkFiles };
