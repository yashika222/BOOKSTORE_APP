export const dynamic = 'force-dynamic';

export default function BackendHome() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
      <h1>FundooBooks API</h1>
      <p>
        This is the independent Next.js backend. API routes are served under <code>/api</code>.
      </p>
      <p>
        Health check: <a href="/api/health">/api/health</a>
      </p>
    </main>
  );
}
