import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'Changelog.md');
        const content = fs.readFileSync(filePath, 'utf8');

        // Parse Changelog
        // `## [Alpha V1.315] - 2026-03-10 16:06:00`
        const versions = content.split('## [').slice(1); // The first element is usually empty before the first '## ['
        
        const recentBuilds = versions.slice(0, 3).map(block => {
            const lines = block.split('\n');
            const headerLine = lines[0]; // e.g., "Alpha V1.315] - 2026-03-10 16:06:00"
            const versionMatch = headerLine.match(/(.*?)] \- (.*)/);
            
            const version = versionMatch ? versionMatch[1] : 'Unknown';
            const date = versionMatch ? versionMatch[2].trim() : '';

            // Extract Summary and Detail
            let summary = '';
            let details: string[] = [];

            let inDetail = false;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('- **Summary**:')) {
                    summary = line.replace('- **Summary**:', '').trim();
                } else if (line.startsWith('- **Detail**:')) {
                    inDetail = true;
                } else if (line.startsWith('- **Build Time**:')) {
                    inDetail = false;
                } else if (inDetail && line.startsWith('-')) {
                    details.push(line.replace(/^- /, '').trim());
                } else if (inDetail && line.length > 0) {
                    details.push(line);
                }
            }

            return {
                version,
                date,
                summary,
                details
            };
        });

        return NextResponse.json({ success: true, builds: recentBuilds });
    } catch (error) {
        console.error('Failed to parse changelog:', error);
        return NextResponse.json({ success: false, error: 'Failed to read changelog' }, { status: 500 });
    }
}
