<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', $locale ?? app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{ $subject ?? '' }}</title>
    <!--[if mso]>
    <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
    <![endif]-->
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0; mso-table-rspace: 0; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f4f5f7; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        @media only screen and (max-width: 620px) {
            .email-container { width: 100% !important; padding: 0 12px !important; }
            .email-button { width: 100% !important; }
            .email-button td { width: 100% !important; }
            .email-button a { display: block !important; width: 100% !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f5f7;">
    <center style="width:100%; background-color:#f4f5f7; padding:32px 0;">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width:600px; width:100%; margin:0 auto;">
            {{-- Header --}}
            <tr>
                <td style="background-color:#ffffff; border-radius:12px 12px 0 0; padding:32px 40px 24px; text-align:center;">
                    <table cellpadding="0" cellspacing="0" border="0" align="center">
                        <tr>
                            <td style="font-size:20px; font-weight:700; color:#111827; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
                                {{ $headerTitle ?? config('app.name') }}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Accent line --}}
            <tr>
                <td style="background-color:#ffffff; padding:0 40px;">
                    <div style="height:3px; background:linear-gradient(to right, #6366f1, #8b5cf6, #a78bfa); border-radius:3px;"></div>
                </td>
            </tr>

            {{-- Body --}}
            <tr>
                <td style="background-color:#ffffff; padding:32px 40px 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#374151;">
                    {{ $body ?? '' }}
                </td>
            </tr>

            {{-- CTA Button slot --}}
            @isset($buttonUrl)
            <tr>
                <td style="background-color:#ffffff; padding:8px 40px 24px; text-align:center;">
                    <table class="email-button" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                        <tr>
                            <td style="border-radius:8px; background-color:#6366f1;">
                                <a href="{{ $buttonUrl }}" style="display:inline-block; padding:14px 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px;">
                                    {{ $buttonText ?? __('emails.click_here') }}
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endisset

            {{-- Secondary button --}}
            @isset($secondaryButtonUrl)
            <tr>
                <td style="background-color:#ffffff; padding:8px 40px 0; text-align:center;">
                    <table class="email-button" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                        <tr>
                            <td style="border-radius:8px; background-color:#f3f4f6; border:1px solid #d1d5db;">
                                <a href="{{ $secondaryButtonUrl }}" style="display:inline-block; padding:12px 28px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; font-size:14px; font-weight:600; color:#374151; text-decoration:none; border-radius:8px;">
                                    {{ $secondaryButtonText }}
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endisset

            {{-- Secondary text (below button) --}}
            @isset($subtext)
            <tr>
                <td style="background-color:#ffffff; padding:0 40px 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; font-size:13px; line-height:1.5; color:#9ca3af; text-align:center;">
                    {{ $subtext }}
                </td>
            </tr>
            @endisset

            {{-- Panel slot --}}
            @isset($panelContent)
            <tr>
                <td style="background-color:#ffffff; padding:0 40px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
                        <tr>
                            <td style="padding:16px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; font-size:14px; line-height:1.5; color:#475569;">
                                {{ $panelContent }}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endisset

            {{-- Divider + Footer --}}
            <tr>
                <td style="background-color:#ffffff; padding:0 40px;">
                    <div style="height:1px; background-color:#e5e7eb;"></div>
                </td>
            </tr>
            <tr>
                <td style="background-color:#ffffff; border-radius:0 0 12px 12px; padding:24px 40px 32px; text-align:center; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; font-size:12px; line-height:1.5; color:#9ca3af;">
                    {{ $footerText ?? config('app.name') }} — {{ date('Y') }}
                </td>
            </tr>
        </table>
    </center>
</body>
</html>
