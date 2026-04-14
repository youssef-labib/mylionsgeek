import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { home } from '@/routes';

export default function Error({ status = 500, message }) {
    return (
        <>
            <Head title="Error" />
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 py-12 text-center">
                <p className="text-6xl font-bold text-muted-foreground tabular-nums">{status}</p>
                <div className="max-w-md space-y-2">
                    <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                        Go back
                    </Button>
                    <Button asChild variant="default">
                        <Link href={home.url()}>Home</Link>
                    </Button>
                </div>
            </div>
        </>
    );
}

Error.layout = (page) => <AppLayout>{page}</AppLayout>;
