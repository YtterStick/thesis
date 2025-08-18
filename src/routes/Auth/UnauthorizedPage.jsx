const UnauthorizedPage = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-950 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">
          🚫 Unauthorized
        </h1>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          You don’t have permission to access this page.
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          If you believe this is a mistake, please contact your administrator.
        </p>
      </div>
    </div>
  );
};

export default UnauthorizedPage;