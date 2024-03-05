import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

export function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <h1>Hello World</h1>
        {process.env.NODE_ENV === 'test' ? null : <ReactQueryDevtools />}
      </QueryClientProvider>
    </>
  );
}
