import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DOCS_DIR = path.join(process.cwd(), "doc", "MSCI");

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filePathParam = searchParams.get("path");

        // 단일 파일 조회
        if (filePathParam) {
            const absolutePath = path.join(DOCS_DIR, filePathParam);

            // 보안을 위해 DOCS_DIR 내부인지 확인 
            // 단, 루트 디렉토리의 파일 접근 등은 보안/요구사항에 맞게 조정
            if (!absolutePath.startsWith(DOCS_DIR)) {
                return NextResponse.json({ error: "Invalid path" }, { status: 403 });
            }

            const content = await fs.readFile(absolutePath, "utf-8");
            return NextResponse.json({ content });
        }

        // 파일 목록 조회 (.md 파일만 재귀적으로 또는 얕게 검색)
        // 일단 얕게 가져오는 것으로 구현
        const listFiles = async (dir: string): Promise<string[]> => {
            const dirents = await fs.readdir(dir, { withFileTypes: true });
            let files: string[] = [];
            for (const dirent of dirents) {
                const res = path.resolve(dir, dirent.name);
                if (dirent.isDirectory()) {
                    // 서브 디렉토리 재귀적 검색을 원할 경우 (일단 옵시디언은 하위 폴더도 쓸 수 있으므로 재귀 탐색)
                    const subFiles = await listFiles(res);
                    files = files.concat(subFiles);
                } else {
                    if (res.endsWith('.md')) {
                        files.push(res);
                    }
                }
            }
            return files;
        };

        const allFiles = await listFiles(DOCS_DIR);

        // 상대 경로로 변환 (UI에서 사용하기 쉽도록)
        const relativeFiles = allFiles.map(file => path.relative(DOCS_DIR, file).replace(/\\/g, '/'));

        return NextResponse.json({ files: relativeFiles });

    } catch (error: any) {
        console.error("API /study GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { path: filePathParam, content } = body;

        if (!filePathParam || content === undefined) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const absolutePath = path.join(DOCS_DIR, filePathParam);

        if (!absolutePath.startsWith(DOCS_DIR)) {
            return NextResponse.json({ error: "Invalid path" }, { status: 403 });
        }

        await fs.writeFile(absolutePath, content, "utf-8");
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("API /study PUT error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
