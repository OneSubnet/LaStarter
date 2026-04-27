import { router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Briefcase,
    Calendar,
    Check,
    FileText,
    Package,
    Receipt,
    SkipForward,
    User,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { store as clientsStore } from '@/routes/ai/clients';
import { store as eventsStore } from '@/routes/ai/events';
import { index as quotesIndex } from '@/routes/ai/quotes';
import { index as invoicesIndex } from '@/routes/ai/invoices';

type ClientPick = {
    id: number;
    first_name: string;
    last_name: string;
    company_name: string | null;
    type: string;
};

type Step = 'type' | 'client-exists' | 'client-select' | 'client-new' | 'service-type' | 'details' | 'result';

export default function EventStepper({
    open,
    onClose,
    clients,
}: {
    open: boolean;
    onClose: () => void;
    clients: ClientPick[];
}) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const [step, setStep] = useState<Step>('type');
    const [prestationType, setPrestationType] = useState<'service' | 'product' | ''>('');
    const [clientExists, setClientExists] = useState<'yes' | 'no' | ''>('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [clientType, setClientType] = useState<'pro' | 'individual'>('individual');
    const [newFirstName, setNewFirstName] = useState('');
    const [newLastName, setNewLastName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newCompanyName, setNewCompanyName] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [eventTitle, setEventTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [location, setLocation] = useState('');
    const [resultType, setResultType] = useState<'quote' | 'invoice' | 'none' | ''>('');
    const [submitting, setSubmitting] = useState(false);

    const steps: { key: Step; label: string }[] = [
        { key: 'type', label: t('ai.events.stepper.prestation') },
        { key: 'client-exists', label: t('ai.events.stepper.client') },
        { key: 'service-type', label: t('ai.events.stepper.service') },
        { key: 'details', label: t('ai.events.stepper.details') },
        { key: 'result', label: t('ai.events.stepper.result') },
    ];

    const currentStepIndex = steps.findIndex((s) => s.key === step);

    const reset = () => {
        setStep('type');
        setPrestationType('');
        setClientExists('');
        setSelectedClientId('');
        setClientType('individual');
        setNewFirstName('');
        setNewLastName('');
        setNewEmail('');
        setNewCompanyName('');
        setServiceType('');
        setEventTitle('');
        setDescription('');
        setStartDate('');
        setLocation('');
        setResultType('');
        setSubmitting(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const goNext = () => {
        switch (step) {
            case 'type':
                setStep('client-exists');
                break;
            case 'client-exists':
                setStep(clientExists === 'yes' ? 'client-select' : 'client-new');
                break;
            case 'client-select':
                setStep('service-type');
                break;
            case 'client-new':
                setStep('service-type');
                break;
            case 'service-type':
                setStep('details');
                break;
            case 'details':
                setStep('result');
                break;
        }
    };

    const goBack = () => {
        switch (step) {
            case 'client-exists':
                setStep('type');
                break;
            case 'client-select':
                setStep('client-exists');
                break;
            case 'client-new':
                setStep('client-exists');
                break;
            case 'service-type':
                setStep(clientExists === 'yes' ? 'client-select' : 'client-new');
                break;
            case 'details':
                setStep('service-type');
                break;
            case 'result':
                setStep('details');
                break;
        }
    };

    const canProceed = (): boolean => {
        switch (step) {
            case 'type':
                return prestationType !== '';
            case 'client-exists':
                return clientExists !== '';
            case 'client-select':
                return selectedClientId !== '';
            case 'client-new':
                return newFirstName.trim() !== '' && newLastName.trim() !== '';
            case 'service-type':
                return serviceType !== '';
            case 'details':
                return eventTitle.trim() !== '';
            case 'result':
                return resultType !== '';
        }
        return false;
    };

    const handleSubmit = () => {
        setSubmitting(true);

        const createClient = clientExists === 'no';
        const clientId = createClient ? null : Number(selectedClientId);

        const clientData = createClient
            ? {
                type: clientType,
                first_name: newFirstName,
                last_name: newLastName,
                email: newEmail || null,
                company_name: clientType === 'pro' ? newCompanyName : null,
            }
            : null;

        const eventData = {
            title: eventTitle,
            type: serviceType,
            client_id: clientId,
            start_date: startDate || null,
            location: location || null,
            description: description || null,
        };

        const finalize = (resolvedClientId: number | null) => {
            router.post(eventsStore(teamSlug).url, { ...eventData, client_id: resolvedClientId }, {
                onSuccess: () => {
                    if (resultType === 'quote') {
                        router.visit(quotesIndex({ current_team: teamSlug }).url);
                    } else if (resultType === 'invoice') {
                        router.visit(invoicesIndex({ current_team: teamSlug }).url);
                    } else {
                        handleClose();
                    }
                },
                onFinish: () => setSubmitting(false),
            });
        };

        if (createClient && clientData) {
            router.post(clientsStore(teamSlug).url, clientData, {
                onSuccess: (page) => {
                    const newClient = (page.props as Record<string, unknown>).client as { id: number } | undefined;
                    if (newClient) {
                        finalize(newClient.id);
                    } else {
                        setSubmitting(false);
                    }
                },
                onError: () => setSubmitting(false),
            });
        } else {
            finalize(clientId);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
                <Button variant="ghost" size="sm" onClick={handleClose}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('ai.events.stepper.quit')}
                </Button>
                <h2 className="text-lg font-semibold">{t('ai.events.stepper.mode')}</h2>
                <div className="w-20" />
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 border-b px-6 py-3">
                {steps.map((s, i) => (
                    <div key={s.key} className="flex items-center gap-2">
                        <div
                            className={`flex size-8 items-center justify-center rounded-full text-xs font-medium ${
                                i < currentStepIndex
                                    ? 'bg-primary text-primary-foreground'
                                    : i === currentStepIndex
                                      ? 'bg-primary/20 text-primary ring-2 ring-primary'
                                      : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
                        </div>
                        <span className={`text-sm ${i <= currentStepIndex ? 'font-medium' : 'text-muted-foreground'}`}>
                            {s.label}
                        </span>
                        {i < steps.length - 1 && <div className="mx-2 h-px w-8 bg-border" />}
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="flex flex-1 items-center justify-center p-8">
                <div className="w-full max-w-lg space-y-6">
                    {/* Step: Type de prestation */}
                    {step === 'type' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold">{t('ai.events.stepper.prestation_type')}</h3>
                            <p className="text-sm text-muted-foreground">{t('ai.events.stepper.what_to_create')}</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setPrestationType('service')}
                                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-colors ${
                                        prestationType === 'service' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    <Briefcase className="h-8 w-8" />
                                    <span className="font-medium">{t('ai.events.stepper.service')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPrestationType('product')}
                                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-colors ${
                                        prestationType === 'product' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    <Package className="h-8 w-8" />
                                    <span className="font-medium">{t('ai.events.stepper.product')}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Client existe */}
                    {step === 'client-exists' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold">{t('ai.events.stepper.client_exists')}</h3>
                            <p className="text-sm text-muted-foreground">{t('ai.events.stepper.client_registered')}</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setClientExists('yes')}
                                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-colors ${
                                        clientExists === 'yes' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    <Users className="h-8 w-8" />
                                    <span className="font-medium">{t('ai.events.stepper.yes_existing')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClientExists('no')}
                                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-colors ${
                                        clientExists === 'no' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    <User className="h-8 w-8" />
                                    <span className="font-medium">{t('ai.events.stepper.no_new')}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Client existant - selection */}
                    {step === 'client-select' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold">{t('ai.events.stepper.select_client')}</h3>
                            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('ai.events.stepper.choose_client')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(clients ?? []).map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.first_name} {c.last_name}
                                            {c.company_name ? ` (${c.company_name})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Step: Nouveau client */}
                    {step === 'client-new' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold">{t('ai.events.stepper.new_client')}</h3>
                            <div className="space-y-2">
                                <Label>{t('ai.events.stepper.client_type')}</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setClientType('individual')}
                                        className={`rounded-lg border-2 p-4 text-center transition-colors ${
                                            clientType === 'individual' ? 'border-primary bg-primary/5' : 'border-border'
                                        }`}
                                    >
                                        <span className="font-medium">{t('ai.events.stepper.individual')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setClientType('pro')}
                                        className={`rounded-lg border-2 p-4 text-center transition-colors ${
                                            clientType === 'pro' ? 'border-primary bg-primary/5' : 'border-border'
                                        }`}
                                    >
                                        <span className="font-medium">{t('ai.events.stepper.professional')}</span>
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('ai.events.stepper.first_name')}</Label>
                                    <Input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('ai.events.stepper.last_name')}</Label>
                                    <Input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('ai.events.stepper.email')}</Label>
                                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                            </div>
                            {clientType === 'pro' && (
                                <div className="space-y-2">
                                    <Label>{t('ai.events.stepper.company')}</Label>
                                    <Input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step: Type de service */}
                    {step === 'service-type' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold">{t('ai.events.stepper.service_type')}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { value: 'service', label: t('ai.events.stepper.service_option'), icon: Briefcase },
                                    { value: 'consultation', label: t('ai.events.stepper.consultation'), icon: Users },
                                    { value: 'formation', label: t('ai.events.stepper.formation'), icon: Calendar },
                                    { value: 'event', label: t('ai.events.stepper.event'), icon: FileText },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setServiceType(opt.value)}
                                        className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                                            serviceType === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                        }`}
                                    >
                                        <opt.icon className="h-5 w-5" />
                                        <span className="font-medium">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step: Details */}
                    {step === 'details' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold">{t('ai.events.stepper.details')}</h3>
                            <div className="space-y-2">
                                <Label>{t('ai.events.stepper.title')}</Label>
                                <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder={t('ai.events.stepper.title_placeholder')} required />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('ai.events.stepper.date')}</Label>
                                <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('ai.events.stepper.location')}</Label>
                                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('ai.events.stepper.location_placeholder')} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('ai.events.stepper.description')}</Label>
                                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('ai.events.stepper.description_placeholder')} rows={3} />
                            </div>
                        </div>
                    )}

                    {/* Step: Result */}
                    {step === 'result' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold">{t('ai.events.stepper.create_document')}</h3>
                            <p className="text-sm text-muted-foreground">{t('ai.events.stepper.generate_question')}</p>
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setResultType('quote')}
                                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-colors ${
                                        resultType === 'quote' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    <FileText className="h-8 w-8" />
                                    <span className="font-medium">{t('ai.events.stepper.quote')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setResultType('invoice')}
                                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-colors ${
                                        resultType === 'invoice' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    <Receipt className="h-8 w-8" />
                                    <span className="font-medium">{t('ai.events.stepper.invoice')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setResultType('none')}
                                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-colors ${
                                        resultType === 'none' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    <SkipForward className="h-8 w-8" />
                                    <span className="font-medium">{t('ai.events.stepper.skip')}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-6 py-4">
                <Button variant="outline" onClick={goBack} disabled={step === 'type'}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('ai.events.stepper.previous')}
                </Button>
                {step === 'result' ? (
                    <Button onClick={handleSubmit} disabled={!canProceed() || submitting}>
                        {submitting ? t('ai.events.stepper.creating') : t('ai.events.stepper.create')}
                    </Button>
                ) : (
                    <Button onClick={goNext} disabled={!canProceed()}>
                        {t('ai.events.stepper.next')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
