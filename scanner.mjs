/**
 * Project Scanner & Data Extractor
 * 
 * Scans the extracted source code and produces a structured JSON report
 * containing project metadata, architecture, components, routes, dependencies, etc.
 *
 * Usage: bun run scanner.mjs [source_directory] [--format json|csv|txt]
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, resolve, dirname, basename } from "path";

// --- Configuration ---
const SOURCE_DIR = resolve(process.argv[2] || join(process.cwd(), "source_code"));
const OUTPUT_FORMAT = process.argv.includes("--format") 
  ? process.argv[process.argv.indexOf("--format") + 1] || "json" 
  : "json";

const SCAN_CONFIG = {
  // Directories to scan for components
  componentDirs: ["src/components/game", "src/components/ui"],
  // Directories to scan for game engines/modules
  engineDirs: ["src/lib/game"],
  // Directories to scan for hooks
  hookDirs: ["src/hooks"],
  // Directories to scan for services
  serviceDirs: ["src/services", "src/store"],
  // Directories to scan for pages/routes
  routeDir: "src/app",
  // Database schema
  schemaFile: "prisma/schema.prisma",
  // Config files to parse
  configFiles: ["package.json", "tsconfig.json", "tailwind.config.ts", "next.config.ts"],
  // Files to check for env vars
  envFiles: [".env", ".env.local", ".env.example"],
};

// --- Utility Functions ---

function safeReadFile(filePath) {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function walkDir(dir, extensions = null) {
  if (!existsSync(dir)) return [];
  const results = [];
  const items = readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...walkDir(fullPath, extensions));
    } else if (item.isFile()) {
      if (!extensions || extensions.some(ext => item.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function getRelativePath(fullPath, baseDir) {
  return fullPath.replace(baseDir + "/", "").replace(baseDir + "\\", "");
}

function getFileSize(filePath) {
  try {
    return statSync(filePath).size;
  } catch {
    return 0;
  }
}

function getLineCount(content) {
  if (!content) return 0;
  return content.split("\n").length;
}

// --- Extractors ---

function extractPackageJson(sourceDir) {
  const filePath = join(sourceDir, "package.json");
  const content = safeReadFile(filePath);
  if (!content) return null;
  
  try {
    const pkg = JSON.parse(content);
    return {
      name: pkg.name || "unknown",
      version: pkg.version || "unknown",
      description: pkg.description || "",
      scripts: pkg.scripts || {},
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      totalDependencies: Object.keys(pkg.dependencies || {}).length,
      totalDevDependencies: Object.keys(pkg.devDependencies || {}).length,
      dependencyCount: Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length,
    };
  } catch {
    return null;
  }
}

function extractFrameworkInfo(pkg) {
  if (!pkg) return {};
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  const frameworks = {};
  const frameworksList = [
    "next", "react", "react-dom", "express", "fastify", "koa", "nest",
    "vue", "angular", "svelte", "remix", "astro", "solid-js", "qwik",
  ];
  
  for (const fw of frameworksList) {
    if (deps[fw]) {
      frameworks[fw] = deps[fw];
    }
  }
  
  return { frameworks };
}

function extractDatabaseInfo(sourceDir) {
  const schemaPath = join(sourceDir, SCAN_CONFIG.schemaFile);
  const content = safeReadFile(schemaPath);
  if (!content) return { type: "none", models: [] };
  
  // Extract Prisma provider
  const providerMatch = content.match(/provider\s*=\s*"(\w+)"/);
  const dbType = providerMatch ? providerMatch[1] : "unknown";
  
  // Extract models
  const models = [];
  const modelRegex = /model\s+(\w+)\s*\{/g;
  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    // Find the block content
    const blockStart = match.index + match[0].length;
    let depth = 1;
    let pos = blockStart;
    while (depth > 0 && pos < content.length) {
      if (content[pos] === "{") depth++;
      if (content[pos] === "}") depth--;
      pos++;
    }
    const blockContent = content.substring(blockStart, pos - 1);
    
    // Extract fields
    const fields = [];
    const fieldRegex = /^\s+(\w+)\s+(\w+)(.*)$/gm;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(blockContent)) !== null) {
      fields.push({
        name: fieldMatch[1],
        type: fieldMatch[2],
        attributes: fieldMatch[3].trim(),
      });
    }
    
    models.push({ name: modelName, fields, fieldCount: fields.length });
  }
  
  return {
    type: dbType,
    schemaFile: SCAN_CONFIG.schemaFile,
    models,
    modelCount: models.length,
  };
}

function extractComponents(sourceDir) {
  const components = [];
  
  for (const dir of SCAN_CONFIG.componentDirs) {
    const fullDir = join(sourceDir, dir);
    const files = walkDir(fullDir, [".tsx", ".jsx", ".ts", ".js"]);
    
    for (const file of files) {
      const content = safeReadFile(file);
      const relativePath = getRelativePath(file, sourceDir);
      const componentType = dir.includes("/ui/") ? "ui" : "game";
      
      // Detect if it's an enhanced/advanced variant
      const fileName = basename(file, ".tsx").replace(".jsx", "").replace(".ts", "").replace(".js", "");
      const isEnhanced = fileName.toLowerCase().includes("enhanced") || 
                         fileName.toLowerCase().includes("advanced") ||
                         fileName.toLowerCase().includes("pro") ||
                         fileName.toLowerCase().includes("v2");
      
      components.push({
        name: fileName,
        path: relativePath,
        type: componentType,
        size: getFileSize(file),
        lineCount: content ? getLineCount(content) : 0,
        isEnhanced,
        hasExports: content ? /export\s+(default\s+)?/.test(content) : false,
      });
    }
  }
  
  return components.sort((a, b) => b.lineCount - a.lineCount);
}

function extractEngines(sourceDir) {
  const engines = [];
  
  for (const dir of SCAN_CONFIG.engineDirs) {
    const fullDir = join(sourceDir, dir);
    const files = walkDir(fullDir, [".ts", ".js"]);
    
    for (const file of files) {
      const content = safeReadFile(file);
      const relativePath = getRelativePath(file, sourceDir);
      const fileName = basename(file, ".ts").replace(".js", "");
      
      // Count exported functions
      const exportedFunctions = content ? (content.match(/^export\s+(async\s+)?function\s+(\w+)/gm) || []).length : 0;
      const exportedConstants = content ? (content.match(/^export\s+(const|let|var)\s+(\w+)/gm) || []).length : 0;
      const exportedTypes = content ? (content.match(/^export\s+(type|interface)\s+(\w+)/gm) || []).length : 0;
      
      engines.push({
        name: fileName,
        path: relativePath,
        size: getFileSize(file),
        lineCount: content ? getLineCount(content) : 0,
        exportedFunctions,
        exportedConstants,
        exportedTypes,
        totalExports: exportedFunctions + exportedConstants + exportedTypes,
      });
    }
  }
  
  return engines.sort((a, b) => b.lineCount - a.lineCount);
}

function extractRoutes(sourceDir) {
  const routes = [];
  const appDir = join(sourceDir, SCAN_CONFIG.routeDir);
  
  if (!existsSync(appDir)) return routes;
  
  const items = readdirSync(appDir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = join(appDir, item.name);
    
    if (item.isDirectory() && !item.name.startsWith("_")) {
      // Check for route files
      const routeFiles = ["page.tsx", "page.ts", "route.ts", "route.js"];
      for (const rf of routeFiles) {
        const routeFile = join(fullPath, rf);
        if (existsSync(routeFile)) {
          const content = safeReadFile(routeFile);
          const routePath = item.name === "page" || item.name === "route" 
            ? "/" 
            : `/${item.name}`;
          
          routes.push({
            path: routePath,
            type: rf.startsWith("page") ? "page" : "api",
            file: getRelativePath(routeFile, sourceDir),
            lineCount: content ? getLineCount(content) : 0,
            size: getFileSize(routeFile),
          });
        }
      }
    } else if (item.isFile()) {
      if (["page.tsx", "page.ts", "route.ts", "route.js"].includes(item.name)) {
        const content = safeReadFile(fullPath);
        routes.push({
          path: item.name.startsWith("page") ? "/" : "/",
          type: item.name.startsWith("page") ? "page" : "api",
          file: getRelativePath(fullPath, sourceDir),
          lineCount: content ? getLineCount(content) : 0,
          size: getFileSize(fullPath),
        });
      }
    }
  }
  
  return routes;
}

function extractHooks(sourceDir) {
  const hooks = [];
  
  for (const dir of SCAN_CONFIG.hookDirs) {
    const fullDir = join(sourceDir, dir);
    const files = walkDir(fullDir, [".ts", ".js"]);
    
    for (const file of files) {
      const content = safeReadFile(file);
      const relativePath = getRelativePath(file, sourceDir);
      const fileName = basename(file, ".ts").replace(".js", "");
      
      hooks.push({
        name: fileName,
        path: relativePath,
        size: getFileSize(file),
        lineCount: content ? getLineCount(content) : 0,
        isCustomHook: fileName.startsWith("use"),
      });
    }
  }
  
  return hooks;
}

function extractServices(sourceDir) {
  const services = [];
  
  for (const dir of SCAN_CONFIG.serviceDirs) {
    const fullDir = join(sourceDir, dir);
    const files = walkDir(fullDir, [".ts", ".js"]);
    
    for (const file of files) {
      const content = safeReadFile(file);
      const relativePath = getRelativePath(file, sourceDir);
      const fileName = basename(file, ".ts").replace(".js", "");
      
      services.push({
        name: fileName,
        path: relativePath,
        size: getFileSize(file),
        lineCount: content ? getLineCount(content) : 0,
      });
    }
  }
  
  return services;
}

function extractEnvVars(sourceDir) {
  const envVars = [];
  
  for (const envFile of SCAN_CONFIG.envFiles) {
    const filePath = join(sourceDir, envFile);
    const content = safeReadFile(filePath);
    if (!content) continue;
    
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex).trim();
          const value = trimmed.substring(eqIndex + 1).trim();
          // Mask sensitive values
          const maskedValue = value.length > 8 && key.toLowerCase().includes("key") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("password") || key.toLowerCase().includes("token")
            ? "***MASKED***"
            : value;
          
          envVars.push({
            key,
            value: maskedValue,
            source: envFile,
          });
        }
      }
    }
  }
  
  return envVars;
}

function extractDirectoryStructure(sourceDir) {
  const structure = { totalFiles: 0, totalDirs: 0, byExtension: {}, byDir: {} };
  
  function scanDir(dir, depth = 0) {
    if (depth > 10) return; // Limit recursion depth
    if (!existsSync(dir)) return;
    
    const items = readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.name === ".git" || item.name === "node_modules") continue;
      
      const fullPath = join(dir, item.name);
      const relativePath = getRelativePath(fullPath, sourceDir);
      
      if (item.isDirectory()) {
        structure.totalDirs++;
        const dirStats = { files: 0, subdirs: 0 };
        scanDir(fullPath, depth + 1);
        // Count items in this directory
        const subItems = readdirSync(fullPath, { withFileTypes: true });
        dirStats.subdirs = subItems.filter(i => i.isDirectory() && i.name !== ".git" && i.name !== "node_modules").length;
        dirStats.files = subItems.filter(i => i.isFile()).length;
        structure.byDir[relativePath] = dirStats;
      } else if (item.isFile()) {
        structure.totalFiles++;
        const ext = item.name.includes(".") ? item.name.split(".").pop() : "no_ext";
        structure.byExtension[ext] = (structure.byExtension[ext] || 0) + 1;
      }
    }
  }
  
  scanDir(sourceDir);
  return structure;
}

function extractCodeMetrics(sourceDir) {
  const metrics = {
    totalLines: 0,
    totalFiles: 0,
    byLanguage: {},
    largestFiles: [],
  };
  
  const extensions = {
    ".tsx": "TypeScript React",
    ".ts": "TypeScript",
    ".jsx": "JavaScript React",
    ".js": "JavaScript",
    ".css": "CSS",
    ".md": "Markdown",
    ".json": "JSON",
    ".mdx": "MDX",
  };
  
  function scanDir(dir) {
    if (!existsSync(dir)) return;
    const items = readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.name === ".git" || item.name === "node_modules" || item.name === "download") continue;
      
      const fullPath = join(dir, item.name);
      
      if (item.isDirectory()) {
        scanDir(fullPath);
      } else if (item.isFile()) {
        const content = safeReadFile(fullPath);
        if (!content) continue;
        
        const ext = item.name.includes(".") ? "." + item.name.split(".").pop() : "";
        const lang = extensions[ext] || ext || "other";
        const lines = getLineCount(content);
        
        metrics.totalLines += lines;
        metrics.totalFiles++;
        metrics.byLanguage[lang] = (metrics.byLanguage[lang] || 0) + lines;
        
        metrics.largestFiles.push({
          path: getRelativePath(fullPath, sourceDir),
          lines,
          size: getFileSize(fullPath),
          language: lang,
        });
      }
    }
  }
  
  scanDir(sourceDir);
  metrics.largestFiles.sort((a, b) => b.lines - a.lines);
  metrics.largestFiles = metrics.largestFiles.slice(0, 20); // Top 20
  
  return metrics;
}

function extractSkills(sourceDir) {
  const skillsDir = join(sourceDir, "skills");
  if (!existsSync(skillsDir)) return [];
  
  const items = readdirSync(skillsDir, { withFileTypes: true });
  const skills = [];
  
  for (const item of items) {
    if (item.isDirectory()) {
      const skillDir = join(skillsDir, item.name);
      const skillFile = join(skillDir, "SKILL.md");
      const content = safeReadFile(skillFile);
      
      skills.push({
        name: item.name,
        hasSkillFile: existsSync(skillFile),
        lineCount: content ? getLineCount(content) : 0,
        hasAssets: existsSync(join(skillDir, "assets")),
        fileCount: walkDir(skillDir).length,
      });
    }
  }
  
  return skills.sort((a, b) => b.fileCount - a.fileCount);
}

function extractAgentContext(sourceDir) {
  const ctxDir = join(sourceDir, "agent-ctx");
  if (!existsSync(ctxDir)) return [];
  
  const files = walkDir(ctxDir, [".md"]);
  return files.map(file => ({
    name: basename(file),
    path: getRelativePath(file, sourceDir),
    lineCount: getLineCount(safeReadFile(file)),
    size: getFileSize(file),
  }));
}

function extractScripts(sourceDir) {
  const scriptsDir = join(sourceDir, ".zscripts");
  if (!existsSync(scriptsDir)) return [];
  
  const files = walkDir(scriptsDir, [".sh", ".js", ".mjs"]);
  return files.map(file => ({
    name: basename(file),
    path: getRelativePath(file, sourceDir),
    size: getFileSize(file),
    lineCount: getLineCount(safeReadFile(file)),
  }));
}

// --- Main Scan ---

function scan(sourceDir) {
  console.log(`\n Scanning: ${sourceDir}\n`);
  
  const startTime = Date.now();
  
  const results = {
    scanInfo: {
      sourceDirectory: sourceDir,
      scanDate: new Date().toISOString(),
      duration: 0,
    },
    packageInfo: null,
    framework: {},
    database: {},
    directoryStructure: {},
    codeMetrics: {},
    components: [],
    engines: [],
    routes: [],
    hooks: [],
    services: [],
    envVars: [],
    skills: [],
    agentContext: [],
    scripts: [],
  };
  
  // Run all extractors
  console.log(" Extracting package info...");
  results.packageInfo = extractPackageJson(sourceDir);
  
  console.log(" Detecting frameworks...");
  results.framework = extractFrameworkInfo(results.packageInfo);
  
  console.log(" Analyzing database schema...");
  results.database = extractDatabaseInfo(sourceDir);
  
  console.log(" Scanning directory structure...");
  results.directoryStructure = extractDirectoryStructure(sourceDir);
  
  console.log(" Computing code metrics...");
  results.codeMetrics = extractCodeMetrics(sourceDir);
  
  console.log(" Extracting components...");
  results.components = extractComponents(sourceDir);
  
  console.log(" Extracting game engines...");
  results.engines = extractEngines(sourceDir);
  
  console.log(" Extracting routes...");
  results.routes = extractRoutes(sourceDir);
  
  console.log(" Extracting hooks...");
  results.hooks = extractHooks(sourceDir);
  
  console.log(" Extracting services...");
  results.services = extractServices(sourceDir);
  
  console.log(" Extracting environment variables...");
  results.envVars = extractEnvVars(sourceDir);
  
  console.log(" Extracting skills...");
  results.skills = extractSkills(sourceDir);
  
  console.log(" Extracting agent context...");
  results.agentContext = extractAgentContext(sourceDir);
  
  console.log(" Extracting scripts...");
  results.scripts = extractScripts(sourceDir);
  
  // Compute summary
  results.scanInfo.duration = Date.now() - startTime;
  
  // Add summary stats
  results.summary = {
    totalComponents: results.components.length,
    gameComponents: results.components.filter(c => c.type === "game").length,
    uiComponents: results.components.filter(c => c.type === "ui").length,
    enhancedComponents: results.components.filter(c => c.isEnhanced).length,
    totalEngines: results.engines.length,
    totalRoutes: results.routes.length,
    apiRoutes: results.routes.filter(r => r.type === "api").length,
    pageRoutes: results.routes.filter(r => r.type === "page").length,
    totalHooks: results.hooks.length,
    customHooks: results.hooks.filter(h => h.isCustomHook).length,
    totalServices: results.services.length,
    envVarCount: results.envVars.length,
    skillCount: results.skills.length,
    agentContextCount: results.agentContext.length,
    scriptCount: results.scripts.length,
    totalDependencies: results.packageInfo?.totalDependencies || 0,
    totalDevDependencies: results.packageInfo?.totalDevDependencies || 0,
    databaseModels: results.database.modelCount || 0,
    databaseType: results.database.type || "none",
    totalLines: results.codeMetrics.totalLines || 0,
    totalFiles: results.codeMetrics.totalFiles || 0,
    totalDirs: results.directoryStructure.totalDirs || 0,
    topLanguages: Object.entries(results.codeMetrics.byLanguage || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang, lines]) => ({ language: lang, lines })),
  };
  
  return results;
}

// --- Output Formatters ---

function formatJSON(data) {
  return JSON.stringify(data, null, 2);
}

function formatCSV(data) {
  // Flatten to CSV - components as primary data
  const lines = [];
  
  // Header
  lines.push("type,name,path,size,lineCount,category");
  
  // Components
  for (const comp of data.components || []) {
    lines.push(`component,"${comp.name}","${comp.path}",${comp.size},${comp.lineCount},${comp.type}`);
  }
  
  // Engines
  for (const eng of data.engines || []) {
    lines.push(`engine,"${eng.name}","${eng.path}",${eng.size},${eng.lineCount},game-engine`);
  }
  
  // Hooks
  for (const hook of data.hooks || []) {
    lines.push(`hook,"${hook.name}","${hook.path}",${hook.size},${hook.lineCount},${hook.isCustomHook ? "custom" : "utility"}`);
  }
  
  // Services
  for (const svc of data.services || []) {
    lines.push(`service,"${svc.name}","${svc.path}",${svc.size},${svc.lineCount},service`);
  }
  
  // Routes
  for (const route of data.routes || []) {
    lines.push(`route,"${route.path}","${route.file}",${route.size},${route.lineCount},${route.type}`);
  }
  
  // Skills
  for (const skill of data.skills || []) {
    lines.push(`skill,"${skill.name}",skills/${skill.name},0,${skill.lineCount},ai-skill`);
  }
  
  return lines.join("\n");
}

function formatText(data) {
  const lines = [];
  const pad = (str, len) => str.padEnd(len);
  
  lines.push("=".repeat(70));
  lines.push(" PROJECT SCAN REPORT");
  lines.push("=".repeat(70));
  lines.push(` Source:      ${data.scanInfo.sourceDirectory}`);
  lines.push(` Date:        ${data.scanInfo.scanDate}`);
  lines.push(` Duration:    ${data.scanInfo.duration}ms`);
  lines.push("");
  
  // Summary
  const s = data.summary || {};
  lines.push("-".repeat(70));
  lines.push(" SUMMARY");
  lines.push("-".repeat(70));
  lines.push(` Database:        ${s.databaseType || "none"} (${s.databaseModels || 0} models)`);
  lines.push(` Components:      ${s.totalComponents || 0} (${s.gameComponents || 0} game, ${s.uiComponents || 0} ui)`);
  lines.push(` Enhanced Comps:  ${s.enhancedComponents || 0}`);
  lines.push(` Game Engines:    ${s.totalEngines || 0}`);
  lines.push(` Routes:          ${s.totalRoutes || 0} (${s.apiRoutes || 0} api, ${s.pageRoutes || 0} pages)`);
  lines.push(` Hooks:           ${s.totalHooks || 0} (${s.customHooks || 0} custom)`);
  lines.push(` Services:        ${s.totalServices || 0}`);
  lines.push(` Env Variables:   ${s.envVarCount || 0}`);
  lines.push(` AI Skills:       ${s.skillCount || 0}`);
  lines.push(` Agent Context:   ${s.agentContextCount || 0} files`);
  lines.push(` Scripts:         ${s.scriptCount || 0}`);
  lines.push(` Dependencies:    ${s.totalDependencies || 0} (+ ${s.totalDevDependencies || 0} dev)`);
  lines.push(` Total Files:     ${s.totalFiles || 0}`);
  lines.push(` Total Dirs:      ${s.totalDirs || 0}`);
  lines.push(` Total Lines:     ${s.totalLines ? s.totalLines.toLocaleString() : 0}`);
  lines.push("");
  
  // Top Languages
  lines.push("-".repeat(70));
  lines.push(" TOP LANGUAGES (by lines of code)");
  lines.push("-".repeat(70));
  for (const lang of s.topLanguages || []) {
    lines.push(` ${pad(lang.language, 25)} ${lang.lines.toLocaleString().padStart(10)} lines`);
  }
  lines.push("");
  
  // Top Files
  lines.push("-".repeat(70));
  lines.push(" LARGEST FILES (top 15)");
  lines.push("-".repeat(70));
  const largest = (data.codeMetrics?.largestFiles || []).slice(0, 15);
  for (const f of largest) {
    lines.push(` ${pad(f.lines.toLocaleString() + " lines", 12)} ${pad(f.size.toLocaleString() + "B", 12)} ${f.language.padEnd(20)} ${f.path}`);
  }
  lines.push("");
  
  // Components
  lines.push("-".repeat(70));
  lines.push(" COMPONENTS");
  lines.push("-".repeat(70));
  lines.push(` ${pad("Lines", 8)} ${pad("Size", 10)} Type      Name`);
  for (const comp of data.components || []) {
    const marker = comp.isEnhanced ? " *" : "";
    lines.push(` ${pad(comp.lineCount.toLocaleString(), 8)} ${pad(comp.size.toLocaleString() + "B", 10)} ${pad(comp.type, 9)} ${comp.name}${marker}`);
  }
  lines.push("");
  lines.push(" (* = Enhanced/Advanced variant)");
  lines.push("");
  
  // Engines
  lines.push("-".repeat(70));
  lines.push(" GAME ENGINES");
  lines.push("-".repeat(70));
  lines.push(` ${pad("Lines", 8)} ${pad("Functions", 12)} Name`);
  for (const eng of data.engines || []) {
    lines.push(` ${pad(eng.lineCount.toLocaleString(), 8)} ${pad(eng.exportedFunctions.toString(), 12)} ${eng.name}`);
  }
  lines.push("");
  
  // Routes
  lines.push("-".repeat(70));
  lines.push(" ROUTES");
  lines.push("-".repeat(70));
  for (const route of data.routes || []) {
    lines.push(` [${route.type.toUpperCase()}] ${route.path} -> ${route.file}`);
  }
  lines.push("");
  
  // Environment Variables
  if (data.envVars?.length > 0) {
    lines.push("-".repeat(70));
    lines.push(" ENVIRONMENT VARIABLES");
    lines.push("-".repeat(70));
    for (const env of data.envVars) {
      lines.push(` ${env.key}=${env.value}`);
    }
    lines.push("");
  }
  
  // Database
  if (data.database?.models?.length > 0) {
    lines.push("-".repeat(70));
    lines.push(` DATABASE SCHEMA (${data.database.type})`);
    lines.push("-".repeat(70));
    for (const model of data.database.models) {
      lines.push(` Model: ${model.name} (${model.fieldCount} fields)`);
      for (const field of model.fields) {
        lines.push(`   - ${field.name}: ${field.type} ${field.attributes}`);
      }
    }
    lines.push("");
  }
  
  // Skills
  if (data.skills?.length > 0) {
    lines.push("-".repeat(70));
    lines.push(" AI SKILLS");
    lines.push("-".repeat(70));
    for (const skill of data.skills) {
      lines.push(` ${pad(skill.name, 30)} ${skill.fileCount} files`);
    }
    lines.push("");
  }
  
  // Agent Context
  if (data.agentContext?.length > 0) {
    lines.push("-".repeat(70));
    lines.push(" AGENT CONTEXT FILES");
    lines.push("-".repeat(70));
    for (const ctx of data.agentContext) {
      lines.push(` ${pad((ctx.lineCount || 0).toLocaleString() + " lines", 12)} ${ctx.name}`);
    }
    lines.push("");
  }
  
  return lines.join("\n");
}

// --- Run ---

if (!existsSync(SOURCE_DIR)) {
  console.error(`Error: Source directory not found: ${SOURCE_DIR}`);
  console.error("Usage: bun run scanner.mjs [source_directory] [--format json|csv|txt]");
  process.exit(1);
}

const data = scan(SOURCE_DIR);

// Output
const outputDir = join(process.cwd(), "scan-output");
const { mkdirSync, writeFileSync } = await import("fs");

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0] + "-" + Date.now();

// Always write JSON
writeFileSync(join(outputDir, `scan-report-${timestamp}.json`), formatJSON(data));
console.log(`\n JSON report: scan-output/scan-report-${timestamp}.json`);

// Write requested format
if (OUTPUT_FORMAT === "csv") {
  writeFileSync(join(outputDir, `scan-report-${timestamp}.csv`), formatCSV(data));
  console.log(` CSV report:  scan-output/scan-report-${timestamp}.csv`);
}

if (OUTPUT_FORMAT === "txt" || OUTPUT_FORMAT === "text") {
  writeFileSync(join(outputDir, `scan-report-${timestamp}.txt`), formatText(data));
  console.log(` Text report: scan-output/scan-report-${timestamp}.txt`);
}

// Print summary to console
console.log(formatText(data));
console.log(`\n Scan complete in ${data.scanInfo.duration}ms`);
