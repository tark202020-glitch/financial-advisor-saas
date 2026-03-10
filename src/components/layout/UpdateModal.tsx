'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Activity } from 'lucide-react';
import Link from 'next/link';

interface BuildInfo {
    version: string;
    date: string;
    summary: string;
    details: string[];
}

interface StudyDoc {
    id: string;
    title: string;
    topic: string;
    created_at: string;
}

export default function UpdateModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [builds, setBuilds] = useState<BuildInfo[]>([]);
    const [recentStudies, setRecentStudies] = useState<StudyDoc[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUpdates = async () => {
            try {
                // Fetch Changelog and Study docs in parallel
                const [changelogRes, studyRes] = await Promise.all([
                    fetch('/api/changelog'),
                    fetch('/api/study/recent')
                ]);

                const changelogData = await changelogRes.json();
                const studyData = await studyRes.json();

                const latestBuilds: BuildInfo[] = changelogData.success ? changelogData.builds : [];
                const latestStudies: StudyDoc[] = studyData.success ? studyData.documents : [];

                setBuilds(latestBuilds);
                setRecentStudies(latestStudies);

                const latestVersion = latestBuilds.length > 0 ? latestBuilds[0].version : null;
                const latestStudyId = latestStudies.length > 0 ? latestStudies[0].id : null;

                const lastSeenVersion = localStorage.getItem('lastSeenVersion');
                const lastSeenStudyId = localStorage.getItem('lastSeenStudyId');

                // 오늘 하루 보지 않기 여부 체크
                const hideUntil = localStorage.getItem('hideUpdateModalUntil');
                const now = new Date().getTime();

                let shouldShow = false;

                if (hideUntil && now < parseInt(hideUntil, 10)) {
                    // Hidden for today
                    shouldShow = false;
                } else if (latestVersion && latestVersion !== lastSeenVersion) {
                    shouldShow = true;
                } else if (latestStudyId && latestStudyId !== lastSeenStudyId) {
                    // Wait, if sidebar handles new study badges, maybe modal also shows once?
                    shouldShow = true;
                }

                if (shouldShow) {
                    setIsOpen(true);
                }

            } catch (error) {
                console.error('Failed to check updates', error);
            } finally {
                setLoading(false);
            }
        };

        checkUpdates();
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        // Record as seen
        if (builds.length > 0) localStorage.setItem('lastSeenVersion', builds[0].version);
        if (recentStudies.length > 0) localStorage.setItem('lastSeenStudyId', recentStudies[0].id);
    };

    const handleHideToday = () => {
        const tomorrow = new Date();
        tomorrow.setHours(24, 0, 0, 0); // Next midnight
        localStorage.setItem('hideUpdateModalUntil', tomorrow.getTime().toString());
        handleClose();
    };

    if (!isOpen || loading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#333] flex justify-between items-center bg-gradient-to-r from-purple-900/40 to-indigo-900/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                            <Activity size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white">최근 업데이트 안내</h2>
                    </div>
                    <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#333] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex flex-col gap-6 flex-1 custom-scrollbar text-sm">
                    
                    {/* 주식 스터디 영역 */}
                    {recentStudies.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FileText size={18} className="text-blue-400" />
                                <h3 className="text-lg font-bold text-gray-200">📚 주식스터디 새 문서</h3>
                            </div>
                            <div className="space-y-3">
                                {recentStudies.map(study => (
                                    <div key={study.id} className="p-4 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400">
                                                {study.topic}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(study.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-medium text-gray-100 text-base mt-1">{study.title}</h4>
                                        <p className="text-gray-400 text-xs mt-1">
                                            새로운 주식 스터디 문서가 등록되었습니다. 사이드바 메뉴에서 바로 확인해보세요.
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 빌드 노트 영역 */}
                    {builds.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Activity size={18} className="text-green-400" />
                                <h3 className="text-lg font-bold text-gray-200">✨ 시스템 업데이트 내역</h3>
                            </div>
                            <div className="space-y-4">
                                {builds.map((build, index) => (
                                    <div key={index} className="pl-4 border-l-2 border-purple-500/50">
                                        <div className="flex flex-wrap items-baseline gap-2 mb-1">
                                            <span className="font-bold text-purple-400">{build.version}</span>
                                            <span className="text-xs text-gray-500">{build.date}</span>
                                        </div>
                                        <p className="text-gray-200 font-medium mb-1">{build.summary}</p>
                                        {build.details.length > 0 && (
                                            <ul className="list-disc list-inside text-gray-400 space-y-1">
                                                {build.details.map((detail, idx) => (
                                                    <li key={idx} dangerouslySetInnerHTML={{ __html: detail.replace(/`([^`]+)`/g, '<code class="bg-[#333] px-1 py-0.5 rounded text-gray-300 text-xs font-mono">$1</code>') }} />
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#333] flex items-center justify-between bg-[#151515]">
                    <button 
                        onClick={handleHideToday}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        오늘 하루 보지 않기
                    </button>
                    <button 
                        onClick={handleClose}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}
