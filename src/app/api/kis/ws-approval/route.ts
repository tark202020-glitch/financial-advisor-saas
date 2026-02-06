import { NextResponse } from 'next/server';
import { getWebSocketApprovalKey } from '@/lib/kis/client';

export async function POST() {
    try {
        const approvalKey = await getWebSocketApprovalKey();
        return NextResponse.json({ approval_key: approvalKey });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
