@component('mail::message')
# {{ __('emails.team_invitation.title') }}

{{ __('emails.team_invitation.greeting', ['name' => $name ?? '']) }}

{{ __('emails.team_invitation.body', [
    'inviterName' => $inviterName,
    'teamName' => $teamName,
]) }}

@component('mail::button', ['url' => $acceptUrl])
{{ __('emails.team_invitation.accept_button') }}
@endcomponent

{{ __('emails.team_invitation.no_action') }}

Thanks,<br>
{{ config('app.name') }}
@endcomponent
