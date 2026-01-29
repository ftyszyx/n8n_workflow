const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
	fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
	if (!fs.existsSync(src)) return;
	ensureDir(path.dirname(dest));
	fs.copyFileSync(src, dest);
}

function walk(dir, cb) {
	if (!fs.existsSync(dir)) return;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, cb);
		else cb(full);
	}
}

const root = path.resolve(__dirname, '..');
const srcRoot = path.join(root, 'src');
const distRoot = path.join(root, 'dist');

// Copy node icons (svg/png) under src/nodes/** to dist/nodes/**
const nodesDir = path.join(srcRoot, 'nodes');
walk(nodesDir, (file) => {
	const ext = path.extname(file).toLowerCase();
	if (ext !== '.svg' && ext !== '.png') return;
	const rel = path.relative(nodesDir, file);
	copyFile(file, path.join(distRoot, 'nodes', rel));
});

// Copy credential icons under src/credentials/**
const credDir = path.join(srcRoot, 'credentials');
walk(credDir, (file) => {
	const ext = path.extname(file).toLowerCase();
	if (ext !== '.svg' && ext !== '.png') return;
	const rel = path.relative(credDir, file);
	copyFile(file, path.join(distRoot, 'credentials', rel));
});

