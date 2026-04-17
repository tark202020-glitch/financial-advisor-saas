"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, Edit, Save, X, FileText, CheckCircle2, TrendingUp, BarChart3, ShieldCheck, Upload, Trash2 } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import JubotPageGuide from "@/components/common/JubotPageGuide";
import { createClient } from "@/utils/supabase/client";
import { useStudyNotification } from "@/hooks/useStudyNotification";
import ETFDashboard from "@/components/study/ETFDashboard";
import React from "react";

type Topic = "msci" | "dividend" | "etf";

const TOPIC_CONFIG = {
    msci: { title: "MSCI 스터디", icon: <BookOpen size={20} className="text-[#F7D047]" />, guide: "MSCI 관련 문서를 열람하고 수정(저장) 할 수 있습니다. '정보 만들기'로 최신 데이터를 구성하세요." },
    dividend: { title: "배당주 분석", icon: <TrendingUp size={20} className="text-[#F7D047]" />, guide: "배당주 투자 방향과 시가배당률 랭킹, 그리고 안정적인 배당 파이프라인 구축을 위한 심층 리포트가 수록됩니다. 프롬프트를 통해 커스텀 분석 요청이 가능합니다." },
    etf: { title: "ETF 분석기", icon: <BarChart3 size={20} className="text-[#F7D047]" />, guide: "추적하고 싶은 종목/ETF를 검색하여 추가하세요. 보유종목 구성과 일일 변경 이력을 추적합니다." }
};

