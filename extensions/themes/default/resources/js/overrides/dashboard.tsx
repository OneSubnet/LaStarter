import { Head, usePage } from '@inertiajs/react';
import {
    CheckSquare,
    FileText,
    FolderKanban,
    LayoutGrid,
    ListChecks,
    Lock,
    Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';

type Widget = {
    id: string;
    title: string;
    description: string;
    icon: string;
    type: string;
    value: string | number;
    order: number;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    FolderKanban,
    ListChecks,
    CheckSquare,
    FileText,
    Lock,
    Users,
    LayoutGrid,
};

export default function ThemedDashboard() {
    const page = usePage();
    const teamSlug = page.props.currentTeam?.slug;
    const widgets = (page.props.widgets ?? []) as Widget[];

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

                {widgets.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {widgets.map((widget) => {
                            const Icon = iconMap[widget.icon] ?? LayoutGrid;
                            return (
                                <Card key={widget.id}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {widget.title}
                                        </CardTitle>
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {widget.value}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {widget.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <LayoutGrid className="mb-4 h-12 w-12 opacity-20" />
                        <p className="text-sm">Enable extensions to see dashboard widgets.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
