import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Get all presentations
app.get('/api/presentations', (req, res) => {
    try {
        const presentationDir = path.join(__dirname, 'presentation');
        
        if (!fs.existsSync(presentationDir)) {
            return res.json({ presentations: [] });
        }
        
        const files = fs.readdirSync(presentationDir);
        const presentations = files
            .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
            .map(f => f.replace(/\.(mdx|md)$/, ''));
        
        res.json({ presentations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get slides for a presentation
app.get('/api/slides/:name', (req, res) => {
    try {
        const { name } = req.params;
        const possibleExtensions = ['.mdx', '.md'];
        let content = null;
        let filePath = null;
        
        for (const ext of possibleExtensions) {
            const testPath = path.join(__dirname, 'presentation', `${name}${ext}`);
            if (fs.existsSync(testPath)) {
                filePath = testPath;
                content = fs.readFileSync(testPath, 'utf-8');
                break;
            }
        }
        
        if (!content) {
            return res.status(404).json({ error: 'Presentation not found' });
        }
        
        // Split by --- or ##
        let slides = content.split(/---\s*\n/).filter(s => s.trim());
        if (slides.length <= 1) {
            slides = content.split(/\n##\s+/).filter(s => s.trim());
            if (slides.length > 1) {
                slides = slides.map((s, i) => i === 0 ? s : `## ${s}`);
            }
        }
        if (slides.length <= 1) {
            slides = [content];
        }
        
        res.json({
            slides: slides.map(s => s.trim()),
            totalSlides: slides.length,
            name
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html for all routes (client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});