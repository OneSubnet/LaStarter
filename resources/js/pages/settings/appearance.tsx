import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import AccountLayout from '@/layouts/account-layout';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <AccountLayout
            breadcrumbs={[
                { title: 'Appearance settings', href: editAppearance().url },
            ]}
        >
            <Head title="Appearance settings" />
            <h1 className="sr-only">Appearance settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Appearance settings"
                    description="Update your account's appearance settings"
                />
                <AppearanceTabs />
            </div>
        </AccountLayout>
    );
}
