"use client";

import { useState, useEffect } from "react";
import { BookOpen, Edit, Save, X, FileText } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import JubotPageGuide from "@/components/common/JubotPageGuide";

export default function StudyPage() {
    const [fileList, setFileList] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [content, setContent] = useState<string>("");
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editedContent, setEditedContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/study");
            if (res.ok) {
                const data = await res.json();
                setFileList(data.files || []);
            }
        } catch (error) {
            console.error("Failed to fetch files:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFile = async (path: string) => {
        setSelectedFile(path);
        setIsEditing(false);
        try {
            const res = await fetch(`/api/study?path=${encodeURIComponent(path)}`);
            if (res.ok) {
                const data = await res.json();
                setContent(data.content || "");
                setEditedContent(data.content || "");
            }
        } catch (error) {
            console.error("Failed to fetch file content:", error);
        }
    };

    const handleSave = async () => {
        if (!selectedFile) return;

        try {
            const res = await fetch("/api/study", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    path: selectedFile,
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
                {/* 왼쪽 트리/목록 영역 */}
                <div className="w-80 border-r border-[#333] bg-[#1E1E1E] flex flex-col h-full rounded-tl-2xl overflow-hidden">
                    <div className="p-4 border-b border-[#333] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BookOpen size={20} className="text-[#F7D047]" />
                            <h2 className="font-bold text-lg">MSCI 스터디</h2>
                        </div>
                        <JubotPageGuide guideText="MSCI 관련 문서를 열람하고 수정(저장) 할 수 있습니다." />
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {loading ? (
                            <p className="text-gray-400 text-sm p-2">로딩 중...</p>
                        ) : fileList.length > 0 ? (
                            <ul className="space-y-1">
                                {fileList.map((file) => (
                                    <li key={file}>
                                        <button
                                            onClick={() => handleSelectFile(file)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2
                                            ${selectedFile === file ? "bg-[#333] text-white border-l-2 border-[#F7D047]" : "text-gray-400 hover:bg-[#2A2A2A] hover:text-white"}
                                        `}
                                        >
                                            <FileText size={16} />
                                            <span className="truncate">{file}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 text-sm p-2">문서가 없습니다.</p>
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
                                    {selectedFile}
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
                                    <div className="w-full h-full overflow-y-auto p-6">
                                        <pre className="whitespace-pre-wrap font-sans text-gray-200 leading-relaxed max-w-4xl mx-auto">
                                            {content || <span className="text-gray-500 italic">내용이 없습니다.</span>}
                                        </pre>
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
