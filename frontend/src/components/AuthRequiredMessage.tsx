'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react'; // Иконка для кнопки входа

/**
 * Компонент AuthRequiredMessage отображает сообщение о том, что для доступа к странице требуется аутентификация,
 * и предоставляет кнопку для перехода на страницу входа.
 *
 * @returns {JSX.Element} Компонент AuthRequiredMessage.
 */
const AuthRequiredMessage: React.FC = () => {
    const router = useRouter();

    const handleLoginRedirect = () => {
        router.push('/login');
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md text-center shadow-lg rounded-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold ">Доступ запрещен</CardTitle>
                    <CardDescription >
                        Для просмотра этой страницы необходимо войти в систему.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-6">
                        Пожалуйста, войдите в свой аккаунт, чтобы получить доступ к содержимому.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button onClick={handleLoginRedirect} className="w-full sm:w-auto">
                        <LogIn className="mr-2 h-4 w-4" />
                        Войти
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default AuthRequiredMessage;