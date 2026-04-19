import { Head, usePage } from '@inertiajs/react';
import { LayoutGrid, Users, FolderKanban, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';

export default function ThemedDashboard() {
    const page = usePage();
    const teamSlug = page.props.currentTeam?.slug;

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Dashboard',
                    href: teamSlug ? dashboard(teamSlug) : '/',
                },
            ]}
        >
            <Head title="Dashboard" />

            <div className="space-y-6 p-6">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary p-2">
                        <LayoutGrid className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            Welcome back! Here is your overview.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Projects
                            </CardTitle>
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground">
                                Active projects
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Team Members
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground">
                                Active members
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Activity
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">-</div>
                            <p className="text-xs text-muted-foreground">
                                This week
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
