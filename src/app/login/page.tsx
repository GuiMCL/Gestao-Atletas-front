'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { login } from '@/lib/api/auth.api';
import { setAuthTokens, setUser } from '@/lib/auth';

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await login(data);
      
      // Store tokens and user data
      setAuthTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      setUser(response.user);

      // Check if user needs to change password on first login
      try {
        const { checkPasswordChange } = await import('@/lib/api/auth.api');
        const passwordCheckResponse = await checkPasswordChange(response.accessToken);
        
        if (passwordCheckResponse.needsPasswordChange) {
          router.push('/change-password-first-login');
          return;
        }
      } catch (err) {
        console.warn('Could not check password change requirement:', err);
        // Continue with normal flow if check fails
      }

      // Redirect based on user role
      switch (response.user.role) {
        case 'ATHLETE':
          router.push('/dashboard');
          break;
        case 'COACH':
          router.push('/coach/dashboard');
          break;
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        default:
          router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sistema de Gerenciamento de Voleibol
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div
              className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Nome de usuário"
              type="text"
              autoComplete="username"
              fullWidth
              error={errors.username?.message}
              {...register('username', {
                required: 'Nome de usuário é obrigatório',
                minLength: {
                  value: 3,
                  message: 'O nome de usuário deve ter pelo menos 3 caracteres',
                },
              })}
            />

            <Input
              label="Senha"
              type="password"
              autoComplete="current-password"
              fullWidth
              error={errors.password?.message}
              {...register('password', {
                required: 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'A senha deve ter pelo menos 6 caracteres',
                },
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Esqueceu sua senha?
              </a>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
