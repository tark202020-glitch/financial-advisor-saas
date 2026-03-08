"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, Edit, Save, X, FileText, CheckCircle2, TrendingUp, BarChart3, ShieldCheck, Upload } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import JubotPageGuide from "@/components/common/JubotPageGuide";
import { createClient } from "@/utils/supabase/client";
import React from "react";

type Topic = "msci" | "dividend" | "etf";

const TOPIC_CONFIG = {
    msci: { title: "MSCI 스터디", icon: <BookOpen size={20} className="text-[#F7D047]" />, guide: "MSCI 관련 문서를 열람하고 수정(저장) 할 수 있습니다. '정보 만들기'로 최신 데이터를 구성하세요." },
    dividend: { title: "배당주 분석", icon: <TrendingUp size={20} className="text-[#F7D047]" />, guide: "배당주 관련 분석 자료를 열람하는 공간입니다." },
    etf: { title: "ETF 분석기", icon: <BarChart3 size={20} className="text-[#F7D047]" />, guide: "ETF 관련 인사이트와 시뮬레이션 자료를 확인하세요." }
};

type StudyBoard = {
    id: string;
    title: string;
    content: string;
    created_at: string;
};

const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    const flushTable = () => {
        if (inTable) {
            elements.push(
                <div key={`table-${elements.length}`} className="w-full overflow-x-auto my-6 rounded-lg border border-[#333] shadow-lg">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#1E1E1E]">
                            <tr>
                                {tableHeaders.map((h, i) => (
                                    <th key={i} className="border-b border-r border-[#333] px-4 py-3 text-sm font-semibold text-gray-200 last:border-r-0 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.map((row, i) => (
                                <tr key={i} className="border-b border-[#333] last:border-b-0 hover:bg-[#252525] transition-colors">
                                    {row.map((cell, j) => (
                                        <td key={j} className="border-r border-[#333] px-4 py-3 text-sm text-gray-300 last:border-r-0" dangerouslySetInnerHTML={{ __html: parseInline(cell) }}></td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            inTable = false;
            tableHeaders = [];
            tableRows = [];
        }
    };

    const parseInline = (str: string) => {
        let processed = str;
        processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#F7D047] font-bold">$1</strong>');
        processed = processed.replace(/\*(.*?)\*/g, '<em class="text-gray-400">$1</em>');
        processed = processed.replace(/`(.*?)`/g, '<code class="bg-[#2A2A2A] px-1.5 py-0.5 rounded text-sm text-[#FF8A65] font-mono">$1</code>');
        return processed;
    };

    const parseRow = (str: string) => {
        const cells = str.split('|');
        if (cells.length > 0 && cells[0].trim() === '') cells.shift();
        if (cells.length > 0 && cells[cells.length - 1].trim() === '') cells.pop();
        return cells.map(c => c.trim());
    };

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        if (line.trim().startsWith('|')) {
            if (!inTable) {
                if (lines.length > i + 1 && lines[i + 1].trim().startsWith('|') && lines[i + 1].includes('---')) {
                    inTable = true;
                    tableHeaders = parseRow(line);
                    i++; // skip '---' separator line
                } else {
                    elements.push(<p key={i} className="mb-4 text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: parseInline(line) }}></p>);
                }
            } else {
                const row = parseRow(line);
                if (row.length > 0) {
                    tableRows.push(row);
                }
            }
        } else {
            flushTable();

            if (line.startsWith('# ')) {
                elements.push(<h1 key={i} className="text-3xl font-extrabold mb-6 text-white tracking-tight">{parseInline(line.substring(2))}</h1>);
            } else if (line.startsWith('## ')) {
                elements.push(<h2 key={i} className="text-2xl font-bold mb-5 mt-10 pb-2 border-b border-[#333] text-gray-100 flex items-center gap-2">{parseInline(line.substring(3))}</h2>);
            } else if (line.startsWith('### ')) {
                elements.push(<h3 key={i} className="text-xl font-bold mb-3 mt-8 text-gray-200">{parseInline(line.substring(4))}</h3>);
            } else if (line.startsWith('> ')) {
                elements.push(<blockquote key={i} className="border-l-4 border-[#F7D047] pl-4 py-2 my-5 text-gray-400 italic bg-[#1A1A1A] rounded-r-lg shadow-sm" dangerouslySetInnerHTML={{ __html: parseInline(line.substring(2)) }}></blockquote>);
            } else if (line.startsWith('- ')) {
                elements.push(<li key={i} className="ml-6 py-1 list-disc text-gray-300" dangerouslySetInnerHTML={{ __html: parseInline(line.substring(2)) }}></li>);
            } else if (line.trim() !== "") {
                if (line.trim() === '---') {
                    elements.push(<hr key={i} className="border-[#333] my-8" />);
                } else {
                    elements.push(<p key={i} className="mb-4 text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: parseInline(line) }}></p>);
                }
            }
        }
        i++;
    }
    flushTable();
    return <div className="markdown-body font-sans max-w-5xl pl-4 py-4">{elements}</div>;
};

export default function StudyPage() {
    const [topic, setTopic] = useState<Topic>("msci");
    const [fileList, setFileList] = useState<StudyBoard[]>([]);
    const [selectedFile, setSelectedFile] = useState<StudyBoard | null>(null);
    const [content, setContent] = useState<string>("");
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editedContent, setEditedContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auth state
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const supabase = createClient();

    useEffect(() => {
        checkAdmin();
    }, []);

    useEffect(() => {
        fetchFiles(topic);
    }, [topic]);

    const checkAdmin = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user && session.user.email === 'tark202020@gmail.com') {
            setIsAdmin(true);
        }
    };

    const fetchFiles = async (currentTopic: Topic) => {
        setLoading(true);
        setSelectedFile(null);
        setContent("");
        setIsEditing(false);
        try {
            const res = await fetch(`/api/study-boards?topic=${currentTopic}`);
            if (res.ok) {
                const data = await res.json();
                setFileList(data.boards || []);
            }
        } catch (error) {
            console.error("Failed to fetch files:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFile = (board: StudyBoard) => {
        setSelectedFile(board);
        setIsEditing(false);
        setContent(board.content || "");
        setEditedContent(board.content || "");
    };

    const handleGenerateInfo = async () => {
        if (topic !== "msci") {
            alert("해당 주제의 생성 기능은 현재 준비 중입니다.");
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch("/api/study/generate-msci", { method: "POST" });
            if (res.ok) {
                alert(`${TOPIC_CONFIG[topic].title} 문서를 성공적으로 생성(업데이트) 했습니다.`);
                await fetchFiles(topic);
            } else {
                alert("문서 생성에 실패했습니다.");
            }
        } catch (error) {
            console.error(`Failed to generate ${topic}:`, error);
            alert("문서 생성 중 오류가 발생했습니다.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.md')) {
            alert("MD (.md) 파일만 업로드 가능합니다.");
            return;
        }

        setIsUploading(true);
        try {
            const text = await file.text();

            // 파일명에서 확장자 제거하여 제목으로 사용
            const title = file.name.replace(/\.md$/, '');

            const res = await fetch("/api/study-boards", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    topic,
                    title,
                    content: text
                }),
            });

            if (res.ok) {
                alert(`'${title}' 파일이 성공적으로 업로드되었습니다.`);
                await fetchFiles(topic);
            } else {
                const errData = await res.json();
                alert(`업로드 실패: ${errData.error || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error("File upload error:", error);
            alert("업로드 중 오류가 발생했습니다.");
        } finally {
            setIsUploading(false);
            // reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleSave = async () => {
        if (!selectedFile) return;

        try {
            const res = await fetch("/api/study-boards", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: selectedFile.id,
                    content: editedContent,
                }),
            });

            if (res.ok) {
                setContent(editedContent);
                setIsEditing(false);
            } else {
                alert("저장에 실패했습니다.");
            }
        } catch (error) {
            console.error("Failed to save file:", error);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    return (
        <SidebarLayout>
            <div className="flex bg-[#121212] h-[calc(100vh-4rem)] text-white w-full">

                {/* 제일 왼쪽: 카테고리 탭 영역 */}
                <div className="w-48 border-r border-[#333] bg-[#1A1A1A] flex flex-col p-4 rounded-tl-2xl">
                    <h2 className="text-gray-400 text-xs font-bold mb-4 uppercase tracking-widest px-2">주식 스터디 영역</h2>
                    <ul className="space-y-2">
                        {(Object.keys(TOPIC_CONFIG) as Topic[]).map((t) => (
                            <li key={t}>
                                <button
                                    onClick={() => setTopic(t)}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors flex items-center gap-3 font-medium
                                        ${topic === t ? "bg-[#333] text-white border-l-2 border-[#F7D047]" : "text-gray-400 hover:bg-[#252525] hover:text-gray-200"}`}
                                >
                                    {TOPIC_CONFIG[t].icon}
                                    {TOPIC_CONFIG[t].title}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 중간: 파일 목록 영역 */}
                <div className="w-80 border-r border-[#333] bg-[#1E1E1E] flex flex-col h-full overflow-hidden">
                    <div className="p-4 border-b border-[#333] flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {TOPIC_CONFIG[topic].icon}
                                <h2 className="font-bold text-lg">{TOPIC_CONFIG[topic].title}</h2>
                            </div>
                            <JubotPageGuide guideText={TOPIC_CONFIG[topic].guide} />
                        </div>
                        {isAdmin && (
                            <div className="flex flex-col gap-2 mt-2">
                                {topic === "msci" && (
                                    <button
                                        onClick={handleGenerateInfo}
                                        disabled={isGenerating || isUploading}
                                        className="w-full text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 border border-blue-500 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold shadow-md"
                                    >
                                        <ShieldCheck size={16} />
                                        {isGenerating ? '정보 만들기 생성 중...' : '정보 만들기 (키움/자동)'}
                                    </button>
                                )}

                                {/* MD 파일 업로드 버튼 */}
                                <input
                                    type="file"
                                    accept=".md"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUploadChange}
                                />
                                <button
                                    onClick={handleFileUploadClick}
                                    disabled={isGenerating || isUploading}
                                    className="w-full text-sm bg-[#2A2A2A] hover:bg-[#333] disabled:opacity-50 border border-[#444] text-gray-200 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
                                >
                                    <Upload size={16} />
                                    {isUploading ? '업로드 중...' : 'MD 파일 업로드'}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {loading ? (
                            <p className="text-gray-400 text-sm p-4 text-center">불러오는 중...</p>
                        ) : fileList.length > 0 ? (
                            <ul className="space-y-1">
                                {fileList.map((file) => (
                                    <li key={file.id}>
                                        <button
                                            onClick={() => handleSelectFile(file)}
                                            className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors flex flex-col gap-1
                                            ${selectedFile?.id === file.id ? "bg-[#333] text-white border-l-2 border-[#F7D047]" : "text-gray-400 hover:bg-[#2A2A2A] hover:text-white"}
                                        `}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText size={16} className="shrink-0" />
                                                <span className="truncate font-semibold text-gray-200">{file.title}</span>
                                            </div>
                                            <span className="text-[11px] text-gray-500 pl-6">{new Date(file.created_at).toLocaleDateString()}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-sm p-4 text-center bg-[#1A1A1A] rounded-lg border border-[#333] m-2">아직 생성된 자료가 없습니다.</p>
                        )}
                    </div>
                </div>

                {/* 오른쪽 영역: 문서 내용/수정 */}
                <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-[#121212]">
                    {selectedFile ? (
                        <>
                            {/* 헤더 액션 바 */}
                            <div className="h-14 border-b border-[#333] flex items-center justify-between px-6 bg-[#1A1A1A]">
                                <h3 className="font-bold text-gray-200 flex items-center gap-2">
                                    <FileText size={18} className="text-gray-400" />
                                    {selectedFile.title}
                                </h3>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditedContent(content); // 변경 취소
                                                }}
                                                className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-1 transition-colors"
                                            >
                                                <X size={16} /> 취소
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="px-3 py-1.5 text-sm bg-[#F7D047] hover:bg-yellow-500 text-black font-bold rounded flex items-center gap-1 transition-colors"
                                            >
                                                <Save size={16} /> 저장하기
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-3 py-1.5 text-sm bg-[#333] hover:bg-[#444] rounded flex items-center gap-1 transition-colors"
                                        >
                                            <Edit size={16} /> 수정하기
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 내용 영역 */}
                            <div className="flex-1 overflow-hidden">
                                {isEditing ? (
                                    <textarea
                                        className="w-full h-full p-6 bg-[#121212] text-gray-200 outline-none resize-none font-mono text-sm leading-relaxed"
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                    />
                                ) : (
                                    <div className="w-full h-full overflow-y-auto p-6 bg-[#121212]">
                                        {content ? renderMarkdown(content) : <span className="text-gray-500 italic">내용이 없습니다.</span>}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-4">
                            <BookOpen size={48} className="text-[#333]" />
                            <p>왼쪽 목록에서 읽을 문서를 선택해주세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </SidebarLayout>
    );
}
