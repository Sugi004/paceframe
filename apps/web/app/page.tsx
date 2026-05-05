import { AuthShell } from './auth-shell';

type SearchParams = Promise<{
  mode?: string;
}>;

function toAuthMode(value?: string) {
  return value === 'signin' || value === 'reset' ? value : 'signup';
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <AuthShell initialMode={toAuthMode(params.mode)} />;
}
