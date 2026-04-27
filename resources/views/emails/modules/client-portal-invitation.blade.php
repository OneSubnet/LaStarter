@component('mail::message')
# {{ __('emails.client_portal.title') }}

{{ __('emails.client_portal.greeting', ['name' => $clientName]) }}

{{ __('emails.client_portal.body', ['teamName' => $teamName]) }}

{{ __('emails.client_portal.features') }}

@component('mail::button', ['url' => $acceptLinkUrl])
{{ __('emails.client_portal.accept_button') }}
@endcomponent

{{ __('emails.client_portal.set_password') }}

{{ __('emails.client_portal.ignore') }}

Thanks,<br>
{{ $teamName }}
@endcomponent
