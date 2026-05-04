// Custom routes that wayfinder doesn't generate
// Re-export all wayfinder routes first
export * from './routes';

import { queryParams, applyUrlDefaults } from './wayfinder';
import type { RouteQueryOptions, RouteDefinition } from './wayfinder';

/**
 * @see \App\Http\Controllers\DashboardController::__invoke
 * @see app/Http/Controllers/DashboardController.php:10
 * @route '/{current_team}/dashboard'
 */
export const dashboard = (
    args:
        | { current_team: string | number }
        | [current_team: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: dashboard.url(args, options),
    method: 'get',
});

dashboard.definition = {
    methods: ['get', 'head'],
    url: '/{current_team}/dashboard',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\DashboardController::__invoke
 * @see app/Http/Controllers/DashboardController.php:10
 * @route '/{current_team}/dashboard'
 */
dashboard.url = (
    args:
        | { current_team: string | number }
        | [current_team: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { current_team: args };
    }

    if (Array.isArray(args)) {
        args = {
            current_team: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        current_team: args.current_team,
    };

    return (
        dashboard.definition.url
            .replace('{current_team}', parsedArgs.current_team.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\DashboardController::__invoke
 * @see app/Http/Controllers/DashboardController.php:10
 * @route '/{current_team}/dashboard'
 */
dashboard.get = (
    args:
        | { current_team: string | number }
        | [current_team: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: dashboard.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DashboardController::__invoke
 * @see app/Http/Controllers/DashboardController.php:10
 * @route '/{current_team}/dashboard'
 */
dashboard.head = (
    args:
        | { current_team: string | number }
        | [current_team: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: dashboard.url(args, options),
    method: 'head',
});
