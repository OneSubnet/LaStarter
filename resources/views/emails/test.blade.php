@component('mail::message')
# Test Email

This is a test email from **{{ $teamName }}**.

If you received this email, your mail settings are configured correctly.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
