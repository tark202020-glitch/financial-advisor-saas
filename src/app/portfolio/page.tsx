import { createClient } from '@/utils/supabase/server';
import PortfolioClientPage from '@/components/portfolio/PortfolioClientPage';

export default async function PortfolioPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const serverDebugInfo = {
        userEmail: user?.email || null,
        portfolioCount: null as number | null,
        error: null as string | null
    };

    if (user) {
        try {
            const { count, error } = await supabase
                .from('portfolios')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            if (error) {
                serverDebugInfo.error = error.message;
            } else {
                serverDebugInfo.portfolioCount = count;
            }
        } catch (e: any) {
            serverDebugInfo.error = e.message;
        }
    }

    return <PortfolioClientPage serverDebugInfo={serverDebugInfo} />;
}
