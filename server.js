import express from 'express';
import { readFileSync } from 'fs';
import { compile } from '@mdx-js/mdx';
import matter from 'gray-matter';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

// Serve the MDX file as compiled React component
app.get('/api/slides/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = join(__dirname, 'presentations', `${filename}.mdx`);
    
    // Read and parse MDX
    const fileContent = readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);
    
    // Compile MDX to JSX
    const compiled = await compile(content, {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight],
      outputFormat: 'function-body',
      development: false,
    });
    
    // Split slides by ---
    const slides = content.split(/^---\s*$/m).filter(s => s.trim());
    
    res.json({
      frontmatter,
      slides,
      totalSlides: slides.length
    });
    
  } catch (error) {
    console.error('Error loading slides:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🎯 Presentation server running at http://localhost:${PORT}`);
  console.log(`📄 Loading: presentations/osi.mdx`);
});