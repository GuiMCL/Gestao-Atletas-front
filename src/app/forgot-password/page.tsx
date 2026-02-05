'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { forgotPassword } from '@/lib/api/auth.api';

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      await forgotPassword(data);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao enviar email de redefinição de senha. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Verifique seu email
            </h2>
            <div className="mt-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p className="text-center">
                Enviamos um email com instruções para redefinir sua senha.
                Por favor, verifique sua caixa de entrada e siga o link fornecido.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="primary"
              fullWidth
              onClick={() => router.push('/login')}
            >
              Voltar para Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Redefinir sua senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Digite seu endereço de email e enviaremos um link para redefinir sua senha.
          </p>
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

          <div>
            <Input
              label="Endereço de email"
              type="email"
              autoComplete="email"
              fullWidth
              error={errors.email?.message}
              {...register('email', {
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Endereço de email inválido',
                },
              })}
            />
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar link de redefinição'}
            </Button>

            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => router.push('/login')}
              disabled={isLoading}
            >
              Voltar para Login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
