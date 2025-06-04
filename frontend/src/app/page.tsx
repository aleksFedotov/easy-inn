import Link from 'next/link'; // Импортируем Link для навигации

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Добро пожаловать в EasyInn!</h1>
        <p className="mb-6">Система управления отелем для оптимизации ваших операций.</p>
        
        <div className="mt-6">
          {/* Ссылка на страницу входа */}
          <Link href="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out">
              Войти в систему
          </Link>
        </div>
        
      </div>
    </div>
  );
}