const DEFAULT_DIVIDEND_PROMPT = `[목표] 국내 고배당 종목 및 ETF(커버드콜 제외, 일반/리츠/액티브 포함) 시가배당률 상위 30% 리포트 작성
[양식] 다음 컬럼을 포함하는 마크다운 표 및 코멘트
| 종목 | 수집일종가 | 연간주당배당금 | 연지급횟수 | 시가배당률 | 최근기준일 | 1000만원 투자주식수 | 1000만원 예상연배당금 |`;

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
                <div key={`table-${elements.length}`} className="w-full overflow-x-auto my-8 rounded-xl border border-[#333] shadow-2xl bg-[#1A1A1A]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#222]">
                            <tr>
                                {tableHeaders.map((h, i) => (
                                    <th key={i} className="border-b border-r border-[#333] px-4 py-3 text-sm font-bold text-gray-200 last:border-r-0 break-keep align-middle">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.map((row, i) => (
                                <tr key={i} className="border-b border-[#333] last:border-b-0 hover:bg-[#2A2A2A] transition-colors group">
                                    {row.map((cell, j) => (
                                        <td key={j} className="border-r border-[#333] px-4 py-3 text-sm text-gray-400 group-hover:text-gray-200 last:border-r-0 break-words align-top leading-relaxed min-w-[100px]" dangerouslySetInnerHTML={{ __html: parseInline(cell) }}></td>
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
    return <div className="markdown-body font-sans max-w-5xl mx-auto w-full pb-10 px-6 pt-4">{elements}</div>;
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

    // AI Generation state
    const [isPromptMode, setIsPromptMode] = useState<boolean>(false);
    const [dividendPrompt, setDividendPrompt] = useState<string>(DEFAULT_DIVIDEND_PROMPT);

    // Auth state
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const supabase = createClient();
    const { hasNewStudy, markAsRead } = useStudyNotification();

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
        setIsPromptMode(false);
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
        if (hasNewStudy) {
            markAsRead();
        }
        setSelectedFile(board);
        setIsEditing(false);
        setIsPromptMode(false);
        setContent(board.content || "");
        setEditedContent(board.content || "");
    };

    const handleGenerateInfo = async () => {
        if (topic === "etf") {
            return; // ETF는 전용 대시보드 사용
        }

        setIsGenerating(true);
        try {
            let apiUrl = "";
            if (topic === "msci") {
                apiUrl = "/api/study/generate-msci";
            } else if (topic === "dividend") {
                apiUrl = "/api/study/generate-dividend";
            }

            const res = await fetch(apiUrl, { method: "POST" });
            const data = await res.json();

            if (res.ok && (data.success || topic === "msci")) {
                alert(`${TOPIC_CONFIG[topic].title} 문서를 성공적으로 생성했습니다.`);
                await fetchFiles(topic);
            } else {
                alert(`문서 생성 실패: ${data.error || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error(`Failed to generate ${topic}:`, error);
            alert("문서 생성 중 오류가 발생했습니다.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateDividendEtf = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/study/generate-dividend-etf", { method: "POST" });
            const data = await res.json();

            if (res.ok && data.success) {
                alert("배당ETF TOP10 문서를 성공적으로 생성했습니다.");
                await fetchFiles(topic);
            } else {
                alert(`문서 생성 실패: ${data.error || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error('Failed to generate dividend ETF:', error);
            alert("문서 생성 중 오류가 발생했습니다.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedFile) return;
        if (!confirm(`'${selectedFile.title}' 문서를 정말 삭제하시겠습니까?\n삭제된 문서는 복구할 수 없으며 시스템에서 영구히 지워집니다.`)) return;

        try {
            const res = await fetch("/api/study-boards", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selectedFile.id })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "문서 삭제에 실패했습니다.");
            }

            alert("삭제되었습니다.");
            setSelectedFile(null);
            setContent("");
            setEditedContent("");
            setIsEditing(false);
            fetchFiles(topic);
        } catch (err: any) {
            alert(err.message);
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

    const handleGenerateDividend = async () => {
        if (!dividendPrompt.trim()) {
            alert("프롬프트를 입력해주세요.");
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch("/api/study/generate-dividend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: dividendPrompt })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setContent(data.content);
                setEditedContent(data.content);
                setIsPromptMode(false);
                setSelectedFile(null); // 신규 생성상태
                setIsEditing(true); // 에디터 모드로 진입시켜 검수 후 저장 유도
            } else {
                alert(`분석 실패: ${data.error}`);
            }
        } catch (error) {
            console.error("AI Generation failed:", error);
            alert("API 호출 중 오류가 발생했습니다.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!selectedFile) {
            // 새 파일 (AI 자동생성 결과 등) 저장
            const titleInput = prompt("저장할 문서의 제목을 입력하세요:", `${TOPIC_CONFIG[topic].title} - ${new Date().toLocaleDateString()}`);
            if (!titleInput) return;

            try {
                const res = await fetch("/api/study-boards", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        topic,
                        title: titleInput,
                        content: editedContent,
                    }),
                });

                if (res.ok) {
                    alert("성공적으로 서버에 등록되었습니다.");
                    await fetchFiles(topic); // 새로고침되어 목록에 표시됨 (이 때 isEditing = false, selectedFile = null 됨)
                } else {
                    const err = await res.json();
                    alert(`저장에 실패했습니다. (${err.error})`);
                }
            } catch (error) {
                console.error("Failed to save new file:", error);
                alert("저장 중 오류가 발생했습니다.");
            }
            return;
        }

        // 기존 파일 업데이트 로직
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

    // ETF 탭: 전용 대시보드 렌더링
    if (topic === "etf") {
        return (
            <SidebarLayout>
                <div className="flex bg-[#121212] h-[calc(100vh-4rem)] text-white w-full">
                    {/* 카테고리 탭 영역 */}
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
                    {/* ETF 전용 대시보드 */}
                    <div className="flex-1 overflow-hidden">
                        <ETFDashboard isAdmin={isAdmin} />
                    </div>
                </div>
            </SidebarLayout>
        );
    }

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

                                {topic === "dividend" && (
                                    <>
                                        <button
                                            onClick={handleGenerateInfo}
                                            disabled={isGenerating || isUploading}
                                            className="w-full text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 border border-purple-500 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold shadow-md"
                                        >
                                            <ShieldCheck size={16} />
                                            {isGenerating ? 'KIS API 데이터 수집 중...' : '배당주 TOP10조사'}
                                        </button>
                                        <button
                                            onClick={handleGenerateDividendEtf}
                                            disabled={isGenerating || isUploading}
                                            className="w-full text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 border border-emerald-500 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold shadow-md"
                                        >
                                            <ShieldCheck size={16} />
                                            {isGenerating ? 'KIS API 데이터 수집 중...' : '배당ETF TOP10조사'}
                                        </button>
                                    </>
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

                {/* 오른쪽 영역: 문서 내용/수정/AI 프롬프트 */}
                <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-[#121212]">
                    {isPromptMode ? (
                        <div className="flex flex-col h-full bg-[#121212] p-8">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                🚀 AI 증권 분석기 (Gemini 연동)
                            </h2>
                            <p className="text-gray-400 mb-6 text-sm">원하시는 분석 가이드라인(프롬프트)을 아래에 작성해주세요. 지시사항에 맞게 AI가 마크다운 포맷의 리포트를 자동 생성합니다.</p>
                            <textarea
                                className="flex-1 w-full p-6 bg-[#1A1A1A] text-gray-200 border border-[#333] rounded-lg outline-none resize-none font-mono text-sm leading-relaxed mb-6 focus:border-purple-500 transition-colors shadow-inner"
                                value={dividendPrompt}
                                onChange={(e) => setDividendPrompt(e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsPromptMode(false)}
                                    className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    disabled={isGenerating}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleGenerateDividend}
                                    disabled={isGenerating}
                                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold transition-colors shadow-md flex items-center gap-2"
                                >
                                    {isGenerating ? 'AI가 분석하고 문서를 작성하고 있습니다...' : '분석 시작'}
                                </button>
                            </div>
                        </div>
                    ) : (selectedFile !== null || isEditing) ? (
                        <>
                            {/* 헤더 액션 바 */}
                            <div className="h-14 border-b border-[#333] flex items-center justify-between px-6 bg-[#1A1A1A]">
                                <h3 className="font-bold text-gray-200 flex items-center gap-2">
                                    <FileText size={18} className="text-gray-400" />
                                    {selectedFile ? selectedFile.title : "새 결과물 미리보기 (미저장 상태)"}
                                </h3>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    if (!selectedFile) {
                                                        if (confirm("저장하지 않고 취소하시겠습니까?")) {
                                                            setIsEditing(false);
                                                            setContent("");
                                                            setEditedContent("");
                                                        }
                                                    } else {
                                                        setIsEditing(false);
                                                        setEditedContent(content);
                                                    }
                                                }}
                                                className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-1 transition-colors"
                                            >
                                                <X size={16} /> 취소
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="px-3 py-1.5 text-sm bg-[#F7D047] hover:bg-yellow-500 text-black font-bold rounded flex items-center gap-1 transition-colors"
                                            >
                                                <Save size={16} /> 서버에 등록(저장)
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {isAdmin && selectedFile && (
                                                <button
                                                    onClick={handleDelete}
                                                    className="px-3 py-1.5 text-sm bg-red-900/60 hover:bg-red-800 text-red-200 rounded flex items-center gap-1 transition-colors"
                                                >
                                                    <Trash2 size={16} /> 삭제
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="px-3 py-1.5 text-sm bg-[#333] hover:bg-[#444] rounded flex items-center gap-1 transition-colors"
                                            >
                                                <Edit size={16} /> 직접 에디터 수정
                                            </button>
                                        </>
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
                                        placeholder="이곳에 마크다운 내용이 생성됩니다. 자유롭게 추가 편집하시고 우측 상단 '서버에 등록'을 누르세요."
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
