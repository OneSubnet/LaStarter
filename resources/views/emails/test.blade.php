@component('mail::message')
# {{ __('emails.test.title') }}

{{ __('emails.test.body', ['teamName' => $teamName]) }}

@component('mail::panel')
{{ __('emails.test.success_message') }}
@endcomponent

{{ __('emails.test.footer') }}

Thanks,<br>
{{ config('app.name') }}
@endcomponent
