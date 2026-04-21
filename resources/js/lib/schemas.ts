import { z } from 'zod';

export const profileSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Invalid email address').max(255),
    locale: z.string().max(10).optional().default('en'),
});

export const securitySchema = z
    .object({
        current_password: z.string().min(1, 'Current password is required'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        password_confirmation: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: 'Passwords do not match',
        path: ['password_confirmation'],
    });

export const teamGeneralSchema = z.object({
    name: z.string().min(1, 'Team name is required').max(255),
});

export const mailSettingsSchema = z.object({
    host: z.string().min(1, 'Host is required').max(255),
    port: z.coerce.number().int().min(1).max(65535),
    username: z.string().max(255).optional().default(''),
    password: z.string().max(255).optional().default(''),
    encryption: z.enum(['tls', 'ssl', 'none']),
    from_address: z.string().email('Invalid email').optional().or(z.literal('')),
    from_name: z.string().max(255).optional().default(''),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    remember: z.boolean().optional().default(false),
});

export const registerSchema = z
    .object({
        name: z.string().min(1, 'Name is required').max(255),
        email: z.string().email('Invalid email address').max(255),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        password_confirmation: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: 'Passwords do not match',
        path: ['password_confirmation'],
    });

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z
    .object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        password_confirmation: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: 'Passwords do not match',
        path: ['password_confirmation'],
    });

export const confirmPasswordSchema = z.object({
    password: z.string().min(1, 'Password is required'),
});

export const roleNameSchema = z.object({
    name: z.string().min(1, 'Role name is required').max(255),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type SecurityFormValues = z.infer<typeof securitySchema>;
export type TeamGeneralFormValues = z.infer<typeof teamGeneralSchema>;
export type MailSettingsFormValues = z.infer<typeof mailSettingsSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ConfirmPasswordFormValues = z.infer<typeof confirmPasswordSchema>;
export type RoleNameFormValues = z.infer<typeof roleNameSchema>;
